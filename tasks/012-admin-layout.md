# Task 012: 관리자 라우트 그룹 및 레이아웃 골격 구축

> Phase 5 · 관리자 영역 골격 구축

## 목표

`src/app/admin/` 라우트를 신설하고, 관리자 전용 레이아웃 골격(`admin-shell`, `admin-page-header`)을
구축한다. 기존 루트 레이아웃(`ThemeProvider`·`Header`·`Footer`)을 그대로 상속해 다크모드/테마 토글이
자동 승계되도록 하고, 인증(Task 018)이 아직 없는 상태이므로 검색 노출 차단(`robots`)과 "인증 미적용"
안내 배너로 임시 완화한다.

## 관련 파일

| 파일                                         | 구분 | 내용                                          |
| -------------------------------------------- | ---- | --------------------------------------------- |
| `src/app/admin/layout.tsx`                   | 신규 | 관리자 레이아웃, robots 메타데이터, 안내 배너 |
| `src/app/admin/page.tsx`                     | 신규 | 견적서 목록 페이지(빈 껍데기)                 |
| `src/app/admin/loading.tsx`                  | 신규 | 로딩 UI(스켈레톤)                             |
| `src/app/admin/not-found.tsx`                | 신규 | 관리자 영역 404                               |
| `src/components/admin/admin-shell.tsx`       | 신규 | 상단 서브바 + 본문 영역 레이아웃              |
| `src/components/admin/admin-page-header.tsx` | 신규 | 제목·설명·액션 슬롯                           |
| `src/components/admin/admin-dev-banner.tsx`  | 신규 | "인증 미적용" 개발용 안내 배너                |
| `src/app/admin/[...catchAll]/page.tsx`       | 신규 | 미매치 `/admin/*` 경로에서 `notFound()` 호출  |
| `docs/guides/project-structure.md`           | 수정 | 관리자 영역 구조 항목 추가                    |

## 설계 결정 및 근거

### 1. 사이드바 대신 상단 서브바 선택

관리자 기능이 "목록 + 링크 복사"뿐이라 좌측 사이드바를 둘 만큼 메뉴가 많지 않다. `admin-shell`은
상단에 얇은 서브바(영역 타이틀 + 향후 확장 자리)만 두고, 본문은 기존 `Container`(`max-w-4xl`)보다
넓은 `max-w-6xl`을 써서 테이블이 답답하지 않게 한다. 좌측 네비게이션이 필요해지면(Task 019 이후) 이
컴포넌트를 확장한다.

### 2. 공개 헤더 `main-nav`에 관리자 링크를 추가하지 않음

ROADMAP 결정대로 인증이 없는 상태에서 공개 헤더에 `/admin` 링크를 노출하면 발견 가능성이 높아져
보안 위험이 커진다. `main-nav.tsx`/`mobile-nav.tsx`는 이번 Task에서 수정하지 않는다(URL 직접 접근만
허용).

### 3. `robots` 차단 + 개발용 배너는 완화책일 뿐 접근 제어가 아님

`admin/layout.tsx`에 `export const metadata = { robots: { index: false, follow: false } }`를 적용해
검색엔진 노출을 막는다. 동시에 `admin-dev-banner.tsx`로 "인증이 적용되지 않은 개발용 화면"임을
화면 상단에 명시한다. 두 조치 모두 Task 018(인증) 완료 시 배너는 제거하고 robots 차단은 유지 검토한다.

### 4. 루트 레이아웃 상속 방식

Next.js App Router 규칙상 `src/app/admin/layout.tsx`는 자동으로 `src/app/layout.tsx`(ThemeProvider·
Header·Footer 포함) 안쪽에 중첩된다. 별도로 `<html>`/`<body>`를 감쌀 필요가 없고, `admin/layout.tsx`는
`admin-shell`만 반환하면 테마·헤더·푸터가 그대로 승계된다.

### 5. `/admin/*` 미매치 경로를 위한 catch-all + `notFound()` (구현 중 발견)

Next.js는 완전히 매치되지 않는 URL(어떤 `page.tsx`도 없는 경로)에서는 세그먼트별 `not-found.tsx`가 아니라
**루트 `not-found.tsx`로 폴백**한다(세그먼트 `not-found.tsx`는 그 세그먼트 안에서 `notFound()`가 명시
호출되거나 클라이언트 내비게이션으로 진입했을 때만 사용됨). `/admin/존재하지-않는-경로`가 관리자 전용
404 대신 기본 Next.js 404를 보여주는 문제를 Playwright 테스트 중 발견했다. `src/app/admin/[...catchAll]/
page.tsx`(catch-all 라우트)에서 `notFound()`를 명시 호출해 가장 가까운 `admin/not-found.tsx` 경계를
타도록 우회했다 — Next.js 커뮤니티에서 널리 쓰이는 표준 패턴이다.

## 구현 단계

