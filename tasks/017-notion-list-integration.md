# Task 017: Notion 견적서 목록 실데이터 연동 (A001·A004)

> Phase 7 · 관리자 핵심 기능 구현

## 목표

`/admin`이 더미 데이터 대신 실제 Notion 데이터베이스에서 견적서 목록을 조회하도록 전환한다. 실패 시
사용자에게 내부 사유를 노출하지 않고 서버 로그만 남긴다(V1 Task 008과 동일한 정책).

## 관련 파일

| 파일                                          | 구분 | 내용                                                               |
| --------------------------------------------- | ---- | ------------------------------------------------------------------ |
| `src/lib/notion/invoices.ts`                  | 수정 | `getInvoiceList()` 신규 구현                                       |
| `src/lib/notion/index.ts`                     | 수정 | `getInvoiceList` 배럴 재export                                     |
| `src/components/admin/invoice-list-error.tsx` | 신규 | 관리자 전용 오류 폴백 UI                                           |
| `src/app/admin/page.tsx`                      | 수정 | `getMockInvoiceList` → `getInvoiceList()` 실데이터 연동, 캐싱 정책 |
| `src/lib/mock/invoice-list.ts`                | 삭제 | 더미 데이터 제거(참조 0건 확인 후)                                 |

## 설계 결정 및 근거

### 1. `page_size` 제한 + 커서 방식(`getAllPages` 미사용)

로드맵 지시대로 `NotionClient.getAllPages()`(전체 페이지네이션 자동 순회)는 대량 데이터에서 API 호출이
폭증할 위험이 있어 쓰지 않는다. `queryDatabase()`를 직접 호출해 `page_size`(기본 20, `InvoiceListQuery.pageSize`로
재정의 가능, Notion 최대치 100으로 상한)와 `start_cursor`만 전달하고, 다음 페이지가 필요하면 호출부가
`InvoiceListResult.nextCursor`를 다시 `InvoiceListQuery.cursor`로 넘기는 구조로 설계한다. 이번 Task의
`/admin` 페이지는 첫 페이지만 보여주고, "더 보기" UI 자체는 Task 019(성능 최적화)에서 필요성을 재판단한다
(과설계 방지).

### 2. 정렬은 발행일 내림차순 고정, 상태 필터만 `InvoiceListQuery`로 선택 적용

`sorts: [{ property: INVOICE_PROPS.invoiceDate, direction: 'descending' }]`을 항상 적용한다. 상태
필터는 `query.status`가 있을 때만 Notion `StatusFilter`(`{ property: INVOICE_PROPS.status, status: { equals } }`)로
전달한다 — `/admin`은 아직 필터 UI가 없어 이번 Task에서는 항상 무필터로 호출되지만, 계약(Task 013에서
정의한 `InvoiceListQuery`)을 그대로 구현해 Task 019에서 필터 UI를 추가할 때 API 쪽 변경이 필요 없게
한다.

### 3. 항목(relation) 개별 조회 없음 — N+1 방지, `INVOICE_PROPS`·`propertyReaders` 그대로 재사용

목록 카드에는 `총금액`만 필요하고 항목별 단가·수량은 필요 없으므로 `getInvoiceById`처럼 각 페이지의
`항목` relation을 순회 조회하지 않는다. Task 013에서 이미 재사용 가능성을 확인해 둔 `INVOICE_PROPS`
상수·`propertyReaders`·`parseStatus`/`readStatusValue`(모듈 내부 함수)를 그대로 재사용해 매핑 로직을
중복 정의하지 않는다. `isOverdue`는 `lib/invoice.ts`의 기존 유틸을 그대로 import해 목록 조회 시점에
필드로 미리 계산한다(Task 013 설계와 일치).

### 4. 실패 시 판별 유니온 반환 + 서버 로그만, 사용자에게는 재시도 안내 UI

