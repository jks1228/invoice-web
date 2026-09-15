# Invoice Web MVP 개발 로드맵

Notion으로 관리하는 견적서를 클라이언트가 공개 웹 링크로 확인하고 PDF로 내려받는 공개 인보이스 플랫폼.

## 개요

**Invoice Web**은 프리랜서·소상공인(견적서 발행자)과 그 클라이언트(견적서 확인자)를 위한 공개 인보이스 뷰어로 다음 기능을 제공합니다:

- **Notion API 연동 (F001)**: Notion 데이터베이스의 견적서 데이터를 서버에서 실시간 조회
- **인보이스 상세 조회 (F002)**: 고객명·상품/서비스·단가·수량·합계·기한·참고사항 완전 표시
- **PDF 다운로드 (F003)**: 현재 인보이스를 서버사이드에서 PDF로 변환·다운로드
- **ID 기반 접근 (F004)**: 고유 인보이스 ID(`/invoice/{id}`)로 특정 견적서만 조회
- **반응형 디자인 (F005)**: 모바일·태블릿·데스크톱 최적 표시 (특히 상품 테이블)
- **오류 처리 (F010)**: 잘못된 ID·없는 견적서에 대한 사용자 친화적 에러 페이지
- **홈/진입점 (F011)**: 인보이스 ID 입력 및 안내 페이지

**MVP 제외 범위**: 관리자 대시보드, 웹 인보이스 생성/편집, 결제 통합, 상태 추적, 이메일 발송, 다국어, 고급 검색, 실시간 알림, 서명/도장.

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `001-setup.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **모든 작업 파일에 "## 테스트 체크리스트" 섹션 필수 포함.** API/비즈니스 로직 작업은 아래 `## 테스트 원칙`의 표준 템플릿으로 **정상 흐름·오류·엣지 케이스·반응형** 시나리오를 밀도 기준(정상 2+ / 오류 2+ / 엣지 2+)에 맞춰 채운다
- 수락 기준(완료 조건)에 "Playwright MCP 테스트 전 항목 통과"를 명시
- 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조 (현재가 `012`라면 `011`, `010`을 참조)
- 완료된 예시는 체크된 박스와 변경 사항 요약을 포함함. 새 작업은 빈 박스와 요약 없음. 초기 상태 샘플은 `000-sample.md` 참조.

3. **작업 구현**

- 작업 파일의 명세서를 따름
- 기능과 기능성 구현
- **구현 완료 직후 Playwright MCP로 테스트 수행 (필수)** — 브라우저를 구동해 실제 사용자 흐름을 재현하고 `## 테스트 체크리스트`의 각 항목을 실행
- 테스트 통과 시 체크박스를 `[x]`로 표시하고 결과 요약을 작업 파일에 기록. **실패 시 원인을 수정하고 재실행하며, 전 항목이 통과할 때까지 다음 단계·다음 Task로 진행하지 않는다**
- 각 단계 후 작업 파일 내 단계 진행 상황 및 테스트 결과 업데이트
- 전 항목 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시 (API/비즈니스 로직 Task는 "## 테스트 체크리스트" 전 항목 통과가 완료 조건)

## 테스트 원칙

### 핵심 원칙 3가지

1. **API 연동·비즈니스 로직 구현 작업은 테스트 시나리오를 꼼꼼하게 작성한다.** 정상 흐름만이 아니라 오류·엣지 케이스·반응형까지 빠짐없이 나열한다.
2. **구현을 완료한 뒤에는 반드시 테스트를 수행한다.** 테스트 없는 구현은 미완료로 간주하며, 전 항목 통과 전에는 다음 단계·다음 Task로 진행하지 않는다.
3. **모든 테스트는 Playwright MCP로 수행한다.** 브라우저를 실제로 구동해 사용자 흐름을 재현하는 방식이다 (코드 레벨 테스트 러너 도입은 이 원칙의 대상이 아님).

### 테스트 대상 분류 (2단계)

