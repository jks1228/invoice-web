# Development Guidelines

> Invoice Web MVP 전용 Coding Agent 운영 규칙. 이 문서는 일반 개발 지식을 설명하지 않는다.
> 이 프로젝트에서만 유효한 규칙·경로·금지사항만 정의한다.

## 프로젝트 개요

### 무엇을 만드는가

- Notion 데이터베이스에서 관리하는 **견적서(인보이스)** 를 클라이언트가 **공개 웹 링크**로 열람하고 **PDF로 다운로드**하는 단방향 뷰어.
- 로그인·회원가입·관리자 대시보드·결제·이메일 발송·다국어는 **범위 밖**이다. 해당 기능 코드를 추가하지 말 것.

### 도메인 용어 (코드·주석·커밋에서 이 표기를 고정 사용)

| 용어        | 의미                                                         | 코드 식별자                       |
| ----------- | ------------------------------------------------------------ | --------------------------------- |
| 발행자      | 견적서를 만든 프리랜서/소상공인                              | `BusinessInfo`, `getBusinessInfo` |
| 클라이언트  | 링크를 받아 견적서를 보는 사람                               | `client_name` 등                  |
| 인보이스 ID | `/invoice/{id}` 의 `id`. Notion page ID(UUID) 또는 커스텀 ID | `params.id`                       |

### 기능 ID (PRD·ROADMAP과 반드시 일치시킬 것)

- `F001` Notion 연동 / `F002` 상세 조회 / `F003` PDF 다운로드 / `F004` ID 기반 접근 / `F005` 반응형 / `F010` 오류 처리 / `F011` 홈 진입점.
- 새 기능 작업 시 커밋·작업 파일·ROADMAP에 해당 `Fxxx`를 명시한다. 새 `Fxxx`를 임의로 만들지 말 것 — PRD 갱신이 선행되어야 한다.

## 프로젝트 아키텍처

### 디렉토리 역할과 배치 규칙

| 경로                         | 넣어야 하는 것                                                                      | 넣지 말 것                                 |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| `src/app/`                   | 라우트 세그먼트(`page.tsx`, `layout.tsx`, `not-found.tsx`, `error.tsx`, `route.ts`) | 재사용 컴포넌트, 비즈니스 로직             |
| `src/components/ui/`         | shadcn/ui 생성 컴포넌트                                                             | 직접 작성한 도메인 컴포넌트, 비즈니스 로직 |
| `src/components/layout/`     | `header`, `footer`, `container` 류 페이지 골격                                      | 인보이스 표시 컴포넌트                     |
| `src/components/navigation/` | `main-nav`, `mobile-nav`                                                            | 그 외                                      |
| `src/components/providers/`  | React Context Provider (`theme-provider`)                                           | 그 외                                      |
| `src/components/invoice/`    | 인보이스 도메인 컴포넌트 (폼·프레젠테이션·스켈레톤)                                 | shadcn 원본                                |
| `src/lib/notion/`            | Notion API 접근 코드 (서버 전용)                                                    | 클라이언트 컴포넌트에서 import 되는 코드   |
| `src/lib/`                   | 순수 유틸(`utils.ts`), 환경검증(`env.ts`), 포맷터(`format.ts`), mock(`mock/`)       | React 컴포넌트                             |

- **금지**: `src/components/sections/`, `src/components/common/`, `src/components/shared/`, `src/components/misc/`, `src/hooks/`, `src/app/login/`, `src/app/signup/` 신설. (스타터킷 잔재이며 이 MVP에는 불필요)
- 컴포넌트가 한 라우트에서만 쓰이고 재사용 가능성이 없으면 그 라우트 폴더 안에 두지 말고 `src/components/invoice/`에 둔다 (이 프로젝트는 라우트 코로케이션을 쓰지 않는다).

### 아직 없으며, 생성 시 반드시 이 경로·이름을 쓸 파일

| 목적                         | 확정 경로                                                                                                                                                         | 관련 기능 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 인보이스 도메인 타입         | `src/types/invoice.ts` (`Invoice`, `InvoiceItem`, `BusinessInfo`, `InvoiceView`, `InvoiceLookupResult`)                                                           | F002      |
| Notion → 도메인 조회/매핑    | `src/lib/notion/invoices.ts` (`getInvoiceById`, `getBusinessInfo`, property 파서)                                                                                 | F001      |
| Notion property 이름 상수 맵 | `src/lib/notion/invoices.ts` 내 `INVOICE_PROPS` 상수                                                                                                              | F001      |
| 통화·날짜 포맷터             | `src/lib/format.ts` (`formatCurrency`, `formatDate`)                                                                                                              | F002      |
| 더미 데이터                  | `src/lib/mock/invoices.ts` (`getMockInvoiceById` — 실제 조회와 동일 시그니처)                                                                                     | Phase 2   |
| 인보이스 프레젠테이션        | `src/components/invoice/invoice-header.tsx`, `invoice-parties.tsx`, `invoice-items-table.tsx`, `invoice-summary.tsx`, `invoice-notes.tsx`, `invoice-skeleton.tsx` | F002      |
| Not Found UI                 | `src/app/invoice/[id]/not-found.tsx`                                                                                                                              | F010      |
| 에러 바운더리                | `src/app/error.tsx` 또는 `src/app/invoice/[id]/error.tsx`                                                                                                         | F010      |
| PDF 응답                     | `src/app/invoice/[id]/pdf/route.ts` (`Content-Disposition: attachment`, 파일명 `invoice-{invoice_number}.pdf`)                                                    | F003      |

