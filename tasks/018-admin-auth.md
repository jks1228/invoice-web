# Task 018: 관리자 접근 제어(인증) 구현 (A005)

> Phase 7 · 관리자 핵심 기능 구현

## 목표

`/admin`을 단일 관리자 비밀번호 + 서명된 세션 쿠키로 보호한다. 미인증 사용자는 목록 데이터를 전혀
보지 못하고 `/admin/login`으로 리다이렉트되어야 하며, 로그인 실패는 무차별 대입 방어(rate limit)가
동작해야 한다. 완료 시 `docs/guides/deployment.md`의 "인증 완료 전 배포 금지" 게이트를 해제한다.

## 관련 파일

| 파일                                          | 구분 | 내용                                                            |
| --------------------------------------------- | ---- | --------------------------------------------------------------- |
| `src/lib/auth/password.ts`                    | 신규 | scrypt 비밀번호 검증(`verifyPassword`), Node 전용               |
| `src/lib/auth/session.ts`                     | 신규 | jose 세션 JWT 암복호화 + 쿠키(`createSession`/`destroySession`) |
| `src/lib/auth/rate-limit.ts`                  | 신규 | 인메모리 로그인 실패 rate limit                                 |
| `src/lib/auth/schema.ts`                      | 신규 | 로그인 폼 zod 스키마                                            |
| `src/lib/auth/actions.ts`                     | 신규 | `loginAction`/`logoutAction` Server Actions                     |
| `src/components/admin/login-form.tsx`         | 신규 | RHF+zodResolver 로그인 폼                                       |
| `src/app/admin/login/page.tsx`                | 신규 | 로그인 페이지(세션 있으면 `/admin`으로 redirect)                |
| `src/app/admin/(protected)/layout.tsx`        | 신규 | `AdminShell` 래핑(로그인 페이지와 분리)                         |
| `src/app/admin/(protected)/page.tsx`          | 신규 | 기존 `admin/page.tsx` 이동(로직 변경 없음)                      |
| `src/app/admin/(protected)/loading.tsx`       | 신규 | 기존 `admin/loading.tsx` 이동                                   |
| `src/proxy.ts`                                | 신규 | `/admin/:path*` 세션 검증 및 리다이렉트                         |
| `src/lib/env.ts`                              | 수정 | `ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET` 스키마 추가        |
| `src/app/admin/layout.tsx`                    | 수정 | `AdminShell` 제거, robots 메타데이터만 유지(패스스루)           |
| `src/app/admin/page.tsx`, `admin/loading.tsx` | 삭제 | `(protected)/`로 이동                                           |
| `src/components/admin/admin-shell.tsx`        | 수정 | 안내 배너 제거, 로그아웃 버튼 추가                              |
| `src/components/admin/admin-dev-banner.tsx`   | 삭제 | Task 012 "인증 미적용" 안내 배너 제거                           |
| `.env.example`                                | 수정 | 신규 env 안내 + 생성 one-liner                                  |
| `.github/workflows/ci.yml`                    | 수정 | CI env에 신규 시크릿 2개 추가                                   |
| `docs/guides/deployment.md`                   | 수정 | 배포 게이트 문구를 "인증 적용됨"으로 교체                       |
| `docs/guides/project-structure.md`            | 수정 | `admin/` 트리·`lib/auth/` 반영                                  |
| `package.json`                                | 수정 | `jose` 의존성 추가                                              |

## 설계 결정 및 근거

### 1. 비밀번호 해싱: Node 내장 `crypto.scrypt`, bcrypt류 미도입

`crypto.scryptSync` + `crypto.timingSafeEqual`만으로 충분히 안전한 검증이 가능해 bcrypt/bcryptjs 등
새 의존성을 추가하지 않았다(과설계 방지, 네이티브 바인딩 없음). 해시는 `salt:hash`(각각 hex) 형식으로
`ADMIN_PASSWORD_HASH`에 저장하고, 생성은 앱 코드가 아니라 `.env.example`의 `node -e` one-liner로
안내한다(해시 생성 함수를 앱에 export하지 않아 공격 표면을 줄임).