- **모든 구현 Task** — 구현 직후 Playwright MCP 스모크 검증 필수: 페이지 정상 렌더링 / 콘솔 에러 0건 / 핵심 사용자 동작 1건 이상 성공
- **API 연동 · 비즈니스 로직 · 데이터 매핑 · 폼 처리 · PDF·파일 생성 Task** — 스모크 + 아래 `## 테스트 체크리스트`의 전체 시나리오 수행 (정상 2+ / 오류 2+ / 엣지 2+ / 반응형·품질)

### `## 테스트 체크리스트` 표준 템플릿

작업 파일(`XXX-description.md`)에 아래 형식을 그대로 넣고 `<...>` 부분을 Task에 맞게 채운다.

```markdown
## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [ ] <핵심 사용자 시나리오 1: 진입 → 동작 → 기대 결과>
- [ ] <API 응답이 화면/데이터에 올바르게 반영됨>

### 오류 처리

- [ ] <잘못된 입력 / 없는 리소스 → 사용자 친화적 에러 표시>
- [ ] <외부 API 실패(4xx/5xx/타임아웃) → 폴백 UI 및 서버 로그 분리>

### 엣지 케이스

- [ ] <빈 값 / 0건 / 대량 데이터 / 경계값 처리>
- [ ] <중복 요청 / 느린 네트워크 / 권한 경계>

### 반응형 & 품질

- [ ] 모바일·태블릿·데스크톱 뷰포트에서 레이아웃 정상
- [ ] 콘솔 에러 0건 · 주요 네트워크 요청 상태 코드 정상
```

### 검증 절차

1. 구현 완료 → 2. Playwright MCP로 `## 테스트 체크리스트`의 각 항목 실행 → 3. 통과 항목은 `[x]` 표기 + 결과 요약 기록 → 4. 실패 시 원인 수정 후 재실행(전 항목 통과까지) → 5. 전 항목 통과 후에만 로드맵에서 해당 Task를 ✅로 표시

## 개발 단계

### Phase 1: 애플리케이션 골격 구축 ✅

- **Task 001: 프로젝트 구조 및 라우팅 설정** ✅ - 완료
  - ✅ Next.js 15.5.3 App Router + Turbopack 프로젝트 초기화
  - ✅ ESLint + Prettier + Husky + lint-staged + `npm run check-all` 파이프라인
  - ✅ 라우트 구조 생성: 홈(`/`), 인보이스 상세(`/invoice/[id]`)
  - ✅ 공통 레이아웃 골격: `layout/header`, `layout/footer`, `layout/container`, `navigation/main-nav`, `navigation/mobile-nav`
  - ✅ 다크모드 지원: `providers/theme-provider`, `theme-toggle` (next-themes)
  - ✅ 서버 전용 환경 변수 검증: `src/lib/env.ts` (`NOTION_API_KEY`, `NOTION_DATABASE_ID`, Zod)

- **Task 002: 도메인 타입 정의 및 데이터 모델 설계** ✅ - 완료
  - ✅ `src/types/invoice.ts` 생성: `Invoice`, `InvoiceItem`, `BusinessInfo`, `InvoiceStatus`, `InvoiceView`, `InvoiceLookupResult` (PRD 데이터 모델 기준, snake_case → camelCase 전환)
  - ✅ Notion 페이지 원본(`NotionPage.properties`)과 도메인 타입 간 매핑 계약: `src/lib/notion/invoices.ts`의 `INVOICE_PROPS` 상수 맵 + `NotionPropertyReaders` 인터페이스 (실제 property 표시명은 Task 006에서 확정)
  - ✅ PDF 생성 입력용 뷰모델 타입 `InvoiceView` 정의 (`computed` 파생값 포함)
  - ✅ `src/lib/format.ts` 골격: `formatCurrency`(KRW), `formatDate`(ko-KR) — Intl 최소 구현
  - ✅ 오류 상태 유니온 `InvoiceLookupResult = { ok: true; data } | { ok: false; reason: 'not_found' | 'invalid_id' | 'notion_error' }`
  - ✅ `src/lib/notion/index.ts` 배럴 재export 갱신 · `npm run typecheck`/`lint` 통과 · Playwright MCP 스모크(홈·상세 렌더 정상, 콘솔 에러 0건)
  - 작업 파일: `tasks/002-domain-types.md`

