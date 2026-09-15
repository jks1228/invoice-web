# Task 006: Notion API 연동 및 데이터 매핑 레이어

> Phase 3 · 핵심 기능 구현 · 구현 기능: F001

## 목표

`src/lib/notion/invoices.ts`의 `getInvoiceById`/`getBusinessInfo` 골격(Task 002에서 `throw`만 하도록
남겨둔 상태)을 실제 Notion 조회 + 도메인 매핑으로 완성한다. 페이지(`src/app/invoice/[id]/page.tsx`)를
mock에서 실데이터로 교체하는 일은 Task 007 범위이며, 이 Task는 데이터 레이어만 다룬다.

사용자가 제공한 실제 Notion 데이터베이스 export(Invoices/Items)를 확인한 결과 PRD가 가정한 스키마와
차이가 있어 다음 3가지를 사용자와 확정했다:

1. 상태 옵션: `대기 / 발송 / 확인함 / 완료` (기존 `Draft/Sent/Viewed/Paid` 대체)
2. 발행자 정보: Notion에 DB 없음 → 환경 변수(`BUSINESS_*`)로 고정 관리
3. 세금/비고: Notion에 필드 없음 → `subtotal = totalAmount`, 세금/비고 항상 미설정

## 관련 파일

| 파일                                        | 구분 | 내용                                                                                                            |
| ------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| `src/lib/notion/invoices.ts`                | 수정 | `INVOICE_PROPS`/`ITEM_PROPS` 실제 property명 확정, property 파서, `getInvoiceById`, `getBusinessInfo` 전체 구현 |
| `src/lib/notion/client.ts`                  | 수정 | `apiKey` 기본값을 `env.NOTION_API_KEY` 경유로 변경                                                              |
| `src/lib/notion/index.ts`                   | 수정 | `ITEM_PROPS`/`propertyReaders` 배럴 export 추가                                                                 |
| `src/lib/env.ts`                            | 수정 | `NOTION_API_KEY`/`NOTION_DATABASE_ID` 필수화, `BUSINESS_*` 6종 선택 필드 추가                                   |
| `.env.example`                              | 수정 | 실제 값처럼 보이던 `NOTION_API_KEY` 예시를 자리표시자로 교체, `BUSINESS_*` 추가                                 |
| `src/types/invoice.ts`                      | 수정 | `InvoiceStatus`를 실제 한글 옵션으로 교체, `subtotal`/`notes` 주석 갱신                                         |
| `src/lib/mock/invoices.ts`                  | 수정 | mock 3건 `status` 값을 새 타입에 맞게 갱신                                                                      |
| `src/components/invoice/invoice-header.tsx` | 수정 | `STATUS_LABEL`/`STATUS_VARIANT` 키 갱신                                                                         |
| `README.md`                                 | 수정 | 환경 변수 표에 `BUSINESS_*` 추가                                                                                |
| `docs/PRD.md`                               | 수정 | 데이터 모델 표를 실제 Notion property명·제약에 맞게 갱신                                                        |

## 설계 결정 및 근거

### 1. Items는 별도 데이터베이스 ID 없이 relation 페이지 ID로 직접 조회

Invoices의 `항목` relation 속성이 이미 각 항목의 Notion 페이지 ID를 제공하므로, `getPage(itemId)`를
개별 호출해 속성을 읽는다. 별도 `NOTION_ITEMS_DATABASE_ID` 환경 변수를 추가하지 않아 설정 부담을 줄였다.

### 2. `금액` 필드 대신 `단가 × 수량` 재계산

`src/types/invoice.ts`의 기존 주석("Notion 원본 값과 계산값이 다르면 항목 기준으로 표시")을 따라, Notion의
`금액` 속성은 참고만 하고 항상 `unitPrice * quantity`로 계산한 값을 사용한다.

### 3. 페이지 소속 데이터베이스 검증으로 임의 ID 접근 차단 (F004)

