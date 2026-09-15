# Next.js 16 개발 지침 (Invoice Web MVP)

이 문서는 이 프로젝트의 Next.js 기준 가이드다. 설치 버전은 **Next.js 16.3.4 + React 19.2.8 + TypeScript 5**.
`nextjs-15.md` 는 15→16 에서 **바뀌지 않은** 일반 패턴(Server Components 우선, Streaming/Suspense,
Route Groups, Parallel/Intercepting Routes, `after()`, 캐시 태그 등) 참고용으로만 유지한다.
아래와 충돌하면 이 문서가 우선한다.

## 15 → 16 마이그레이션 델타 (이 저장소 기준)

### 1. 비동기 Request API — 동기 접근 완전 제거 (Breaking)

15 에서 "임시 동기 호환"이 있던 API가 16 에서는 **오직 비동기**다.
대상: `cookies()`, `headers()`, `draftMode()`, 그리고 `layout` / `page` / `route` / `default` /
메타데이터 파일(`opengraph-image`, `icon` 등)의 `params`, `page` 의 `searchParams`.

```tsx
// ✅ 16 필수 형태 (이 프로젝트는 이미 이렇게 되어 있음)
interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params
  // ...
}
```

- `route.ts`(Route Handler)에서도 `params` 는 `await` 필수 — Task 009 PDF 엔드포인트 구현 시 주의.
- 자동 변환이 필요하면: `npx @next/codemod@latest next-async-request-api .`

### 2. `middleware.ts` → `proxy.ts`

요청 가로채기 파일 관례가 바뀌었다. 파일명 `proxy.ts`, export 함수명 `proxy`
(`export function proxy(request: NextRequest)`), 설정 객체는 동일하게 `export const config`.

- **현재 이 프로젝트에는 미들웨어/프록시 파일이 없다.** 새로 만들 일이 생기면 `proxy.ts` 로 만든다.
- 변환 코드모드: `npx @next/codemod@latest middleware-to-proxy .`

### 3. Turbopack 설정 최상위화

`experimental.turbopack` → **`turbopack`** (최상위). 이 프로젝트 `next.config.ts` 는 이미 최상위.

```ts
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() }, // 상위 lockfile 오추론 방지
}
```

`npm run dev` / `npm run build` 는 `--turbopack` 플래그로 Turbopack 을 쓴다 (16 에서 안정).

### 4. ESLint — `next lint` 제거, flat config 직접 사용

16 에서 `next lint` 명령과 `next.config` 의 `eslint` 옵션이 제거됐다. `lint` 스크립트는
`eslint .` 이고, `eslint-config-next` 가 flat config 를 직접 제공한다.

```js
// eslint.config.mjs — 이 프로젝트의 구성
import next from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = [
  ...next,
  ...nextTypeScript,
  prettier,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
]
export default eslintConfig
```

- `@eslint/eslintrc` 의 `FlatCompat` 은 더 이상 쓰지 않는다 (ESLint 10 에서 깨지고, 9 에서도 비권장).
- **ESLint 버전은 9.x(`^9.39.5`)로 고정한다.** ESLint 10 은 `eslint-plugin-react@7.37.x`(eslint-config-next
  전이 의존성)와 비호환(`context.getFilename is not a function`). 생태계 대응 후 승격.

### 5. React 19.2

16 은 React 19.2 를 동봉하고 **React 18 을 deprecated** 처리한다(17 에서 제거 예정).
이 프로젝트는 `react`/`react-dom` `19.2.8`. `@types/react`/`@types/react-dom` 는 `package.json`
`overrides` 로 19.2.x 에 고정한다. React Compiler 지원이 stable 이 됐지만 이 프로젝트는 미도입.

### 6. Cache Components (`cacheComponents`) — 미도입

15 canary 의 `experimental.dynamicIO` / `experimental.ppr` 는 16 에서 `cacheComponents` 로 통합됐다.
opt-in 이며 **이 프로젝트는 켜지 않는다.**

- `@next/codemod upgrade` 가 넣는 `export const instant = false` (page/layout/default) 는
  `cacheComponents` 를 켰을 때만 의미가 있다. 도입 전까지는 넣지 않는다 (넣으면 코드 스타일상
  세미콜론·불필요 export 노이즈).
- 성능 최적화(Task 010)에서 캐싱 전략을 정할 때 `cacheComponents` vs 라우트 세그먼트
  `revalidate` / `unstable_cache` 를 비교 검토한다.

### 7. `agentRules` — 비활성화

16 은 `next dev` 실행 시 `CLAUDE.md` 말미에 `<!-- BEGIN:nextjs-agent-rules -->` 블록을
자동 주입한다(기본 on). 이 프로젝트는 에이전트 지침을 `CLAUDE.md` + `shrimp-rules.md` +
`docs/guides/*` 로 수동 관리하므로 `next.config.ts` 에서 껐다.

```ts
const nextConfig: NextConfig = {
  agentRules: false,
}
```

### 8. `tsconfig.json` 자동 재구성

`next build` 가 다음을 자동 적용한다(되돌려도 재적용됨 — 수용):

- `compilerOptions.jsx`: `"preserve"` → `"react-jsx"` (16 필수, React automatic runtime)
- `include` 에 `.next/dev/types/**/*.ts` 추가

## 런타임 / 환경 요구사항

- **Node.js ≥ 20.9.0** (18 지원 종료). `package.json` `engines` 는 아직 미명시 — 배포 전 명시 권장.
- **TypeScript ≥ 5.1.0**.
- 최소 브라우저: Chrome/Edge/Firefox 111+, Safari 16.4+.

## 업그레이드 절차 (재현용)

```bash
# 1) 공식 코드모드 (버전 상향 + 관례 변환, 비대화형 가능)
npx @next/codemod@latest upgrade latest

# 2) 비동기 Request API 잔여 변환이 필요하면
npx @next/codemod@latest next-async-request-api .

# 3) 검증
npm run typecheck && npm run lint && npm run build
```

- 코드모드가 `eslint` 를 10.x 로 올리면 `package.json` 에서 `^9.39.5` 로 되돌리고 `npm install`.
- 코드모드가 넣은 `export const instant = false` 는 `cacheComponents` 미도입 시 되돌린다.

## 변하지 않은 핵심 규칙 (재확인)

- App Router 만 사용. Pages Router 금지.
- 기본 Server Component. `'use client'` 는 상태·이벤트·브라우저 API·`next-themes`·RHF 최소 파일에만.
- Notion 접근 코드는 서버 전용 (`src/lib/notion/*` 를 `'use client'` 에서 import 금지).
- 동적 라우트 `params` 는 항상 `await`.
- 자세한 프로젝트 규칙은 `shrimp-rules.md`, 워크플로우는 `docs/ROADMAP.md`.