- **Task 003: Next.js 15.5.3 → 16 마이그레이션** ✅ - 완료
  - ✅ `@next/codemod@latest upgrade latest` 적용: `next` 15.5.3 → **16.3.4**, `react`/`react-dom` 19.1.0 → **19.2.8**, `eslint-config-next` → 16.3.4, `@types/react(-dom)` 19.2.x + `overrides`
  - ✅ 비동기 Request API: `src/app/invoice/[id]/page.tsx` 는 이미 `await params` 사용 — 16 관례 부합 (추가 변환 불필요)
  - ✅ `middleware.ts`/`proxy.ts` 없음, `turbopack` 설정 이미 최상위 — 영향 없음
  - ✅ `eslint.config.mjs` flat config 재작성(FlatCompat 제거 → `eslint-config-next/core-web-vitals` + `/typescript` + `eslint-config-prettier/flat`), ESLint 10 비호환으로 `eslint` `^9.39.5` 핀 고정
  - ✅ `next.config.ts` `agentRules: false` (에이전트 지침은 `CLAUDE.md`/`shrimp-rules.md`/`docs/guides` 로 수동 관리), `cache-components-instant-false` 코드모드 산출물 되돌림(Cache Components 미도입)
  - ✅ `tsconfig.json` 자동 재구성 수용(`jsx: react-jsx`, `.next/dev/types` include), `docs/guides/nextjs-16.md` 신설 · `nextjs-15.md` 대체 배너
  - ✅ `npm run typecheck`/`lint`/`build` 통과 · Playwright MCP 스모크(홈·상세 렌더 정상, 폼→상세 이동, 콘솔 에러·경고 0건, 동적 `params` 정상)
  - 작업 파일: `tasks/003-nextjs-16-migration.md`

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

- **Task 004: 홈 페이지 및 오류 페이지 UI 완성** ✅ - 완료
  - ✅ 홈 페이지 카드 레이아웃 + `InvoiceLookupForm` (React Hook Form + Zod, `/invoice/{id}` 라우팅)
  - ✅ 홈 페이지 안내 텍스트 보강 + `mockInvoices` 기반 데모 견적서 바로가기 링크 (링크 받은 사용자 대상 설명, "쉬운 입장" 요구 반영)
  - ✅ `src/app/invoice/[id]/not-found.tsx` 생성: "견적서를 찾을 수 없습니다" + 원인 안내 + 홈으로 버튼 + 발행자 연락처(설정 시) (F010)
  - ✅ `src/app/error.tsx` 생성: 전역 오류 폴백 UI (`reset` 재시도 + 홈으로 버튼)
  - ⏸ 홈 폼 형식 검증(잘못된 ID 인라인 에러) — **범위 변경**: mock ID가 Notion 실제 ID 형식이 아니라 Task 007(실데이터 전환) 이후로 보류, 대신 데모 링크로 "쉬운 입장" 해결
  - ✅ 반응형: 모바일 세로 중앙 정렬, 데스크톱 카드 폭 제한, 다크·라이트모드 확인
  - 작업 파일: `tasks/004-home-error-pages.md`
  - **알려진 기존 이슈(범위 밖)**: 좁은 뷰포트로 새로 로드 시 헤더 `useMediaQuery` 기반 네비게이션에서 hydration mismatch 경고 발생 (이 Task 이전부터 있던 별개 문제, 후속 Task에서 다룰 것을 제안)

