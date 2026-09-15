# Invoice Web

Notion에서 관리하는 견적서(인보이스)를 클라이언트가 **공개 웹 링크**로 확인하고
**PDF로 다운로드**할 수 있는 공개 인보이스 플랫폼입니다. 발행자를 위한 **관리자 견적서 목록**도
제공합니다(V2).

- **발행자**: 프리랜서 / 소상공인 — Notion 데이터베이스에서 견적서를 관리, `/admin`에서 목록 확인 및
  공개 링크 복사
- **클라이언트**: 전달받은 링크(또는 인보이스 ID)로 견적서를 확인하고 PDF로 보관

상세 요구사항은 [`docs/PRD.md`](docs/PRD.md), 개발 진행 상황은 [`docs/ROADMAP.md`](docs/ROADMAP.md)를 참조하세요.

> ⚠️ **관리자 영역(`/admin`)은 아직 인증이 없습니다.** URL을 아는 누구나 접근 가능하므로, 인증
> (ROADMAP Task 018)이 완료되기 전에는 공개 도메인에 배포하지 마세요. 자세한 내용은
> [`docs/guides/deployment.md`](docs/guides/deployment.md)의 "배포 게이트" 참고.

## 주요 페이지

| 페이지             | 경로                  | 구현 기능      | 설명                                                                                |
| ------------------ | --------------------- | -------------- | ----------------------------------------------------------------------------------- |
| 홈                 | `/`                   | F011           | 인보이스 ID 입력 → 상세 페이지 이동. 중앙 정렬 카드 레이아웃                        |
| 인보이스 상세      | `/invoice/[id]`       | F001~F004      | Notion API로 조회한 발행자/클라이언트 정보 + 상품 테이블 + 합계 + PDF 다운로드      |
| PDF 다운로드       | `/invoice/[id]/pdf`   | F003           | 서버사이드에서 생성한 인보이스 PDF 응답                                             |
| 오류               | `not-found` / `error` | F010           | 잘못된 ID·존재하지 않는 견적서·일시적 오류 처리                                     |
| 관리자 견적서 목록 | `/admin`              | A001·A002·A004 | Notion 전체 견적서 목록(테이블/카드), 공개 링크 복사, 새 탭에서 열기. **인증 없음** |

## 핵심 기능

| ID   | 기능                                             | 상태                       |
| ---- | ------------------------------------------------ | -------------------------- |
| F001 | Notion API 연동 (`src/lib/notion/`)              | 완료                       |
| F002 | 인보이스 상세 조회 (발행자·클라이언트·상품·합계) | 완료                       |
| F003 | PDF 다운로드 (`@react-pdf/renderer`, 서버사이드) | 완료                       |
| F004 | ID 기반 인보이스 접근                            | 완료                       |
| F005 | 반응형 디자인                                    | 완료                       |
| F010 | 오류 처리 (잘못된 ID·일시적 오류·만료 표시)      | 완료                       |
| F011 | 홈 / 인보이스 ID 입력                            | 완료                       |
| A001 | 관리자 견적서 목록 (`/admin`, Notion 실데이터)   | 완료                       |
| A002 | 공개 링크 복사(Clipboard API + 폴백)             | 완료                       |
| A003 | 관리자 영역 다크모드 확장                        | 완료                       |
| A004 | Notion 목록 조회 API(`getInvoiceList`)           | 완료                       |
| A005 | 관리자 접근 제어(인증)                           | 보류 — 결정 필요(Task 018) |

성능 최적화(ISR/캐싱)와 배포 준비까지 포함한 전체 작업 내역은 [`docs/ROADMAP.md`](docs/ROADMAP.md)를 참고하세요.

## 기술 스택

- **Framework**: Next.js 16.3.4 (App Router + Turbopack)
- **Runtime**: React 19.2.8, TypeScript 5 (strict)
- **Styling**: TailwindCSS v4, shadcn/ui (new-york), Lucide Icons
- **Forms**: React Hook Form + Zod
- **Theme**: next-themes (다크모드)
- **Data**: Notion API (서버 전용 fetch 클라이언트, `src/lib/notion/`), ISR 캐싱
- **PDF**: `@react-pdf/renderer` (서버사이드 생성, 한글 폰트 로컬 임베드)
- **Toast**: sonner
- **Tooling**: ESLint, Prettier, Husky, lint-staged, GitHub Actions CI

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 Notion 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수                   | 설명                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `NOTION_API_KEY`       | Notion 통합 토큰 (서버 전용, 클라이언트 노출 금지)                                             |
| `NOTION_DATABASE_ID`   | 견적서가 저장된 Notion 데이터베이스 ID                                                         |
| `BUSINESS_NAME`        | 발행자 사업명 (Notion에 없어 환경 변수로 관리, 없으면 발행자 정보 미표시)                      |
| `BUSINESS_OWNER_NAME`  | 발행자 대표자 이름 (선택)                                                                      |
| `BUSINESS_PHONE`       | 발행자 연락처 (선택)                                                                           |
| `BUSINESS_EMAIL`       | 발행자 이메일 (선택)                                                                           |
| `BUSINESS_ADDRESS`     | 발행자 주소 (선택)                                                                             |
| `BUSINESS_TAX_ID`      | 발행자 사업자 번호 (선택)                                                                      |
| `NEXT_PUBLIC_SITE_URL` | 관리자 목록 "링크 복사"(A002)가 서버에서 쓸 공개 도메인 (선택, 미설정 시 요청 origin으로 폴백) |