- 새 이름을 임의로 짓기 전에 위 표를 확인한다. 표에 있으면 그 이름을 쓴다.

### import 규칙

- 항상 `@/` 접두사 사용. 상대 경로 `../../` 금지. (예외: 같은 폴더 내 `./container` 처럼 형제 파일)
- `@/*` 는 `./src/*` 로만 매핑된다 (`tsconfig.json`). `@/hooks`, `@/ui` 별칭은 `tsconfig`에 없으므로 사용 금지 — `@/components/ui/...` 로 쓴다.
- Notion 관련 심볼은 하위 파일이 아니라 배럴에서 import: `import { getNotionClient, FilterBuilder } from '@/lib/notion'`.

## 코드 스타일 규칙

`.prettierrc` / `eslint.config.mjs` 가 강제한다. 아래를 어기면 `npm run check-all` 이 실패한다.

- 세미콜론 **쓰지 않는다**.
- 문자열은 **작은따옴표**.
- 들여쓰기 2칸(스페이스), `printWidth` 80.
- 화살표 함수 단일 인자에 괄호 **없음**: `arr.map(x => x.id)` (O) / `arr.map((x) => x.id)` (X).
- `trailingComma: es5`.
- Tailwind 클래스 정렬은 `prettier-plugin-tailwindcss` 에 위임 — 수동 재정렬 금지.
- **`any` 금지.** 불명확한 외부 데이터는 `unknown` 으로 받고 파서/타입가드로 좁힌다 (Notion 응답이 대표 사례).
- 함수 컴포넌트·공개 함수는 반환 타입을 명시한다 (예: `export function InvoiceHeader(...): React.JSX.Element`).
- Props 타입은 `interface XxxProps` 로 분리한다.
- 주석은 **WHY만** 한 줄로. "무엇을 하는지"는 이름으로 표현한다.
- 파일명 `kebab-case`, 내보내는 컴포넌트 `PascalCase`, 함수 `camelCase`.
- 한 파일 300줄 초과 시 분할한다.

### export 규칙

- 라우트 `page.tsx` / `layout.tsx` / `route.ts` 는 `default export`.
- 그 외 컴포넌트·유틸은 **named export**. 같은 심볼을 named + default 로 동시 export 하지 않는다.
- `src/lib/notion/index.ts` 는 배럴이다. `src/lib/notion/` 에 공개 심볼을 추가하면 **같은 커밋에서 `index.ts` 의 `export` 목록도 갱신**한다.

## Notion 연동 규칙

- Notion 접근 코드는 **서버에서만 실행**한다. `src/lib/notion/*` 를 `'use client'` 파일에서 import 금지. Server Component / Server Action / Route Handler 에서만 호출한다.
- `NOTION_API_KEY`, `NOTION_DATABASE_ID` 는 **반드시 `src/lib/env.ts` 의 `env` 객체를 통해** 읽는다. 컴포넌트에서 `process.env.NOTION_*` 직접 접근 금지.
- 어떤 Notion 값에도 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- Notion 클라이언트는 `getNotionClient()` 싱글톤을 쓴다. `new NotionClient()` 직접 생성 금지 (테스트 제외, 그 경우 `resetNotionClient()` 사용).
- 재시도·페이지네이션은 `NotionClient` 에 이미 구현됨. `invoices.ts` 에서 `fetch` 를 다시 만들지 말고 `queryDatabase` / `getPage` / `getAllPages` 를 조합한다.
- Notion page `properties` 는 `Record<string, unknown>` 이다. `properties.Xxx.title[0].plain_text` 같은 체이닝을 그대로 쓰지 말고 `invoices.ts` 의 타입가드 파서(title/rich_text/number/date/select/status/relation)를 거친다.
- property 이름 문자열을 여러 곳에 흩뿌리지 않는다. `INVOICE_PROPS` 상수 맵 한 곳에서만 정의하고 참조한다.
- 조회 결과는 예외를 던지는 대신 유니온으로 반환한다: `{ ok: true; data } | { ok: false; reason: 'not_found' | 'invalid_id' | 'notion_error' }`.
- 상세 페이지 분기: `ok:false & not_found`/`invalid_id` → `notFound()` 호출, `notion_error` → 에러 바운더리로 throw.
- 필터가 필요하면 `FilterBuilder` / `ComplexFilterBuilder` 를 쓴다. 원시 필터 객체를 손으로 쓰지 않는다.