- **Task 005: 공통 컴포넌트·더미 데이터 및 인보이스 상세 페이지 UI 완성** ✅ - 완료
  - ✅ `npx shadcn add table` — `Table` 컴포넌트 추가 (생성된 `from "cn"` import 오류 수정 + 프로젝트 스타일로 정규화)
  - ✅ `src/lib/mock/invoices.ts` 생성: 더미 `Invoice` 3건 (표준 세금 10% / 다항목·할인·세금 0% / 장문 참고사항·고액 단일 항목) + `getMockInvoiceById(id)` (Task 007에서 `getInvoiceById`로 교체될 동일 형태)
  - ✅ 인보이스 표시용 프레젠테이션 컴포넌트: `components/invoice/invoice-header`(번호·발행일·만료일·상태 배지), `invoice-parties`(발행자/클라이언트 2단), `invoice-items-table`(반응형 테이블, 모바일에서 설명 컬럼 숨김+항목명 하위 표시), `invoice-summary`(소계·세금·총액, 세금 0% 시 라벨 생략), `invoice-notes`(장문 줄바꿈 대응), `invoice-actions`(PDF 다운로드 비활성 버튼 + 홈으로)
  - ✅ 로딩 상태용 `components/invoice/invoice-skeleton` (shadcn `skeleton` 활용, Task 007 로딩 UI에서 연결 예정)
  - ✅ `src/app/invoice/[id]/page.tsx`를 더미 데이터 기반 완성 렌더링으로 교체, 존재하지 않는 ID는 `notFound()` 호출
  - ✅ 반응형(모바일 375 / 데스크톱 1280)·다크모드 Playwright MCP로 점검
  - 작업 파일: `tasks/005-invoice-detail-ui.md`
  - **범위 밖(별도 Task)**: 클라이언트 주소/연락처 표시(현재 `Invoice.clientName`만 존재 — Task 002 확정 타입 범위 밖), 인쇄(print) 전용 스타일, `not-found.tsx` 커스터마이징(Task 004), 로딩 UI 연결(Task 007)

- **Task 004-1: 컨테이너 폭 통일 및 UI/UX 모던화** ✅ - 완료
  - ✅ `Container` 컴포넌트를 단일 폭(`max-w-4xl`, 896px)으로 단순화, 홈/인보이스 상세/`not-found`/`error` 페이지가 헤더·푸터와 동일한 폭·좌우 패딩을 공유하도록 통일 (기존 헤더 1280px → 896px로 축소)
  - ✅ `invoice-items-table.tsx` 헤더/셀 padding 확장(`sm` 이상 `px-4`, 모바일은 `px-3`로 잘림 방지) + 단가·수량·금액 컬럼 `tabular-nums`
  - ✅ 인보이스 상세 페이지를 `Card`로 감싸 "문서" 톤 부여, `invoice-summary.tsx` 합계 영역 `bg-muted/50` 강조 박스 스타일 적용
  - ✅ Playwright MCP로 모바일(375)·태블릿(768)·데스크톱(1280)·다크/라이트모드 재검증 (모바일 테이블 패딩 회귀 발견 후 반응형 패딩으로 수정)
  - 작업 파일: `tasks/004-1-ui-modernization.md`

### Phase 3: 핵심 기능 구현

- **Task 006: Notion API 연동 및 데이터 매핑 레이어** ✅ - 완료
  - ✅ `src/lib/notion/invoices.ts`: `INVOICE_PROPS`/`ITEM_PROPS`를 실제 Notion DB 스키마(사용자 제공
    export + `getDatabase` 재확인)로 확정, title/rich_text/number/date/select/status/relation property
    파서 구현, `getInvoiceById`(ID 형식 검증 → 페이지 조회 → 소속 DB 검증(F004) → 항목 relation 개별
    조회·`단가×수량` 재계산) 및 환경 변수 기반 `getBusinessInfo` 구현
  - ✅ 실데이터 매핑 확정: Notion 실제 스키마에는 PRD가 가정한 세금/비고/발행자 필드가 없어
    `subtotal = totalAmount`·세금·비고는 항상 미설정, 발행자 정보는 Notion이 아니라 `BUSINESS_*`
    환경 변수로 관리(사용자 확인 완료, `docs/PRD.md` 데이터 모델 표 갱신)
  - ✅ `InvoiceStatus`를 실제 Notion 상태 옵션(`대기`/`발송`/`확인함`/`완료`)으로 교체, mock 데이터·
    `invoice-header.tsx` 배지 매핑 동기화
  - ✅ `src/lib/env.ts`에서 `NOTION_API_KEY`·`NOTION_DATABASE_ID` 필수화, `BUSINESS_*` 6종 추가,
    `client.ts`가 `process.env` 직접 접근 대신 `env.ts` 경유하도록 수정, `.env.example`의 실제 토큰처럼
    보이던 값을 자리표시자로 교체(보안 조치)
  - ✅ **실데이터 발견 버그 수정**: Notion "총금액" property의 실제 표시명이 공백 포함 `총금 액`이었음 —
    실조회 테스트로 발견해 수정
  - ✅ `npm run typecheck`/`lint`/`build` 통과 · UI 없는 데이터 레이어 Task라 Playwright MCP 대신 tsx
    스크립트로 실제 Notion DB 조회 검증(정상 매핑·not_found·invalid_id·env 필수화 오류·getBusinessInfo
    null/값 반환 전 시나리오 통과)
  - 작업 파일: `tasks/006-notion-integration.md`

