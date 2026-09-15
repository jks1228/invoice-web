# Task 015: 공개 링크 복사 기능 구현 (A002)

> Phase 6 · 관리자 UI 완성 (더미 데이터 활용)

## 목표

목록의 각 행에서 `/invoice/{id}` 공개 링크를 클립보드로 복사하는 기능을 구현한다. 클립보드 API
미지원/비보안 컨텍스트에 대한 폴백을 필수로 포함한다.

## 관련 파일

| 파일                                          | 구분 | 내용                                                   |
| --------------------------------------------- | ---- | ------------------------------------------------------ |
| `src/lib/invoice.ts`                          | 수정 | `buildInvoicePublicUrl` 구현                           |
| `src/hooks/use-copy-invoice-link.ts`          | 신규 | 복사/폴백 로직 공용 훅(버튼·드롭다운 메뉴에서 재사용)  |
| `src/components/admin/copy-link-button.tsx`   | 신규 | 데스크톱 액션 컬럼용 복사 버튼(Client Component)       |
| `src/components/admin/invoice-list-table.tsx` | 수정 | 액션 컬럼에 복사 버튼 추가, 모바일은 드롭다운으로 접기 |
| `src/lib/env.ts`                              | 수정 | `NEXT_PUBLIC_SITE_URL` 스키마 추가(문서화 목적)        |
| `.env.example`                                | 수정 | `NEXT_PUBLIC_SITE_URL` 예시 추가                       |

## 설계 결정 및 근거

### 1. `buildInvoicePublicUrl`은 `lib/env.ts`의 `env` 객체를 import하지 않는다

이 함수는 관리자 목록 페이지(Server Component)뿐 아니라 `copy-link-button.tsx`(Client Component)에서도
호출된다. `env.ts`는 모듈 로드 시점에 `NOTION_API_KEY`(서버 전용 값)를 Zod로 즉시 검증하는데, 이 모듈을
클라이언트 번들에 포함시키면 브라우저에는 그 값이 없어 **모듈 로드 자체가 예외를 던져 클라이언트 코드가
깨진다**. `NEXT_PUBLIC_` 접두사 변수는 Next.js가 서버/클라이언트 번들 모두에 빌드 타임에 안전하게
인라인하므로, `process.env.NEXT_PUBLIC_SITE_URL`을 직접 읽어 이 문제를 피한다. 로드맵 지시대로
`env.ts` 스키마에도 문서화 목적으로 추가하되(서버 전용 코드에서 필요시 사용), `buildInvoicePublicUrl`
자체는 `env` 객체를 우회한다.

### 2. 우선순위: 브라우저 `window.location.origin` → 서버 `NEXT_PUBLIC_SITE_URL` → 호출부가 넘긴 `origin` 인자

로드맵 지시를 그대로 따른다. 브라우저에서 호출되면(클라이언트 컴포넌트) `window`가 존재하므로 항상
`window.location.origin`을 쓴다. 서버(향후 메타데이터 생성 등)에서 호출되면 `window`가 없으므로 환경
변수를 우선하고, 없으면 호출부가 요청에서 뽑아 넘긴 `origin`으로 폴백한다.

### 3. 클립보드 복사 로직을 훅으로 분리 — 데스크톱 버튼과 모바일 드롭다운 메뉴 항목이 공유

Task 016(반응형)까지 고려하면 같은 "복사" 동작이 데스크톱은 독립 버튼으로, 모바일은 드롭다운 메뉴
항목으로 서로 다른 트리거 UI에 필요하다. 복사·폴백·토스트 로직을 `use-copy-invoice-link.ts` 훅으로
빼서 두 프레젠테이션 컴포넌트(`CopyLinkButton`, 드롭다운 내 메뉴 항목)가 로직을 중복 구현하지 않게
한다.

### 4. 복사 폴백 3단계: Clipboard API → `execCommand('copy')` → 입력창 노출

1. `navigator.clipboard.writeText()` — `window.isSecureContext`(HTTPS/localhost)에서만 시도
2. 실패/미지원 시 임시 `<textarea>` + `document.execCommand('copy')`(레거시 폴백, 구형 브라우저·비보안
   컨텍스트 대응)
3. 그마저 실패하면 읽기 전용 `Input`에 URL을 노출해 사용자가 직접 선택·복사하게 하고 오류 토스트로
   안내(로드맵 "실패 시 토스트로 URL 직접 노출" 지시와 일치)

### 5. 접근성: `aria-label` + `aria-live` 상태 안내

버튼에 `aria-label="공개 링크 복사"`를 명시하고, 복사 성공 여부를 스크린리더에 알리기 위해 `sr-only`
`role="status" aria-live="polite"` 영역을 둔다(시각적으로는 sonner 토스트가 이미 보여주므로 중복
노출하지 않음).

## 구현 단계

1. [x] `src/lib/env.ts`에 `NEXT_PUBLIC_SITE_URL: z.string().url().optional()` 추가, `.env.example`에
       예시 추가
2. [x] `src/lib/invoice.ts`에 `buildInvoicePublicUrl` 구현(위 설계 결정 1·2)
3. [x] `src/hooks/use-copy-invoice-link.ts` 작성 — `copied`·`fallbackUrl`·`copy()` 반환
4. [x] `src/components/admin/copy-link-button.tsx` 작성 — 훅 사용, 성공 시 아이콘 2초 체크 표시 +
       sonner 토스트, 실패 시 `Input` 폴백 노출
