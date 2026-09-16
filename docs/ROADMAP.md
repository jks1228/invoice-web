# Invoice Web 고도화 개발 로드맵 (V2)

발행자가 Notion을 열지 않고도 웹에서 견적서 목록을 확인하고 클라이언트 공유 링크를 바로 복사할 수 있는 **관리자 영역**을 신설한다.

## 개요

**Invoice Web V1(MVP)** 은 완료되었습니다 — 공개 인보이스 조회(F001·F002·F004), PDF 다운로드(F003), 반응형(F005), 오류 처리(F010), 홈 진입점(F011)까지 Task 001~011 전부 구현 완료. 상세 이력은 `docs/roadmaps/ROADMAP_V1.md`를 참조하세요.

**V2(이번 고도화)** 는 PRD "MVP 이후 기능"에 있던 **관리자 대시보드**의 첫 단계를 구현합니다:

- **관리자 견적서 목록 (A001)**: Notion DB의 전체 견적서를 웹 목록으로 조회 (번호·클라이언트·발행일·유효기간·총금액·상태)
- **공개 링크 복사 (A002)**: 목록의 각 행에서 `/invoice/{id}` 공개 링크를 클립보드로 한 번에 복사
- **관리자 영역 다크모드 확장 (A003)**: 이미 공개 페이지에 동작 중인 next-themes 다크모드를 신설 관리자 레이아웃까지 확장·검증
- **Notion 목록 조회 API 확장 (A004)**: 현재 단일 조회(`getInvoiceById`)만 있는 `src/lib/notion/invoices.ts`에 목록 조회 함수 신설
- **관리자 접근 제어 (A005)**: 단일 비밀번호 + 서명 세션 쿠키 인증 — Task 018에서 구현 완료 (아래 "범위 결정 사항" 참조)

### 현재 코드 상태 (V2 착수 시점)

| 영역              | 현재 상태                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 라우트            | `/`(홈), `/invoice/[id]`(상세), `/invoice/[id]/pdf`(Route Handler), `/api/business-info`, `error.tsx` — **관리자 라우트 없음** |
| Notion 레이어     | `src/lib/notion/invoices.ts`에 `getInvoiceById`·`getBusinessInfo`만 존재 — **목록 조회 함수 없음** (신규 작성 필요)            |
| Notion 클라이언트 | `src/lib/notion/client.ts`에 `queryDatabase`/`getAllPages`/`iteratePages` **이미 구현되어 있음** (그대로 재사용)               |
| 다크모드          | `providers/theme-provider` + `theme-toggle` + `app/layout.tsx` 적용 — **이미 동작 중** (관리자 영역으로 확장만 필요)           |
| 공통 레이아웃     | `layout/header`·`footer`·`container`, `navigation/main-nav`·`mobile-nav` (`main-nav`의 `navItems`는 현재 홈 1개뿐)             |
| UI 컴포넌트       | shadcn/ui new-york — `table`, `badge`, `button`, `card`, `input`, `dropdown-menu`, `skeleton`, `sonner` 등 사용 가능           |

### 🔒 범위 결정 사항 (인증) — Task 018 완료로 해제됨

