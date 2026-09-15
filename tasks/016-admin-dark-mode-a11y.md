# Task 016: 관리자 영역 다크모드 확장 및 반응형·접근성 검증 (A003)

> Phase 6 · 관리자 UI 완성 (더미 데이터 활용)

## 목표

다크모드는 이미 `theme-provider`·`theme-toggle`·`app/layout.tsx`로 구현되어 동작 중이다. 이 Task는
**신규 관리자 컴포넌트가 시맨틱 토큰만 사용하는지 점검**하고, 라이트/다크/시스템 × 3개 뷰포트에서
시각적으로 검증하며, Task 012·014·015에서 재현이 관찰된 기존 `Header` hydration mismatch 이슈를
조사·해결한다.

## 관련 파일

| 파일                               | 구분 | 내용                                                                                             |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| `src/components/layout/header.tsx` | 수정 | `useMediaQuery` 기반 조건부 렌더링 제거 → CSS 전용 반응형으로 교체(hydration mismatch 근본 수정) |
| `docs/ROADMAP.md`                  | 수정 | Task 016 완료 표시                                                                               |

## 설계 결정 및 근거

### 1. 시맨틱 토큰 점검 결과 — 수정 불필요

`src/components/admin/`, `src/app/admin/`, `src/hooks/use-copy-invoice-link.ts` 전체를 하드코딩 색상
패턴(`text-white`/`bg-black`/`#hex`/`rgb()`/`bg-red-500`류 팔레트 직접 참조)으로 grep했을 때 **일치하는
코드가 없었다**. Task 012~015에서 만든 모든 컴포넌트가 처음부터 `bg-background`·`text-foreground`·
`bg-muted`·`text-muted-foreground`·`border` 등 shadcn/ui 시맨틱 토큰과 `Badge`/`Alert`의 기존 variant만
사용했기 때문이다. 별도 수정 없이 다크모드 시각 검증만 진행한다.

### 2. `Header`의 `useMediaQuery` hydration mismatch — 근본 원인 확인 후 수정(후속 Task로 미루지 않음)

Task 012·014·015에서 좁은 뷰포트(≤768px) 최초 로드 시 다음 React hydration 경고가 반복 재현됨을
기록했다:

```
Error: Hydration failed because the server rendered HTML didn't match the client.
  <nav className="flex items-center space-x-6 lg:space-x-8">
```

**근본 원인**: `header.tsx`가 `usehooks-ts`의 `useMediaQuery('(max-width: 768px)')`로 `isMobile`을
판정해 `{!isMobile && <MainNav />}` / `{isMobile && <Sheet>...}`처럼 **JS 조건부**로 데스크톱 내비게이션과
모바일 메뉴 버튼을 완전히 다르게 렌더링한다. `useMediaQuery`는 서버에는 `window`가 없어 항상 기본값
(`false`, 즉 "데스크톱")으로 서버 HTML을 만드는데, 실제 뷰포트가 768px 이하면 클라이언트 첫 렌더에서
`isMobile === true`로 즉시 바뀌어 서버 HTML과 클라이언트 HTML의 DOM 구조 자체가 달라진다 — 전형적인
hydration mismatch 패턴이다.

**수정**: `isMobile` 상태와 `useMediaQuery` 훅을 완전히 제거하고, `Container`(Task 014 목록 테이블에서
이미 쓴 것과 동일한 패턴) 반응형 유틸리티(`hidden md:block` / `md:hidden`)로 대체했다. 이제 서버와
클라이언트 모두 데스크톱 내비게이션과 모바일 메뉴 트리거를 **항상 둘 다 렌더링**하고 CSS 미디어 쿼리로
어느 쪽을 보여줄지만 결정하므로, 서버·클라이언트 HTML이 항상 동일해 hydration mismatch가 발생할 수
없다. `usehooks-ts` 의존성은 프로젝트 전체에서 이 파일에서만 쓰였음을 grep으로 확인했다(제거해도
다른 곳에 영향 없음 — `package.json`의 `usehooks-ts` 의존성 자체는 향후 다른 훅에 쓰일 수 있어 이번
Task 범위에서 제거하지 않는다).

