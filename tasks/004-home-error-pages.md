# Task 004: 홈 페이지 및 오류 페이지 UI 완성

> Phase 2 · UI/UX 완성 (더미 데이터 활용) · 구현 기능: F010, F011 UI

## 목표

ROADMAP Phase 2 Task 004의 첫 항목("홈 페이지 카드 레이아웃 + `InvoiceLookupForm`")은 이미 완료되어 있다.
이 Task는 남은 항목을 완성한다:

1. 홈 페이지 안내 텍스트·사용법 섹션 보강
2. `src/app/invoice/[id]/not-found.tsx` 커스텀 404 페이지
3. `src/app/error.tsx` 전역 오류 폴백
4. ~~홈 폼의 "형식이 명백히 잘못된 ID" 즉시 인라인 에러~~ → **범위 변경**(아래 참고)
5. 반응형 재확인 (기존 레이아웃 유지 여부 검증)

상세 데이터 연동(Task 007)·오류 원인별 메시지 세분화(Task 008)·PDF(Task 009)는 이 Task의 범위 밖이다.
이 Task가 만드는 `not-found.tsx`/`error.tsx`는 지금은 mock 데이터(`getMockInvoiceById`) 기준으로 동작하는
UI 골격이며, Task 007에서 실제 Notion 조회로 교체되어도 파일 구조는 그대로 재사용된다.

### 범위 변경: 형식 검증 대신 데모 링크로 "쉬운 입장" 문제 해결

실사용 중 사용자가 인보이스 ID 대신 임의 텍스트("웹사이트 디자인")를 입력해 Next.js 기본 404 페이지를
보는 문제가 보고되었다. 원래 계획한 "32자리 16진수 형식 검증"(`isValidNotionId` 기반 `.refine()`)은
**mock 데이터 단계에서는 적용하지 않기로 결정**한다. mock ID(`sample-001` 등)는 Notion 실제 ID 형식(32자리
16진수)이 아니므로, 이 검증을 지금 넣으면 데모용 mock ID 자체가 폼을 통과하지 못하는 모순이 생긴다.
대신 사용자가 ID를 몰라도 바로 들어가 볼 수 있도록 홈 페이지에 `mockInvoices` 기반 데모 링크
(`/invoice/sample-001` 등)를 추가해 "쉬운 입장" 요구를 해결했다. 형식 검증은 Task 007에서 실제 Notion ID로
전환된 이후 재도입을 검토한다(`src/lib/notion/id.ts` 분리안은 그때 유효).

## 관련 파일

| 파일                                                 | 구분 | 내용                                                                |
| ---------------------------------------------------- | ---- | ------------------------------------------------------------------- |
| `src/app/page.tsx`                                   | 수정 | 안내 문구 보강 + `mockInvoices` 기반 데모 견적서 바로가기 링크 추가 |
| `src/app/invoice/[id]/not-found.tsx`                 | 신규 | "견적서를 찾을 수 없습니다" + 원인 안내 + 홈 버튼 + 발행자 연락처   |
| `src/app/error.tsx`                                  | 신규 | 전역 error boundary (Notion 조회 실패 등 폴백 UI, `reset` 지원)     |
| `docs/ROADMAP.md`                                    | 수정 | Task 004 완료 표시                                                  |
| ~~`src/lib/notion/id.ts`~~                           | 보류 | 형식 검증 공용 유틸 — Task 007(실제 Notion ID 전환) 이후 재검토     |
| ~~`src/components/invoice/invoice-lookup-form.tsx`~~ | 보류 | zod `.refine()` 형식 검증 — 위와 동일 사유로 보류                   |

## 설계 결정 및 근거

### 1. ID 형식 검증 로직 분리는 보류 (위 "범위 변경" 참고)

원래는 `src/lib/notion/invoices.ts`의 `isValidNotionId`(32자리 16진수, 하이픈 무관)를 의존성 없는
`src/lib/notion/id.ts`로 분리해 클라이언트 폼에서도 재사용하려 했으나, mock ID(`sample-001`)가 이 형식이
아니라서 지금 도입하면 데모 흐름이 막힌다. Task 007에서 실제 Notion ID로 전환된 후 재검토한다.