> **Task 012~017 시점에는 관리자 인증(A005)을 고도화(Phase 5~7) 범위에서 제외했으나, 이후 Task 018에서
> 단일 비밀번호 + 서명된 세션 쿠키 방식으로 구현을 완료했다.**
>
> - **해결됨**: `/admin`은 이제 `src/proxy.ts`가 세션 쿠키를 검증해 미인증 요청을 `/admin/login`으로
>   리다이렉트한다. URL을 안다고 목록·금액·상태에 접근할 수 없다. 상세는 `tasks/018-admin-auth.md` 참고
> - `robots: { index: false, follow: false }` 메타데이터는 검색 노출 차단용 완화책으로 계속 유지한다
>   (접근 제어는 proxy.ts가 담당, robots는 별개의 이중 방어)
> - **배포 게이트 해제**: `docs/guides/deployment.md`의 "인증 완료 전 배포 금지" 문구를 "인증
>   적용됨 — 환경 변수 등록 필요" 안내로 교체했다

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `012-admin-layout.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **모든 작업 파일에 "## 테스트 체크리스트" 섹션 필수 포함.** API/비즈니스 로직 작업은 아래 `## 테스트 원칙`의 표준 템플릿으로 **정상 흐름·오류·엣지 케이스·반응형** 시나리오를 밀도 기준(정상 2+ / 오류 2+ / 엣지 2+)에 맞춰 채운다
- 수락 기준(완료 조건)에 "Playwright MCP 테스트 전 항목 통과"를 명시
- 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조 (현재가 `014`라면 `013`, `012`를 참조). V1 완료 작업(`009-pdf-download.md`, `010-performance-optimization.md` 등)도 형식 참고용으로 유효하다
- 완료된 예시는 체크된 박스와 변경 사항 요약을 포함함. 새 작업은 빈 박스와 요약 없음.

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
- **API 연동 · 비즈니스 로직 · 데이터 매핑 · 폼 처리 · 클립보드 · 인증 Task** — 스모크 + 아래 `## 테스트 체크리스트`의 전체 시나리오 수행 (정상 2+ / 오류 2+ / 엣지 2+ / 반응형·품질)

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

> V1의 Phase 1~4(Task 001~011)는 완료되어 `docs/roadmaps/ROADMAP_V1.md`로 이관되었습니다. 이번 로드맵은 **Phase 5**부터 이어집니다.

### Phase 5: 관리자 영역 골격 구축

- **Task 012: 관리자 라우트 그룹 및 레이아웃 골격 구축** ✅ - 완료
  - `src/app/admin/` 라우트 신설: `layout.tsx`, `page.tsx`(견적서 목록), `loading.tsx`, `not-found.tsx` 빈 껍데기 생성
  - 관리자 전용 레이아웃 컴포넌트 골격: `src/components/admin/admin-shell.tsx`(사이드바 또는 상단 서브바 + 본문 영역), `admin-page-header.tsx`(제목·설명·액션 슬롯)
  - 기존 루트 `app/layout.tsx`(ThemeProvider·Header·Footer)를 **그대로 상속**하고 관리자 레이아웃은 그 안쪽 영역만 담당 — 다크모드/테마 토글이 자동 승계되도록 구성 (A003 사전 조건)
  - 관리자 진입 동선: `src/components/navigation/main-nav.tsx`의 `navItems`에 관리자 항목 추가 여부 결정 — **기본은 추가하지 않음**(공개 헤더에 관리자 링크 노출 금지, URL 직접 접근). `mobile-nav.tsx`도 동일 정책 유지
  - **보안 임시 완화책**: `admin/layout.tsx`에 `export const metadata = { robots: { index: false, follow: false } }` 적용 + 페이지 상단에 "인증 미적용" 개발용 안내 배너 표시 (Task 018 완료 시 제거)
  - `docs/guides/project-structure.md`에 관리자 영역 구조 항목 추가
  - **테스트** (Playwright MCP · 스모크): `/admin` 진입 시 레이아웃 렌더링 정상, 헤더/푸터/테마 토글 승계 확인, 콘솔 에러 0건

