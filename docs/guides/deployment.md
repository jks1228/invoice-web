# 배포 가이드

Invoice Web을 Vercel에 배포하는 절차입니다. GitHub Actions CI(`.github/workflows/ci.yml`)는 이미
저장소에 구성되어 있으므로, 아래는 계정 연결이 필요한 나머지 단계입니다.

> ## ✅ 관리자 인증(Task 018) 적용됨
>
> 관리자 견적서 목록(`/admin`)은 단일 비밀번호 + 서명된 세션 쿠키로 보호됩니다(`proxy.ts`가
> `/admin/:path*`를 가로채 미인증 요청을 `/admin/login`으로 리다이렉트). 배포 전 아래 두 환경 변수를
> **반드시** Production/Preview에 등록하세요 — 없으면 `src/lib/env.ts`가 빌드/기동 시점에 즉시
> 실패합니다.
>
> - `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` (생성 방법은 아래 "2. Vercel 환경 변수 등록" 표 참고)
>
> `/admin`에는 추가로 `robots: { index: false, follow: false }`(검색 노출 차단)도 적용되어 있습니다.
> 아래 "관리자 영역 배포 체크리스트"에서 다시 확인합니다.

## 1. Vercel 프로젝트 연결

1. [Vercel](https://vercel.com)에 로그인 후 이 GitHub 저장소를 Import
2. Framework Preset: Next.js (자동 인식됨)
3. Build Command / Output Directory는 기본값 유지

## 2. Vercel 환경 변수 등록

Vercel 프로젝트 → Settings → Environment Variables에서 Production/Preview 각각에 등록합니다.

| 변수                   | 필수 여부  | 설명                                                                                                                                                                                                                           |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NOTION_API_KEY`       | 필수       | Notion 통합 토큰                                                                                                                                                                                                               |
| `NOTION_DATABASE_ID`   | 필수       | 견적서 데이터베이스 ID                                                                                                                                                                                                         |
| `BUSINESS_NAME`        | 선택       | 미설정 시 발행자 정보 섹션 미표시                                                                                                                                                                                              |
| `BUSINESS_OWNER_NAME`  | 선택       |                                                                                                                                                                                                                                |
| `BUSINESS_PHONE`       | 선택       |                                                                                                                                                                                                                                |
| `BUSINESS_EMAIL`       | 선택       |                                                                                                                                                                                                                                |
| `BUSINESS_ADDRESS`     | 선택       |                                                                                                                                                                                                                                |
| `BUSINESS_TAX_ID`      | 선택       |                                                                                                                                                                                                                                |
| `NEXT_PUBLIC_SITE_URL` | 선택(권장) | 관리자 목록의 "링크 복사"(Task 015)가 서버 렌더링 시 사용할 공개 도메인(예: `https://invoice.example.com`). 클라이언트에 노출되는 값이라 `NEXT_PUBLIC_` 접두사를 쓴다. 미설정 시 요청 origin으로 폴백한다                      |
| `ADMIN_PASSWORD_HASH`  | 필수       | 관리자 비밀번호의 scrypt 해시(`salt:hash`, hex). `node -e "const c=require('crypto');const s=c.randomBytes(16);console.log(s.toString('hex')+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" '원하는비밀번호'`로 생성 |
| `ADMIN_SESSION_SECRET` | 필수       | 세션 쿠키(JWT) 서명 키, 32자 이상. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`로 생성                                                                                                           |

값 채우는 방법은 [`notion-quickstart.md`](./notion-quickstart.md) 참고.

## 3. GitHub Actions Secrets 등록

GitHub 저장소 → Settings → Secrets and variables → Actions에 `NOTION_API_KEY`, `NOTION_DATABASE_ID`,
`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`을 등록합니다(`NEXT_PUBLIC_SITE_URL`은 선택 — 미등록해도
빌드는 통과함). `ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET`은 `src/lib/env.ts`에서 필수값이라
없으면 `npm run build`가 즉시 실패합니다. `npm run build`는 실제로 Notion을 호출하지 않고(정적
페이지를 미리 생성하지 않는 구조) `src/lib/env.ts`가 값이 비어있지 않은지만 검증하므로, **CI 빌드
통과만 원한다면 더미 문자열도 가능**합니다(단, `ADMIN_SESSION_SECRET`은 32자 이상이어야 함). 실제
Notion 연동까지 CI에서 검증하고 싶다면 진짜 값을 등록하세요.

## 관리자 영역 배포 체크리스트 (V2)

`/admin` 관련 변경(Task 012~020)을 배포하기 전 아래를 순서대로 확인합니다.

- [ ] `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`을 Production 환경 변수로 등록했는가?
- [ ] `NEXT_PUBLIC_SITE_URL`을 Production 환경 변수로 등록했는가?(생략해도 요청 origin으로 폴백해
      동작은 하지만, 커스텀 도메인을 쓴다면 정확한 값을 등록하는 편이 "링크 복사" 결과가 일관됨)
- [ ] 배포된 `/admin`의 페이지 소스에 `<meta name="robots" content="noindex, nofollow">`가 포함되어
      있는지 확인(검색 노출 차단이 실제로 적용됐는지)
- [ ] 로그인 없이 배포된 `/admin`에 직접 접근 시 `/admin/login`으로 리다이렉트되는지 확인
- [ ] 배포된 `/admin`에서 견적서 목록이 실제 Notion 데이터와 일치하는지 확인
- [ ] "링크 복사" 결과 URL이 실제 배포 도메인(`https://...`)을 정확히 가리키는지 확인

## 4. 배포

Vercel 프로젝트를 연결하면 `main` 브랜치 push마다 자동 배포됩니다. 수동 배포가 필요하면 Vercel
대시보드에서 Redeploy를 누르거나 `vercel --prod` CLI를 사용합니다.

## 5. 배포 후 스모크 테스트 (필수 체크리스트)

> V1(공개 여정) 핵심 항목만 아래에 남겨둔다. 관리자 여정을 포함한 전체 회귀 테스트 시나리오는
> [`regression-testing.md`](./regression-testing.md)를 참고한다.

- [ ] **PDF 폰트 확인**: `/invoice/{실제 id}/pdf`를 열어 한글이 정상 렌더링되는지 확인 (Task 009에서
      `outputFileTracingIncludes`로 `assets/fonts/**`를 명시적으로 포함시켰지만, Vercel 서버리스 함수의
      실제 트레이싱 결과는 로컬 빌드만으로 100% 보장되지 않음 — 반드시 실배포 후 확인)
- [ ] 홈 페이지 접속 및 인보이스 ID 입력 → 상세 페이지 이동
- [ ] 실제 인보이스 링크(`/invoice/{id}`) 직접 접근
- [ ] 잘못된 ID 접근 시 오류 페이지 정상 표시
- [ ] PDF 다운로드 버튼 클릭 → 파일 정상 다운로드
- [ ] 모바일/데스크톱 반응형 확인
- [ ] 다크모드/라이트모드 확인
- [ ] 브라우저 콘솔 에러 0건 확인

## 참고: 향후 확장 (이번 배포 범위 아님)

- **Playwright E2E CI 자동화**: 현재 CI는 `check-all` + `build`만 수행합니다. E2E까지 자동화하려면
  실제 Notion 워크스페이스에 의존하게 되어 Notion 장애/레이트리밋에 CI가 영향을 받을 수 있어 이번에는
  제외했습니다.
- **on-demand ISR (`revalidateTag`)**: Notion 데이터가 바뀔 때 캐시를 즉시 무효화하려면 웹훅 소스가
  필요합니다(현재 Notion 기본 API는 웹훅을 제공하지 않음). [`tasks/010-performance-optimization.md`](../../tasks/010-performance-optimization.md)에
  확장 지점으로 기록되어 있습니다.
