# Task 014: 견적서 목록 UI 구현 (더미 데이터)

> Phase 6 · 관리자 UI 완성 (더미 데이터 활용)

## 목표

더미 데이터로 관리자 견적서 목록 UI(테이블/카드·상태 배지·빈 상태·로딩 스켈레톤)를 완성한다. 실제
Notion 연동은 Task 017에서 동일한 `InvoiceListItem[]` 형태를 그대로 이어받아 교체한다.

## 관련 파일

| 파일                                             | 구분 | 내용                                                   |
| ------------------------------------------------ | ---- | ------------------------------------------------------ |
| `src/lib/mock/invoice-list.ts`                   | 신규 | 더미 `InvoiceListItem[]` 12건 + `getMockInvoiceList()` |
| `src/components/admin/invoice-list-table.tsx`    | 신규 | 목록 테이블(데스크톱)/카드(모바일) 컴포넌트            |
| `src/components/admin/invoice-list-empty.tsx`    | 신규 | 빈 상태 UI                                             |
| `src/components/admin/invoice-list-skeleton.tsx` | 신규 | 로딩 스켈레톤                                          |
| `src/app/admin/page.tsx`                         | 수정 | `getMockInvoiceList()` 호출, 테이블/빈 상태 연결       |
| `src/app/admin/loading.tsx`                      | 수정 | 기존 임시 스켈레톤 → `InvoiceListSkeleton`으로 교체    |

## 설계 결정 및 근거

### 1. 더미 ID를 유효한 Notion ID 형식(32자리 16진수)으로 생성

`getInvoiceById`의 `isValidNotionId`가 32자리 16진수만 유효하다고 판단한다. 더미 ID를 이 형식으로
맞춰두면 "행 링크 클릭 → `/invoice/{id}` 새 탭 이동" 테스트에서 실제 상세 페이지 라우트(존재하지 않는
견적서라 `not-found`가 뜨는 것도 정상 동작)까지 검증할 수 있다 — Task 017에서 실 ID로 교체되면 그대로
정상 조회로 이어진다.

### 2. 상태 배지는 `invoice-header.tsx`의 매핑을 그대로 재사용(중복 정의 금지)

`invoice-header.tsx`가 이미 `STATUS_VARIANT`(로컬 상수) + `STATUS_LABEL`(`lib/invoice.ts`)로 배지
스타일을 정의해뒀다. 목록에서 이 매핑을 다시 만들면 두 곳의 색상 체계가 갈라질 위험이 있어, `STATUS_LABEL`은
그대로 import하고 `STATUS_VARIANT`는 `invoice-header.tsx`와 동일한 값으로 `invoice-list-table.tsx`
내부에 두되 나중에 갈라지면 `lib/invoice.ts`로 승격을 검토한다(현재는 컴포넌트가 2곳뿐이라 과설계 방지
차원에서 상수 위치는 그대로 둠).

### 3. 반응형 전환 기준은 Tailwind `md`(768px) 브레이크포인트

로드맵 지시("모바일 `<768px`은 카드 리스트")를 그대로 따른다. `hidden md:block` 테이블 + `md:hidden`
카드 스택으로 구현 — 별도 JS 미디어쿼리 훅 없이 CSS만으로 처리해 hydration mismatch 위험을 없앤다
(Task 004에서 기록된 `useMediaQuery` hydration 경고 이슈를 새 컴포넌트에서 재현하지 않기 위함).

### 4. "액션" 컬럼은 이번 Task에서 "새 탭에서 열기"만 배치

"링크 복사" 버튼은 Task 015 범위다. 컬럼 구조만 먼저 만들어 Task 015에서 버튼을 끼워 넣을 자리를
확보한다(빈 컬럼을 새로 추가하는 레이아웃 변경 없이).

### 5. 금액·수량 컬럼에 `tabular-nums` 적용

로드맵 지시대로 총금액 컬럼에 `tabular-nums`를 적용해 숫자 자릿수가 바뀌어도 컬럼 폭이 흔들리지 않게
한다.

## 구현 단계

1. [x] `src/lib/mock/invoice-list.ts` 작성 — 12건(상태 4종 분포, 기한 지남 1건 이상, 총금액 0원 1건,
       장문 클라이언트명 1건 포함) + `getMockInvoiceList(): Promise<InvoiceListItem[]>`(Task 017 시그니처
       예습을 위해 Promise로 감쌈)
