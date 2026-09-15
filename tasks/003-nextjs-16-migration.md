# Task 003: Next.js 15.5.3 → 16 마이그레이션

> Phase 1 · 애플리케이션 골격 구축 (후속 인프라 작업) · 구현 기능: 없음(프레임워크 업그레이드) · F001~F011 전반의 기반

## 목표

프로젝트를 Next.js 15.5.3에서 최신 안정 버전 Next.js 16(16.3.4)으로 올린다.
공식 `@next/codemod upgrade` 를 적용하고, 16의 breaking change(비동기 Request API 강제,
ESLint flat config, Turbopack 설정 최상위화 등)에 맞춰 설정을 정리한다.
기능 코드 변경은 범위 밖이며, 렌더링 결과와 검증 파이프라인이 15와 동일하게 동작해야 한다.

## 배경 (15 → 16 주요 변경점)

| 항목                        | 15                                   | 16                                                        | 이 프로젝트 영향                                        |
| --------------------------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| Node 최소 버전              | 18.18                                | **20.9**                                                  | 로컬 v24 → 영향 없음                                    |
| `params` / `searchParams`   | Promise + 동기 호환(임시)            | **Promise만, 동기 접근 완전 제거**                        | `invoice/[id]/page.tsx` 이미 `await params` → 영향 없음 |
| `middleware.ts`             | 지원                                 | `proxy.ts` 로 관례 변경                                   | 미들웨어 파일 없음 → 영향 없음                          |
| Turbopack 설정              | `experimental.turbopack`             | **`turbopack` 최상위**                                    | 이미 최상위 사용 중 → 영향 없음                         |
| ESLint                      | `next lint` + `.eslintrc`/FlatCompat | **ESLint CLI + flat config 직접 제공**                    | `eslint.config.mjs` 재작성 필요                         |
| `next.config` `eslint` 옵션 | 지원                                 | 제거                                                      | 사용 안 함 → 영향 없음                                  |
| React                       | 19 권장                              | **19.2 동봉, 18 deprecated**                              | 19.1 → 19.2.8 로 상향                                   |
| Cache Components            | `experimental.dynamicIO`/`ppr`       | `cacheComponents` (opt-in)                                | 미도입 — `instant` 코드모드 산출물은 되돌림             |
| `agentRules`                | 없음                                 | `next dev` 가 `CLAUDE.md` 에 규칙 블록 자동 주입(기본 on) | `agentRules: false` 로 비활성화 (문서는 수동 관리)      |

## 관련 파일

| 파일                            | 구분 | 내용                                                                                                                                                      |
| ------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                  | 수정 | `next` 16.3.4, `eslint-config-next` 16.3.4, `react`/`react-dom` 19.2.8, `@types/react(-dom)` 19.2.x, `overrides` 추가. `eslint` 는 9.x 유지(핀 `^9.39.5`) |
| `package-lock.json`             | 수정 | 위 반영 (codemod + `npm install`)                                                                                                                         |
| `eslint.config.mjs`             | 수정 | FlatCompat 제거 → `eslint-config-next/core-web-vitals` + `/typescript` + `eslint-config-prettier/flat` flat config                                        |
| `tsconfig.json`                 | 수정 | `next build` 가 `jsx: "react-jsx"` 로 변경, `.next/dev/types/**/*.ts` include 추가 (자동)                                                                 |
| `next.config.ts`                | 수정 | `agentRules: false` 추가                                                                                                                                  |
| `src/app/layout.tsx`            | 수정 | `cache-components-instant-false` 코드모드가 넣은 `export const instant = false` 되돌림                                                                    |
| `src/app/page.tsx`              | 수정 | 동일 되돌림                                                                                                                                               |
| `src/app/invoice/[id]/page.tsx` | 수정 | 동일 되돌림 (`await params` 는 이미 적용됨)                                                                                                               |
| `CLAUDE.md`                     | 수정 | 기술 스택 버전 문자열 갱신, 가이드 링크 `nextjs-16.md`, `agentRules` 자동 주입 블록 제거                                                                  |
| `docs/guides/nextjs-16.md`      | 신규 | 16 기준 개발 지침 + 15→16 마이그레이션 델타                                                                                                               |
| `docs/guides/nextjs-15.md`      | 수정 | 상단에 "16 가이드로 대체됨" 배너                                                                                                                          |
| `docs/ROADMAP.md`               | 수정 | 본 Task 항목 추가                                                                                                                                         |

## 설계 결정 및 근거

### 1. `@next/codemod@latest upgrade latest` 사용, 결과는 선별 채택