**주의(실제로 겪은 버그)**: 최초 구현 시 `.env.example` one-liner가 `scryptSync(password, saltHex, 64)`처럼
salt를 **hex 문자열 그대로** 넘겨 UTF-8 바이트로 해싱했는데, `verifyPassword`는 `Buffer.from(saltHex, 'hex')`로
**디코딩한 raw 바이트**를 사용해 서로 다른 salt로 해시가 계산되는 불일치가 있었다(로그인이 항상 실패).
Playwright 테스트 중 발견해 `s.toString('hex')` 이전에 `randomBytes(16)` **Buffer 자체**를 salt로
`scryptSync`에 넘기도록 one-liner를 수정해 해결했다(`.env.example`/`deployment.md` 반영 완료).

### 2. 세션: jose + HttpOnly 서명 쿠키, 7일 고정 만료

Next.js 공식 인증 가이드가 권장하는 패턴(`SignJWT`/`jwtVerify`, HS256)을 그대로 채택했다. jose는
Edge/Node 양쪽에서 동작하므로 `src/proxy.ts`(Edge)와 Server Action(Node) 모두에서 `session.ts` 하나만
공유한다. 슬라이딩 갱신은 구현하지 않는다(1인 관리자, 과설계 방지) — 7일 후 재로그인하면 된다.
`decryptSession`은 서명 불일치·만료·형식 오류를 모두 catch해 `null`을 반환해 위조/만료 쿠키를
미인증과 동일하게 취급한다.

### 3. 라우트 보호: `src/proxy.ts` 단일 지점, matcher로 공개 라우트 원천 배제

Next.js 16은 `middleware.ts` → `proxy.ts`(파일명·함수명 모두 변경)로 컨벤션이 바뀌었다. `src/` 디렉터리를
쓰는 프로젝트이므로 **프로젝트 루트가 아니라 `src/proxy.ts`에 두어야 인식된다** — 처음 루트에 두었을 때
`next build` 결과물에 `ƒ Proxy (Middleware)` 라인이 나타나지 않아(=등록 안 됨) `src/`로 옮긴 뒤에야
정상 등록을 확인했다. `matcher: ['/admin/:path*']`로 좁혀 공개 라우트(`/`, `/invoice/*`, `/api/*`)는
proxy 함수 자체가 실행되지 않도록 해 "공개 페이지 영향 없음" 요건을 로직이 아닌 매처 설계로 보장한다.
`password.ts`(node:crypto)는 Edge에서 동작하지 않으므로 proxy에서는 import하지 않는다.

### 4. Rate limiting: 인메모리 Map, 5회 실패당 5분 잠금

DB/Redis 없는 1인 관리자 서비스를 위한 실용적 절충안이다. **한계**: Vercel 등 서버리스 다중 인스턴스
환경에서는 인스턴스별 Map이 독립적이라 완벽한 전역 차단이 아니며 콜드스타트 시 초기화될 수 있다.
강한 보장이 필요해지면 Upstash Redis 등으로 교체 가능하도록 `checkRateLimit`/`recordFailure`/`resetRateLimit`
시그니처를 스토리지 구현과 분리해 두었다.

### 5. 로그인 폼 상태 관리: 기존 RHF `onSubmit` 패턴 재사용

코드베이스에 `useActionState`/Server Action 선례가 없어(`invoice-lookup-form.tsx`가 유일한 폼
참조), 새 패턴을 최소화하기 위해 클라이언트에서 `loginAction`을 직접 `await`하고 실패 시
`form.setError`로 표시하는 동일한 방식을 그대로 따랐다.

### 6. 라우트 구조: `(protected)` 라우트 그룹 도입

