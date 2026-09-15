# Task 009: PDF 다운로드 기능

> Phase 3 · 핵심 기능 구현 · 구현 기능: F003

## 목표

상세 페이지에서 비활성 상태였던 "PDF 다운로드" 버튼을 실제로 동작하게 만든다. 현재 인보이스를
서버사이드에서 PDF로 렌더링해 다운로드할 수 있어야 한다.

## PDF 생성 방식 결정

ROADMAP은 `@react-pdf/renderer` 또는 Puppeteer/Playwright chromium print-to-pdf 중 선택하도록 열어뒀다.
사용자에게 확인한 결과 **`@react-pdf/renderer`**로 결정했다:

- Vercel 서버리스 배포(Task 011) 기준으로 헤드리스 브라우저(Puppeteer + `@sparticuz/chromium`) 없이
  순수 JS로 동작해 배포 크기·콜드스타트 부담이 없음
- 대신 화면(Tailwind/shadcn) 레이아웃과 100% 동일하지는 않다 — PDF 전용 레이아웃을 `@react-pdf/renderer`
  컴포넌트(`View`/`Text`)로 새로 구성했다(아래 "관련 파일" 참고)

## 관련 파일

| 파일                                         | 구분 | 내용                                                                                                      |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| `assets/fonts/NotoSansKR-Variable.ttf`       | 신규 | 한글 PDF 렌더링용 로컬 폰트(Google Fonts, OFL 라이선스). 원격 CDN 의존 없이 서버 파일시스템에서 직접 읽음 |
| `assets/fonts/NotoSansKR-OFL.txt`            | 신규 | 위 폰트의 라이선스 원문                                                                                   |
| `src/lib/pdf/invoice-document.tsx`           | 신규 | `@react-pdf/renderer` 컴포넌트로 작성한 PDF 전용 인보이스 레이아웃                                        |
| `src/app/invoice/[id]/pdf/route.tsx`         | 신규 | Route Handler: `getInvoiceById` → PDF 바이너리 응답(`Content-Disposition: attachment`)                    |
| `src/lib/invoice.ts`                         | 신규 | `resolveSubtotal`/`STATUS_LABEL`/`isOverdue` 공용 유틸(화면·PDF가 함께 씀, 아래 참고)                     |
| `src/components/invoice/invoice-header.tsx`  | 수정 | `STATUS_LABEL`/`isOverdue`를 `src/lib/invoice.ts`에서 import하도록 리팩터링(동작 변화 없음)               |
| `src/components/invoice/invoice-actions.tsx` | 수정 | Client Component로 전환, `fetch` 기반 다운로드 + 로딩 상태(`Loader2`) + 실패 시 `sonner` 토스트           |
| `src/app/invoice/[id]/page.tsx`              | 수정 | `InvoiceActions`에 `invoiceId`/`invoiceNumber` 전달, 소계 계산을 `resolveSubtotal`로 교체                 |
| `next.config.ts`                             | 수정 | `outputFileTracingIncludes`로 PDF 라우트에 폰트 파일 명시적 포함(아래 설계 결정 4번)                      |
| `package.json`                               | 수정 | `@react-pdf/renderer` 의존성 추가                                                                         |

## 설계 결정 및 근거

### 1. 한글 폰트: Noto Sans KR 가변 폰트를 로컬 파일로 임베드

`@react-pdf/renderer`는 기본 내장 폰트(Helvetica 등)가 한글을 지원하지 않아 별도 폰트 등록이 필수다.
`CLAUDE.md`의 "로컬 폰트 사용(외부 서버 의존도 제거)" 원칙에 따라, 런타임에 Google Fonts CDN을 매 PDF
요청마다 호출하는 대신 폰트 파일을 저장소에 내려받아 `assets/fonts/`에 커밋하고 파일시스템에서 직접
읽는다. 정적(굵기별 분리) 파일이 없어 가변 폰트 1개(`NotoSansKR[wght].ttf`, ~10MB)를 `normal`/`bold` 두
굵기 모두에 등록했다 — `@react-pdf/renderer`가 렌더링 시 실제 사용된 글자만 서브셋해 내장하므로, 최종
PDF 파일 크기는 원본 폰트 크기와 무관하게 작다(실측: 3항목 인보이스 1페이지 PDF가 약 11KB).