## 컴포넌트 구현 규칙

- 기본은 Server Component. `'use client'` 는 상태·이벤트·브라우저 API·`next-themes`·RHF 가 필요한 최소 파일에만 붙인다.
- `'use client'` 컴포넌트는 별도 파일로 분리하고, Server Component가 데이터를 prop 으로 내려준다. Notion 조회 결과를 클라이언트 컴포넌트에서 다시 fetch 하지 않는다.
- `src/components/ui/` 파일은 **수정하지 않는다**. 변형이 필요하면 `src/components/invoice/` 에 래퍼를 만들고 `cn()` 으로 클래스를 확장한다.
- 새 shadcn 컴포넌트는 `npx shadcn@latest add <name>` 로 추가한다 (`components.json`: new-york, baseColor neutral, lucide). 손으로 `ui/` 파일을 만들지 않는다.
- 상품/서비스 테이블에 shadcn `table` 이 필요하면 먼저 `npx shadcn@latest add table` 를 실행한다 (현재 미설치).
- 스타일: Tailwind 유틸리티만 사용. 인라인 `style` 금지. 색은 시맨틱 토큰(`bg-background`, `text-muted-foreground`, `border-border` 등)만 사용하고 `bg-white` / `text-gray-900` 같은 하드코딩·수동 `dark:` 이중지정 금지.
- 반응형은 모바일 우선(`md:`, `lg:` 로 확장). 상품 테이블은 모바일에서 가로 스크롤 컨테이너 또는 카드형 전환을 반드시 처리한다 (F005).
- 아이콘은 `lucide-react` 에서만 가져온다.
- 토스트는 `sonner` (`Toaster` 는 `layout.tsx` 에 이미 마운트됨). 다른 알림 라이브러리 추가 금지.

## 폼 규칙

- 폼은 `react-hook-form` + `@hookform/resolvers/zod` + `src/components/ui/form.tsx` 프리미티브 조합으로만 만든다.
- Zod 스키마는 폼 컴포넌트 파일 상단에 두거나, 서버와 공유해야 하면 `src/lib/` 하위 파일에 둔다. `z.infer` 로 타입을 파생한다.
- 데이터 변경·서버 조회는 Server Action 우선.
- 라우팅 이동은 `useRouter().push` + `encodeURIComponent` (예: `invoice-lookup-form.tsx`).

## 워크플로우 규칙

`docs/ROADMAP.md` 의 "개발 워크플로우"·"테스트 원칙"을 그대로 따른다. 핵심:

- 새 작업은 `/tasks` 디렉토리에 `XXX-description.md` 로 만든다 (예: `002-domain-types.md`). 마지막 완료 작업 파일을 형식 참고용으로 읽는다.
- 모든 작업 파일에 **`## 테스트 체크리스트`** 섹션을 ROADMAP 표준 템플릿으로 채운다. API 연동·비즈니스 로직·데이터 매핑·폼·PDF 작업은 정상 2+ / 오류 2+ / 엣지 2+ / 반응형 시나리오를 채운다.
- **구현 완료 직후 Playwright MCP 로 테스트를 수행**한다. 브라우저를 실제 구동해 각 체크리스트 항목을 실행하고, 통과 시 `[x]` 표기 + 결과 요약을 작업 파일에 기록한다.
- 전 항목 통과 전에는 다음 단계·다음 Task 로 진행하지 않는다. 실패 시 원인 수정 후 재실행한다.
- 각 단계 완료 후 중단하고 추가 지시를 기다린다.
- Task 완료 후 `docs/ROADMAP.md` 의 해당 항목을 `✅` 로 표시한다.
- 코드 제출 전 항상 `npm run check-all` 와 `npm run build` 를 통과시킨다.
- 라이브러리 문법·버전이 불확실하면 추측하지 말고 `context7` MCP 로 문서를 조회한다.

## 다중 파일 동기화 규칙

한 변경이 아래 파일들의 **동시 수정**을 요구한다.