로그인 페이지가 `AdminShell`(상단바 + 로그아웃 버튼)을 상속하면 로그인 화면에 로그아웃 버튼이 보이는
모순이 생긴다. 기존 `admin/page.tsx`·`admin/loading.tsx`를 `(protected)/`로 옮기고 `AdminShell` 래핑도
`(protected)/layout.tsx`로 이동했다. `admin/layout.tsx`는 `/admin/*` 전체에 적용되는 robots 메타데이터만
남기고 children을 패스스루한다. `not-found.tsx`·`[...catchAll]/page.tsx`는 이미 범용적이라 그대로
`admin/` 루트에 유지했다.

## 구현 단계

1. [x] `npm install jose`
2. [x] `src/lib/env.ts`에 `ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET` 스키마 추가
3. [x] `src/lib/auth/{password,session,rate-limit,schema,actions}.ts` 작성
4. [x] `src/proxy.ts` 작성 (최초 루트에 뒀다가 미등록 확인 후 `src/`로 이동)
5. [x] `(protected)/{layout,page,loading}.tsx` 생성, 기존 `admin/{page,loading}.tsx` 삭제,
       `admin/layout.tsx` 축소
6. [x] `src/components/admin/login-form.tsx`, `src/app/admin/login/page.tsx` 작성
7. [x] `admin-shell.tsx` 로그아웃 버튼 추가, `admin-dev-banner.tsx` 삭제
8. [x] `.env.example`, `.github/workflows/ci.yml`, `docs/guides/deployment.md`,
       `docs/guides/project-structure.md` 갱신
9. [x] `npm run typecheck`/`lint` 통과, `npm run build` 성공(`ƒ Proxy (Middleware)` 등록 확인)
10. [x] Playwright MCP 테스트(아래 체크리스트) 수행 및 해시 생성 버그 발견·수정

## 수락 기준 (완료 조건)

- [x] 미인증 상태로 `/admin` 접근 시 목록 데이터 노출 없이 `/admin/login`으로 리다이렉트
- [x] 올바른 비밀번호 로그인 → 목록 표시, 새로고침 후 세션 유지
- [x] 로그아웃 → 재접근 시 로그인으로 리다이렉트
- [x] 잘못된 비밀번호/위조 쿠키가 비밀번호·해시 값을 노출하지 않고 안전하게 거부됨
- [x] 로그인 연속 실패 시 rate limit 동작, 공개 페이지는 영향받지 않음
- [x] Playwright MCP 테스트 전 항목 통과
- [x] `npm run typecheck`/`lint`/`build` 통과 (`format:check`는 아래 참고)

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리

### 정상 흐름 (Happy Path)

- [x] `/admin/login`에서 올바른 비밀번호 입력 → `/admin`으로 이동, 견적서 목록(INV-2026-002,
      INV-2026-001) 정상 표시, 콘솔 에러 0건
- [x] 로그인 상태에서 `/admin` 새로고침(재방문) → 세션 쿠키로 재인증 없이 목록 유지 표시
- [x] 로그인 상태에서 `/admin/login` 직접 접근 → 로그인 폼 노출 없이 즉시 `/admin`으로 리다이렉트
- [x] 로그아웃 버튼 클릭 → `/admin/login`으로 이동 → 이후 `/admin` 재접근 시 다시 로그인으로
      리다이렉트됨을 확인

### 오류 처리

- [x] 잘못된 비밀번호 입력 → "비밀번호가 올바르지 않습니다." 표시, 화면·DOM 어디에도 해시/내부 사유
      노출 없음(서버 콘솔에만 `관리자 로그인 실패: 잘못된 비밀번호 시도` 로그)
- [x] 미인증 상태로 `/admin` 직접 접근 → 목록 데이터가 한 순간도 렌더링되지 않고 `/admin/login`으로
      리다이렉트(레이스 없음 — proxy가 데이터 페칭 이전에 요청을 가로챔)

### 엣지 케이스

- [x] 위조된 세션 쿠키(`admin_session=tampered.invalid.token`) 상태로 `/admin` 접근 → `decryptSession`이
      `jwtVerify` 실패를 catch해 미인증과 동일하게 `/admin/login`으로 리다이렉트. 만료 쿠키도 동일한
      catch 경로(서명 불일치·만료·형식 오류를 모두 동일 처리)라 별도 재현 없이 코드 경로 재사용으로
      검증 대체