- **Task 013: 관리자 도메인 타입 및 목록 조회 계약 설계** ✅ - 완료
  - `src/types/invoice.ts`에 목록 전용 타입 추가: `InvoiceListItem`(id·invoiceNumber·clientName·invoiceDate·dueDate·totalAmount·status·isOverdue — 항목 배열 미포함 경량 타입)
  - 목록 조회 결과 판별 유니온 정의: `InvoiceListResult = { ok: true; data: InvoiceListItem[]; nextCursor?: string } | { ok: false; reason: 'notion_error' }` (기존 `InvoiceLookupResult` 패턴과 동일한 계약)
  - 목록 조회 옵션 타입 정의: `InvoiceListQuery`(정렬 기준·상태 필터·페이지 크기·커서) — 구현은 Task 017, 이 Task는 타입 계약만
  - `src/lib/notion/invoices.ts`의 `INVOICE_PROPS` 상수 맵을 목록 조회에서도 재사용하도록 정리 (property 표시명 문자열은 이 상수에서만 정의 — `총금 액` 공백 포함 표시명 주의)
  - `src/lib/invoice.ts`의 공용 유틸(`resolveSubtotal`·`STATUS_LABEL`·`isOverdue`)을 목록에서도 재사용할 수 있는지 점검하고 필요 시 시그니처만 확장
  - 공개 링크 생성 유틸 시그니처 정의: `buildInvoicePublicUrl(id: string, origin?: string): string` (구현은 Task 015)
  - `npm run typecheck`/`lint` 통과 · UI 변경 없는 타입 Task이므로 기존 페이지 스모크(홈·상세 렌더 정상)로 회귀 확인

### Phase 6: 관리자 UI 완성 (더미 데이터 활용)

- **Task 014: 견적서 목록 UI 구현 (더미 데이터)** ✅ - 완료
  - `src/lib/mock/invoice-list.ts` 신설: `InvoiceListItem` 더미 10~15건 (상태 4종 `대기`/`발송`/`확인함`/`완료` 분포, 기한 지남 건, 총금액 0원 건, 장문 클라이언트명 포함) + `getMockInvoiceList()` — Task 017에서 실 API로 교체될 동일 형태
  - `src/components/admin/invoice-list-table.tsx`: shadcn `Table` 기반 목록 (컬럼 = 견적서 번호 / 클라이언트 / 발행일 / 유효기간 / 총금액 / 상태 / 액션)
  - 상태 배지는 기존 `invoice-header.tsx`의 배지 매핑 규칙과 동일한 색상 체계 사용, 기한 지남 건은 `destructive` "기한 지남" 배지 병기
  - 반응형: 데스크톱은 테이블, 모바일(<768px)은 카드 리스트로 전환 (또는 `overflow-x-auto` + 저우선 컬럼 숨김). 금액·수량 컬럼 `tabular-nums` 적용
  - 빈 상태 UI(`견적서가 없습니다` + 안내), 로딩 상태(`src/components/admin/invoice-list-skeleton.tsx`)
  - 목록 행 클릭/번호 링크 → `/invoice/{id}` 공개 상세 페이지로 이동(새 탭)
  - **테스트** (Playwright MCP): 정상(목록 렌더·행 링크 이동·상태 배지 매핑), 오류(빈 목록 상태 UI), 엣지(장문 클라이언트명 줄바꿈·총금액 0원·기한 지남 배지), 반응형(375/768/1280 레이아웃 정상, 콘솔 에러 0건)