`getPage(id)`가 성공해도 반환된 페이지의 `parent.database_id`가 `env.NOTION_DATABASE_ID`와 다르면
`not_found`로 처리한다. 워크스페이스 내 다른 데이터베이스의 페이지 ID를 넣어 접근하는 것을 막기 위함이다.

### 4. 항목 페이지 하나가 실패해도 인보이스 전체를 실패시키지 않음

relation 항목 중 하나의 `getPage`가 실패하면 해당 항목만 건너뛰고 경고 로그를 남긴다. `totalAmount`는
Notion 값을 그대로 쓰므로(설계 결정 3, PRD 갱신 참고) 항목 합계와 무관하게 항상 표시된다.

### 5. Playwright MCP 대신 Node 스크립트로 검증

이 Task는 UI 화면이 없는 데이터 레이어다(`page.tsx`는 Task 007 전까지 mock 유지). ROADMAP의 Playwright
MCP 요구사항은 "구현 직후 사용자 흐름 재현"을 전제로 하는데 이 Task엔 재현할 화면이 없으므로, 대신 Node
스크립트로 `getInvoiceById`/`getBusinessInfo`를 직접 호출해 정상/오류/엣지 케이스를 검증한다. 실제 화면을
통한 Playwright E2E 검증은 Task 007에서 수행한다.

## 구현 단계

1. [x] `src/types/invoice.ts`의 `InvoiceStatus`를 실제 옵션으로 교체
2. [x] `src/lib/env.ts` 필수화 + `BUSINESS_*` 추가, `.env.example` 갱신
3. [x] `src/lib/notion/client.ts`가 `env.ts`를 경유하도록 수정
4. [x] `src/lib/notion/invoices.ts` 전체 구현 (`INVOICE_PROPS`/`ITEM_PROPS`/property 파서/`getInvoiceById`/`getBusinessInfo`)
5. [x] `src/lib/notion/index.ts` 배럴 export 갱신
6. [x] `src/lib/mock/invoices.ts`, `invoice-header.tsx` 상태값 동기화
7. [x] `README.md`, `docs/PRD.md` 문서 동기화
8. [x] `npm run check-all` / `npm run build` 통과
9. [x] Node 스크립트(tsx)로 정상/오류/엣지 시나리오 검증
10. [x] `docs/ROADMAP.md` Task 006 완료 표시

## 수락 기준 (완료 조건)

- [x] `npm run check-all` 통과 (본 Task에서 수정한 파일 기준 — 저장소에 이미 존재하던 무관한 파일들의
      prettier 경고는 이 Task 범위 밖이라 손대지 않음)
- [x] `npm run build` 통과
- [x] 아래 테스트 체크리스트 전 항목 통과

## 테스트 체크리스트

> 도구: Node 스크립트(`tsx --env-file=.env.local`로 `getInvoiceById`/`getBusinessInfo` 직접 호출) — UI 없는
> 데이터 레이어 Task라 Playwright MCP 대신 사용(설계 결정 5 참고) · 실제 Notion DB(사용자 제공)에 대해 실행함

### 정상 흐름 (Happy Path)

- [x] 실제 Notion INV-2026-001 페이지(`3d5eed15f2bc800389f4fc748aaa1df4`)로 `getInvoiceById` 호출 →
      `ok: true`, 항목 3건(웹사이트 디자인/로고 제작/명함디자인) 포함, 각 항목 `amount = unitPrice * quantity`
      정확히 일치(3,000,000 / 1,000,000 / 1,000,000), `totalAmount`/`subtotal` 모두 5,000,000으로 CSV와 일치
- [x] `getBusinessInfo()` — 환경 변수로 `BUSINESS_NAME`/`BUSINESS_PHONE`을 주입해 호출 → 주입한 값과
      일치하는 `BusinessInfo` 반환 확인 (`.env.local`에는 실제 값 미설정 상태라 임시 환경변수로 검증)

### 오류 처리