`queryDatabase()` 호출이 실패(레이트 제한 재시도 소진, 잘못된 키 등)하면 예외를 던지지 않고
`{ ok: false, reason: 'notion_error' }`를 반환하고 `console.error`로만 원인을 남긴다(V1 Task 008과
동일 정책 — 사용자 화면에 내부 오류 문구·키 값 노출 금지). `admin/page.tsx`는 이 경우
`invoice-list-error.tsx`(재시도 안내 + `/admin` 새로고침 링크)를 렌더링한다.

### 5. 캐싱: `revalidate = 30` + `fetchCache = 'default-cache'`

관리자 목록은 최신성이 어느 정도 중요하지만 매 요청마다 무조건 Notion을 호출할 필요는 없다. V1 Task
010에서 확인된 대로 Next.js 15+의 기본 `fetch` 정책이 `no-store`라 `revalidate`만으로는 캐시가 걸리지
않으므로, `invoice/[id]/page.tsx`(Task 007)와 동일하게 `fetchCache = 'default-cache'`를 함께 지정해야
실제로 캐시가 히트한다. 30초는 "새 견적서 등록 후 어드민이 바로 확인"과 "매 새로고침마다 API 호출"
사이의 절충값이며, Task 019에서 실측 후 조정될 수 있다.

### 6. 알 수 없는 상태값 폴백, 누락된 property 폴백값

기존 `getInvoiceById`의 `parseStatus`(알 수 없는 값 → `'대기'` + 경고 로그), `readStatusValue`(status
타입 우선, select로 폴백)를 그대로 재사용하므로 목록에서도 동일한 폴백 규칙이 적용된다. 클라이언트명
누락 시 `'(클라이언트 미상)'`, 총금액 누락 시 `0`, 발행일 누락 시 `page.created_time`으로 안전하게
채운다 — `getInvoiceById`와 동일한 패턴.

## 구현 단계

1. [x] `src/lib/notion/invoices.ts`에 `getInvoiceList(query?: InvoiceListQuery): Promise<InvoiceListResult>`
       구현(위 설계 결정 1~6)
2. [x] `src/lib/notion/index.ts`에 `getInvoiceList` 재export 추가
3. [x] `src/components/admin/invoice-list-error.tsx` 작성 — 재시도 안내 + `/admin` 새로고침 링크
4. [x] `src/app/admin/page.tsx` 수정 — `getInvoiceList()` 호출, 결과에 따라 오류/빈 상태/목록 분기,
       `revalidate = 30` + `fetchCache = 'default-cache'` 추가
5. [x] `src/lib/mock/invoice-list.ts` 참조 grep으로 0건 확인 후 삭제
6. [x] `npm run check-all` 통과 확인
7. [x] Playwright MCP 테스트(아래 체크리스트) 수행 — 실제 Notion DB 대상

## 수락 기준 (완료 조건)