Notion 통합 생성 방법은 [`docs/guides/notion-quickstart.md`](docs/guides/notion-quickstart.md)를 참조하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## 배포

Vercel 배포 절차(프로젝트 연결 → 환경 변수 → GitHub Secrets → 배포 후 스모크 테스트)는
[`docs/guides/deployment.md`](docs/guides/deployment.md)를 참조하세요. `main` 브랜치에 push/PR이
생성되면 GitHub Actions(`.github/workflows/ci.yml`)가 `check-all` + `build`를 자동 실행합니다.

## 명령어

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run check-all    # 타입체크 + 린트 + 포맷 검사
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier 자동 정리
```

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (테마, Header/Footer, Toaster)
│   ├── page.tsx                      # 홈 (F011) — 인보이스 ID 입력 카드
│   ├── error.tsx                     # 전역 오류 폴백 UI (F010)
│   ├── api/business-info/route.ts    # 발행자 정보 조회 API (error.tsx에서 사용)
│   ├── invoice/[id]/
│   │   ├── page.tsx                  # 인보이스 상세 (F001~F004, ISR)
│   │   ├── loading.tsx                # 로딩 스켈레톤
│   │   ├── not-found.tsx              # 잘못된 ID 처리 (F010)
│   │   └── pdf/route.tsx              # PDF 다운로드 Route Handler (F003)
│   └── admin/                        # 관리자 견적서 목록 (V2, 인증 없음)
│       ├── layout.tsx                # robots noindex + AdminShell
│       ├── page.tsx                  # 견적서 목록 (A001, ISR revalidate 30s)
│       ├── loading.tsx                # 목록 스켈레톤
│       ├── not-found.tsx              # 관리자 전용 404
│       └── [...catchAll]/page.tsx    # 미매치 경로 → notFound() 위임
├── components/
│   ├── invoice/                      # 인보이스 도메인 컴포넌트
│   ├── admin/                        # 관리자 도메인 컴포넌트(목록 테이블/카드, 링크 복사 등)
│   ├── layout/                       # Header, Footer, Container
│   ├── navigation/                   # Main/Mobile 내비게이션
│   ├── providers/                    # ThemeProvider
│   └── ui/                           # shadcn/ui (수정 지양)
├── hooks/
│   └── use-copy-invoice-link.ts      # 클립보드 복사 + 3단계 폴백(A002)
├── lib/
│   ├── env.ts                        # 환경 변수 스키마 (Zod)
│   ├── invoice.ts                    # 화면·PDF 공용 유틸 (소계 계산, 상태 라벨, 공개 링크 생성 등)
│   ├── format.ts                     # 통화·날짜 포맷
│   ├── notion/                       # Notion API 클라이언트 + 데이터 매핑(단건·목록 조회)
│   └── pdf/                          # @react-pdf/renderer 문서 정의
└── types/                            # Invoice·InvoiceListItem 등 도메인 타입

assets/fonts/                          # PDF 임베드용 로컬 한글 폰트 (Noto Sans KR)
```

## 참고 문서

- [`docs/PRD.md`](docs/PRD.md) — 제품 요구사항
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 개발 로드맵 및 진행 상황
- [`docs/guides/deployment.md`](docs/guides/deployment.md) — Vercel 배포 가이드(관리자 영역 배포
  게이트 포함)
- [`docs/guides/regression-testing.md`](docs/guides/regression-testing.md) — 공개+관리자 여정 회귀
  테스트 시나리오
- [`docs/guides/notion-quickstart.md`](docs/guides/notion-quickstart.md)
- [`docs/guides/notion-filtering.md`](docs/guides/notion-filtering.md)
- [`docs/guides/nextjs-16.md`](docs/guides/nextjs-16.md)
- [`docs/guides/forms-react-hook-form.md`](docs/guides/forms-react-hook-form.md)
- [`docs/guides/component-patterns.md`](docs/guides/component-patterns.md)
- [`docs/guides/styling-guide.md`](docs/guides/styling-guide.md)
- [`docs/guides/project-structure.md`](docs/guides/project-structure.md)