### 2. PDF 레이아웃은 화면 컴포넌트를 재사용하지 않고 새로 작성

`@react-pdf/renderer`의 `View`/`Text`는 Tailwind 클래스나 DOM을 쓸 수 없는 별도 렌더러라 기존
`invoice-header.tsx` 등을 그대로 재사용할 수 없다. `src/lib/pdf/invoice-document.tsx` 하나에 PDF 전용
스타일(`StyleSheet.create`)로 새로 작성했다. 대신 **데이터 가공 로직**(상태 라벨, 기한 지남 판정, 소계
재계산)은 `src/lib/invoice.ts`로 뽑아 화면과 PDF가 같은 유틸을 쓰도록 했다 — 레이아웃은 갈라져도 "무엇을
보여줄지"까지 갈라지면 두 곳에서 따로 버그가 날 수 있기 때문이다.

### 3. 다운로드는 `<a href>` 직접 연결 대신 `fetch` + Blob + 임시 링크

버튼 요구사항에 "다운로드 중 로딩 상태"가 있어, 단순 `<a href="/invoice/{id}/pdf" download>`로는 로딩
상태를 표현할 수 없다(브라우저 다운로드는 JS에서 진행 상태를 관찰할 수 없음). 대신 `invoice-actions.tsx`를
Client Component로 전환해 버튼 클릭 시 `fetch`로 PDF를 받아 `Blob` → `URL.createObjectURL` → 임시
`<a>` 클릭으로 다운로드를 트리거한다. 이 방식은 응답 실패(404/500)를 `response.ok`로 감지해 이미
프로젝트에 있는 `sonner` 토스트로 사용자에게 실패를 알릴 수 있다는 장점도 있다(기존엔 비활성 버튼이라
에러 처리 자체가 없었음).

### 4. `next.config.ts`에 `outputFileTracingIncludes` 추가

`@react-pdf/renderer`(정확히는 내부 `fontkit`)는 `Font.register`에 넘긴 로컬 경로를 **자신의 코드 안에서**
읽는다. 우리 Route Handler 소스에는 `fs.readFileSync(...)` 호출이 직접 보이지 않으므로, Next.js/Vercel의
빌드타임 자동 파일 트레이싱(`@vercel/nft`)이 이 폰트 파일을 서버리스 함수 번들에 자동으로 포함하지
못할 위험이 있다(로컬 `next dev`/`next start`에서는 프로젝트 루트 전체가 그대로 존재해 문제없이
작동하지만, Vercel 배포 시에는 트레이싱된 파일만 함수에 포함됨). `outputFileTracingIncludes: {
'/invoice/[id]/pdf': ['./assets/fonts/**'] }`로 명시해 두었고, `npm run build` 후
`.next/server/app/invoice/[id]/pdf/route.js.nft.json`에 `NotoSansKR-Variable.ttf`가 포함된 것을 직접
확인했다. **실제 Vercel 배포 검증은 Task 011 범위**(로컬 빌드 트레이스만으로는 100% 보장은 아님).

### 5. 파일명: ASCII 폴백 + RFC 5987 UTF-8 동시 제공

`Content-Disposition`의 `filename`은 일부 구형 클라이언트가 UTF-8을 잘못 해석할 수 있어
`filename="invoice-INV-2026-001.pdf"`(영숫자만 남긴 안전한 폴백)와
`filename*=UTF-8''invoice-INV-2026-001.pdf`(RFC 5987 인코딩)를 함께 내려준다. 현재 실제 데이터의
`invoiceNumber`는 ASCII라 두 값이 같지만, 향후 한글이 포함된 견적서 번호가 생겨도 깨지지 않는다.