5. [x] `src/components/admin/invoice-list-table.tsx` 수정 — 데스크톱 액션 컬럼에 `CopyLinkButton` +
       `OpenInvoiceLink` 나란히 배치, 모바일 카드는 `DropdownMenu`(액션 트리거) 안에 "링크 복사"/"새
       탭에서 열기" 2개 항목으로 접기
6. [x] `npm run check-all` 통과 확인
7. [x] Playwright MCP 테스트(아래 체크리스트) 수행

## 수락 기준 (완료 조건)

- [x] "링크 복사" 클릭 시 클립보드 값이 `{origin}/invoice/{id}`와 정확히 일치
- [x] 클립보드 API가 없거나 실패해도 폴백으로 URL을 확인할 수 있음
- [x] 모바일에서는 액션이 드롭다운 메뉴로 접혀 표시됨
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run check-all` 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] 버튼 클릭 → 클립보드 값이 `{origin}/invoice/{id}`와 정확히 일치 — `navigator.clipboard.writeText`를
      가로채(모킹) 실제 전달값을 검증(`readText()`는 브라우저 권한 프롬프트가 자동화 세션을 블로킹시켜
      대신 사용, 아래 "구현 중 발견" 참고), 토스트("링크를 복사했습니다") 표시 확인
- [x] 복사한 링크(`http://localhost:3000/invoice/{id}`)가 실제 `/invoice/{id}` 라우트로 정상 이동함을
      기존 라우트 동작으로 확인(더미 ID라 not-found로 귀결되는 것도 라우팅 자체는 정상임을 Task 014에서
      이미 확인함)

### 오류 처리

- [x] `navigator.clipboard.writeText`가 거부(reject)하고 `document.execCommand`도 실패하도록 모킹 →
      폴백 `Input`에 URL이 노출되고 오류 토스트("자동 복사에 실패했습니다...") 표시, 콘솔 unhandled
      rejection 없음(스크린샷으로 확인)
- [x] (버튼이 항상 유효한 ID를 받는 목록 구조라 "잘못된/빈 ID 행" 케이스는 해당 없음 — 목록 자체가 ID
      없는 행을 렌더링하지 않음)

### 엣지 케이스

- [x] 서로 다른 행(1번째·2번째) 연속 복사 시 각각 자신의 ID로 정확한 URL이 전달됨을 확인(마지막 클릭
      값이 아니라 클릭한 행 각각의 값이 정확함)
- [x] 하이픈 없는 32자리 ID로 생성된 링크(`http://localhost:3000/invoice/1111...`)가 유효한 URL
      형식임을 확인
- [x] **구현 중 발견한 버그**: 모바일 드롭다운의 "링크 복사" 메뉴 항목에 불필요한
      `onSelect={event => event.preventDefault()}`를 넣어 복사 후 메뉴가 닫히지 않는 문제를 Playwright
      테스트 중 발견 — `DropdownMenuItem`의 `onSelect`에 `copy`를 직접 연결하는 방식으로 수정해
      정상적으로 메뉴가 닫히는 것까지 재검증(스크린샷 비교)

### 반응형/품질

- [x] 데스크톱(1280) — 액션 컬럼에 "링크 복사"+"새 탭에서 열기" 버튼 2개 노출, 정상 동작
- [x] 모바일(375) — `DropdownMenu`("견적서 액션 메뉴")로 접혀 표시, 두 항목 모두 정상 동작(수정 후 재검증)
- [x] 콘솔 에러 0건(1280px 기준) — 375px에서는 Task 014에서도 기록한 기존 `Header` `useMediaQuery`
      hydration mismatch 이슈(ROADMAP Task 016에서 조사 예정)가 동일하게 재현되었으나, 기능 자체(메뉴
      열기·복사·토스트)는 정상 동작함을 확인했다. 이번 Task의 회귀는 아니다.

## 결과 요약

`buildInvoicePublicUrl`(`lib/invoice.ts`, `env.ts`를 우회해 `NEXT_PUBLIC_SITE_URL`을 직접 읽음),
`use-copy-invoice-link.ts`(Clipboard API → `execCommand` → 입력창 노출 3단계 폴백 훅), `copy-link-button.tsx`
(데스크톱 버튼), `invoice-row-actions-menu.tsx`(모바일 드롭다운)를 구현해 목록 각 행에서 공개 링크를
복사할 수 있게 했다.

Playwright MCP로 `navigator.clipboard.writeText`를 모킹해 복사값이 `{origin}/invoice/{id}`와 정확히
일치함을 검증했고(`readText()`는 권한 프롬프트가 자동화를 블로킹해 대신 모킹 방식 사용), 클립보드
실패 시 폴백 입력창·오류 토스트 노출, 서로 다른 행의 값이 섞이지 않음, 데스크톱/모바일 액션 UI를
모두 확인했다. 테스트 중 모바일 드롭다운이 복사 후 닫히지 않는 버그를 발견해 `onSelect` 핸들러를
수정하고 재검증까지 완료했다. `npm run check-all` 통과.