- [x] 존재하지 않는(형식은 유효한, `'a'.repeat(32)`) ID로 `getInvoiceById` 호출 →
      `{ ok: false, reason: 'not_found' }`
- [x] `NOTION_API_KEY`/`NOTION_DATABASE_ID` 미설정 상태로 모듈 로드 → `env.ts`의 Zod 파싱이 각 필드에 대해
      `Invalid input: expected string, received undefined`로 즉시 실패(실제 재현 확인)

### 엣지 케이스

- [x] 형식이 잘못된 ID(`'not-a-valid-id'`, 32자리 hex 아님)로 `getInvoiceById` 호출 → API 호출 없이
      `{ ok: false, reason: 'invalid_id' }`
- [x] `BUSINESS_NAME` 미설정 상태에서 `getBusinessInfo()` 호출 → `null` 반환 확인

### 반응형 & 품질

- [x] 해당 없음 (UI 없는 데이터 레이어 Task — Task 007에서 화면 연동 후 검증)
- [x] `npm run typecheck` / `npm run lint` / `npm run build` 오류 0건. 이 Task에서 수정한 모든 파일은
      `prettier --check` 통과

## 결과 요약

- `src/lib/notion/invoices.ts`를 골격에서 실제 구현으로 완성: 실제 Notion 스키마 확인(사용자 제공
  `invoices.zip`/`items.zip` export + `getDatabase`로 재검증) 기반으로 `INVOICE_PROPS`/`ITEM_PROPS` 확정,
  `title`/`rich_text`/`number`/`date`/`select`/`status`/`relation` property 파서 구현, `getInvoiceById`
  (ID 형식 검증 → 페이지 조회 → 소속 DB 검증(F004) → 항목 relation 개별 조회·매핑) 및 환경 변수 기반
  `getBusinessInfo` 구현.
- **실제 조회 중 발견한 버그**: Notion "총금액" property의 실제 표시명에 공백이 포함된 `총금 액`이었다
  (`getDatabase`로 스키마 재확인해 발견). 최초 구현 시 `총금액`(공백 없음)으로 매핑해 `totalAmount`가
  항상 0이 되는 문제를 실데이터 테스트에서 발견해 수정했다.
- `상태` property는 Notion 타입이 `status`(select 아님)로 확인됨 — `readStatusValue`가 status 우선,
  select 폴백으로 이미 양쪽을 다 처리하도록 설계해 두었으므로 추가 수정 불필요.
- `env.ts`의 `NOTION_API_KEY`/`NOTION_DATABASE_ID`를 필수화하고 `BUSINESS_*` 6종 선택 필드 추가.
  `client.ts`가 `process.env` 직접 접근 대신 `env.ts`를 경유하도록 수정.
- `InvoiceStatus` 타입을 실제 Notion 옵션(`대기`/`발송`/`확인함`/`완료`)으로 교체하고 mock 데이터·
  `invoice-header.tsx` 배지 매핑을 동기화. PRD 데이터 모델 표·README 환경 변수 표 갱신.
- 사용자 실제 Notion DB에 대해 tsx 스크립트로 직접 조회 검증 완료(정상 조회 시 항목 3건·금액·상태 모두
  CSV와 일치, not_found/invalid_id/env 필수화 오류 모두 재현 확인). 임시 테스트 스크립트는 검증 후 삭제.
- **별건 보안 조치**: `.env.example`에 실제 토큰처럼 보이는 값이 커밋되어 있던 것을 자리표시자로 교체.
  이미 git 이력에 노출되었을 수 있어 Notion 통합 토큰 재발급을 사용자에게 권장함(README/PRD 범위 밖이라
  이 파일에만 기록).
- 후속: Task 007에서 `src/app/invoice/[id]/page.tsx`의 `getMockInvoiceById`를 `getInvoiceById`로 교체하고
  실제 화면 기준 Playwright MCP E2E를 수행한다. `.env.local`에 `BUSINESS_NAME` 등을 채우면 발행자 정보가
  화면에 표시된다.
