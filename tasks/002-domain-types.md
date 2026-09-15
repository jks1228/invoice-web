# Task 002: 도메인 타입 정의 및 데이터 모델 설계

> Phase 1 · 애플리케이션 골격 구축 · 구현 기능: F002(준비) / 후속 F001·F003 계약 제공

## 목표

이후 Task(005 상세 UI, 006 Notion 연동, 009 PDF)가 공유할 **인보이스 도메인 타입 계약**을
완결적으로 확정한다. 실제 Notion 조회·매핑 구현은 범위 밖이며, 이 Task는 타입·시그니처·상수만 정의한다.

## 관련 파일

| 파일                         | 구분       | 내용                                                                                            |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `src/types/invoice.ts`       | 신규       | `InvoiceStatus`, `InvoiceItem`, `BusinessInfo`, `Invoice`, `InvoiceView`, `InvoiceLookupResult` |
| `src/lib/notion/invoices.ts` | 신규(골격) | `INVOICE_PROPS` 상수, `NotionPropertyReaders` 계약, `getInvoiceById`/`getBusinessInfo` 시그니처 |
| `src/lib/format.ts`          | 신규       | `formatCurrency`, `formatDate` (ko-KR / KRW 기본)                                               |
| `src/lib/notion/index.ts`    | 수정       | `invoices` 모듈 재export 추가 (배럴 동기화 규칙)                                                |
| `docs/PRD.md`                | 참조       | 데이터 모델 섹션                                                                                |
| `docs/ROADMAP.md`            | 참조       | Task 002 항목, 테스트 원칙                                                                      |
| `shrimp-rules.md`            | 참조       | 코드 스타일, 확정 경로 표, 다중 파일 동기화                                                     |

## 설계 결정 및 근거

### 1. 필드 명명: PRD의 snake_case → camelCase 전환

PRD 데이터 모델 표는 `client_name`, `invoice_number` 등 snake_case로 기술되어 있으나,
도메인 타입 필드는 프로젝트 표준(shrimp-rules.md 코드 스타일, 기존 `invoice-lookup-form`의
`invoiceId` 등)에 맞춰 **camelCase**(`clientName`, `invoiceNumber`, `invoiceDate`, `dueDate`,
`taxRate`, `taxAmount`, `totalAmount`)로 통일한다.
Notion property 표시명과의 연결은 `INVOICE_PROPS` 상수 맵이 전담한다.

### 2. `InvoiceItem`에서 `invoiceId` 제외

PRD `InvoiceItem`에는 `invoice_id`(소속 인보이스)가 있으나, 도메인 타입에서는
`Invoice.items: InvoiceItem[]`로 부모에 종속되므로 중복이다. 제외한다.
`order`는 표시 정렬용으로 옵셔널 유지한다.

### 3. 날짜는 ISO 문자열(`string`)로 보관

Notion date 원본이 문자열이고 직렬화(Server Component → Client, PDF 입력)에 유리하다.
표시용 변환은 `src/lib/format.ts`가 담당한다.

### 4. 옵셔널 필드 확정

- **Invoice 필수**: `id`, `invoiceNumber`, `clientName`, `invoiceDate`, `items`, `subtotal`, `totalAmount`, `status`
- **Invoice 선택**: `dueDate`, `taxRate`, `taxAmount`, `notes`, `businessInfo`
  (세금 0%·할인·발행자 조회 실패 케이스가 ROADMAP 엣지에 명시됨)
- **InvoiceItem 필수**: `id`, `itemName`, `unitPrice`, `quantity`, `amount` / **선택**: `description`, `order`
- **BusinessInfo 필수**: `businessName` / 나머지 선택

### 5. `INVOICE_PROPS`는 자리표시자 상태

값은 임시 문자열이며 `TODO(Task 006)` 주석으로 표시했다. 실제 Notion 데이터베이스의
정확한 property 표시명·타입은 Task 006에서 DB를 확인한 뒤 확정한다.

### 6. `InvoiceView.computed` 선반영

`itemsTotal`, `taxLabel`, `isOverdue` 등 파생값을 뷰모델에 미리 포함해
Task 007(합계 재계산 검증)·Task 008(기한 지남 배지)에서 타입 재설계가 없도록 한다.

### 7. 조회 함수는 골격만

`getInvoiceById`/`getBusinessInfo`는 시그니처만 확정하고 본문은
`throw new Error('...Task 006에서 구현...')`. 이 Task에서 호출되지 않으며
(Task 005는 mock 사용) `tsc`·`eslint`를 통과한다.

## 구현 단계

1. [x] `src/types/invoice.ts` 작성 (순수 타입, 런타임 코드 없음)
2. [x] `src/lib/notion/invoices.ts` 골격 작성 (`INVOICE_PROPS`, `NotionPropertyReaders`, 조회 시그니처)
3. [x] `src/lib/format.ts` 작성 (`formatCurrency`, `formatDate`)
4. [x] `src/lib/notion/index.ts` 배럴에 재export 추가
5. [x] `npm run typecheck` / `npm run lint` 통과, 신규 파일 `prettier --check` 통과
6. [x] 작업 파일 작성
7. [x] Playwright MCP 스모크 수행

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` (tsc --noEmit) 통과
- [x] `npm run lint` (eslint) 통과
- [x] 신규/수정 4개 파일 `prettier --check` 통과
- [x] `src/types/invoice.ts`가 PRD 필드를 camelCase로 모두 표현, 옵셔널 구분이 명세대로
- [x] `InvoiceLookupResult.reason` 값이 정확히 `not_found` / `invalid_id` / `notion_error`
- [x] `@/lib/notion` 배럴에서 `INVOICE_PROPS` / `getInvoiceById` / `getBusinessInfo` import 가능
- [x] 기존 홈/상세 페이지 컴파일 무영향
- [x] Playwright MCP 스모크 전 항목 통과

> **참고**: 저장소 전체 `npm run format:check`는 이 Task와 무관한 기존 미포맷 파일
> 약 58개(`.claude/*.md`, `docs/guides/*`, `src/components/ui/*` 등)로 인해 실패한다.
> 이는 Task 001 이전부터의 baseline 상태이며, 범위 관리를 위해 이 Task에서 일괄 포맷하지 않는다.
> 이 Task가 생성/수정한 4개 파일은 모두 Prettier 규칙을 통과한다.

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리
> (타입/시그니처 정의 Task이므로 API·비즈니스 로직 시나리오는 해당 없음 → 스모크 검증만)

### 정상 흐름 (Happy Path)

- [x] 홈(`/`) 렌더링 정상 — 헤더 / "견적서 확인" 카드 / 인보이스 ID 입력 / 조회 버튼 / 푸터 표시
- [x] 인보이스 상세(`/invoice/test-id`) 렌더링 정상 — "견적서 상세" 카드 / "인보이스 ID: test-id" / 홈으로 링크 표시

### 반응형 & 품질

- [x] 콘솔 에러 0건 (홈·상세 전 구간, error 0 / warning 0)
- [x] 두 라우트 HTTP 200

## 결과 요약

- `src/types/invoice.ts`, `src/lib/notion/invoices.ts`(골격), `src/lib/format.ts` 신규 생성 및
  `src/lib/notion/index.ts` 배럴 갱신 완료.
- `typecheck` / `lint` / 신규 파일 `prettier --check` 모두 통과.
- Playwright MCP 스모크: 홈·상세 두 페이지 정상 렌더링, 콘솔 에러·경고 0건 확인.
- 후속: Task 006에서 `INVOICE_PROPS` 실제 값 확정 + `getInvoiceById` / `getBusinessInfo` /
  `NotionPropertyReaders` 구현.