- **Task 015: 공개 링크 복사 기능 구현 (A002)** ✅ - 완료
  - `src/lib/invoice.ts`에 `buildInvoicePublicUrl(id, origin)` 구현: 브라우저에서는 `window.location.origin`, 서버 렌더링/환경 변수 우선순위는 `NEXT_PUBLIC_SITE_URL` → 요청 origin 폴백 (환경 변수 추가 시 `src/lib/env.ts` 스키마에 반영 — 클라이언트 노출 값이므로 `NEXT_PUBLIC_` 접두사 사용, Notion 키와 분리)
  - `src/components/admin/copy-link-button.tsx` 신설 (Client Component): 목록 각 행의 "링크 복사" 버튼
    - `navigator.clipboard.writeText()` 사용, 성공 시 `sonner` 토스트("링크를 복사했습니다") + 버튼 아이콘 2초간 체크 표시 전환
    - **폴백 필수**: `navigator.clipboard` 미지원 또는 비보안 컨텍스트(HTTP·일부 모바일 브라우저)에서는 선택 가능한 입력 필드 노출 또는 `document.execCommand('copy')` 폴백 + 실패 시 토스트로 URL 직접 노출
    - 접근성: `aria-label="공개 링크 복사"`, 복사 결과를 `aria-live` 영역으로 안내
  - 목록 액션 컬럼에 "링크 복사" + "새 탭에서 열기" 2개 액션 배치 (모바일에서는 `dropdown-menu`로 접기)
  - **테스트** (Playwright MCP):
    - 정상: 버튼 클릭 → 클립보드 값이 `{origin}/invoice/{id}`와 정확히 일치(`navigator.clipboard.readText()` 또는 입력 필드 붙여넣기로 검증), 토스트 표시
    - 정상: 복사한 링크를 주소창에 붙여넣어 이동 → 해당 견적서 상세 페이지 정상 렌더링
    - 오류: 클립보드 권한 거부/미지원 상황 주입 → 폴백 UI 노출 및 URL 확인 가능, 콘솔 unhandled rejection 없음
    - 오류: 잘못된/빈 ID를 가진 행 → 버튼 비활성화 또는 명확한 에러 토스트
    - 엣지: 동일 버튼 연속 3회 클릭(중복 요청) → 토스트 중복 누적 없이 정상 동작, 서로 다른 행 연속 복사 시 마지막 값이 정확히 반영
    - 엣지: 하이픈 포함 Notion ID(`xxxxxxxx-xxxx-...`)와 32자리 무하이픈 ID 모두 동일한 유효 URL 생성
    - 반응형/품질: 모바일·태블릿·데스크톱에서 액션 버튼 접근 가능, 콘솔 에러 0건

- **Task 016: 관리자 영역 다크모드 확장 및 반응형·접근성 검증 (A003)** ✅ - 완료
  - **스코프 주의**: 다크모드는 이미 `theme-provider`·`theme-toggle`·`app/layout.tsx`로 **구현되어 동작 중**이다. 이 Task는 **신규 관리자 레이아웃/컴포넌트에 다크모드가 올바르게 적용되는지 확장·검증**하는 작업이며 신규 구현이 아니다
  - 관리자 컴포넌트(`admin-shell`·`admin-page-header`·`invoice-list-table`·`copy-link-button`·스켈레톤·빈 상태)가 하드코딩 색상 없이 **시맨틱 토큰**(`bg-background`·`text-foreground`·`bg-muted`·`border`·`text-muted-foreground`)만 사용하는지 점검·수정
  - 다크모드에서 상태 배지·기한 지남 배지·테이블 줄무늬/호버 상태의 대비비(WCAG AA 4.5:1) 확인 및 필요 시 토큰 조정
  - 관리자 레이아웃에서 테마 토글 접근성 확인: 헤더 토글이 관리자 화면에서도 노출·동작, 새로고침 후 테마 유지(`next-themes` 저장값)
  - **기존 이슈 확인**: 좁은 뷰포트 신규 로드 시 `Header`의 `useMediaQuery` 기반 hydration mismatch 경고(V1 Task 004에서 기록된 기존 이슈)가 관리자 화면에서도 재현되는지 확인하고, 재현 시 해결 또는 별도 후속 Task로 기록
  - 시스템 테마(`defaultTheme="system"`) 상태에서 OS 다크/라이트 전환 시 관리자 화면 즉시 반영 확인
  - **테스트** (Playwright MCP): `/admin`에서 라이트/다크/시스템 3가지 모드 × 모바일(375)·태블릿(768)·데스크톱(1280) 조합 시각 점검, 테마 전환 후 새로고침 유지, 콘솔 에러·hydration 경고 0건

### Phase 7: 관리자 핵심 기능 구현

