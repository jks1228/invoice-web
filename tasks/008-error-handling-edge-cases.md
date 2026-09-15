# Task 008: 오류 처리 및 엣지 케이스

> Phase 3 · 핵심 기능 구현 · 구현 기능: F010

## 목표

Task 007에서 실데이터 연동을 마친 상세 페이지의 오류/엣지 케이스를 보강한다.

1. `error.tsx`에도 `not-found.tsx`처럼 발행자 연락처를 노출(설정 안 됐거나 조회 실패 시 기본 안내 문구)
2. Notion 클라이언트 재시도 소진 시 서버 로그를 명시적으로 남겨 사용자 메시지와 분리
3. 만료된(`dueDate` 경과) 인보이스에 "기한 지남" 배지 표시(조회 자체는 계속 허용)
4. `generateMetadata`가 `notion_error`까지 "찾을 수 없음"으로 뭉뚱그리지 않도록 사유별로 분리

## 관련 파일

| 파일                                        | 구분 | 내용                                                                                      |
| ------------------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| `src/app/api/business-info/route.ts`        | 신규 | `getBusinessInfo()`를 JSON으로 반환하는 Route Handler(`error.tsx`가 클라이언트에서 fetch) |
| `src/app/error.tsx`                         | 수정 | 마운트 시 `/api/business-info` fetch → 문의처 표시, 실패/미설정 시 기본 안내 문구         |
| `src/app/invoice/[id]/not-found.tsx`        | 수정 | 발행자 정보 없을 때도 기본 안내 문구를 보이도록 통일(기존엔 아무것도 안 보임)             |
| `src/components/invoice/invoice-header.tsx` | 수정 | `dueDate` 경과 + 상태가 "완료"가 아니면 `destructive` 배지 "기한 지남" 표시               |
| `src/lib/notion/client.ts`                  | 수정 | 재시도 소진 직전 `console.error`로 요청 메서드·경로·마지막 에러 로그                      |
| `src/app/invoice/[id]/page.tsx`             | 수정 | `generateMetadata`가 `notion_error`일 때 "일시적인 오류" 제목으로 분리                    |

## 설계 결정 및 근거

### 1. `error.tsx`(Client Component)가 서버 데이터를 얻는 방법: 전용 Route Handler

`error.tsx`는 Next.js 규칙상 `'use client'`가 필수라 `getBusinessInfo()`(서버 전용, env 접근)를 직접
호출할 수 없다. 별도 서버 상태 관리 없이 가장 단순한 방법은 작은 Route Handler를 두고
`useEffect`에서 fetch하는 것이다. `getBusinessInfo()`는 이미 예외를 던지지 않고 `null`만 반환하므로
이 라우트도 항상 200을 반환한다 — "실패"는 사실상 네트워크 자체 실패(fetch reject)만 남는데, 이 경우도
`catch`로 조용히 흡수하고 기본 문구로 대체한다(에러 화면 안에서 또 다른 에러를 보여주지 않기 위함).

### 2. `not-found.tsx`도 기본 안내 문구로 통일

기존엔 `businessInfo`가 없으면 문의처 문단 자체를 렌더링하지 않았다. ROADMAP이 "getBusinessInfo 실패
시 기본 안내 문구"를 요구하므로, `error.tsx`와 동일하게 null일 때도 문단은 유지하되 내용을
"문제가 계속되면 견적서를 보내주신 분께 문의해 주세요."로 바꿨다. `not-found.tsx`는 Server Component라
직접 `await getBusinessInfo()`를 호출하며(Route Handler 불필요), 로직만 두 파일에서 동일한 형태를 쓴다.

### 3. "기한 지남" 배지는 `InvoiceHeader` 내부에서 자체 계산

