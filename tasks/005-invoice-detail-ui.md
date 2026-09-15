# Task 005: 공통 컴포넌트·더미 데이터 및 인보이스 상세 페이지 UI 완성

> Phase 2 · UI/UX 완성 (더미 데이터 활용) · 구현 기능: F002 UI (더미 데이터 기준)

## 목표

ROADMAP Phase 2에 중복 번호로 남아 있던 "공통 컴포넌트 및 더미 데이터 구축"(구 Task 003, Phase 1의
실제 Task 003 마이그레이션과 번호 충돌) 항목과 "인보이스 상세 페이지 UI 완성"(구 Task 005) 항목을
하나로 통합해 진행한다. 컴포넌트만 단독으로 만들면 소비하는 페이지가 없어 프로젝트 테스트 원칙(Playwright
MCP 렌더링 검증)을 만족할 수 없으므로, 더미 데이터·프레젠테이션 컴포넌트·상세 페이지 조합을 한 단위로 구현한다.

번호 정리: 이 Task 파일 번호는 기존에 `tasks/002-domain-types.md`·`shrimp_data/tasks.json`에서 이미
"Task 005 는 mock 사용"으로 참조되던 번호를 그대로 유지했다. Phase 3 이후(Task 006 Notion 연동 ~ Task 011)
번호는 변경하지 않았다.

## 관련 파일

| 파일                                             | 구분 | 내용                                               |
| ------------------------------------------------ | ---- | -------------------------------------------------- |
| `src/components/ui/table.tsx`                    | 신규 | shadcn `table` 추가 (생성된 `from "cn"` 오류 수정) |
| `src/lib/mock/invoices.ts`                       | 신규 | 더미 `Invoice[]` 3건 + `getMockInvoiceById(id)`    |
| `src/components/invoice/invoice-header.tsx`      | 신규 | 인보이스 번호·발행일·만료일·상태 배지              |
| `src/components/invoice/invoice-parties.tsx`     | 신규 | 발행자/클라이언트 2단 레이아웃                     |
| `src/components/invoice/invoice-items-table.tsx` | 신규 | 상품/서비스 테이블 (반응형)                        |
| `src/components/invoice/invoice-summary.tsx`     | 신규 | 소계·세금·총액                                     |
| `src/components/invoice/invoice-notes.tsx`       | 신규 | 참고사항 (장문 대응)                               |
| `src/components/invoice/invoice-actions.tsx`     | 신규 | PDF 다운로드(비활성) · 홈으로 버튼                 |
| `src/components/invoice/invoice-skeleton.tsx`    | 신규 | 로딩 스켈레톤 (Task 007에서 연결 예정)             |
| `src/app/invoice/[id]/page.tsx`                  | 수정 | 더미 데이터 기반 완성 렌더링, `notFound()` 연동    |
| `docs/ROADMAP.md`                                | 수정 | 번호 충돌 정리, Task 005 완료 표시                 |

## 설계 결정 및 근거

### 1. 클라이언트 정보는 `clientName`만 표시

PRD UX 흐름(§상세 페이지, "클라이언트 정보: 고객명·주소·연락처")에는 주소·연락처가 언급되지만, PRD 데이터
모델 표와 Task 002에서 확정한 `Invoice` 타입에는 `clientName`만 존재한다(`src/types/invoice.ts`는 완료된
Task의 확정 계약이므로 이 Task에서 임의로 필드를 추가하지 않는다). 따라서 클라이언트 패널은 `clientName`만
표시하고, 확장이 필요하면 별도 Task로 타입 계약을 재검토한다.

### 2. 세금 0%일 때 세금 행 생략

`InvoiceSummary`는 `taxRate`가 있어도 `taxAmount`가 0/undefined면 세금 라벨을 렌더링하지 않는다. 할인만
있고 세금계산서를 발행하지 않는 mock 케이스(`sample-002`)에서 "세금 (VAT 0%) ₩0" 같은 무의미한 줄이
보이지 않도록 하기 위함이다.

### 3. 항목 테이블은 컬럼 숨김 방식으로 반응형 처리

ROADMAP은 "모바일에서 가로 스크롤 또는 카드형 전환"을 선택지로 제시했다. `Table`이 자체적으로
`overflow-x-auto` 컨테이너를 갖고 있어 가로 스크롤은 항상 가능하지만, 컬럼이 5개뿐이고 "설명"만 길어질
수 있어 카드형 전환 대신 `sm:table-cell`로 설명 컬럼을 모바일에서 숨기고 항목명 아래에 작게 붙이는
절충안을 택했다. 데이터가 더 복잡해지면(Task 007 실데이터) 카드형 전환을 재검토한다.

### 4. `notFound()` 사용, 커스텀 `not-found.tsx`는 Task 004 범위

상세 페이지는 mock 조회 실패 시 Next.js `notFound()`를 호출해 프레임워크 404 경계로 위임한다. 현재는
`src/app/invoice/[id]/not-found.tsx`가 없어 기본 404 페이지가 뜨지만, Task 004에서 커스텀 파일을 추가하면
코드 변경 없이 자동으로 적용된다.