2. [x] `src/components/admin/invoice-list-empty.tsx` 작성 — "견적서가 없습니다" 안내
3. [x] `src/components/admin/invoice-list-skeleton.tsx` 작성 — 테이블 형태 스켈레톤(행 5개)
4. [x] `src/components/admin/invoice-list-table.tsx` 작성 — 데스크톱 테이블 + 모바일 카드, 상태 배지,
       기한 지남 배지, `tabular-nums`, "새 탭에서 열기" 액션
5. [x] `src/app/admin/page.tsx` 수정 — `getMockInvoiceList()` 호출 → 0건이면 `InvoiceListEmpty`,
       그 외 `InvoiceListTable` 렌더링
6. [x] `src/app/admin/loading.tsx` 수정 — `InvoiceListSkeleton`으로 교체
7. [x] `npm run check-all` 통과 확인
8. [x] Playwright MCP 테스트(아래 체크리스트) 수행

## 수락 기준 (완료 조건)

- [x] `/admin`에서 더미 12건이 테이블로 정상 렌더링됨
- [x] 상태 배지가 `invoice-header.tsx`와 동일한 색상 체계로 표시됨(기한 지남 배지 별도 병기)
- [x] 모바일(<768px)에서 카드 리스트로 전환됨
- [x] 견적서 번호/새 탭 열기 클릭 시 `/invoice/{id}`가 새 탭으로 열림
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run check-all` 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] `/admin` 진입 → 더미 12건이 발행일 순서대로 테이블에 렌더링됨
- [x] 상태별 배지 색상이 `invoice-header.tsx`와 동일한 variant로 매핑됨(대기=outline, 발송/확인함=secondary, 완료=default)

### 오류 처리

- [x] (더미 데이터 고정이라 API 오류 케이스 없음 — Task 017에서 실 API 오류 처리 테스트)
- [x] 잘못된 형식의 값 없이 렌더링되는지(NaN·undefined 텍스트 노출 없음) 확인

### 엣지 케이스

- [x] 장문 클라이언트명이 줄바꿈되며 레이아웃이 깨지지 않음
- [x] 총금액 0원 건이 "₩0"으로 정상 표시되고 기한 지남 건은 "기한 지남" 배지가 병기됨

### 반응형 & 품질

- [x] 375px(모바일) — 카드 리스트로 전환, 정보 누락 없음(스크린샷 확인)
- [x] 768px(태블릿) — `md` 브레이크포인트가 768px이라 테이블 형태로 전환됨(가로 스크롤 컨테이너 정상
      동작, `ui/table.tsx`의 기본 `overflow-x-auto` 활용)
- [x] 1280px(데스크톱) — 테이블 정상, 컬럼 정렬 확인(스크린샷 확인)
- [x] 콘솔 에러 0건(1280px 기준) — 단, **기존 이슈 재확인**: 뷰포트가 768px 부근일 때 `Header`의
      `useMediaQuery` 기반 hydration mismatch 경고가 `/`(홈, 미수정 페이지)에서도 동일하게 재현됨을
      확인했다. V1 Task 004에서 이미 기록되고 ROADMAP Task 016에서 조사·해결 예정인 기존 이슈로,
      이번 Task 012~014 변경과 무관하다(회귀 아님). Task 016에서 다시 확인 예정.

## 결과 요약

`src/lib/mock/invoice-list.ts`(더미 12건, 상태 4종·기한 지남·0원·장문 클라이언트명 포함)와
`invoice-list-table.tsx`(데스크톱 테이블/모바일 카드 반응형)·`invoice-list-empty.tsx`·
`invoice-list-skeleton.tsx`를 신설해 `/admin`에 실제 목록 UI를 연결했다. 상태 배지는
`invoice-header.tsx`와 동일한 `STATUS_VARIANT`/`STATUS_LABEL` 체계를 재사용했다.

Playwright MCP로 데스크톱(1280)·태블릿(768)·모바일(375) 3개 뷰포트, 장문 클라이언트명 줄바꿈, 0원
표시, 기한 지남 배지, 견적서 번호/"새 탭에서 열기" 링크의 `/invoice/{id}` 이동(더미 ID라 실제로는
견적서 상세의 `not-found` 페이지로 연결되는 것까지 정상 확인 — Task 017에서 실 ID로 교체되면 정상
조회로 이어짐)까지 전 항목 테스트했다. `npm run check-all` 통과.

테스트 중 `Header`의 기존 `useMediaQuery` hydration mismatch 이슈(V1 Task 004 기록, ROADMAP Task 016
조사 예정)가 손대지 않은 홈페이지에서도 동일하게 재현됨을 확인해 이번 Task의 회귀가 아님을 검증하고
넘어갔다.