공식 코드모드를 실행해 버전 상향과 관례 변경을 자동 적용했다. 실행된 변환:
`middleware-to-proxy`, `remove-unstable-prefix`, `remove-experimental-ppr`,
`cache-components-instant-false`, `remove-partial-prefetch`. 이 중 소스 변환이 발생한 것은
`cache-components-instant-false` 뿐이며(`page`/`layout`/`default` 3개 파일에
`export const instant = false` 삽입), 나머지는 대상 없음(no-op)이었다.

### 2. `export const instant = false` 는 되돌린다

`instant` 세그먼트 설정은 `next.config` 의 `cacheComponents` 를 켰을 때만 의미가 있다
(Next 공식 문서: "purely additive — no stable breaking changes"). 이 프로젝트는
Cache Components 를 도입하지 않으므로 3개 파일의 `instant` export 와 동반 TODO 주석은
불필요한 노이즈(세미콜론 포함, 코드 스타일 위반)여서 제거했다. Cache Components 도입은
별도 의사결정 사항이다.

### 3. ESLint 는 9.x 로 고정한다

`@next/codemod upgrade` 가 `eslint` 를 `^9` → `10.10.0` 으로 올렸으나, `eslint-config-next@16.3.4`
의 전이 의존성 `eslint-plugin-react@7.37.x` 가 ESLint 10 에서
`context.getFilename is not a function` 으로 깨진다(ESLint 10 이 deprecated API 제거).
`eslint-config-next` peer 는 `eslint >=9` 이므로 `^9.39.5`(maintenance 태그)로 핀 고정한다.
ESLint 10 은 생태계 대응 후 별도 Task 로 승격한다.

### 4. `eslint.config.mjs` 는 FlatCompat 제거

Next 16 의 `eslint-config-next` 는 `dist/*.js` 로 flat config 를 직접 export 한다
(`.`, `./core-web-vitals`, `./typescript`, `./parser`). 기존 `@eslint/eslintrc` `FlatCompat`
경유 방식은 ESLint 10 에서 "Converting circular structure to JSON" 으로 실패하고,
9.x 에서도 더 이상 권장되지 않는다. 새 구성:

```js
import next from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = [...next, ...nextTypeScript, prettier, { ignores: [...] }]
```

`@eslint/eslintrc` devDependency 는 지금은 남겨둔다(다른 도구가 참조할 여지, 무해). 후속 정리 가능.

### 5. `agentRules: false`

Next 16 은 `next dev` 실행 시 `CLAUDE.md` 말미에 `<!-- BEGIN:nextjs-agent-rules -->` 블록을
자동 주입한다(기본 on). 이 프로젝트는 `CLAUDE.md` + `shrimp-rules.md` + `docs/guides/*` 로
에이전트 지침을 엄격히 수동 관리하고 "다중 파일 동기화 규칙"을 두므로, 추적 파일이
매 `npm run dev` 마다 변경되는 것은 규율에 반한다. `next.config.ts` 에서 비활성화하고
주입된 블록을 제거했다. (Next 기본 동작을 원하면 이 옵션을 지우면 된다.)

### 6. `tsconfig.json` 자동 변경은 수용

`next build` 가 `jsx: "preserve"` → `"react-jsx"`(16 필수), `.next/dev/types/**/*.ts` include
추가를 자동 수행한다. 되돌리면 빌드가 재적용하므로 그대로 두고 Prettier 로만 재정렬했다.

### 7. `params` 대응

`src/app/invoice/[id]/page.tsx` 는 Task 001 시점부터 `params: Promise<{ id: string }>` +
`const { id } = await params` 를 사용 중이라 16 의 동기 접근 제거에 이미 부합한다.
추가 코드모드(`next-async-request-api`) 불필요.

## 구현 단계

1. [x] `context7` 로 `/vercel/next.js` v16 업그레이드 가이드·codemod·breaking change 확인
2. [x] `npx @next/codemod@latest upgrade latest` 실행 (비대화형)
3. [x] 코드모드 산출물 검토: `instant` export 3건 되돌림
4. [x] `eslint.config.mjs` flat config 재작성 (FlatCompat 제거)
5. [x] ESLint 10 비호환 확인 → `eslint` `^9.39.5` 로 핀, `npm install`
6. [x] `next.config.ts` `agentRules: false` 추가
7. [x] `npm run typecheck` / `npm run lint` 통과
8. [x] `npm run build` 성공 (`tsconfig.json` 자동 변경 수용 후 재빌드 안정 확인)
9. [x] 신규/수정 파일 `prettier --write` (CRLF→LF 정규화 포함)
10. [x] `CLAUDE.md` 버전·링크 갱신, agent-rules 블록 제거
11. [x] `docs/guides/nextjs-16.md` 신설, `nextjs-15.md` 배너
12. [x] Playwright MCP 스모크
13. [x] 작업 파일·ROADMAP 갱신

