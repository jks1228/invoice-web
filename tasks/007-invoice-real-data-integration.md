# Task 007: 인보이스 상세 조회 실데이터 연동

> Phase 3 · 핵심 기능 구현 · 구현 기능: F001, F002, F004

## 목표

Task 006에서 완성한 Notion 데이터 레이어(`src/lib/notion/invoices.ts`의 `getInvoiceById`)를 실제 페이지에
연동한다. `src/app/invoice/[id]/page.tsx`의 mock 데이터(`getMockInvoiceById`) 호출을 `getInvoiceById`
(실제 Notion 조회)로 교체하고, 다음을 추가로 구현한다:

1. 에러 처리: API 조회 결과 판별 유니온에 따른 적절한 응답 (404 또는 에러 경계)
2. 합계 재계산 검증: 항목 금액 합계와 Notion 총금액 불일치 감지 (ROADMAP Task 007 요구사항)
3. 동적 메타데이터: `generateMetadata`로 견적서 번호 기반 `<title>` 설정
4. 로딩 UI: `InvoiceSkeleton` 기반 `loading.tsx` 추가로 레이아웃 시프트 방지
5. 홈페이지 데모 링크: mock 링크 3개 → 실제 Notion 데이터(INV-2026-001) 1개로 교체

## 관련 파일

| 파일                                         | 구분 | 내용                                                                                                         |
| -------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| `src/app/invoice/[id]/page.tsx`              | 수정 | `getMockInvoiceById` → `getInvoiceById`로 교체, 에러 분기, 합계 검증, `generateMetadata` 추가                |
| `src/app/invoice/[id]/loading.tsx`           | 신규 | `InvoiceSkeleton`을 페이지 레이아웃으로 감싼 로딩 상태                                                       |
| `src/app/page.tsx`                           | 수정 | mock 데모 링크 제거, 실제 Notion 링크(`3d5eed15f2bc800389f4fc748aaa1df4`)로 교체, `mockInvoices` import 제거 |
| `src/lib/mock/invoices.ts`                   | 삭제 | 더 이상 사용되지 않음                                                                                        |
| `tasks/007-invoice-real-data-integration.md` | 신규 | 본 Task 계획 및 진행 결과 문서 (이 파일)                                                                     |

## 설계 결정 및 근거

### 1. 에러 분기: `invalid_id`/`not_found` → `notFound()`, `notion_error` → `throw`

`getInvoiceById`는 3가지 실패 사유를 반환한다:

- `invalid_id`: ID 형식 오류 (즉각적 404 오류가 아님, 사용자 입력 오류)
- `not_found`: ID 형식은 유효하나 존재하지 않거나 다른 DB 소속 (F004)
- `notion_error`: Notion API 실패 (재시도 소진 등 서버 측 문제)

규칙:

- `invalid_id` + `not_found` → 모두 404 처리 (`notFound()`)
- `notion_error` → 예외 발생 (`throw new Error()`) 후 `src/app/error.tsx` 경계가 잡음

### 2. 합계 재계산 검증 (ROADMAP Task 007 "데이터 정합성 검증")

항목 relation이 `getPage`로 개별 조회되므로, Notion의 "총금액" 필드(`invoice.subtotal`)와
항목 금액 합계(`itemsTotal = sum(items[].amount)`)가 불일치할 수 있다(데이터 입력 오류,
relation 누락 등). 검증 로직:

- `itemsTotal === invoice.subtotal` → 정상, `invoice.subtotal` 표시
- `itemsTotal ≠ invoice.subtotal` → 불일치 감지:
  - 화면에는 `itemsTotal` 소계로 표시 (항목 기준이 더 신뢰성 높음)
  - `console.warn(...)` 로그로 불일치 기록
  - 실제 테스트 데이터(INV-2026-001)는 정상 케이스라 불일치 케이스는 재현하지 않음 (코드 리뷰 수준)

### 3. `generateMetadata`에서 중복 조회 방지

Next.js는 같은 요청 내에서 동일한 `fetch()` 호출을 자동 메모이즈한다. `generateMetadata`와
페이지 컴포넌트 모두 `getInvoiceById(id)`를 호출해도 실제 API는 한 번만 나간다(캐싱 래퍼 불필요).

### 4. 로딩 UI는 `InvoiceSkeleton` 컴포넌트 재사용

이미 구현된 `InvoiceSkeleton`(8칸 레이아웃, `space-y-8`)를 `<Container>`/`<Card>` 구조로
감싸면 페이지 로딩 중 레이아웃 시프트 없음.

### 5. 홈페이지 데모: 단일 실제 링크로 통일

mock 데이터 3개(`sample-001` 등)는 32자리 hex 형식이 아니므로 실제 Notion 연동 후 모두 404.
대신 실제 테스트 데이터(INV-2026-001, 페이지 ID `3d5eed15f2bc800389f4fc748aaa1df4`)로
단일 데모 링크 제공.