1. [x] `src/components/admin/admin-dev-banner.tsx` 작성 — "인증이 적용되지 않은 관리자 화면입니다"
       경고 배너 (destructive 톤, 상시 노출)
2. [x] `src/components/admin/admin-page-header.tsx` 작성 — 제목·설명·우측 액션 슬롯을 갖는 헤더
3. [x] `src/components/admin/admin-shell.tsx` 작성 — 상단 서브바(영역 타이틀) + `max-w-6xl` 본문 래퍼
4. [x] `src/app/admin/layout.tsx` 작성 — `robots` 메타데이터 + `admin-dev-banner` + `admin-shell`로
       children 감싸기
5. [x] `src/app/admin/page.tsx` 작성 — `admin-page-header`(제목: "견적서 목록")만 있는 빈 껍데기(Task
       014에서 실제 목록 UI 채움)
6. [x] `src/app/admin/loading.tsx` 작성 — 목록 스켈레톤(간단한 테이블 형태 `Skeleton` 조합)
7. [x] `src/app/admin/not-found.tsx` 작성 — 관리자 영역 전용 404(기존 `invoice/[id]/not-found.tsx`
       패턴 재사용, 홈 대신 `/admin`으로 복귀 링크)
8. [x] `src/app/admin/[...catchAll]/page.tsx` 작성 — 미매치 `/admin/*` 경로에서 `notFound()` 호출(위
       "설계 결정 5" 참고, Playwright 테스트 중 발견한 문제 수정)
9. [x] `docs/guides/project-structure.md`에 `src/app/admin/`, `src/components/admin/` 구조 설명 추가
10. [x] `npm run check-all` 통과 확인

## 수락 기준 (완료 조건)

- [x] `/admin` 접속 시 레이아웃이 정상 렌더링되고 헤더/푸터/테마 토글이 승계됨
- [x] 화면 상단에 "인증 미적용" 안내 배너가 노출됨
- [x] `admin/layout.tsx`에 `robots: { index: false, follow: false }`가 적용됨
- [x] 공개 헤더(`main-nav`/`mobile-nav`)에 관리자 링크가 추가되지 않음(직접 URL 접근만 가능)
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run check-all` 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (스모크)

- [x] `/admin` 진입 시 레이아웃(서브바·페이지 헤더·배너) 정상 렌더링 — 스냅샷으로 배너·제목·설명 확인
- [x] 헤더의 테마 토글 클릭 시 관리자 화면도 다크모드로 정상 전환 — 라이트→다크 전환 스크린샷으로 확인
      (배경·텍스트·배지 모두 시맨틱 토큰 기반으로 전환됨)

### 오류 처리 / 엣지 케이스

- [x] `/admin/존재하지-않는-경로` 접근 시 관리자 전용 404 표시 — 최초 시도 시 루트 기본 404로
      폴백되는 문제를 발견해 catch-all 라우트로 수정(위 "설계 결정 5"), 재검증 통과("페이지를 찾을 수
      없습니다" + "견적서 목록으로 돌아가기" 링크 정상 동작 확인)
- [x] 공개 헤더 네비게이션에 관리자 메뉴가 보이지 않음(홈 메뉴만 존재) 확인 — 스냅샷상 `navigation`에
      "홈" 링크 1개만 존재

### 반응형 & 품질

- [x] 모바일(375)·태블릿(768)·데스크톱(1280) 뷰포트에서 레이아웃 정상 — 스크린샷 3종 확인, 375/768에서
      햄버거 메뉴로 전환(기존 Header `useMediaQuery` 동작 그대로 승계)
- [x] 콘솔 에러 0건 — 404 경로 테스트 시 브라우저가 자체적으로 남기는 "Failed to load resource: 404"
      리소스 로그 1건만 있었고(모든 404 페이지에서 나타나는 정상 동작), 애플리케이션 예외는 없음

## 결과 요약

`src/app/admin/`(layout·page·loading·not-found·catch-all)과 `src/components/admin/`(admin-shell·
admin-page-header·admin-dev-banner)을 신설해 관리자 라우트 골격을 구축했다. 루트 레이아웃의
ThemeProvider·Header·Footer를 그대로 상속해 테마 토글이 자동 승계되며, `robots: noindex,nofollow` +
"인증 미적용" 안내 배너로 Task 018 전까지의 보안 위험을 완화했다. 공개 헤더(`main-nav`/`mobile-nav`)는
수정하지 않아 URL 직접 접근만 가능하다.

Playwright MCP 테스트 중 `/admin/*`의 미매치 경로가 관리자 전용 404 대신 Next.js 기본 404로 폴백되는
문제를 발견해, catch-all 라우트(`[...catchAll]/page.tsx`)에서 `notFound()`를 명시 호출하는 방식으로
수정했다(설계 결정 5). 수정 후 라이트/다크 모드, 모바일/태블릿/데스크톱 3개 뷰포트, 공개 헤더 회귀까지
전 항목 테스트 통과했으며 `npm run check-all`(typecheck+lint+format)도 통과했다.
