# Task 019: 관리자 목록 성능 최적화 및 캐싱

> Phase 8 · 최적화 및 배포

## 목표

관리자 목록 조회의 캐싱 전략을 확정하고(이미 Task 017에서 구현한 정책의 실측 검증), 대량 데이터·필터
UI 확장 필요성을 현재 데이터 규모 기준으로 판단하며, Lighthouse로 `/admin`을 측정해 V1 기준선과 비교한다.

## 관련 파일

이 Task는 실측 후 "현재 규모에서는 변경 불필요"로 결론 나는 경우가 많아 코드 변경이 없을 수 있다(과설계
방지). 실제 변경 파일은 구현 단계에서 확정한다.

| 파일              | 구분 | 내용                                 |
| ----------------- | ---- | ------------------------------------ |
| `docs/ROADMAP.md` | 수정 | Task 019 완료 표시 및 결정 사항 기록 |

## 설계 결정 및 근거

### 1. 캐싱 전략: Task 017의 `revalidate=30` + `fetchCache='default-cache'` 유지(실측 검증)

V1 Task 010에서 확립한 방법론(연속 요청 응답 시간 비교)을 그대로 적용해 `/admin` 캐시 히트를
실측했다. 실측 결과는 아래 "결과 요약" 참고. 현재 실 데이터가 2건뿐이라 응답 자체가 원래도 빠르지만,
캐시 히트 시 Notion API 호출 자체가 생략되는지(레이턴시 감소 폭)로 판단한다. 별도 캐싱 정책 변경은
하지 않는다 — Task 017에서 이미 V1의 실측 교훈(`fetchCache` 없이는 `revalidate`가 무효)을 반영해
구현해뒀기 때문이다.

### 2. 페이지네이션/"더 보기" — 이번 규모에서는 보류, 확장 지점만 문서화

실제 Notion 데이터베이스에 현재 2건만 존재한다. `InvoiceListQuery.cursor`/`InvoiceListResult.nextCursor`
계약은 Task 013·017에서 이미 만들어 뒀으므로, 나중에 건수가 늘어나면 `admin/page.tsx`가
`searchParams`로 `cursor`를 받아 `getInvoiceList({ cursor })`를 호출하고 "더 보기" 버튼으로
`nextCursor`를 다음 요청에 넘기기만 하면 된다 — API 계약은 이미 페이지네이션을 지원하므로 UI만
추가하면 된다. 지금 만들면 실제로 테스트할 데이터도 없고 사용되지 않는 UI가 남는 과설계라 판단해
보류한다.

### 3. 클라이언트 측 정렬/상태 필터 UI — 보류

`getInvoiceList(query)`가 이미 `status` 필터를 서버에서 지원한다(Task 017). 클라이언트 측에 별도
정렬/필터 UI를 추가하면 서버 필터와 책임이 중복되거나 꼬일 위험이 있고, 현재 2건짜리 목록에는
필터링 자체가 실질적 효용이 없다. 실제 데이터가 늘어나 필요성이 확인되면 그때 `InvoiceListQuery`를
그대로 활용해 필터 UI(예: 상태 `Select` + `searchParams` 연동)를 추가한다.

### 4. Lighthouse 측정 방법 — V1 Task 010과 동일 방법론

`npm run build && npm run start`로 프로덕션 빌드를 띄운 뒤 `npx lighthouse http://localhost:3000/admin
--output=json --output-path=./lighthouse-admin.json --chrome-flags="--headless"`로 측정한다(모바일
시뮬레이션 기본값). 결과 리포트 파일은 저장소에 커밋하지 않고 수치만 이 문서에 남긴다. 관리자
페이지는 인증이 없어 `/admin`에 바로 접근 가능하므로 별도 로그인 절차가 필요 없다.

## 구현 단계

1. [x] 프로덕션 빌드(`npm run build`) 후 `npm start`로 실행
2. [x] `/admin` 연속 요청 응답 시간 측정(캐시 히트 확인, V1 Task 010 방법론과 동일)
3. [x] `npx lighthouse http://localhost:3000/admin` 실행, LCP/CLS/TBT/Performance 기록
4. [x] 페이지네이션·필터 UI 필요성 판단(위 설계 결정 2·3) — 이번 규모에서는 미구현, 확장 지점만 문서화
5. [x] `docs/ROADMAP.md` Task 019 완료 표시

## 수락 기준 (완료 조건)