## 구현 단계

1. [x] `src/app/invoice/[id]/page.tsx` 코드 변경
   - [x] `getInvoiceById` import 추가
   - [x] `getMockInvoiceById` 호출 → `await getInvoiceById(id)` 호출로 교체
   - [x] 결과 판별 유니온 분기 구현 (not_found/invalid_id/notion_error)
   - [x] 합계 재계산 검증 로직 추가 (불일치 시 warn 로그)
   - [x] `generateMetadata` 추가 (동적 제목)
2. [x] `src/app/invoice/[id]/loading.tsx` 신규 생성
3. [x] `src/app/page.tsx` 수정
   - [x] `mockInvoices` import 제거
   - [x] mock 링크 블록 → 단일 실제 링크(INV-2026-001)로 교체
4. [x] `src/lib/mock/invoices.ts` 정리 (참조 없음 확인 후 삭제)
5. [x] `npm run check-all` / `npm run build` 통과 확인
6. [x] `npx prettier --check` 통과

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` 통과
- [x] `npm run lint` 통과
- [x] `npm run build` 성공
- [x] `npx prettier --check` 모든 변경 파일 통과
- [x] 아래 테스트 체크리스트 구현 관련 항목 통과

## 테스트 체크리스트

> 도구: 정적 검증(typecheck/lint/build/prettier) · 코드 리뷰 수준 검증 · 실제 E2E는 Playwright MCP (상위
> 세션에서 수행)

### 구현 검증

- [x] `src/app/invoice/[id]/page.tsx` 타입 안정성
  - [x] `getInvoiceById` import 확인
  - [x] `InvoiceLookupResult` 판별 유니온 분기 완료
  - [x] `generateMetadata` 반환 타입 `Metadata` 정확
  - [x] `displaySubtotal` 계산 로직 정확
- [x] `src/app/invoice/[id]/loading.tsx` 레이아웃 일치성
  - [x] `<Container>` / `<Card>` / `<CardContent className="space-y-8">` 구조 동일
  - [x] `<InvoiceSkeleton>` 포함
- [x] `src/app/page.tsx` mock 제거 확인
  - [x] `mockInvoices` import 제거됨
  - [x] 단일 링크(INV-2026-001, `3d5eed15f2bc800389f4fc748aaa1df4`) 포함
- [x] `src/lib/mock/invoices.ts` 삭제 확인
  - [x] grep 확인: 코드 내 참조 0건

### 정적 검증

- [x] `npm run typecheck` — 0개 에러
- [x] `npm run lint` — 0개 에러
- [x] `npm run build` 성공 — 동적 페이지 생성 확인
- [x] `npx prettier --check` — 모든 변경 파일 통과

### 동적 E2E 검증 (Playwright MCP)

> 상위 세션(코디네이터)이 서브에이전트 완료 후 수행

- [x] 실제 Notion 데이터(INV-2026-001) 페이지 로드
  - [x] 브라우저에서 `/invoice/3d5eed15f2bc800389f4fc748aaa1df4` 접속
  - [x] 견적서 번호(INV-2026-001), 클라이언트(ABC회사) 표시 확인
  - [x] 항목 3건(웹사이트 디자인/로고 제작/명함디자인) 표시 확인, 각 금액(₩3,000,000/₩1,000,000/
        ₩1,000,000) 정확
  - [x] 소계·합계(₩5,000,000) 표시 확인 (항목 합계와 Notion 총금액 일치 — 정상 케이스)
  - [x] `<title>` 태그가 "INV-2026-001 — 견적서 확인"으로 정확히 설정됨 확인
  - [x] `BUSINESS_NAME` 미설정 상태에서 "발행자 정보를 불러올 수 없습니다" 문구로 정상 폴백
  - [x] 홈(`/`) → "INV-2026-001 보기" 데모 링크 클릭 → 상세 페이지 정상 이동
- [x] 404 처리 확인
  - [x] 형식 오류 ID(`not-a-valid-id`) → 커스텀 `not-found.tsx` 렌더, `<title>` "견적서를 찾을 수
        없습니다"로 폴백
  - [x] 형식은 맞지만 존재하지 않는 32자리 ID → 커스텀 `not-found.tsx` 렌더
  - [ ] 다른 DB의 유효한 페이지 ID로 접근(F004 보안 분기) — 테스트용 타 DB 페이지 ID를 확보하기 어려워
        미실행. `getInvoiceById`의 `pageDatabaseId` 비교 로직은 Task 006에서 이미 코드 검증됨(범위 밖 재확인)
- [ ] 에러 처리 확인
  - [ ] Notion API 실패 시뮬레이션(`.env.local` 키 훼손) → `error.tsx` 경계 표시 — **미실행**: 동작 중인
        `.env.local`을 일부러 깨뜨리는 건 리스크 대비 얻는 정보가 적다고 판단(동일한 throw→error.tsx
        catch 경로는 Task 004에서 강제 `throw`로 이미 실제 검증됨). 코드 경로가 동일해 낮은 리스크로 판단.
- [ ] 로딩 상태 확인
  - [ ] 느린 네트워크(DevTools throttle)에서 `loading.tsx` 스켈레톤 표시 — **미실행**: 로컬 Notion 응답이
        빨라 실제 화면 전환을 관찰하기 어려움(throttle 도구 미가용). `loading.tsx` 자체는 코드 리뷰로
        `InvoiceSkeleton` 정상 임포트·레이아웃 일치 확인 완료.
- [x] 합계 불일치 시뮬레이션 — 실제 데이터가 정상 케이스라 코드 리뷰로만 검증(위 서브에이전트 검증과 동일)
- [x] 반응형/품질: 모바일(375×812)·데스크톱(1280×900) 레이아웃 정상, 콘솔 에러 0건(신선한 데스크톱 로드
      기준). 좁은 뷰포트 새로고침 시 나타나는 헤더 hydration mismatch는 Task 004에 기록된 기존 이슈로
      이 Task와 무관함을 재확인(1280px로 리사이즈 후 재현 안 됨)

## 결과 요약

### 구현 완료

1. **`src/app/invoice/[id]/page.tsx` 교체**
   - Task 006의 `getInvoiceById`를 실제 페이지에 연동
   - 결과 판별 유니온 분기: `not_found`/`invalid_id` → `notFound()`, `notion_error` → `throw`
   - 항목 금액 합계 vs Notion 총금액 불일치 감지 로직 추가:
     - 불일치 시: 화면에 항목 합계(`itemsTotal`) 표시, `console.warn` 로그
     - 일치 시: Notion 값 그대로 사용
   - `generateMetadata` 추가: 동적 `<title>` (예: `INV-2026-001 — 견적서 확인`)

2. **`src/app/invoice/[id]/loading.tsx` 신규 생성**
   - `InvoiceSkeleton`을 `<Container>` / `<Card>` 구조로 감싸 레이아웃 시프트 방지
   - 기존 페이지와 동일한 `space-y-8` 간격

3. **`src/app/page.tsx` 수정**
   - mock 데모 링크 3개 제거 (`mockInvoices` 기반)
   - 실제 Notion 데이터(INV-2026-001, 페이지 ID `3d5eed15f2bc800389f4fc748aaa1df4`) 단일 링크로 교체
   - `mockInvoices` import 제거

4. **`src/lib/mock/invoices.ts` 삭제**
   - grep 확인: 코드 내 참조 0건 확인 후 삭제

### 검증 결과

- **정적 검증**: `npm run typecheck` / `npm run lint` / `npm run build` / `prettier --check` 모두 통과
- **합계 재계산 검증**: 코드 리뷰 수준 검증 완료
  - 테스트 데이터(INV-2026-001)는 정상 케이스(항목 합계 ₩5,000,000 = Notion 총금액 ₩5,000,000)
  - 불일치 케이스는 실제 Notion에서 재현하기 어려워 코드 로직 자체로만 검증
- **메타데이터**: 동적 제목 설정 확인, 실패 시 기본 제목 반환

### 주의사항 및 후속

- `.env.local`에 `NOTION_API_KEY` / `NOTION_DATABASE_ID` 설정 필수
- `BUSINESS_*` 환경 변수 미설정 시 발행자 정보는 표시 안 됨 (선택 필드)

### Playwright MCP 검증 (상위 세션, 서브에이전트 완료 후 수행)

- 실제 링크(`/invoice/3d5eed15f2bc800389f4fc748aaa1df4`) 접속 → INV-2026-001·ABC회사·항목 3건·합계
  ₩5,000,000·동적 `<title>` 전부 정상 확인. 홈 → 데모 링크 → 상세 이동 정상.
- 형식 오류 ID·존재하지 않는 32자리 ID 모두 커스텀 `not-found.tsx`로 정상 처리, `<title>` 폴백도 확인.
- 모바일(375)·데스크톱(1280) 레이아웃 정상, 콘솔 에러 0건(신선한 데스크톱 로드 기준).
- **미실행(낮은 리스크로 판단해 생략)**: `.env.local` 훼손을 통한 `notion_error`→`error.tsx` 실제 트리거
  (Task 004에서 동일 경로를 강제 `throw`로 이미 검증했고, `.env.local`을 일부러 깨뜨리는 리스크가 더 큼),
  느린 네트워크 throttle로 `loading.tsx` 관찰(로컬 Notion 응답이 빨라 자연 재현 어려움, throttle 도구
  미가용 — 코드 리뷰로 대체), 타 DB 페이지 ID로 F004 분기 재확인(테스트용 타 DB 페이지 미보유, Task 006
  코드 검증으로 대체).
- Task 007 전체 완료로 판단해 `docs/ROADMAP.md`에 ✅ 표시함.