### 2. `error.tsx`는 우선 루트 하나로 커버

세그먼트별(`app/invoice/[id]/error.tsx`) vs 루트(`app/error.tsx`) 중, 현재 Notion 조회는 상세 페이지에서만
발생하고 다른 라우트가 늘어나지 않은 상태이므로 루트 `error.tsx` 하나로 시작한다. Task 007에서 실제 Notion
연동이 들어가고 오류 시나리오가 상세 페이지 특화로 갈리면(Task 008) 세그먼트 분리를 재검토한다.

### 3. `getBusinessInfo()`를 Server Component에서 직접 호출

`not-found.tsx`/`error.tsx`(콘텐츠 부분)는 Server Component로 작성해 `await getBusinessInfo()`를 직접
호출한다. `null`이면 연락처 섹션 대신 기본 안내 문구만 표시한다. 실패 원인별 메시지 세분화는 Task 008 범위.
(`error.tsx` 자체는 Next.js 규칙상 `'use client'`가 필수이므로, 발행자 연락처가 필요한 폴백 UI는 정적 안내
문구로 단순화하거나 별도 Server Component를 자식으로 감싸 처리한다.)

### 4. 폼 인라인 형식 검증은 보류, 데모 링크로 대체

계획했던 zod `.refine(isValidNotionId, ...)` 형식 검증은 위 "범위 변경" 사유로 보류한다. 대신 홈 페이지에
`mockInvoices`를 순회해 렌더링하는 데모 링크 섹션(`src/app/page.tsx`)을 추가했다. 이 블록은 Task 007에서
mock 데이터가 실제 Notion 조회로 교체되면 함께 제거·대체되어야 한다(코드에 동일 취지 주석 남김).

## 구현 단계

