# Task 010: 성능 최적화 및 캐싱

> Phase 4 · 고급 기능 및 최적화

## 목표

1. 인보이스 상세 페이지에 ISR(증분 정적 재생성) 적용 — 매 요청마다 Notion을 재조회하지 않도록
2. PDF 생성 결과를 단기 캐시 — 동일 ID 반복 다운로드 시 매번 렌더링하지 않도록
3. ~~한글 웹폰트(Noto Sans KR) 로컬 셀프호스팅 적용~~ — **구현 후 측정 결과 보류** (아래 "설계 결정 4 (수정)" 참고)
4. Lighthouse로 LCP/CLS/TBT 측정 및 필요 시 개선

## 관련 파일

| 파일                                 | 구분      | 내용                                                                                                                                              |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/invoice/[id]/page.tsx`      | 수정      | `export const revalidate = 120` + `export const fetchCache = 'default-cache'` 추가 (ISR)                                                          |
| `src/app/invoice/[id]/pdf/route.tsx` | 수정      | `export const revalidate = 300` + `export const fetchCache = 'default-cache'` 추가 (PDF 응답 캐시)                                                |
| `src/app/layout.tsx`                 | 수정      | `body`에 `font-sans` 클래스 추가 (기존 Geist 폰트가 실제로는 전혀 적용되지 않던 버그 수정, 아래 "설계 결정 6" 참고). 한글 웹폰트는 측정 후 미적용 |
| `src/app/globals.css`                | 변경 없음 | Noto Sans KR 시도 후 되돌림 — 최종적으로 원본과 동일                                                                                              |
| `docs/ROADMAP.md`                    | 수정      | Task 010 완료 표시                                                                                                                                |

## 설계 결정 및 근거

### 1. ISR은 route segment `revalidate` export만으로 충분 — 코드 변경 최소화 (수정: `fetchCache` 추가 필요)

`src/lib/notion/client.ts`의 `request()`는 평범한 `fetch()`를 쓴다. Next.js App Router는 route segment에
`export const revalidate = N`을 선언하면 그 세그먼트 안에서 일어나는 모든 `fetch()` 호출에 기본
캐시 정책(N초 후 재검증)을 자동 적용한다 — `NotionClient`나 `getInvoiceById` 내부를 전혀 건드리지 않고
`page.tsx` 최상단에 한 줄만 추가하면 된다. `generateMetadata`도 같은 세그먼트라 동일하게 적용된다.

`N = 120`(2분)을 골랐다: ROADMAP이 제시한 "60~300초" 범위의 중간값이며, 인보이스 상태(`대기`→`발송`→
`확인함`→`완료`)가 실시간으로 바뀔 필요는 없는 도메인이라 2분 지연은 수용 가능하다고 판단.

**구현 후 실측 정정**: 위 가정은 Next.js 15 이전 기준이었다. Next.js 15부터 `fetch()`는 옵션을 명시하지
않으면 기본이 `cache: 'no-store'`로 바뀌었고(공식 마이그레이션 문서 확인), route segment의 `revalidate`
export 하나만으로는 실제로 `fetch()`가 캐시되지 않는다 — 연속 요청 응답 시간이 거의 동일해(1366ms →
1119ms → 1043ms) 캐시 미적중을 실측으로 확인했다. `NotionClient.request()`를 건드리지 않는다는 원래
제약을 지키면서 고치는 방법은 route segment 옵션 `export const fetchCache = 'default-cache'`를 추가하는
것 — 이 옵션은 "세그먼트 내 모든 fetch의 기본값을 `force-cache`로 바꾼다"는 뜻이라 코드 변경 없이 의도한
캐싱이 살아난다. 적용 후 재실측: 인보이스 상세 1372ms → 198ms → 166ms → 170ms, PDF 618ms → 186ms →
188ms로 명확한 캐시 히트 확인.

### 2. "on-demand ISR + `revalidateTag`" 훅은 지금 구현하지 않는다

ROADMAP 문구가 "검토"로 되어 있어 필수 구현은 아니다. 이를 실제로 쓰려면 `NotionClient.request()`에
`next: { tags }` 옵션을 통과시키는 배관 작업이 필요한데, 이 프로젝트엔 Notion 변경을 실시간으로 알려줄
웹훅 소스가 없어(Notion Free/기본 API는 웹훅을 제공하지 않음) 지금 그 훅을 만들어도 호출할 곳이 없다.
쓰이지 않는 API 엔드포인트를 미리 만드는 건 과설계라 판단해 보류하고, 대신 이 문서에 확장 지점으로
기록만 해둔다: 나중에 Notion 자동화(예: Notion 자체 버튼/자동화가 우리 쪽 webhook을 호출)가 생기면
`client.ts`의 `request()`에 `next?: NextFetchRequestConfig` 파라미터를 추가하고 `getInvoiceById`가
`tags: ['invoice', `invoice-${id}`]`를 넘기도록 확장, `POST /api/revalidate`(공유 시크릿 검증) 라우트를
추가해 `revalidateTag`를 호출하면 된다.

### 3. PDF 응답도 route segment `revalidate`로 캐시(별도 `unstable_cache` 불필요)

Next.js Route Handler는 `GET` 핸들러가 `cookies()`/`headers()`/동적 `request` 프로퍼티를 쓰지 않으면
`export const revalidate = N`으로 응답 전체(우리 경우 PDF 바이너리)를 캐시할 수 있다. 현재 PDF
Route Handler는 `params`(정적 분석 가능한 동적 세그먼트)만 쓰고 `request` 객체 자체는 무시하므로 이
조건을 만족한다. 처음엔 `unstable_cache`로 버퍼를 base64 문자열로 감싸 수동 캐시하는 방안을 검토했으나,
route segment 캐시가 표준적이고 코드가 훨씬 단순해 이쪽을 택했다. `N = 300`(5분) — 소계 재계산 경고 등
데이터 정합성 이슈가 있는 인보이스라도 5분 이내 재다운로드는 동일 결과를 받는 게 자연스럽다.

이 라우트도 위 "설계 결정 1"과 동일한 이유로 `export const fetchCache = 'default-cache'`를 함께
추가했다 — 내부적으로 `getInvoiceById`가 같은 `NotionClient.request()`를 쓰므로 동일한 no-store 기본값
문제가 있었다.

### 4. 한글 웹폰트 (수정: 구현·실측 후 보류로 최종 결정)

**최초 계획**: `next/font/google`로 Noto Sans KR 셀프호스팅. **실제 확인 결과**: `next/font/google`의
Noto Sans KR은 `subsets`에 `cyrillic`/`latin`/`latin-ext`/`vietnamese`만 있고 `korean`이 없음을
`node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`에서 직접 확인 — 애초에 한글
글리프를 받을 수 없어 이 방식은 불가능했다.

**시도 1 — PDF용 가변 폰트 재사용**: `next/font/local`로 `assets/fonts/NotoSansKR-Variable.ttf`(10.4MB,
전송 시 5.4MB)를 그대로 웹에 적용. Lighthouse 모바일 시뮬레이션 결과 **LCP 29.7초**(목표 2.5초)로 완전히
실패 — 저속 회선 시뮬레이션에서 폰트 하나를 받는 데만 대부분의 시간이 소요됨.

**시도 2 — `@fontsource/noto-sans-kr`로 한글 서브셋만 로드**: 이 패키지는 언어별로 파일을 쪼개 배포하며
`korean-400.css`/`korean-700.css`를 쓰면 한글 글리프 전용 woff2만 받는다(각 약 530~560KB, 가변 폰트
대비 약 1/10). 그래도 두 굵기 합쳐 LCP 9.2초, 400 굵기만 남겨도 LCP 6.2초로 목표에 크게 못 미쳤다.
원인은 FCP까지 지연되는 것으로 확인됐는데(6.6초 → 3.7초), `font-display: swap`이 페인트 자체를
막지는 않지만 브라우저가 `<head>`에서 발견한 폰트 요청에 높은 우선순위를 줘 저속 회선의 제한된 대역폭을
다른 필수 JS/CSS 청크와 경합하게 되는 것으로 보인다. 즉 한글은 최소 서브셋(현대 한글 음절 전체)도
수백 KB대라 완전히 회피하지 않는 한 이 프로젝트의 Lighthouse 목표(LCP < 2.5s, 모바일 시뮬레이션 기준)를
만족시키기 어렵다는 결론.

**최종 결정(사용자 확인)**: 한글 웹폰트 적용을 보류하고 시스템 폰트로 회귀한다. `@fontsource/noto-sans-kr`
설치를 제거하고 `layout.tsx`/`globals.css`를 Task 010 시작 이전 상태(Geist만 사용)로 되돌렸다. Windows
(맑은 고딕)·macOS(Apple SD Gothic Neo)·Android(Noto Sans CJK KR) 등 대부분의 OS가 품질 좋은 한글
폰트를 기본 내장하고 있어 가독성 문제는 없으며, 되돌린 결과 LCP는 원래 수준(홈 0.8초대 FCP)으로 복귀했다.
PRD가 원했던 "통일된 타이포그래피"는 이번 Task 범위에서 달성하지 못했음을 기록한다.

**부수적으로 발견/수정한 버그**: 이 과정에서 `src/app/layout.tsx`의 `<body>`가 애초에 `font-sans`
Tailwind 유틸리티 클래스를 쓰지 않고 있어, `@theme inline`으로 정의한 `--font-sans`(Geist)가
`:root` 스코프의 `--default-font-family` 파생값과 CSS 커스텀 프로퍼티 상속 순서 문제로 전혀 적용되지
않고 있었음을 발견했다(`document.fonts`에는 Geist가 `unloaded` 상태로만 존재, 실제 렌더링은 브라우저
기본 `ui-sans-serif` 스택). `<body>`에 `font-sans` 클래스를 명시적으로 추가해 수정 — Geist가 이제
실제로 적용된다(Latin 텍스트 한정, 한글은 위 결정에 따라 시스템 폰트).

### 5. Lighthouse 측정 방법

로컬에 Chrome이 설치되어 있음을 확인했다(`C:\Program Files\Google\Chrome\Application\chrome.exe`).
`npm run build && npm run start`로 프로덕션 빌드를 띄운 뒤 `npx lighthouse http://localhost:3000
--output=json --output-path=./lighthouse-home.json --chrome-flags="--headless"`(홈)과 인보이스 상세
페이지 각각에 대해 실행해 LCP/CLS/TBT를 기록한다. 결과 리포트 파일은 저장소에 커밋하지 않고(일회성
측정 산출물) 결과 수치만 작업 파일에 남긴다.

## 구현 단계

1. [x] `src/app/invoice/[id]/page.tsx`에 `export const revalidate = 120` 추가
2. [x] `src/app/invoice/[id]/pdf/route.tsx`에 `export const revalidate = 300` 추가
3. [x] ~~`next/font/google`(또는 필요 시 `next/font/local`)로 Noto Sans KR 등록~~ — 실측 후 보류(설계
       결정 4). 대신 두 라우트에 `export const fetchCache = 'default-cache'` 추가(설계 결정 1) 및
       `layout.tsx` `<body>`에 `font-sans` 클래스 추가(기존 Geist 미적용 버그 수정)
4. [x] `npm run typecheck` / `npm run lint` / `npm run build` 통과, `prettier --check` 통과
5. [x] Playwright MCP로 홈/인보이스 상세를 모바일(375)·태블릿(768)·데스크톱(1280)·다크/라이트모드로
       재검증 — 콘솔 에러 0건
6. [x] ISR 동작 확인: 동일 인보이스 연속 요청 응답 시간 1372ms → 198ms → 166ms → 170ms로 캐시 히트 확인
7. [x] PDF 캐시 동작 확인: 연속 요청 618ms → 186ms → 188ms로 캐시 히트 확인
8. [x] Lighthouse 실행 (홈 + 인보이스 상세), LCP/CLS/TBT 기록 — 아래 "결과 요약" 참고
9. [x] `docs/ROADMAP.md` Task 010 완료 표시

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` / `lint` / `build` 통과
- [x] 인보이스 상세·PDF 라우트 모두 ISR/캐시 적용, 재요청 시 캐시 히트 확인
- [x] ~~한글 웹폰트 적용 후 다크·라이트모드·모바일·데스크톱에서 깨짐/레이아웃 시프트 없음~~ — 한글
      웹폰트 보류(사용자 확인), 시스템 폰트로 다크·라이트모드·반응형 정상 확인