- [x] `/admin` 캐시 히트가 응답 시간으로 실측 확인됨
- [x] Lighthouse LCP/CLS/TBT가 기록되고 V1 홈 기준선과 비교됨
- [x] 페이지네이션/필터 UI 결정과 근거가 문서화됨
- [x] Playwright MCP(또는 대체 브라우저 도구) 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: `npx lighthouse` + 브라우저 자동화(claude-in-chrome, Playwright MCP 세션 내 미연결)

### 정상 흐름

- [x] 캐시 히트 시 응답 단축 확인 — 프로덕션 빌드(`npm run build && npm start`)에서 `/admin` 연속
      4회 요청: 10ms → 5ms → 5.7ms → 5.2ms. 빌드 로그에서 `/admin`이 `○`(Static, ISR
      `revalidate: 30s`)로 완전히 정적 프리렌더된 것을 확인 — `/invoice/[id]`(동적 세그먼트라 매
      요청 시 서버 렌더링)와 달리 `/admin`은 동적 세그먼트가 없어 빌드 시점에 이미 정적 HTML로
      생성되고 이후 30초마다 백그라운드 재검증되는 구조라 응답이 항상 빠르다(V1 인보이스 상세의 캐시
      히트 시 166~198ms보다도 훨씬 빠름 — 더 유리한 캐싱 특성)
- [x] 데이터 최신성 유지 — `revalidate=30`이라 30초 이내 요청은 캐시, 이후는 재검증(Next.js 표준 ISR
      동작에 근거, V1 Task 010에서 동일 메커니즘 검증됨)

### 오류 처리

- [x] 캐시된 상태에서 Notion 장애 시 동작 — Task 017에서 이미 `notion_error` 폴백 경로를 실제로
      재현·검증했고(캐시 여부와 무관하게 호출 실패 시 동일 폴백 UI 경로를 타므로) 재검증 생략

### 엣지 케이스

- [x] 대량 건수·커서 경계 — 실 데이터가 2건뿐이라 재현 불가, 대신 위 설계 결정 2에서 커서 계약이
      이미 확장 가능한 형태로 준비되어 있음을 코드 리뷰로 확인

### 반응형/품질

- [x] 콘솔 에러 0건 — `claude-in-chrome`으로 프로덕션 빌드 `/admin` 재확인

## 결과 요약

**캐싱**: Task 017에서 구현한 `revalidate = 30` + `fetchCache = 'default-cache'`가 프로덕션 빌드에서
`/admin`을 완전한 정적(ISR) 라우트로 만든다는 것을 빌드 로그(`○ /admin  30s  1y`)와 실측 응답 시간
(연속 4회 10ms→5ms→5.7ms→5.2ms)으로 확인했다. 동적 세그먼트가 없는 목록 페이지라 `/invoice/[id]`
(V1, 동적 렌더링 + fetch 캐시)보다도 더 유리한 캐싱 특성을 가진다. 정책 변경 없이 유지하기로 결정.

**Lighthouse 측정치** (모바일 시뮬레이션, `npm run build && npm start` 프로덕션 빌드 기준):

| 페이지                     | Performance | LCP  | CLS | TBT   | FCP  |
| -------------------------- | ----------- | ---- | --- | ----- | ---- |
| V1 홈 (`/`, Task 010 기준) | 90          | 3.4s | 0   | 120ms | 0.8s |
| `/admin` (이번 측정)       | 89          | 3.6s | 0   | 100ms | 1.1s |

V1 기준선과 거의 동일한 수준으로 **회귀 없음**. `lcp-breakdown-insight` 감사로 LCP 지연 원인을
확인한 결과 TTFB는 16ms에 불과하고 나머지 약 2.2초는 "element render delay"(React 하이드레이션·
클라이언트 컴포넌트 실행 비용, 4x CPU 스로틀링 시뮬레이션 기준)로, Task 010에서 홈 페이지 LCP 지연의
원인으로 이미 식별하고 "이 프로젝트 전반의 후속 과제"로 남긴 것과 **동일한 근본 원인**이다. 관리자
페이지가 새로 만든 문제가 아니라 프로젝트 전체에 걸친 기존 특성이므로 이 Task에서 추가로 손대지
않는다.

**페이지네이션·필터 UI**: 실 데이터가 2건뿐이라 구현하지 않기로 결정(설계 결정 2·3). API 계약
(`InvoiceListQuery.cursor`/`status`)은 이미 확장 가능한 형태로 준비되어 있어, 데이터가 늘어나면 UI만
추가하면 된다.

이번 Task는 코드 변경 없이 실측·검증과 의사결정만 수행했다(Task 017에서 이미 올바른 캐싱을
구현해뒀기 때문).
