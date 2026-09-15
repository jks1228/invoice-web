# Task 011: 배포 및 CI/CD

> Phase 4 · 고급 기능 및 최적화

## 목표

ROADMAP 원문의 Task 011 중, **계정 연결이 필요 없는 로컬 작업만**을 이 Task의 범위로 한다(사용자 확인).
Vercel 프로젝트 연결·환경 변수 등록·GitHub Actions Secrets 등록·실제 배포 트리거는 이 Task에서 다루지
않고, 사용자가 직접 진행할 수 있도록 가이드 문서로 정리한다.

**이 Task가 하는 것**:

1. GitHub Actions CI 워크플로 작성 (`typecheck` + `lint` + `format:check` + `build`)
2. `README.md`를 현재 구현 상태(F001~F011 완료)에 맞게 전면 개정, 배포 가이드 링크 추가
3. 배포 가이드 문서 신설(`docs/guides/deployment.md`) — Vercel 연결부터 배포 후 스모크 테스트까지
   사용자가 따라 할 수 있는 체크리스트. Task 009에서 발견한 "PDF 폰트 파일 트레이싱" 확인 항목 포함

**이 Task가 하지 않는 것** (사용자 직접 진행, 위 가이드 문서 참고):

- `vercel login` / Vercel 프로젝트 연결
- Vercel Production/Preview 환경 변수 등록(`NOTION_API_KEY`, `NOTION_DATABASE_ID`, `BUSINESS_*`)
- GitHub 저장소 Settings → Secrets에 `NOTION_API_KEY`/`NOTION_DATABASE_ID` 등록(CI가 빌드를 통과하려면
  필요 — 아래 "설계 결정 3" 참고)
- 실제 `git push` / Vercel 배포 트리거
- 배포 후 스모크 테스트(실제 배포 URL이 있어야 가능) — 배포 완료 후 요청하면 이어서 수행

## 관련 파일

| 파일                        | 구분 | 내용                                                                     |
| --------------------------- | ---- | ------------------------------------------------------------------------ |
| `.github/workflows/ci.yml`  | 신규 | push/PR 시 `check-all` + `build` 실행                                    |
| `docs/guides/deployment.md` | 신규 | Vercel 연결·환경 변수·GitHub Secrets·배포·스모크 테스트 체크리스트       |
| `README.md`                 | 수정 | F001~F011 상태 갱신(대부분 완료로), 프로젝트 구조 최신화, 배포 섹션 추가 |
| `docs/ROADMAP.md`           | 수정 | Task 011 완료 표시(단, "사용자 직접 진행" 항목은 미체크로 남김)          |

## 설계 결정 및 근거

### 1. CI가 실행할 검사: `check-all` + `build`만 (E2E는 제외)

`npm run check-all`(typecheck+lint+format:check)과 `npm run build`는 외부 서비스 없이 GitHub Actions
러너에서 그대로 돈다. Playwright E2E까지 CI에 넣으려면 실제 Notion 조회가 필요해(현재 mock 데이터가 없고
Task 007에서 전부 실데이터로 전환함) `NOTION_API_KEY`/`NOTION_DATABASE_ID` GitHub Secrets가 반드시
있어야 하고, 실제 Notion 워크스페이스에 의존하는 CI는 Notion 쪽 장애·레이트리밋에 따라 CI가 불안정해질
수 있다. 이번엔 `check-all`+`build`만 넣고, Playwright E2E CI 자동화는 README/가이드에 "향후 확장"으로
문서화만 해둔다(과도한 범위 확장 방지).

### 2. `next.config.ts`의 `outputFileTracingIncludes`(Task 009)는 로컬 빌드로만 검증됨

Task 009에서 PDF용 폰트 파일이 `.next/server/.../route.js.nft.json`에 포함되는 것까지는 확인했지만,
실제 Vercel 서버리스 함수에서 그 트레이스가 그대로 적용되는지는 실배포 전까지 100% 보장할 수 없다.
`docs/guides/deployment.md`에 "배포 직후 `/invoice/{실제 id}/pdf`를 열어 한글이 정상 렌더링되는지
확인" 항목을 체크리스트 1번으로 넣어, 배포 담당자가 놓치지 않게 한다.

### 3. CI 빌드에 필요한 Secrets는 "더미 값도 가능"함을 문서화

`src/lib/env.ts`는 모듈 로드 시점에 `NOTION_API_KEY`/`NOTION_DATABASE_ID`가 **비어있지 않기만** 하면
통과하는 Zod 스키마다(`z.string().min(1)`, 실제 Notion 연결 여부는 검증하지 않음). `npm run build`는
정적 페이지를 생성하지 않는 구조(`generateStaticParams` 미사용)라 빌드 시점에 실제로 Notion을 호출하지
않는다. 즉 CI에서 빌드만 통과시키고 싶다면 아무 더미 문자열을 Secrets에 넣어도 되고, 실제 통합
검증까지 원하면 진짜 값을 넣으면 된다 — 가이드 문서에 두 옵션을 모두 안내한다.