## 수락 기준 (완료 조건)

- [x] `npm run typecheck` (tsc --noEmit) 통과
- [x] `npm run lint` (eslint .) 통과
- [x] `npm run build` 성공 — 라우트 `/`, `/_not-found`(정적), `/invoice/[id]`(동적) 정상
- [x] 마이그레이션이 만지거나 새로 만든 파일 `prettier --check` 통과
- [x] `next` 16.x, `react`/`react-dom` 19.2.x, `eslint-config-next` 16.x 설치 확인
- [x] `middleware`/`proxy` 없음, `params` 는 `await` 사용 — 16 관례 부합
- [x] `next dev` 가 `CLAUDE.md` 를 자동 수정하지 않음 (`agentRules: false`)
- [x] Playwright MCP 테스트 체크리스트 전 항목 통과

> **참고**: 저장소 전체 `npm run format:check` 는 이 Task 이전부터 미포맷 파일 약 58개
> (`.claude/*.md`, `docs/guides/*`, `src/components/ui/*`)와 `core.autocrlf=true` 로 인한
> CRLF 차이 때문에 실패하는 baseline 상태다. 이 Task 는 자신이 만지거나 생성한 파일만
> Prettier(LF) 를 통과시킨다.

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리
> (프레임워크 업그레이드 Task — 비즈니스 로직 시나리오 해당 없음 → 스모크 + 렌더 동등성 검증)

### 정상 흐름 (Happy Path)

- [x] 홈(`/`) 렌더링 정상 — 헤더 / "견적서 확인" 카드 / 인보이스 ID 입력 / 견적서 조회 버튼 / 푸터 (`next dev` 16.3.4)
- [x] 인보이스 상세(`/invoice/test-id`) 렌더링 정상 — "견적서 상세" 카드 / "인보이스 ID: test-id" / 홈으로 링크
- [x] 홈 폼에 UUID 입력 → "견적서 조회" 클릭 → `/invoice/{입력한 id}` 로 이동, 동적 `params` 값 정상 표시
- [x] `npm run build` 후 라우트 표에 `/`(정적), `/invoice/[id]`(동적) 정상 분류

### 오류 처리

- [x] 존재하지 않는 라우트(`/_not-found`) 정적 프리렌더 정상 (빌드 산출물 확인)
- [x] `params` 동기 접근 제거로 인한 런타임/타입 오류 없음 (typecheck + 상세 페이지 렌더)

### 엣지 케이스

- [x] 긴 UUID 형식 ID(`2f1a9c4b-1234-5678-90ab-cdef12345678`)로 상세 페이지 진입 시 그대로 표시
- [x] `next dev` 재기동 시 `CLAUDE.md` diff 재발생 없음 (`agentRules: false` 유효)

### 반응형 & 품질

- [x] 콘솔 에러 0건 · 경고 0건 (홈·상세·폼 이동 전 구간, 세션 누적 기준)
- [x] 주요 네트워크 요청 상태 코드 정상 (`/invoice/...` 200, 정적 자산 200/304)

## 결과 요약

- `@next/codemod@latest upgrade latest` 로 `next` 15.5.3 → **16.3.4**, `react`/`react-dom`
  19.1.0 → **19.2.8**, `eslint-config-next` 15.5.3 → **16.3.4**, `@types/react(-dom)` 19.2.x
  상향 + `overrides` 추가. 코드모드는 `middleware-to-proxy` 등 5종을 돌렸고 소스 변환은
  `cache-components-instant-false`(3파일) 뿐이었으며 이는 Cache Components 미도입이라 되돌림.
- **수동 작업**: `eslint.config.mjs` flat config 재작성(FlatCompat 제거), ESLint 10 비호환으로
  `eslint`를 `^9.39.5`로 핀, `next.config.ts` `agentRules: false`, `CLAUDE.md` 버전/링크/블록
  정리, `tsconfig.json` 자동 변경 Prettier 재정렬, 만진 파일 CRLF→LF 정규화.
- 검증: `typecheck` / `lint` 통과, `npm run build` 성공(재빌드 안정), Playwright MCP 스모크
  전 항목 통과(콘솔 에러·경고 0건, 폼→상세 이동 정상, 동적 `params` 정상).
- 후속: (1) ESLint 10 승격, (2) `@eslint/eslintrc` devDependency 제거 여부, (3) `engines.node`
  `>=20.9.0` 명시, (4) Cache Components(`cacheComponents`) 도입 검토는 별도 Task.