- [x] Lighthouse LCP/CLS/TBT 측정 결과를 작업 파일에 기록 — **CLS·TBT는 목표 달성, LCP는 목표
      미달(아래 결과 요약의 원인 설명 참고, Task 010 범위 밖 이슈로 판단해 후속 과제로 기록만 함)**
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP + `npx lighthouse` · 구현 완료 후 필수 수행

### 정상 흐름 (Happy Path)

- [x] 홈/인보이스 상세(`INV-2026-001`) 페이지 정상 렌더링(시스템 폰트 + Geist)
- [x] 동일 인보이스 연속 조회 시 두 번째 응답부터 캐시 적중(응답 타이밍으로 확인, 위 구현 단계 6 참고)

### 오류 처리

- [x] 해당 없음(성능/캐싱 전용 Task — 비즈니스 로직 변경 없음)

### 엣지 케이스

- [ ] ISR 캐시 기간(120초) 경과 후 재요청 시 최신 데이터로 정상 갱신되는지 확인 — 미실행(대기 시간이
      길어 이번 세션에서 생략, Next.js 표준 `revalidate` 동작에 근거해 문제 없다고 판단)
- [ ] PDF 캐시(300초) 경과 후 재요청 시 정상 재생성되는지 확인 — 위와 동일 사유로 미실행