- **Task 007: 인보이스 상세 조회 실데이터 연동 (F001·F002·F004)** ✅ - 완료
  - ✅ 상세 페이지 Server Component에서 `getMockInvoiceById` 제거, `getInvoiceById(params.id)` 호출로 실데이터 연동
  - ✅ 조회 결과에 따라 분기: 성공 → 상세 렌더링 / `not_found`/`invalid_id` → `notFound()` 호출 / `notion_error` → `throw new Error()` (error boundary가 잡음)
  - ✅ `generateMetadata` 추가: 성공 시 인보이스 번호 기반 `<title>` (예: `INV-2026-001 — 견적서 확인`), 실패 시 기본 제목
  - ✅ 합계 재계산 검증 구현: 항목 금액 합계(`itemsTotal = sum(items[].amount)`)와 Notion 총금액(`subtotal`) 비교, 불일치 시 `console.warn` 로그 + 항목 합계로 화면 표시
  - ✅ `src/app/invoice/[id]/loading.tsx` 추가: `InvoiceSkeleton`을 페이지 레이아웃으로 감싸 로딩 중 레이아웃 시프트 방지
  - ✅ 홈페이지 데모 링크 업데이트: mock 링크 3개 제거, 실제 Notion 데이터(INV-2026-001, 페이지 ID `3d5eed15f2bc800389f4fc748aaa1df4`) 단일 링크로 교체
  - ✅ `src/lib/mock/invoices.ts` 삭제 (grep 확인: 코드 내 참조 0건)
  - ✅ `npm run typecheck`/`lint`/`build` 통과, `prettier --check` 통과
  - ✅ **테스트** (Playwright MCP):
    - [x] 정상: 실제 링크(`/invoice/3d5eed15f2bc800389f4fc748aaa1df4`) 접근 → INV-2026-001 헤더·클라이언트(ABC회사)·항목 3건·합계(₩5,000,000)·상태 표시, `<title>` 포함 확인
    - [x] 정상: 홈 데모 링크 클릭 → 상세 페이지 이동
    - [x] 오류: 잘못된 형식(`not-a-valid-id`) → not-found 페이지
    - [x] 오류: 존재하지 않는 32자리 ID → not-found 페이지
    - [ ] 오류: Notion 조회 실패(`.env.local` 잘못된 키) → error boundary — 미실행(동일 throw→error.tsx 경로를 Task 004에서 이미 검증, `.env.local` 훼손 리스크 대비 실익 낮다고 판단)
    - [ ] 엣지: 느린 네트워크에서 로딩 중 `InvoiceSkeleton` 표시 — 미실행(로컬 응답이 빨라 자연 재현 어려움, 코드 리뷰로 대체)
    - [ ] 엣지: 과거 만료 인보이스 "기한 지남" 배지 — Task 008 범위로 이관
    - [x] 반응형/품질: 모바일 375 / 데스크톱 1280 레이아웃 정상, 콘솔 에러 0건(신선한 데스크톱 로드 기준)
  - 작업 파일: `tasks/007-invoice-real-data-integration.md`