`Invoice.dueDate`는 이미 `InvoiceHeader`에 전달되고 있어, `isOverdue(dueDate, status)`라는 작은 순수
함수를 컴포넌트 파일 안에 두고 `new Date(dueDate) < Date.now()`로 판단한다. 상태가 "완료"인 인보이스는
기한이 지났어도 이미 처리가 끝난 건이라 배지를 띄우지 않는다(이미 결제된 건에 "기한 지남" 경고를 보여주는
건 오히려 혼란을 준다). `InvoiceDetailPage`나 `InvoiceLookupResult`/`InvoiceView` 타입을 건드리지 않아
Task 007 변경분과 독립적이다.

### 4. Notion 클라이언트 로그: 재시도 소진 지점에 한 줄 추가

기존에도 `getInvoiceById`의 catch 블록에서 `console.error`로 서버 로그를 남기고 있었지만(사용자에게는
일반화된 메시지만 노출하는 구조는 이미 되어 있었음), "재시도 소진"이라는 사실 자체와 몇 번 시도했는지는
로그에 없었다. `client.ts`의 `request()`가 재시도 루프를 다 돌고 마지막으로 `throw`하기 직전에
`(${this.retryCount}회 재시도 소진): ${method} ${path}`를 로그로 남겨, 향후 Notion 쪽 장애를 디버깅할 때
"환경변수 문제"와 "실제 재시도 소진"을 로그만 보고 구분할 수 있게 했다.

### 5. `generateMetadata`의 사유별 제목 분리

`getInvoiceById`가 `ok:false`를 반환하는 사유는 `invalid_id`/`not_found`(사용자 입력·존재하지 않음)와
`notion_error`(서버 장애)로 성격이 다르다. 기존엔 둘 다 "견적서를 찾을 수 없습니다" 제목을 썼는데,
`notion_error`는 실제로는 `error.tsx` 경계가 렌더링되므로 브라우저 탭 제목과 실제 화면 내용이 어긋났다
(강제 오류로 직접 확인함). `notion_error`일 때만 "일시적인 오류가 발생했습니다"로 분리했다.

## 구현 단계

