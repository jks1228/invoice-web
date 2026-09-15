# Task 020: 배포 반영 및 회귀 테스트 세트 정리

> Phase 8 · 최적화 및 배포

## 목표

V2(관리자 대시보드) 구현 내용을 배포 문서·CI·README에 반영하고, 공개+관리자 여정을 아우르는 회귀
테스트 시나리오 목록을 정리한다. V1 Task 011과 동일하게, **계정 연결이 필요한 실제 배포 작업은 이
Task에서 하지 않는다** — 로컬에서 완결되는 문서·설정 작업만 다룬다.

**이 Task가 하는 것**: CI 워크플로에 신규 환경 변수 반영, 배포 가이드에 관리자 영역 체크리스트(인증
선행 조건 포함) 추가, README를 V2 상태로 갱신, 회귀 테스트 시나리오 문서 신설.

**이 Task가 하지 않는 것** (사용자 직접 진행, `docs/guides/deployment.md` 참고): Vercel
환경 변수 등록, GitHub Secrets 등록, 실제 `git push`/배포 트리거, 배포 후 스모크 테스트.

## 관련 파일

| 파일                                | 구분 | 내용                                                           |
| ----------------------------------- | ---- | -------------------------------------------------------------- |
| `.github/workflows/ci.yml`          | 수정 | `NEXT_PUBLIC_SITE_URL` 환경 변수 참조 추가(선택값)             |
| `docs/guides/deployment.md`         | 수정 | 관리자 영역 배포 체크리스트 추가(인증 선행 조건이 배포 게이트) |
| `docs/guides/regression-testing.md` | 신규 | 공개+관리자 여정 회귀 테스트 시나리오 목록                     |
| `README.md`                         | 수정 | V2(관리자 목록·링크 복사) 상태 반영, 프로젝트 구조 갱신        |
| `docs/ROADMAP.md`                   | 수정 | Task 020 완료 표시                                             |

`CLAUDE.md`(프로젝트 루트)는 기능 완료 상태를 담고 있지 않고(가이드 문서 링크·기술 스택만 나열) 이미
정확해 이번 Task에서 수정하지 않는다.

## 설계 결정 및 근거

### 1. 배포 게이트를 `deployment.md` 최상단에 명시

ROADMAP "범위 결정 사항"에 이미 기록된 대로, Task 018(인증)이 완료되기 전에는 관리자 영역을 공개
도메인에 배포하지 않는다. 이 제약을 배포를 시작하기 전에 반드시 보도록 `deployment.md`의 배포 전
체크리스트 맨 앞에 굵게 표시한다 — 문서 중간에 묻혀 있으면 놓치기 쉽다.

### 2. `NEXT_PUBLIC_SITE_URL`은 CI 빌드에 필수가 아님 — 선택 secret으로만 반영

`src/lib/env.ts`에서 `NEXT_PUBLIC_SITE_URL`은 `.optional()`이라 미설정 상태로도 빌드가 통과한다
(`buildInvoicePublicUrl`이 브라우저에서는 `window.location.origin`, 서버에서는 값이 없으면 호출부
`origin` 인자로 폴백). CI에는 참조만 추가해 GitHub Secrets에 등록하면 자동으로 반영되게 하되, 비어
있어도 빌드가 깨지지 않게 한다.

### 3. 회귀 테스트 시나리오는 새 문서로 분리(README/deployment.md에 섞지 않음)

Task 018-1에서 수행한 통합 테스트 시나리오(관리자 여정·공개 여정·에러 플로우·반응형)를 향후 배포마다
반복 실행할 수 있는 체크리스트로 정리한다. 배포 가이드는 "어떻게 배포하는가"이고 회귀 테스트는
"배포 후 무엇을 확인하는가"로 관심사가 달라 별도 문서(`regression-testing.md`)로 분리한다.

## 구현 단계

1. [x] `.github/workflows/ci.yml`에 `NEXT_PUBLIC_SITE_URL` secret 참조 추가
2. [x] `docs/guides/deployment.md`에 "관리자 영역 배포 체크리스트" 섹션 추가(배포 게이트 최상단 명시,
       `NEXT_PUBLIC_SITE_URL` 환경 변수, robots 차단 확인, Task 018 완료 여부 확인)
3. [x] `docs/guides/regression-testing.md` 신설 — 공개 여정 + 관리자 여정 시나리오 목록(Task 018-1
       내용을 재사용 가능한 체크리스트로 정리)
4. [x] `README.md`를 V2 상태로 갱신(주요 페이지 표에 관리자 라우트 추가, 프로젝트 구조 트리 갱신,
       배포 섹션에 인증 미완료 경고 추가)
5. [x] `npm run check-all` + `npm run build` 통과 확인
6. [x] `docs/ROADMAP.md` Task 020 완료 표시(단, "사용자 직접 진행" 항목은 미체크로 남김)

## 수락 기준 (완료 조건)

- [x] `deployment.md`에 관리자 배포 게이트(Task 018 선행)가 최상단에 명시됨
- [x] `regression-testing.md`에 공개+관리자 여정 체크리스트가 정리됨
- [x] `README.md`가 V2(관리자 목록·링크 복사) 상태를 정확히 반영
- [x] `npm run check-all` + `npm run build` 통과

## 결과 요약

`.github/workflows/ci.yml`에 `NEXT_PUBLIC_SITE_URL` secret 참조를 추가했다(선택값이라 미등록 상태로도
빌드는 통과). `docs/guides/deployment.md` 최상단에 관리자 배포 게이트(Task 018 완료 전 배포 금지 또는
Vercel 배포 보호 필수)를 명시하고, "관리자 영역 배포 체크리스트" 섹션을 추가했다. 공개+관리자 여정을
아우르는 `docs/guides/regression-testing.md`를 신설해 Task 018-1의 통합 테스트 시나리오를 재사용 가능한
체크리스트로 정리했다. `README.md`를 V2 상태(관리자 목록·링크 복사 라우트, A001~A005 기능 상태,
`src/app/admin/`·`src/components/admin/`·`src/hooks/` 구조, `NEXT_PUBLIC_SITE_URL` 환경 변수)로
갱신했다. `CLAUDE.md`는 기능 완료 상태를 담고 있지 않아 수정하지 않았다.

`npm run check-all`(YAML 유효성 검사 포함)과 `npm run build` 모두 통과했다(변경 파일은 문서·CI 설정뿐이라
코드 영향 없음). V1 Task 011과 동일하게 Vercel 프로젝트 연결·환경 변수 등록·GitHub Secrets 등록·실제
배포·배포 후 스모크 테스트는 계정 접근이 필요해 사용자가 `docs/guides/deployment.md`를 따라 직접
진행해야 한다.