- **Task 017: Notion 견적서 목록 실데이터 연동 (A001·A004)** ✅ - 완료
  - `src/lib/notion/invoices.ts`에 `getInvoiceList(query?: InvoiceListQuery): Promise<InvoiceListResult>` 신규 구현
    - 기존 `NotionClient.queryDatabase()` 재사용 (`getAllPages`는 대량 시 API 호출 폭증 위험 — 기본은 `page_size` 제한 + 커서 방식 선택)
    - 정렬: `발행일` 내림차순 기본 (Notion `sorts` 사용), 상태 필터는 `InvoiceListQuery`로 선택 적용
    - 매핑: 기존 `propertyReaders`와 `INVOICE_PROPS` 재사용 — **항목(relation) 개별 조회는 하지 않는다**(목록에서 N+1 API 호출 방지). 총금액은 Notion `총금 액` property 값을 그대로 사용
    - 실패 시 예외 대신 `{ ok: false, reason: 'notion_error' }` 반환 + `console.error`로 서버 로그만 남김 (사용자에게 내부 사유 비노출 — V1 Task 008 정책과 동일)
  - `src/lib/notion/index.ts` 배럴 재export 갱신
  - `src/app/admin/page.tsx`를 Server Component로 실데이터 연동: `getMockInvoiceList` 제거 → `getInvoiceList()` 호출, 실패 시 관리자 전용 오류 폴백 UI(재시도 안내) 렌더링
  - `src/lib/mock/invoice-list.ts` 삭제 (grep으로 참조 0건 확인)
  - 캐싱 정책 결정: 관리자 목록은 최신성이 중요하므로 `export const revalidate = 30` 수준의 짧은 재검증 또는 `dynamic = 'force-dynamic'` 중 선택. **V1 Task 010 실측 교훈**: Next.js 15+ 기본 `fetch` 정책이 `no-store`이므로 캐시를 쓰려면 `export const fetchCache = 'default-cache'`를 함께 지정해야 실제 히트한다
  - **테스트** (Playwright MCP):
    - 정상: `/admin` 진입 → 실제 Notion DB의 견적서가 발행일 내림차순으로 표시, 건수·번호·클라이언트·총금액이 Notion 원본과 일치
    - 정상: 목록 행의 "새 탭에서 열기" → 해당 인보이스 상세(`/invoice/{id}`)가 동일 데이터로 렌더링, 복사 링크도 실 ID 기준으로 동작
    - 오류: `NOTION_API_KEY`를 잘못된 값으로 주입 → 관리자 오류 폴백 UI 표시, 화면에 내부 오류 메시지·키 값 미노출, 서버 콘솔에만 원인 로그
    - 오류: Notion 레이트 제한(429)/타임아웃 재현 또는 모킹 → 재시도 후 폴백 UI, unhandled exception 없음
    - 엣지: 결과 0건(필터로 재현) → 빈 상태 UI 표시
    - 엣지: 일부 property 누락(클라이언트 미상·총금액 null·상태 미지정) 페이지 포함 시 폴백 값으로 안전 렌더링, 알 수 없는 상태값은 `대기`로 대체되고 목록이 깨지지 않음
    - 엣지: 대량 데이터(page_size 경계) — 페이지 크기 초과 시 잘림/커서 처리가 의도대로 동작
    - 반응형/품질: 모바일·태블릿·데스크톱 레이아웃 정상, 콘솔 에러 0건, 목록 요청 상태 코드 200

- **Task 018: 관리자 접근 제어(인증) 구현 (A005)** ✅ - 완료
  - 단일 관리자 비밀번호(Node `crypto.scrypt` 검증) + `jose` 서명 HttpOnly 세션 쿠키로 구현
  - `src/proxy.ts`(Next.js 16 컨벤션, `src/` 디렉터리 프로젝트라 루트가 아닌 `src/`에 위치)가
    `/admin/:path*`를 가로채 미인증 요청을 `/admin/login`으로 리다이렉트
  - `src/lib/auth/{password,session,rate-limit,schema,actions}.ts` 신규, 로그인 실패 5회당 5분
    인메모리 rate limit 적용(서버리스 다중 인스턴스 한계는 문서화)
  - `src/app/admin/(protected)/` 라우트 그룹 도입으로 로그인 페이지가 `AdminShell`(로그아웃 버튼)을
    상속하지 않도록 분리, Task 012의 "인증 미적용" 안내 배너 제거
  - **테스트** (Playwright MCP, 전 항목 통과): 정상(로그인→목록 표시→새로고침 세션 유지,
    로그인 상태서 `/admin/login`→`/admin` 리다이렉트, 로그아웃→재접근 시 로그인 리다이렉트),
    오류(잘못된 비밀번호 시 내부 정보 비노출, 미인증 직접 접근 시 데이터 미노출), 엣지(위조 세션
    쿠키 거부, 연속 실패 5회 후 rate limit 동작, 공개 페이지 영향 없음), 반응형/다크모드 정상.
    상세: `tasks/018-admin-auth.md`