이 버그는 관리자 화면이 아니라 `Header`(전역 컴포넌트) 자체의 결함이라 공개 페이지(`/`, `/invoice/{id}`)
와 관리자 페이지(`/admin`) 모두에 영향을 주고 있었다. ROADMAP은 "재현 시 해결 또는 별도 후속 Task로
기록"을 선택지로 뒀는데, 원인이 명확하고 수정 범위가 파일 1개·반응형 클래스 전환으로 작고 안전해
후속 Task로 미루지 않고 이번에 바로 수정했다.

## 구현 단계

1. [x] 하드코딩 색상 grep 점검(관리자 컴포넌트 전체) — 수정 불필요 확인
2. [x] `Header`의 `useMediaQuery`/`isMobile` 제거, `hidden md:block`(데스크톱 내비게이션)·`md:hidden`
       (모바일 메뉴 트리거)으로 교체
3. [x] `npm run check-all` 통과 확인
4. [x] Playwright MCP로 라이트/다크/시스템 × 모바일(375)/태블릿(768)/데스크톱(1280) 조합 시각 점검,
       테마 전환 후 새로고침 유지 확인, hydration 경고 재현 여부 재확인

## 수락 기준 (완료 조건)

- [x] 관리자 컴포넌트가 하드코딩 색상 없이 시맨틱 토큰만 사용함을 확인
- [x] `/admin`에서 라이트/다크/시스템 테마가 모두 정상 표시됨
- [x] 테마 토글이 관리자 화면에서 동작하고 새로고침 후에도 유지됨
- [x] 기존 `Header` hydration mismatch 경고가 더 이상 재현되지 않음(홈·관리자 모두)
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run check-all` 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름

- [x] `/admin`에서 다크 모드 전환 시 배경·텍스트·배지·테이블 대비가 정상 유지됨(스크린샷 확인 — 헤더,
      배너, 테이블, 배지 전부 시맨틱 토큰 기반으로 정상 전환)
- [x] 테마를 다크로 바꾸고 전체 페이지 새로고침(`page.goto` 재진입) 후에도 다크 유지 확인
      (`next-themes` localStorage 저장 동작)

### 오류 처리 / 엣지 케이스

- [x] 375px(모바일 폭)로 최초 진입(fresh navigate) 시 더 이상 hydration mismatch 콘솔 에러가 발생하지
      않음 — 수정 전: 홈·관리자 모두 재현 / 수정 후: 홈·관리자 모두 0건으로 재검증
- [x] 768px 경계값에서 데스크톱 내비게이션이 정상 표시됨(CSS `md` 브레이크포인트 기준 그대로 전환,
      레이아웃 깨짐 없음)

### 반응형 & 품질

- [x] 모바일(375)·태블릿(768)·데스크톱(1280)에서 관리자 화면 레이아웃 정상(다크 모드 기준 확인)
- [x] 콘솔 에러 0건(375·768·1280 모든 뷰포트, fresh navigate 기준)
- [x] `npm run check-all` 통과(변경 파일 기준 — 타입체크/린트 전체 통과, 포맷은 손대지 않은 기존 파일의
      CRLF 경고만 남아 있고 이번 변경 파일과는 무관함)

## 결과 요약

관리자 컴포넌트(Task 012~015에서 만든 전체)를 하드코딩 색상 패턴으로 grep 점검한 결과 시맨틱 토큰만
사용하고 있어 별도 수정이 필요 없었다. 대신 Task 012·014·015에서 반복 기록된 `Header`의 `useMediaQuery`
기반 hydration mismatch를 근본 원인(서버는 항상 "데스크톱" 기본값으로 렌더링하지만 실제 뷰포트가
768px 이하면 클라이언트에서 즉시 다른 DOM 구조로 바뀜)까지 확인하고, JS 조건부 렌더링을
`hidden md:block`/`md:hidden` CSS 전용 반응형으로 교체해 근본적으로 수정했다.

Playwright MCP로 375/768/1280 각 뷰포트에서 fresh navigate 시 콘솔 에러 0건임을 재검증했고(수정 전
재현 → 수정 후 미재현), 다크 모드가 관리자 화면 전체에 정상 적용되며 새로고침 후에도 유지됨을
확인했다. `npm run check-all` 통과.