### 5. shadcn `table.tsx` 생성 버그 수정

`npx shadcn add table`이 생성한 파일이 `import { cn } from "cn"`(잘못된 모듈 경로)와 `"use client"`,
큰따옴표/세미콜론 스타일을 포함해 그대로 두면 빌드가 깨진다. `@/lib/utils`로 임포트를 수정하고, 다른
`ui/*` 컴포넌트와 동일하게 서버 렌더링 가능한 순수 컴포넌트로 정규화(작은따옴표/세미콜론 없음)했다.

## 구현 단계

1. [x] `npx shadcn add table` 실행 및 생성 파일 버그 수정(`cn` import, 코드 스타일)
2. [x] `src/lib/mock/invoices.ts` 작성 (3개 케이스 + `getMockInvoiceById`)
3. [x] 프레젠테이션 컴포넌트 6종 작성 (`invoice-header/parties/items-table/summary/notes/actions`)
4. [x] `invoice-skeleton.tsx` 작성
5. [x] `src/app/invoice/[id]/page.tsx`를 컴포넌트 조합 + `notFound()`로 교체
6. [x] `npm run typecheck` / `npm run lint` 통과, 신규·수정 파일 `prettier --check` 통과
7. [x] `npm run build` 통과
8. [x] `docs/ROADMAP.md` 번호 충돌 정리 및 완료 표시
9. [x] Playwright MCP 스모크 + 시나리오 테스트 수행

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` 통과
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] 신규/수정 파일 `prettier --check` 통과
- [x] mock 3건(`sample-001/002/003`) 모두 `/invoice/{id}`에서 정상 렌더링
- [x] 존재하지 않는 ID는 404(Next.js 기본 not-found)로 처리
- [x] 홈 폼 → 상세 페이지 이동 정상
- [x] 모바일(375px)·데스크톱(1280px)·다크모드 렌더링 정상
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리
> (UI 렌더링 Task이므로 API/비즈니스 로직 오류 시나리오는 해당 없음 → 렌더링·엣지·반응형 중심)

### 정상 흐름 (Happy Path)

- [x] `/invoice/sample-001` 접근 시 헤더(번호·발행일·만료일·상태 배지)·발행자·클라이언트·항목 테이블(2건)·
      합계(소계/세금 10%/총액)·참고사항·액션 바(PDF 비활성, 홈으로) 전 항목 렌더링
- [x] 홈(`/`)에서 "sample-002" 입력 후 조회 → `/invoice/sample-002`로 정상 이동

### 오류 처리

- [x] 존재하지 않는 ID(`/invoice/does-not-exist`) 접근 시 Next.js 기본 404 페이지로 전환 (HTTP 404)

### 엣지 케이스

- [x] 다항목 + 할인(음수 금액) + 세금 0% 케이스(`sample-002`): 세금 행 생략, 할인 항목 `-₩75,000` 정상 표시
- [x] 장문 참고사항 + 고액 단일 항목 케이스(`sample-003`): 참고사항 줄바꿈 정상, 금액 큰 자릿수(₩2,750,000) 정상 표시

### 반응형 & 품질

- [x] 모바일(375×812) 뷰포트: 항목 테이블 설명 컬럼 숨김 + 항목명 하위 표시, 레이아웃 깨짐 없음
- [x] 데스크톱(1280×900) 뷰포트: 2단 레이아웃, 합계 우측 정렬 정상
- [x] 다크모드 전환(라이트→다크) 시 전 요소 시맨틱 색상 정상 반영, 콘솔 에러 없음
- [x] 콘솔 에러 0건 (홈·상세 3건·정상 라우트 전 구간). 404 라우트에서만 브라우저 표준 리소스 404 로그 및
      Next.js 기본 not-found 페이지의 프레임워크 자체 dev 경고가 나타나며, 이는 이 Task의 코드가 아닌
      Next.js 기본 404 페이지에서 기인함(Task 004의 커스텀 `not-found.tsx` 적용 후 재확인 예정)

## 결과 요약

- shadcn `table` 컴포넌트 추가 및 생성 버그(`from "cn"`) 수정.
- `src/lib/mock/invoices.ts`(표준/할인·세금0%/장문 3케이스), 인보이스 프레젠테이션 컴포넌트 6종,
  `invoice-skeleton` 신규 생성. `src/app/invoice/[id]/page.tsx`를 더미 데이터 기반 완성 렌더링 + `notFound()`로 교체.
- `typecheck` / `lint` / `build` / `prettier --check` 모두 통과.
- Playwright MCP: mock 3건 상세 렌더링, 홈→상세 이동, 존재하지 않는 ID 404, 모바일/데스크톱/다크모드 전 항목 통과, 콘솔 에러 0건(404 라우트의 프레임워크 자체 로그 제외).
- 후속: Task 004(홈/오류 페이지, `not-found.tsx` 커스터마이징), Task 007(`getMockInvoiceById` → `getInvoiceById` 교체, 로딩 UI에 `invoice-skeleton` 연결).