## 구현 단계

1. [x] PDF 생성 방식 결정 (사용자 확인: `@react-pdf/renderer`)
2. [x] `npm install @react-pdf/renderer`
3. [x] 한글 폰트 확보: Noto Sans KR(OFL) 다운로드 후 `assets/fonts/`에 저장
4. [x] `src/lib/invoice.ts` 신규: `resolveSubtotal`/`STATUS_LABEL`/`isOverdue` (기존 페이지·헤더 컴포넌트의
       중복 로직을 이 기회에 통합)
5. [x] `src/lib/pdf/invoice-document.tsx` 작성 (헤더/발행자·클라이언트/항목 테이블/합계/참고사항, 페이지
       번호, 항목 행 단위 `wrap={false}`로 페이지 넘침 시 행 중간 절단 방지)
6. [x] `src/app/invoice/[id]/pdf/route.tsx` 작성 (성공 → PDF 응답, `not_found`/`invalid_id` → 404,
       `notion_error`/PDF 렌더링 실패 → 500)
7. [x] `src/components/invoice/invoice-actions.tsx`를 Client Component로 전환, 로딩 상태·토스트 추가
8. [x] `src/app/invoice/[id]/page.tsx`에서 `InvoiceActions`에 props 전달
9. [x] `next.config.ts`에 `outputFileTracingIncludes` 추가, 빌드 트레이스 매니페스트로 직접 확인
10. [x] `npm run typecheck` / `npm run lint` / `npm run build` 통과, `prettier --check` 통과
11. [x] Playwright MCP + `curl`로 실제 검증 (아래 테스트 체크리스트)
12. [x] `docs/ROADMAP.md` Task 009 완료 표시

## 수락 기준 (완료 조건)

- [x] 버튼 클릭 시 PDF 다운로드 트리거, `content-type: application/pdf` + `Content-Disposition: attachment`
- [x] 파일명 `invoice-{invoice_number}.pdf`
- [x] 존재하지 않는/형식 오류 ID로 PDF 요청 시 404 JSON 응답
- [x] 다운로드 중 버튼이 "다운로드 중..." + 스피너로 바뀌고 비활성화됨
- [x] 한글 텍스트가 PDF에서 정상 렌더링(글자 깨짐 없음) — 실제 PDF를 열어 직접 확인
- [x] `npm run typecheck` / `lint` / `build` 통과
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP + `curl`(응답 헤더/바이너리 검증) · 구현 완료 후 필수 수행

### 정상 흐름 (Happy Path)

- [x] 실제 인보이스(`INV-2026-001`) 페이지에서 "PDF 다운로드" 클릭 → 브라우저가 `invoice-INV-2026-001.pdf`
      파일을 실제로 다운로드함(Playwright MCP 다운로드 이벤트로 확인)
- [x] 다운로드된 PDF를 직접 열어 견적서 번호·클라이언트(ABC회사)·항목 3건·금액·소계/총액(₩5,000,000)·
      상태 배지("대기")·"기한 지남" 배지까지 모두 정확히 표시되고 한글이 깨지지 않음 확인

### 오류 처리

- [x] 형식 오류 ID(`/invoice/not-a-valid-id/pdf`) → 404 + `{"error": "견적서를 찾을 수 없습니다."}`
- [x] 형식은 맞지만 존재하지 않는 ID(`/invoice/aaaa...aaaa/pdf`) → 404 + 동일 오류 메시지
- [ ] Notion 조회 실패/PDF 렌더링 실패 → 500 + 사용자 메시지 — **코드 리뷰 수준 검증**: 500 분기와
      클라이언트의 `response.ok` 체크 → `toast.error(...)` 경로는 Task 007/008에서 이미 검증한 동일
      패턴(에러 boundary·기본 문구)과 같은 구조라 낮은 리스크로 판단, 실제 장애 재현은 생략

