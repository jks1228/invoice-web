# Task 013: 관리자 도메인 타입 및 목록 조회 계약 설계

> Phase 5 · 관리자 영역 골격 구축

## 목표

관리자 목록 화면(Task 014~017)이 공통으로 쓸 타입 계약을 먼저 정의한다. 이 Task는 **타입만** 정의하고
런타임 구현(실제 Notion 조회, 링크 생성 함수 본문)은 다루지 않는다 — 각각 Task 017·015에서 구현한다.

## 관련 파일

| 파일                         | 구분 | 내용                                                                                  |
| ---------------------------- | ---- | ------------------------------------------------------------------------------------- |
| `src/types/invoice.ts`       | 수정 | `InvoiceListItem`·`InvoiceListResult`·`InvoiceListQuery`·`BuildInvoicePublicUrl` 추가 |
| `src/lib/notion/invoices.ts` | 수정 | `INVOICE_PROPS` 재사용 관련 주석 추가(목록 조회에서도 동일 상수 사용 예정)            |

## 설계 결정 및 근거

### 1. `InvoiceListItem`은 `items` 배열을 포함하지 않는 경량 타입

목록에서 항목(relation) 개별 조회를 하면 견적서 건수만큼 API 호출이 발생한다(N+1). Task 017에서
`getInvoiceList()`가 항목 relation을 조회하지 않기로 결정했으므로, 타입 단계에서부터 `items`를 제외해
"목록에는 항목이 없다"는 계약을 명확히 한다. `isOverdue`는 매 렌더링마다 재계산하지 않도록 목록 조회
시점에 미리 계산해 필드로 포함한다(기존 `isOverdue()` 유틸을 조회 계층에서 호출해 채움).

### 2. `InvoiceListResult`은 기존 `InvoiceLookupResult`와 동일한 판별 유니온 패턴

단건 조회는 `not_found`/`invalid_id`/`notion_error` 세 가지 실패 사유가 있지만, 목록 조회는 ID 유효성
검증이 필요 없고 "결과가 없음(0건)"은 실패가 아니라 `data: []`로 표현되는 정상 케이스다. 따라서 실패
사유는 `notion_error` 하나만 정의한다.

### 3. `InvoiceListQuery`는 이 시점에는 필드만 정의(구현은 Task 017)

정렬 기준은 로드맵상 "발행일 내림차순 고정"이 기본이라 별도 sort 옵션은 넣지 않고, 상태 필터·페이지
크기·커서만 정의한다. 향후 정렬 옵션이 필요해지면 이 타입을 확장한다(과설계 방지).

### 4. `buildInvoicePublicUrl`은 함수 타입(`BuildInvoicePublicUrl`)만 선언

"타입 계약만 정의"라는 로드맵 지시를 TypeScript로 표현하려면 실행 가능한 함수 스텁을 만들기보다 함수
시그니처를 나타내는 타입 별칭을 선언하는 편이 낫다 — 빈 구현체를 만들면 Task 015 전까지 잘못된 반환값
(예: 빈 문자열)을 실수로 호출부에서 쓸 위험이 있다. Task 015에서 `src/lib/invoice.ts`에 이 타입을
만족하는 실제 함수를 구현한다.

### 5. `STATUS_LABEL`·`isOverdue`·`INVOICE_PROPS` 재사용 가능 여부 점검 결과 — 변경 불필요

- `isOverdue(dueDate, status)`: `InvoiceListItem`도 `dueDate`·`status` 필드를 그대로 가지므로 시그니처
  변경 없이 목록에서도 재사용 가능
- `STATUS_LABEL: Record<InvoiceStatus, string>`: `InvoiceStatus`를 키로 하므로 그대로 재사용 가능
- `INVOICE_PROPS`(`invoiceNumber`·`clientName`·`invoiceDate`·`dueDate`·`totalAmount`·`status`): 목록에
  필요한 property가 모두 포함되어 있어(항목 relation `items`만 목록에서 미사용) 추가 상수 없이 그대로
  재사용 가능 — Task 017에서 `getInvoiceList()`가 그대로 import해서 쓴다
- `resolveSubtotal(invoice)`: `Invoice.items`에 의존하므로 목록에서는 사용하지 않는다(목록은 Notion의
  `총금 액` 값을 그대로 표시, 로드맵 Task 017 지시와 일치)

## 구현 단계

1. [x] `src/types/invoice.ts`에 `InvoiceListItem` 인터페이스 추가
2. [x] `InvoiceListResult` 판별 유니온 추가
3. [x] `InvoiceListQuery` 인터페이스 추가
4. [x] `BuildInvoicePublicUrl` 함수 타입 별칭 추가
5. [x] `src/lib/notion/invoices.ts`의 `INVOICE_PROPS` 주석에 목록 조회 재사용 계획 명시
6. [x] `npm run typecheck`/`npm run lint` 통과 확인
7. [x] Playwright MCP로 기존 페이지(홈·인보이스 상세·관리자 골격) 스모크 회귀 확인 — 타입 전용
       변경이라 렌더링에 영향이 없어야 함

## 수락 기준 (완료 조건)

- [x] `InvoiceListItem`·`InvoiceListResult`·`InvoiceListQuery`·`BuildInvoicePublicUrl`이
      `src/types/invoice.ts`에 정의되고 기존 타입(`InvoiceStatus`)과 정합
- [x] 런타임 코드 변경 없음(타입 전용 Task) — 기존 페이지 동작에 회귀 없음
- [x] `npm run check-all` 통과
- [x] Playwright MCP 스모크 테스트 전 항목 통과

## 테스트 체크리스트

> 이 Task는 타입 전용 변경이라 별도 API/비즈니스 로직 테스트 대상이 아니다(ROADMAP "테스트 대상 분류"
> 상 "모든 구현 Task" 스모크 요건만 해당). 새 UI가 없으므로 기존 페이지의 회귀 여부만 확인한다.

### 정상 흐름 (회귀 스모크)

- [x] 홈(`/`) 정상 렌더링, 콘솔 에러 0건
- [x] 관리자(`/admin`) 정상 렌더링(Task 012 골격 유지 확인), 콘솔 에러 0건
- [x] 인보이스 상세(`/invoice/{실 ID}`) 실데이터 정상 렌더링, 콘솔 에러 0건 (타입 추가가 기존
      `Invoice`/`InvoiceLookupResult` 매핑에 영향 없음을 확인)

### 오류 처리 / 엣지 케이스

- [x] 해당 없음(타입 전용 Task, 신규 오류 흐름 없음)

### 반응형 & 품질

- [x] 해당 없음(신규 UI 없음)
- [x] `npm run typecheck` / `npm run lint` / `npx prettier --check` 통과(변경 파일 기준)

## 결과 요약

`src/types/invoice.ts`에 `InvoiceListItem`·`InvoiceListResult`·`InvoiceListQuery`·
`BuildInvoicePublicUrl` 타입을 추가했다. 기존 `INVOICE_PROPS`·`STATUS_LABEL`·`isOverdue`는 시그니처
변경 없이 목록 조회에서도 재사용 가능함을 확인해 `INVOICE_PROPS` 주석만 보강했다(런타임 로직 변경
없음). `npm run check-all` 통과, Playwright MCP로 홈·관리자 골격·인보이스 상세(실데이터) 3개 페이지
회귀 확인 — 콘솔 에러 0건.