1. [x] `src/app/api/business-info/route.ts` 신규 작성
2. [x] `src/app/error.tsx`: `useEffect` + `useState`로 business-info fetch, 문의처/기본 문구 렌더링
3. [x] `src/app/invoice/[id]/not-found.tsx`: 기본 안내 문구로 통일
4. [x] `src/components/invoice/invoice-header.tsx`: `isOverdue` 함수 + "기한 지남" 배지 추가
5. [x] `src/lib/notion/client.ts`: 재시도 소진 로그 추가
6. [x] `src/app/invoice/[id]/page.tsx`: `generateMetadata` 사유별 제목 분리
7. [x] `npm run typecheck` / `npm run lint` / `npm run build` 통과, `prettier --check` 통과(자동 포맷 1건)
8. [x] Playwright MCP로 실제 화면 검증 (아래 테스트 체크리스트)
9. [x] `docs/ROADMAP.md` Task 008 완료 표시

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` 통과
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] `prettier --check` 통과
- [x] 실제 만료 인보이스(INV-2026-001, 만료일 2026-09-09 < 오늘 2026-09-14)에서 "기한 지남" 배지 표시
- [x] `error.tsx` 강제 트리거 시 기본 안내 문구(발행자 미설정 상태) 표시
- [x] `not-found.tsx`에서도 동일한 기본 안내 문구 표시
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] "홈으로 돌아가기" 버튼(`not-found.tsx`/`error.tsx` 둘 다) → 홈 페이지 이동
- [x] `error.tsx`/`not-found.tsx` 모두 문의처 안내 문단(설정 시 연락처, 미설정 시 기본 문구) 표시

### 오류 처리

- [x] 없는 견적서(형식 오류 ID `not-a-valid-id`) → `not-found.tsx`, "문제가 계속되면 견적서를 보내주신
      분께 문의해 주세요." 기본 문구 표시(현재 `BUSINESS_NAME` 미설정)
- [x] Notion 조회 실패(페이지 내부에서 강제 `throw`로 재현 후 원복) → `error.tsx` 경계 표시, 콘솔에
      `console.error(error)` 로그 확인, 사용자 화면에는 `error.message`(내부 사유) 노출되지 않음(고정
      문구만 표시) 확인
- [x] `client.ts` 재시도 소진 로그 추가는 코드 리뷰로 확인(실제 Notion 장애를 의도적으로 재현하지는
      않음 — 기존 3회 재시도 로직 자체는 Task 006에서 이미 실동작 검증됨)

### 엣지 케이스

- [x] 만료된 인보이스(due_date 경과, 실제 데이터 INV-2026-001) → "기한 지남" 배지가 상태 배지 옆에 표시
- [x] `getBusinessInfo` null(환경 변수 미설정) 상태에서 `error.tsx`/`not-found.tsx` 모두 기본 안내 문구로
      정상 대체(빈 화면이나 깨짐 없음)

### 반응형 & 품질

- [x] 모바일(375×812) 뷰포트에서 상태 배지 + "기한 지남" 배지가 `flex-wrap`으로 줄바꿈, 레이아웃 깨짐 없음
- [x] 데스크톱(1280×900) 정상
- [x] 콘솔 에러 0건(신선한 데스크톱 로드 기준). 좁은 뷰포트 새로고침 시 나타나는 헤더 hydration
      mismatch는 Task 004에 기록된 기존 이슈로 이 Task와 무관함(1280px 리사이즈 후 재현 안 됨, 재확인)

## 결과 요약

- `src/app/api/business-info/route.ts` 신규: `error.tsx`가 서버 전용 `getBusinessInfo()`를 간접적으로
  쓸 수 있게 하는 작은 Route Handler.
- `src/app/error.tsx`: 마운트 시 위 라우트를 fetch해 문의처를 표시하거나(설정된 경우), 없거나 fetch
  실패 시 "문제가 계속되면 견적서를 보내주신 분께 문의해 주세요." 기본 문구로 대체. 사용자에게는
  `error.message`를 절대 노출하지 않고 고정 문구만 보여주며, 실제 에러는 `console.error`로만 남김.
- `src/app/invoice/[id]/not-found.tsx`: 동일한 기본 문구 정책으로 통일(기존엔 발행자 정보 없으면
  아무것도 안 보였음).
- `src/components/invoice/invoice-header.tsx`: `isOverdue(dueDate, status)` 순수 함수 추가, 만료
  - 미완료 상태일 때 상태 배지 옆에 `destructive` 스타일 "기한 지남" 배지 표시. "완료" 상태는 제외(이미
    처리된 건에 경고를 띄우는 건 혼란을 줌).
- `src/lib/notion/client.ts`: 재시도 소진 직전 `console.error`로 몇 회 재시도했는지·어떤 요청이었는지
  로그 추가(기존에도 상위 `getInvoiceById`에서 로그는 있었으나 "재시도 소진"이라는 사실 자체는 기록되지
  않았음).
- `src/app/invoice/[id]/page.tsx`: `generateMetadata`가 `notion_error`(서버 장애)와 `not_found`/
  `invalid_id`(사용자 입력 문제)를 서로 다른 제목으로 분리 — 강제 오류로 재현해보니 기존엔 실제
  `error.tsx`가 뜨는데 탭 제목은 "찾을 수 없습니다"로 나와 불일치했던 걸 수정.
- `typecheck`/`lint`/`build`/`prettier --check` 모두 통과. Playwright로 실제 만료 인보이스(INV-2026-001)
  "기한 지남" 배지, 강제 오류→`error.tsx`→기본 문구, 형식 오류 ID→`not-found.tsx`→기본 문구, 모바일/
  데스크톱 레이아웃, 콘솔 에러 0건(신선한 데스크톱 로드 기준) 모두 확인.