| 변경 트리거                                          | 함께 수정해야 하는 파일                                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/notion/` 에 공개 심볼 추가/이름변경         | `src/lib/notion/index.ts` 의 `export` 목록                                                                                                      |
| `Invoice` / `InvoiceItem` / `BusinessInfo` 필드 변경 | `src/types/invoice.ts`, `src/lib/notion/invoices.ts` 매핑, `src/lib/mock/invoices.ts`, 해당 프레젠테이션 컴포넌트, `docs/PRD.md` 데이터 모델 표 |
| 새 환경 변수 추가                                    | `src/lib/env.ts` 스키마, `.env.example`, `README.md` 환경 변수 표                                                                               |
| 새 라우트 세그먼트 추가                              | `README.md` "주요 페이지" 표, 필요 시 `src/components/navigation/main-nav.tsx` · `mobile-nav.tsx`                                               |
| 기능(`Fxxx`) 상태 변화                               | `docs/ROADMAP.md`, `README.md` "핵심 기능" 표                                                                                                   |
| 새 npm 의존성 추가                                   | `package.json` (+ lockfile), 도입 이유를 작업 파일에 기록                                                                                       |
| `docs/PRD.md` 요구사항 변경                          | `docs/ROADMAP.md` 해당 Task                                                                                                                     |

## AI 의사결정 규칙

### 파일을 어디에 둘까

1. 라우트가 렌더링하는 진입점인가 → `src/app/<route>/`.
2. 인보이스를 화면에 그리거나 입력받는가 → `src/components/invoice/`.
3. 페이지 골격(헤더/푸터/컨테이너/내비)인가 → `src/components/layout/` 또는 `navigation/`.
4. Notion 접근인가 → `src/lib/notion/`.
5. React 없이 순수 함수인가 → `src/lib/`(포맷·유틸) 또는 `src/types/`(타입).
6. 위 어디에도 안 맞으면 새 폴더를 만들기 전에 사용자에게 확인한다.

### `'use client'` 를 붙일까

- `useState`/`useEffect`/`onClick`/`useForm`/`useTheme`/`useRouter`/`usePathname` 중 하나라도 쓰면 → 붙인다.
- 데이터만 받아 렌더링 → 붙이지 않는다.
- 애매하면 Server Component 로 두고 상호작용 부분만 자식 클라이언트 컴포넌트로 분리한다.

### 새 라이브러리를 넣을까

1. `package.json` 에 이미 유사 기능이 있는가 → 있으면 그것을 쓴다 (toast=sonner, 폼=RHF+Zod, 아이콘=lucide, 클래스병합=`cn`).
2. PDF 생성처럼 기존에 없는 능력인가 → 작업 파일에 후보·선정 이유를 적고, 서버사이드 방식을 우선한다 (`@react-pdf/renderer` 또는 Puppeteer/Playwright chromium print-to-pdf).
3. 그 외에는 의존성을 늘리지 않는다.

### 오류를 어떻게 표현할까

- 사용자 대상 상황(없는 ID / 잘못된 형식) → `notFound()` → `not-found.tsx`.
- 시스템 장애(Notion 5xx / 타임아웃 / 재시도 소진) → throw → `error.tsx`. 서버 로그와 사용자 메시지를 분리한다.
- 만료된(`due_date` 경과) 인보이스는 오류가 아니다. 조회를 허용하고 "기한 지남" 배지를 표시한다.

## 커밋 규칙

- 형식: `<이모지> <타입>: <한국어 설명>` (예: `✨ feat: 인보이스 상세 Notion 연동 (F001)`).
- 타입: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore`.
- 이모지 맵은 `.claude/commands/git/commit.md` 를 따른다.
- 명령형 어조("추가", not "추가함"), 첫 줄 72자 미만, 커밋 1개 = 목적 1개.
- 관련 없는 변경을 한 커밋에 섞지 않는다.

## 금지 사항 (요약)

- ❌ `src/lib/notion/*` 를 클라이언트 컴포넌트에서 import.
- ❌ 컴포넌트에서 `process.env.NOTION_*` 직접 접근 / `NEXT_PUBLIC_NOTION_*` 사용.
- ❌ `src/components/ui/` 파일 직접 수정, 손으로 `ui/` 파일 생성.
- ❌ `any` 타입, 세미콜론, 큰따옴표, 인라인 `style`, 하드코딩 색상(`bg-white` 등).
- ❌ 상대경로 `../../` import, `@/hooks`·`@/ui` 별칭.
- ❌ 로그인/회원가입/대시보드/결제/이메일/다국어 코드 추가.
- ❌ `sections/`, `common/`, `shared/`, `hooks/` 등 새 최상위 컴포넌트 폴더 신설.
- ❌ 구현만 하고 Playwright MCP 테스트 없이 다음 Task 진행.
- ❌ PRD 갱신 없이 새 `Fxxx` 기능 ID 생성.
- ❌ `tasks.json`·`.taskmaster/config.json` 수동 편집 (Task Master 사용 시).