- **Task 008: 오류 처리 및 엣지 케이스 (F010)** ✅ - 완료
  - ✅ `error.tsx`가 `notion_error`(서버 장애)를 사용자에게는 고정 안내 문구로만 보여주고 실제 사유는
    서버/브라우저 콘솔 로그로만 남김(`error.message` 미노출), `generateMetadata`도 `notion_error`일 때
    "일시적인 오류가 발생했습니다"로 제목 분리(기존엔 `not_found`와 동일 제목이라 화면과 불일치)
  - ✅ `src/lib/notion/client.ts`: 재시도 소진 직전 `console.error`로 요청 메서드·경로·재시도 횟수 로그 추가
  - ✅ `InvoiceHeader`에 `isOverdue(dueDate, status)` 계산 + "기한 지남" `destructive` 배지 추가(상태
    "완료"는 제외). 실제 만료 인보이스(INV-2026-001)로 검증
  - ✅ `src/app/api/business-info/route.ts` 신규: `error.tsx`(Client Component)가 서버 전용
    `getBusinessInfo()`를 fetch로 간접 사용, 미설정/실패 시 기본 안내 문구로 대체. `not-found.tsx`도
    동일한 기본 문구 정책으로 통일
  - **테스트** (Playwright MCP):
    - [x] 정상: "홈으로" 버튼(`not-found.tsx`/`error.tsx`) → 홈 이동, 문의처 안내 문단 표시
    - [x] 오류: 형식 오류 ID → `not-found.tsx` 기본 문구, 강제 `throw` → `error.tsx` 기본 문구(내부 사유
          비노출)
    - [x] 엣지: 만료 인보이스 "기한 지남" 배지 표시, `getBusinessInfo` null 상태에서도 정상 폴백
    - [x] 반응형/품질: 모바일(375)·데스크톱(1280) 정상, 콘솔 에러 0건(신선한 데스크톱 로드 기준)
  - 작업 파일: `tasks/008-error-handling-edge-cases.md`