- [x] 연속 로그인 실패 5회 → 6번째 시도(정상 비밀번호 포함)에서 "너무 많이 시도했습니다. N초 후 다시
      시도해 주세요." 즉시 거부 확인(실제 296초로 표시됨)
- [x] 공개 페이지(`/`, `/invoice/{id}`)는 `proxy.ts`의 matcher(`/admin/:path*`) 범위 밖이라 로그인
      여부와 무관하게 항상 정상 접근됨을 확인, 콘솔 에러 0건

### 반응형 & 품질

- [x] 모바일(375) — 로그인 화면 레이아웃 정상, 콘솔 에러 0건
- [x] 데스크톱(1280) — 로그인 화면 레이아웃 정상
- [x] 다크모드 — 로그인 화면 시맨틱 토큰 기반 대비 정상(스크린샷으로 시각 확인)
- [x] `npm run typecheck`/`lint`/`build` 통과. `npm run format:check`는 이 리포지토리에 이미 존재하던
      CRLF 개행 경고(36개 파일, 전부 이번 Task에서 손대지 않은 기존 파일 — `git stash`로 baseline에서도
      동일하게 실패함을 확인)로 인해 exit 1이며, 이는 Task 018의 회귀가 아니다. 이번 Task가 새로 만들거나
      수정한 파일은 모두 `prettier --write`로 정리해 경고가 없음

## 결과 요약

단일 비밀번호 + jose 서명 세션 쿠키로 `/admin`을 보호했다. `src/proxy.ts`(Next.js 16 컨벤션, `src/`
디렉터리 프로젝트라 루트가 아닌 `src/`에 위치)가 `/admin/:path*`를 가로채 세션을 검증하고 미인증
요청을 `/admin/login`으로 리다이렉트한다. 비밀번호는 Node 내장 `crypto.scrypt`로 검증하며(신규
의존성 없음), 세션은 `jose`(신규 의존성 1개)로 서명한다. 로그인 폼은 기존 `invoice-lookup-form.tsx`와
동일한 RHF+zod 패턴을 재사용했고, 로그인 페이지가 관리자 상단바(로그아웃 버튼 포함)를 상속하지 않도록
`(protected)` 라우트 그룹으로 분리했다. 로그인 실패는 인메모리 rate limit(5회/5분)으로 방어한다
(서버리스 다중 인스턴스 한계는 문서화).

구현 중 두 가지 실수를 Playwright 테스트로 발견해 수정했다: (1) `proxy.ts`를 프로젝트 루트에 두어
빌드에 등록되지 않던 문제(→ `src/proxy.ts`로 이동, 빌드 로그의 `ƒ Proxy (Middleware)`로 등록 확인),
(2) `.env.example`의 비밀번호 해시 생성 one-liner가 salt를 hex 문자열째로 scrypt에 넘겨
`verifyPassword`의 디코딩 방식과 불일치해 항상 로그인 실패하던 문제(→ salt Buffer를 그대로 재사용하도록
one-liner 수정).

Playwright MCP로 정상 로그인/세션 유지/로그아웃, 잘못된 비밀번호·위조 쿠키·직접 접근 리다이렉트,
연속 실패 5회 후 rate limit(296초 잠금 메시지 확인), 공개 페이지 무영향, 모바일/데스크톱/다크모드
레이아웃까지 전 항목을 확인했다(콘솔 에러 0건). `npm run typecheck`/`lint`/`build`는 통과했고,
`format:check`는 이번 Task와 무관한 기존 CRLF 경고로 baseline부터 실패 상태였음을 `git stash`로
검증했다.

`.env.local`에는 로컬 테스트용 임시 비밀번호(`dev-temp-password`)의 해시를 넣어뒀다 — 실제 운영
전 반드시 사용자 본인의 비밀번호로 재생성해 교체해야 한다. GitHub Actions CI가 계속 통과하려면
`ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET`을 repo secrets에도 등록해야 한다(사용자 조치 필요).