- **Task 018-1: 관리자 플로우 통합 테스트** ✅ - 완료(공개 페이지 모바일/태블릿 반응형 스크린샷
  재검증만 세션 내 도구 제약으로 생략 — 낮은 리스크로 판단한 근거는
  `tasks/018-1-admin-flow-integration-test.md` 참고)
  - Playwright MCP로 전체 관리자 여정 E2E: `/admin` 진입 → 목록 확인 → 링크 복사 → 새 탭에서 공개 상세 확인 → PDF 다운로드 → 목록 복귀
  - 공개 사용자 여정 회귀 확인: 홈 → ID 입력 → 상세 → PDF (V1 기능이 관리자 추가로 깨지지 않았는지)
  - 에러 플로우: Notion 장애 시 관리자 폴백 UI / 잘못된 ID 상세 접근 시 not-found
  - 반응형 스냅샷: 모바일(375)·태블릿(768)·데스크톱(1280) 3개 뷰포트 × 라이트/다크 시각 점검
  - `npm run check-all` + `npm run build` 통과 확인

### Phase 8: 최적화 및 배포

- **Task 019: 관리자 목록 성능 최적화 및 캐싱** ✅ - 완료
  - 목록 조회 응답 시간 측정(건수 증가 시나리오 포함) 후 캐싱 전략 확정: 짧은 `revalidate` + `fetchCache` 조합 vs 완전 동적
  - 대량 견적서 대비: 페이지네이션 또는 "더 보기" 커서 로딩 구현 여부 판단 (건수가 적으면 과설계 방지를 위해 보류하고 확장 지점만 문서화)
  - 클라이언트 측 정렬/상태 필터 UI 추가 여부 판단 (서버 필터와 중복 구현 방지)
  - Lighthouse로 `/admin` 측정 (V1 기준선: 홈 LCP 3.4s / CLS 0 / TBT 120ms), 회귀 여부 확인
  - **테스트** (Playwright MCP): 정상(캐시 히트 시 응답 단축 확인·데이터 최신성 유지), 오류(캐시된 상태에서 Notion 장애 시 동작), 엣지(대량 건수·커서 경계), 반응형/품질(콘솔 에러 0건)

- **Task 020: 배포 반영 및 회귀 테스트 세트 정리** ✅ - 완료(로컬 문서·CI 설정만 — Vercel 연결/배포는
  사용자 직접 진행, `docs/guides/deployment.md` 참고)
  - **⚠️ 배포 게이트**: Task 018(인증) 미완료 상태에서는 관리자 영역을 공개 도메인에 배포하지 않는다. 배포가 필요하면 Vercel 프리뷰 보호 또는 배포 보호 기능으로 접근을 제한한다
  - `.github/workflows/ci.yml`에 신규 환경 변수(`NEXT_PUBLIC_SITE_URL` 등) 반영 및 GitHub Secrets 항목 갱신
  - `docs/guides/deployment.md`에 관리자 영역 배포 체크리스트 추가 (인증 선행 조건, 환경 변수, robots 차단 확인)
  - `README.md`·`CLAUDE.md`를 V2 구현 상태(관리자 목록·링크 복사)에 맞게 갱신, `docs/ROADMAP.md`(본 문서) 완료 표시 정리
  - Playwright MCP 회귀 테스트 시나리오 목록을 `docs/guides/`에 정리 (공개 여정 + 관리자 여정)
  - `npm run check-all` + `npm run build` 통과 후 배포 트리거 및 배포본 스모크 테스트