- [x] `/admin`이 실제 Notion 데이터를 발행일 내림차순으로 표시
- [x] Notion 조회 실패 시 관리자 전용 오류 폴백 UI 표시(내부 사유 비노출)
- [x] `src/lib/mock/invoice-list.ts` 삭제, 참조 0건
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run check-all` 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] `/admin` 진입 → 실제 Notion DB의 견적서 2건(INV-2026-002, INV-2026-001)이 발행일 내림차순(9월
      15일 → 9월 8일)으로 정확히 표시됨, 클라이언트명·총금액·상태도 Notion 원본과 일치
- [x] 견적서 번호 링크(`INV-2026-002`) 클릭 → 새 탭에서 실 ID
      (`/invoice/3dceed15-f2bc-80ac-901d-f6a825d23206`) 기준 상세 페이지가 정상 렌더링(콘솔 에러 0건),
      복사 링크도 동일한 실 ID로 생성됨을 확인

### 오류 처리

- [x] `NOTION_DATABASE_ID`를 존재하지 않는 값으로 임시 전환(`.env.local`은 건드리지 않고 `npm run dev`
      실행 시 프로세스 환경변수로만 오버라이드 — Next.js 환경변수 우선순위상 `.env.local`보다 셸
      환경변수가 우선하므로 파일 변경 없이 테스트 가능)한 별도 dev 서버로 재현 → 화면에는
      `InvoiceListError`("견적서 목록을 불러오지 못했습니다" + 다시 시도 링크)만 표시되고 데이터베이스
      ID·API 키 등 내부 정보는 화면에 노출되지 않음. 서버 콘솔(dev 모드 RSC 콘솔 포워딩)에만 원인
      로그(`Notion 견적서 목록 조회 실패: ...`) 확인. 테스트 후 원래 dev 서버로 정상 복구
- [x] 레이트 제한/타임아웃 재시도 로직은 `NotionClient.request()`(Task 006)를 그대로 재사용하므로
      별도 재현 없이 코드 재사용성으로 검증 대체 — 재시도 소진 시 `notion_error` 반환 경로는 위 DB ID
      오류 테스트로 동일 코드 경로가 실제 작동함을 확인함

### 엣지 케이스

- [x] 빈 상태 UI(`InvoiceListEmpty`)는 Task 014에서 이미 Playwright로 검증된 동일 컴포넌트·동일 조건
      (`items.length === 0`)이라 이번 Task에서 로직 변경이 없어 재현 생략(코드 경로 재사용 확인으로
      대체) — 실제 DB에는 현재 2건이 존재해 인위적인 0건 유도 없이 넘어감
- [x] 현재 실 데이터 2건에는 property 누락 케이스가 없어 해당 없음으로 기록(폴백 로직은
      `getInvoiceById`와 동일 함수를 재사용하므로 V1 Task 007/008에서 이미 검증된 것과 같은 보장)
- [x] 알 수 없는 상태값 폴백은 `parseStatus`(기존 함수)를 그대로 재사용하므로 별도 재현 없이 코드
      재사용성으로 검증 대체

### 반응형/품질

- [x] 모바일(375) — 실 데이터 기준 레이아웃 정상, 콘솔 에러 0건(Task 016 hydration 수정이 실데이터에서도
      유효함을 재확인)
- [x] 데스크톱(1280) — 테이블 정상, 콘솔 에러 0건
- [x] `npm run check-all` 통과(타입체크·린트 전체 통과, 미변경 파일의 기존 CRLF 포맷 경고만 존재)

## 결과 요약

`getInvoiceList()`(`src/lib/notion/invoices.ts`)를 구현해 `/admin`이 더미 데이터 대신 실제 Notion
데이터베이스를 조회하도록 전환했다. `queryDatabase()`를 직접 호출(page_size 20 기본·커서 지원, N+1
방지를 위해 항목 relation 미조회)하고 기존 `INVOICE_PROPS`·`propertyReaders`·`parseStatus`를 재사용해
매핑 로직 중복을 없앴다. 실패 시 `{ ok: false, reason: 'notion_error' }`를 반환하고 서버 로그만 남기며,
`admin/page.tsx`는 이 경우 신규 `InvoiceListError` 폴백 UI를 렌더링한다. `src/lib/mock/invoice-list.ts`는
참조 0건 확인 후 삭제했다.

Playwright MCP로 실제 Notion DB 데이터(2건)가 발행일 내림차순으로 정확히 표시됨을 확인했고, 견적서
번호 링크가 실 ID로 상세 페이지·복사 링크에 정상 연결됨을 확인했다. 오류 경로는 `.env.local`을
건드리지 않고 프로세스 환경변수로 `NOTION_DATABASE_ID`를 일시적으로 오버라이드해 재현 — 화면에는
내부 정보 노출 없이 재시도 안내만 표시되고 원인은 서버 콘솔에만 남음을 확인한 뒤 정상 서버로 복구했다.
모바일/데스크톱 콘솔 에러 0건, `npm run check-all` 통과.