### 4. `README.md`는 Task 001 시점 상태로 방치되어 있었다

현재 README는 "F002 미구현", "F003 미구현" 등 Phase 3 작업 전 상태를 그대로 담고 있다(실제로는 Task
006~009로 F001~F004 모두 완료). 개정판에는 실제 구현 상태, `@react-pdf/renderer`·`assets/fonts/` 등
Task 009에서 추가된 구성요소, 배포 가이드 링크를 반영한다.

## 구현 단계

1. [x] `.github/workflows/ci.yml` 작성 (Node 20, `npm ci`, `npm run check-all`, `npm run build` —
       빌드 스텝에 `NOTION_API_KEY`/`NOTION_DATABASE_ID` secrets 참조)
2. [x] `docs/guides/deployment.md` 작성 (Vercel 연결 → 환경 변수 등록 → GitHub Secrets 등록 → 배포 →
       폰트/PDF 스모크 테스트 → 회귀 테스트 체크리스트, 순서대로)
3. [x] `README.md` 전면 개정 (기능 상태표, 프로젝트 구조, 명령어, 배포 섹션 추가/링크)
4. [x] `docs/ROADMAP.md` Task 011 갱신 — "로컬 작업" 항목만 완료 표시, "사용자 직접 진행" 항목은 체크
       하지 않고 그대로 남김(실제 계정 작업은 사용자 몫)
5. [x] `npm run check-all` 통과 확인(README/문서만 수정하는 단계라 코드 영향 없음, 형식 검사만)

## 수락 기준 (완료 조건)

- [x] `.github/workflows/ci.yml`이 `npm run check-all` + `npm run build`를 push/PR에서 실행하도록 구성됨
- [x] `docs/guides/deployment.md`에 Vercel 연결부터 배포 후 스모크 테스트까지 순서대로 정리됨(PDF 폰트
      확인 항목 포함)
- [x] `README.md`가 현재 구현 상태(F001~F011)를 정확히 반영
- [x] `npm run check-all` 통과 (타입체크/린트/포맷 모두 통과 — 아래 결과 요약 참고)

## 테스트 체크리스트

> 이 Task는 로컬 문서·설정 작업이라 Playwright MCP 브라우저 테스트 대상이 아니다(ROADMAP "테스트 대상
> 분류"의 "모든 구현 Task" 스모크 요건은 실행 가능한 코드 변경이 없어 해당 없음). 대신 아래를 확인한다.

### 정상 흐름

- [x] `.github/workflows/ci.yml`의 YAML 문법이 유효함 (`js-yaml`로 파싱해 구조 확인 완료)
- [x] `docs/guides/deployment.md`의 각 단계를 순서대로 따라가면 실제로 배포까지 이어질 수 있는지 논리적
      검토 완료(실행은 사용자 몫)

### 오류 처리 / 엣지 케이스

- [x] 해당 없음(문서·설정 전용 Task)

### 반응형 & 품질

- [x] 해당 없음
- [x] `npm run typecheck` / `npm run lint` / `npx prettier --check` 통과 (신규 파일 3개 기준)

## 결과 요약

`.github/workflows/ci.yml`, `docs/guides/deployment.md`를 신규 작성하고 `README.md`를 F001~F011 완료
상태(Next.js 16.3.4 기준)로 전면 개정했다. `docs/ROADMAP.md` Task 011도 로컬 작업 항목만 완료
표시했다.

작성 직후 `npx prettier --check`로 이 Task가 만든/수정한 3개 파일(`ci.yml`, `deployment.md`,
`README.md`)만 검사했을 때 `deployment.md`와 `README.md`에서 마크다운 테이블 컬럼 정렬 위반이 실제로
있었다(Prettier가 컬럼 폭을 재계산). `npx prettier --write`로 두 파일을 정리해 재검사까지 통과 확인
— 이 Task 범위의 파일은 모두 Prettier 규칙을 만족한다. (저장소 전체에는 이번 세션의 Task 010에서
확인한 별개의 CRLF 관련 기존 포맷 경고가 존재하지만, 이 Task가 만든 파일과는 무관하다.)

Vercel 프로젝트 연결·환경 변수 등록·GitHub Secrets 등록·실제 배포·배포 후 스모크 테스트는 계정 접근이
필요해 사용자가 `docs/guides/deployment.md`를 따라 직접 진행해야 한다.