### 엣지 케이스

- [x] 항목 3건(다항목) 페이지 정상 렌더링, 금액 큰 자릿수(₩1,000,000+) 표기 정상
- [ ] 페이지 넘침(항목 다수로 2페이지 이상) — **미검증**: 실제 테스트 데이터가 3항목뿐이라 자연 재현
      불가. `wrap={false}`를 행 단위로 적용해 항목이 중간에 잘리지 않고 다음 페이지로 넘어가도록
      구현했고, `@react-pdf/renderer`의 표준 페이지네이션 동작(문서화된 기능)에 의존 — 코드 리뷰로 대체
- [x] 참고사항 없는 케이스(현재 데이터)에서 참고사항 섹션 자체가 렌더링되지 않음 확인(조건부 렌더링)

### 반응형 & 품질

- [x] 모바일(375×812)·데스크톱(1280×900)에서 "PDF 다운로드"/"홈으로" 버튼 정상 노출·레이아웃 깨짐 없음
- [x] 콘솔 에러 0건(신선한 데스크톱 로드 및 다운로드 클릭 기준)
- [x] `npm run build` 산출물의 파일 트레이싱 매니페스트에 폰트 파일 포함 확인(Vercel 배포 대비)

## 결과 요약

- `@react-pdf/renderer` 도입(사용자 결정: 서버리스 배포 친화성 우선, Puppeteer 계열 대신 선택).
- 한글 폰트(Noto Sans KR, OFL 라이선스)를 `assets/fonts/`에 로컬로 커밋해 임베드 — 외부 CDN 런타임
  의존 없음. 실제 서브셋 결과 3항목 인보이스 PDF가 약 11KB로 가벼움.
- `src/lib/pdf/invoice-document.tsx`: 화면과 별개의 PDF 전용 레이아웃(헤더/발행자·클라이언트/항목
  테이블/합계 강조 박스/참고사항/페이지 번호), 상태·기한지남 배지 포함.
- `src/lib/invoice.ts` 신규 도입: `resolveSubtotal`(Task 007에서 `page.tsx`에 있던 로직을 공용화),
  `STATUS_LABEL`/`isOverdue`(Task 008에서 `invoice-header.tsx`에 있던 로직을 공용화) — 화면과 PDF가
  같은 계산 결과를 보장.
- `src/app/invoice/[id]/pdf/route.tsx`: `getInvoiceById` → 사유별 404/500 분기 → `renderToBuffer`로
  PDF 생성 → `Content-Disposition`(ASCII 폴백 + RFC 5987 UTF-8) 헤더로 응답.
- `invoice-actions.tsx`를 Client Component로 전환: `fetch` + Blob 다운로드, 로딩 스피너, 실패 시
  `sonner` 토스트.
- `next.config.ts`에 `outputFileTracingIncludes` 추가 — react-pdf가 내부적으로 읽는 폰트 파일이 Next의
  자동 트레이싱에 잡히지 않는 문제를 미리 방지, 빌드 산출물의 `.nft.json`으로 실제 포함 확인.
- `typecheck`/`lint`/`build`/`prettier --check` 모두 통과. Playwright로 실제 다운로드 트리거·파일명
  확인, 다운로드된 PDF를 직접 열어 한글·배지·금액 정상 렌더링 확인, `curl`로 404 오류 케이스 확인,
  모바일/데스크톱 레이아웃 확인.
- **미검증(낮은 리스크로 판단)**: 실제 Notion 장애 상황의 500 응답(Task 007/008과 동일 코드 패턴이라
  생략), 다중 페이지 넘침(테스트 데이터가 1페이지 분량뿐 — `wrap={false}` 적용 및 react-pdf 표준
  페이지네이션에 의존), Vercel 실배포 환경에서의 폰트 트레이싱 최종 확인(Task 011에서 재확인 필요).