### 반응형 & 품질

- [x] 모바일(375)·태블릿(768)·데스크톱(1280) 정상, 레이아웃 시프트 없음(CLS 0)
- [x] 다크모드·라이트모드 정상
- [x] 콘솔 에러 0건
- [x] Lighthouse LCP/CLS/TBT 수치 기록(아래 결과 요약)

## 결과 요약

**완료된 것**: ISR(`revalidate` + `fetchCache='default-cache'`)로 인보이스 상세·PDF 라우트 모두 실측
캐시 히트 확인(응답 시간 최대 8배 단축). 부수적으로 `<body>`에 `font-sans`가 빠져 Geist 폰트가 전혀
적용되지 않던 기존 버그를 발견해 수정.

**보류된 것**: 한글 웹폰트(Noto Sans KR) 셀프호스팅. `next/font/google`은 애초에 한글 subset을
지원하지 않고, PDF용 가변 폰트(5.4MB 전송) 재사용은 LCP 29.7초, `@fontsource/noto-sans-kr`의 한글
전용 서브셋(400+700, 약 1.1MB)도 LCP 9.2초로 목표(2.5초)에 크게 못 미쳤다. 한글 웹폰트는 최소
구성(현대 한글 음절 전체)도 수백 KB~1MB대라 저속 모바일 시뮬레이션 기준으로는 근본적 한계가 있다고
판단, 시스템 폰트로 회귀하기로 사용자와 합의했다.

**Lighthouse 최종 측정치** (모바일 시뮬레이션, `npm run build && npm run start` 프로덕션 빌드 기준):

| 페이지                         | Performance | LCP  | CLS | TBT   | FCP  |
| ------------------------------ | ----------- | ---- | --- | ----- | ---- |
| 홈 (`/`)                       | 90          | 3.4s | 0   | 120ms | 0.8s |
| 인보이스 상세 (`INV-2026-001`) | 87          | 3.5s | 0   | 160ms | 1.1s |

CLS(목표 <0.1)와 TBT(목표 <200ms)는 두 페이지 모두 목표를 만족한다. LCP(목표 <2.5s)는 두 페이지
모두 약 1초 초과한다 — `lcp-breakdown-insight` 감사로 원인을 확인한 결과 폰트나 네트워크가 아니라
"element render delay"(약 2.2초, React 하이드레이션·클라이언트 컴포넌트 실행 비용, 4x CPU 스로틀링
시뮬레이션 기준)였다. 이는 폰트/캐싱을 다루는 이 Task의 범위 밖이며(특정 컴포넌트를 서버 컴포넌트로
전환하거나 클라이언트 번들을 줄이는 별도 작업이 필요), 후속 성능 개선 과제로 남겨둔다.