1. [x] ~~`src/lib/notion/id.ts` 작성~~ → 보류 (범위 변경)
2. [x] ~~`invoices.ts` 리팩터링~~ → 보류 (범위 변경)
3. [x] ~~`invoice-lookup-form.tsx` 형식 검증 `.refine()`~~ → 보류, 대신 홈에 데모 링크 추가로 대체
4. [x] `src/app/page.tsx`에 안내 문구 보강 + `mockInvoices` 데모 링크 섹션 추가
5. [x] `src/app/invoice/[id]/not-found.tsx` 작성 (안내 문구 + 홈 버튼 + 발행자 연락처 조건부 표시)
6. [x] `src/app/error.tsx` 작성 (`'use client'`, `reset` 콜백으로 재시도 버튼)
7. [x] `npm run typecheck` / `npm run lint` / `npm run build` 통과, 신규·수정 파일 `prettier --check` 통과
8. [x] `docs/ROADMAP.md` Task 004 완료 표시
9. [x] Playwright MCP로 `## 테스트 체크리스트` 전 항목 수행

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` 통과
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] 신규/수정 파일 `prettier --check` 통과
- [x] ~~홈 폼에 형식이 잘못된 ID 입력 시 제출 없이 인라인 에러 표시~~ → 보류, 데모 링크로 "쉬운 입장" 해결
- [x] `/invoice/{존재하지 않는 ID}` 접근 시 커스텀 `not-found.tsx` 렌더 (홈 버튼 동작)
- [x] 상세 페이지에서 강제 오류 발생 시 `error.tsx` 폴백 UI + 재시도/홈 이동 동작
- [x] 모바일(375px)·데스크톱(1280px)·다크모드/라이트모드 정상
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] 홈에서 데모 링크(`INV-2026-0001 보기` 등) 클릭 → `/invoice/sample-001` 상세 페이지로 정상 이동
- [x] 홈 안내 문구 + 데모 링크 섹션이 폼과 함께 정상 렌더링

### 오류 처리

- [ ] ~~홈 폼 형식 검증~~ → 보류 (범위 변경)
- [x] `/invoice/{존재하지 않는 임의 텍스트}` 접근 → 커스텀 `not-found.tsx` 렌더("견적서를 찾을 수
      없습니다" + 안내 문구), "홈으로 돌아가기" 버튼 확인
- [x] 상세 페이지에서 강제 예외 발생(임시 `throw new Error(...)`로 테스트 후 원복) → `error.tsx` 폴백 UI
      표시, "다시 시도"/"홈으로 돌아가기" 버튼 동작 확인, 콘솔에 에러 로그 확인

### 엣지 케이스

- [x] `BUSINESS_NAME` 미설정 상태(`.env.local`에 값 없음 확인)에서 `not-found.tsx` 접근 시 연락처 섹션
      없이 기본 문구만 표시됨
- [ ] ~~하이픈 포함/미포함 ID 형식 폼 검증~~ → 보류 (범위 변경)

### 반응형 & 품질

- [x] 모바일(375×812) 뷰포트: 홈 페이지 데모 링크 `flex-wrap`으로 줄바꿈, 레이아웃 깨짐 없음
- [x] 데스크톱(1280×900) · 다크모드/라이트모드 전환 정상, `error.tsx` 페이지 반응형 정상
- [x] 콘솔 에러 0건 (홈, `/invoice/sample-001`, 신선한 데스크톱 뷰포트 로드 기준). `not-found.tsx` 라우트
      에서는 표준 404 리소스 로그 1건과 Next.js dev 모드 자체 오버레이 스크립트 경고 1건이 나타나며, 둘 다
      Task 005에서도 동일하게 확인된 프레임워크 자체 현상으로 이 Task의 코드 문제가 아님. (별도로, 375px
      처럼 좁은 뷰포트에서 곧바로 새로 접속하면 `Header`의 `useMediaQuery` 기반 모바일 네비게이션 분기에서
      기존부터 있던 hydration mismatch 경고가 발생하는 것을 확인 — 이 Task의 변경과 무관한 기존 이슈이며
      범위 밖. 별도 이슈로 기록해둠)

## 결과 요약

- `src/app/invoice/[id]/not-found.tsx` 신규 작성: 안내 문구 + "홈으로 돌아가기" 버튼 + `getBusinessInfo()`
  기반 발행자 연락처(설정된 경우만 표시). Next.js 기본 404 페이지를 대체.
- `src/app/error.tsx` 신규 작성: 전역 오류 폴백(`'use client'`, "다시 시도"(`reset`)/"홈으로 돌아가기" 버튼,
  `useEffect`로 콘솔 에러 로깅).
- `src/app/page.tsx`: 안내 문구를 "링크를 받았다면 자동으로 열림" 톤으로 보강, `mockInvoices` 3건을 순회하는
  데모 견적서 바로가기 링크 섹션 추가(사용자가 ID를 몰라도 바로 진입 가능). 이 블록은 Task 007에서 mock →
  실제 Notion 데이터 전환 시 제거 대상(코드 주석 명시).
- **범위 변경**: 원래 계획했던 폼 형식 검증(`.refine()`)과 `src/lib/notion/id.ts` 유틸 분리는 mock ID가
  Notion 실제 ID 형식이 아니라서 지금 도입하면 데모가 막히므로 Task 007 이후로 보류.
- `typecheck`/`lint`/`build`/`prettier --check` 모두 통과. Playwright로 홈→데모 링크 이동, 잘못된 URL 접근
  시 커스텀 not-found 렌더, `error.tsx` 강제 트리거·재시도·홈 이동, 모바일/데스크톱/다크·라이트모드, 콘솔
  에러(예상된 404 로그 제외 0건) 확인.
- **알려진 기존 이슈(범위 밖)**: 좁은 뷰포트(예: 375px)로 페이지를 새로 로드하면 `Header`의
  `useMediaQuery`(client-only) 기반 모바일 네비게이션 분기에서 SSR/클라이언트 hydration mismatch 경고가
  발생함. 이 Task의 변경 이전부터 있던 별개 문제로, 리사이즈(이미 hydrate된 페이지에서 뷰포트만 바꾸는 경우)
  에서는 재현되지 않음. 다음에 착수할 별도 Task에서 다룰 것을 제안.