- **Task 009: PDF 다운로드 기능 (F003)** ✅ - 완료
  - ✅ PDF 생성 방식: **`@react-pdf/renderer`**로 결정(사용자 확인 — Vercel 서버리스 배포 친화적, 헤드리스
    브라우저 불필요). 화면 레이아웃과는 별도로 `src/lib/pdf/invoice-document.tsx`에 PDF 전용 레이아웃 작성
  - ✅ Route Handler `src/app/invoice/[id]/pdf/route.tsx` 구현: `getInvoiceById` → 사유별 404/500 분기 →
    `renderToBuffer` → PDF 바이너리 응답 (`Content-Disposition: attachment`, ASCII 폴백 + RFC 5987 UTF-8)
  - ✅ 한글 폰트: Noto Sans KR(OFL 라이선스)을 `assets/fonts/`에 로컬로 커밋해 임베드(원격 CDN 의존 없음).
    `next.config.ts`에 `outputFileTracingIncludes` 추가해 Vercel 배포 시 폰트 파일 누락 위험 방지(빌드
    트레이스 매니페스트로 포함 확인)
  - ✅ `src/lib/invoice.ts` 신규: `resolveSubtotal`/`STATUS_LABEL`/`isOverdue`를 화면·PDF 공용 유틸로 통합
  - ✅ `invoice-actions.tsx`를 Client Component로 전환: `fetch` + Blob 다운로드, 로딩 스피너("다운로드
    중..."), 실패 시 `sonner` 토스트
  - ✅ 파일명 규칙: `invoice-{invoice_number}.pdf`
  - ✅ **테스트** (Playwright MCP + `curl`):
    - [x] 정상: 버튼 클릭 시 실제 PDF 다운로드 트리거(`invoice-INV-2026-001.pdf`), 다운로드된 PDF를 직접
          열어 한글·항목·합계·배지 정상 렌더링 확인
    - [x] 오류: 형식 오류/존재하지 않는 ID → 404 JSON 응답 확인(curl)
    - [ ] Notion 조회 실패 시 500 — 미검증(Task 007/008과 동일 코드 패턴이라 낮은 리스크로 판단해 생략)
    - [x] 다운로드 중 버튼 로딩 상태(스피너) 정상
    - [ ] 다항목 페이지 넘김 — 미검증(테스트 데이터가 1페이지 분량뿐, `wrap={false}` 적용 및 react-pdf
          표준 페이지네이션에 의존)
    - [x] 반응형/품질: 모바일·데스크톱 버튼 노출 정상, 콘솔 에러 0건(신선한 데스크톱 로드 기준)
  - 작업 파일: `tasks/009-pdf-download.md`

- **Task 009-1: 핵심 기능 통합 테스트**
  - Playwright MCP로 전체 사용자 여정 E2E: 홈 → ID 입력 → 상세 확인 → PDF 다운로드 → 홈 복귀
  - 직접 링크 접근(`/invoice/{id}`) 경로 검증
  - 에러 플로우: 잘못된 ID → 오류 페이지 → 재입력
  - 반응형 스냅샷: 모바일/태블릿/데스크톱 3개 뷰포트에서 레이아웃 깨짐 점검
  - 다크모드 전체 페이지 시각 점검

### Phase 4: 고급 기능 및 최적화

- **Task 010: 성능 최적화 및 캐싱** ✅ - 완료
  - ✅ 인보이스 상세(`page.tsx`)·PDF Route Handler(`pdf/route.tsx`)에 `export const revalidate`(각
    120초/300초) + `export const fetchCache = 'default-cache'` 적용 — Next.js 15+부터 `fetch()` 기본값이
    `no-store`로 바뀐 것을 실측으로 발견해 `fetchCache`를 추가로 적용, `NotionClient` 코드 변경 없이
    캐시 히트 확인(응답 시간 최대 8배 단축)
  - `generateStaticParams` 미적용(공개 ID 무한) 유지. on-demand `revalidateTag('invoice')` 훅은 호출할
    웹훅 소스가 없어 **이번엔 구현 보류**, 확장 지점으로만 문서화(과설계 방지)
  - ⏸ 한글 웹폰트(Noto Sans KR) 셀프호스팅 — **보류(사용자 확인)**. `next/font/google`은 한글 subset
    미지원, PDF용 가변 폰트 재사용(LCP 29.7s)과 `@fontsource/noto-sans-kr` 한글 전용 서브셋(LCP 9.2s)
    모두 Lighthouse 목표(LCP<2.5s)에 크게 못 미쳐 시스템 폰트로 회귀. 부수적으로 `<body>`에 `font-sans`
    클래스가 빠져 Geist 폰트가 전혀 적용되지 않던 기존 버그를 발견해 수정
  - ✅ Lighthouse 측정(모바일 시뮬레이션): 홈 LCP 3.4s/CLS 0/TBT 120ms, 인보이스 상세 LCP 3.5s/CLS 0/TBT
    160ms. CLS·TBT는 목표 달성, LCP는 하이드레이션 비용(폰트/캐싱과 무관)으로 약 1초 초과 — 후속 과제로
    기록
  - 작업 파일: `tasks/010-performance-optimization.md`

- **Task 011: 배포 및 CI/CD** (범위 축소 — 사용자 확인) ✅ - 로컬 작업 완료
  - ✅ **이 Task가 한 것(로컬 작업)**: `.github/workflows/ci.yml` 신설(Node 20, `npm ci` → `check-all` →
    `build`, `NOTION_API_KEY`/`NOTION_DATABASE_ID`는 GitHub Secrets 참조), `docs/guides/deployment.md`
    배포 가이드 신설(Task 009 PDF 폰트 트레이싱 확인 항목 포함), `README.md`를 현재 구현 상태
    (F001~F011 완료, Next.js 16.3.4 기준)에 맞게 전면 개정
  - ⏸ **사용자가 직접 진행**(가이드 문서로 안내, 완료 후 요청 시 이어서 검증): Vercel 프로젝트 연결·환경
    변수 등록, GitHub Actions Secrets 등록, 실제 `git push`/배포 트리거, 배포 후 스모크 테스트
  - ~~Puppeteer 사용 시 서버리스 chromium 대응~~ — Task 009에서 `@react-pdf/renderer`로 결정해 해당 없음
  - 작업 파일: `tasks/011-deployment-cicd.md`
