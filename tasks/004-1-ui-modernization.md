# Task 004-1: 컨테이너 폭 통일 및 UI/UX 모던화

> Phase 2 · UI/UX 완성 (더미 데이터 활용) · Task 004 후속 폴리싱 (홈/오류 페이지를 넘어 전체 레이아웃·인보이스
> 상세·테이블까지 범위 확장)

## 목표

사용자 피드백 4가지를 반영한다.

1. 전체 페이지의 컨테이너 폭을 일관되게 통일
2. 컨테이너 폭을 축소 (현재 헤더/푸터 1280px 은 이 앱 규모에 비해 과함)
3. 견적 항목 테이블의 셀 간격을 여유 있게
4. 전반적으로 더 모던한 톤 (인보이스 상세를 "문서"처럼 카드로 분리, 합계 강조 등)

Notion 실데이터 연동(Task 007)·PDF(Task 009) 등 기능/로직 변경은 없다. 순수 스타일·레이아웃 리팩터링.

## 현재 상태 분석

- `Header`/`Footer`만 `Container`(기본 `size="lg"` = `max-w-7xl`, 1280px)를 사용 중.
- 홈 페이지(`src/app/page.tsx`)·인보이스 상세(`src/app/invoice/[id]/page.tsx`)·`not-found.tsx`는 `Container`를
  전혀 쓰지 않고 각자 다른 값(카드 `max-w-md`=448px, 상세 페이지 자체 `max-w-4xl`=896px)을 하드코딩 →
  헤더바(1280px)와 실제 콘텐츠 폭이 서로 달라 "폭이 일관되지 않다"는 인상을 준다.
- `Container`의 `size` prop(`sm/md/lg/xl/full`)은 현재 `lg` 외에는 아무도 쓰지 않는 미사용 유연성이다.
- `Table`(`components/ui/table.tsx`) 기본 패딩은 `TableHead: h-10 px-2`, `TableCell: p-2`로 shadcn 기본값
  그대로라 촘촘하다.
- 인보이스 상세 페이지는 배경 위에 `Separator`로만 섹션을 구분하는 밋밋한 리스트형 레이아웃이라 "문서"라는
  성격이 잘 드러나지 않는다.

## 관련 파일

| 파일                                             | 구분 | 내용                                                                    |
| ------------------------------------------------ | ---- | ----------------------------------------------------------------------- |
| `src/components/layout/container.tsx`            | 수정 | `size` variant 제거, 단일 폭(`max-w-4xl`, 896px)으로 단순화             |
| `src/app/page.tsx`                               | 수정 | `<Container>`로 감싸 좌우 패딩·최대폭을 헤더/푸터와 통일                |
| `src/app/invoice/[id]/page.tsx`                  | 수정 | 자체 `max-w-4xl` 대신 `<Container>` 재사용, 전체를 `Card`로 감싸 문서화 |
| `src/app/invoice/[id]/not-found.tsx`             | 수정 | `<Container>`로 감싸 좌우 패딩 통일                                     |
| `src/components/invoice/invoice-items-table.tsx` | 수정 | 헤더/셀 padding 확장, 금액·수량 컬럼 `tabular-nums`                     |
| `src/components/invoice/invoice-summary.tsx`     | 수정 | 합계 영역을 강조 박스(`bg-muted/50 rounded-lg`)로 감싸 총액 부각        |
| `docs/ROADMAP.md`                                | 수정 | Task 004-1 반영 및 완료 표시                                            |

## 설계 결정 및 근거

### 1. `Container`의 `size` variant 제거, 단일 폭으로 단순화

현재 `sm/md/lg/xl/full` 5개 옵션 중 실제로는 `lg`(기본값) 하나만 쓰인다. 이번에 페이지 콘텐츠도 같은
컴포넌트를 쓰게 되면 "여러 폭 중 하나를 고르는 유연성"보다 "앱 전체가 항상 같은 폭"이라는 불변식이 더
중요해진다. 안 쓰는 옵션을 남겨두면 나중에 실수로 다른 사이즈를 지정해 폭이 다시 어긋나는 회귀가 생길 수
있어, 지금 시점에 과감히 단일 상수로 정리한다.

### 2. 폭 값: `max-w-4xl`(896px)

기존 헤더/푸터(1280px) 대비 확연히 좁아져 "줄여달라"는 요청을 충족한다. 동시에 인보이스 상세 페이지가
이미 이 값(`max-w-4xl`)으로 Task 005 Playwright 테스트(모바일/데스크톱/다크모드)를 통과한 이력이 있어,
여백을 넓힌 5열 테이블을 넣어도 줄바꿈 없이 들어갈 여지가 검증된 값이다. 홈 페이지의 로그인폼류 카드는
계속 `max-w-md`로 그 안에서 중앙 정렬되므로 시각적으로 더 좁게 보이는 건 의도된 결과다(콘텐츠 성격이 다름).

### 3. 인보이스 상세를 `Card`로 감싸기

지금은 페이지 배경 위에 `Separator`로만 섹션이 나뉜 밋밋한 리스트다. 청구서라는 문서 성격을 살리기 위해
배경과 대비되는 카드(둥근 모서리 + 옅은 테두리/그림자, 이미 `components/ui/card.tsx`에 정의됨)로 감싸는
것이 "모던한 UI/UX" 요청에 가장 직접적으로 기여한다. 섹션 간 `Separator`는 카드 내부에서 유지한다.

### 4. 합계 강조 박스

여러 SaaS 인보이스 UI에서 흔한 패턴대로, 소계/세금/총액 블록을 옅은 배경(`bg-muted/50`) 박스로 살짝
구분해 총액에 시선이 가도록 한다.

### 5. 테이블 패딩은 `ui/table.tsx`가 아니라 사용처에서만 override

`components/ui/table.tsx`의 기본 패딩을 직접 바꾸면 이 앱에 앞으로 추가될 수 있는 다른(더 촘촘해야 할 수도
있는) 테이블에도 영향을 준다. 영향 범위를 지금 요청이 있는 견적 항목 테이블 하나로 최소화하기 위해
`invoice-items-table.tsx`의 `TableHead`/`TableCell` 사용 시 `className`으로만 패딩을 확장한다.

## 구현 단계

1. [x] `Container` 컴포넌트 단순화 (`size` prop 제거, `max-w-4xl` 고정 + 기존 반응형 패딩 유지)
2. [x] `Header`/`Footer` 정상 동작 확인 (별도 수정 불필요 — 기본값 소비만 하고 있었음)
3. [x] `src/app/page.tsx`를 `<Container>`로 감싸기 (내부 `Card`는 `max-w-md` 유지)
4. [x] `src/app/invoice/[id]/not-found.tsx`를 `<Container>`로 감싸기 (`error.tsx`도 동일 적용, Task 004
       완료 후 새로 생긴 파일이라 함께 반영)
5. [x] `src/app/invoice/[id]/page.tsx`를 `<Container>` + `Card`로 재구성 (섹션 간 `Separator` 유지, 카드
       내부 패딩 정리, `sm:p-8`로 데스크톱에서 여유 있게)
6. [x] `invoice-items-table.tsx`: `TableHead`/`TableCell`에 여유 패딩 추가, 단가/수량/금액 컬럼에
       `tabular-nums` 적용 — **계획 대비 조정**: 모바일에서 4열(항목명/단가/수량/금액)이 잘리는 회귀가
       발견되어 `px-4` 고정 대신 `px-3 sm:px-4`(반응형)로 변경 (아래 "구현 중 발견한 이슈" 참고)
7. [x] `invoice-summary.tsx`: 합계 블록을 강조 박스(`bg-muted/50 rounded-lg p-4`) 스타일로 변경, 숫자에
       `tabular-nums` 적용
8. [x] `npm run typecheck` / `npm run lint` / `npm run build` 통과, 신규·수정 파일 `prettier --check` 통과
9. [x] Playwright MCP로 홈 / 샘플 3건(`sample-001/002/003`) / `not-found` / `error.tsx` 페이지를
       모바일(375)·태블릿(768)·데스크톱(1280)·다크모드·라이트모드로 재검증
10. [x] `docs/ROADMAP.md`에 Task 004-1 반영 및 완료 표시

### 구현 중 발견한 이슈: 모바일 테이블 패딩 회귀

계획대로 `TableHead`/`TableCell`에 `px-4`를 고정 적용했더니, 375px 뷰포트에서 4개 컬럼(항목명/단가/수량/
금액, 설명 컬럼은 `sm:` 이상에서만 표시)의 패딩 총합이 늘어나면서 "금액" 헤더와 금액 값이 뷰포트 밖으로
잘리는 회귀가 Playwright 스크린샷으로 발견됐다. 원인은 패딩이 컬럼당 8px(기존 `px-2`)에서 16px(`px-4`)로
늘며 4컬럼 기준 총 64px 증가한 것. 데스크톱에서 "여유 있게"라는 요청과 모바일에서 "레이아웃 안 깨짐"이라는
기존 검증된 요구사항이 충돌하므로, `px-3 sm:px-4`(모바일은 소폭만 확장, `sm` 이상에서 목표 패딩 적용)로
수정해 재검증했다. 이제 모바일에서도 4개 컬럼이 잘림 없이 표시된다.

## 수락 기준 (완료 조건)

- [x] 헤더/푸터/홈/인보이스 상세/`not-found`/`error` 페이지가 모두 동일한 최대 폭(896px)·좌우 패딩을 가짐
- [x] 데스크톱(1280px) 뷰포트에서 기존 대비 콘텐츠 폭이 눈에 띄게 좁아짐 (1280px → 896px)
- [x] 견적 항목 테이블 셀 패딩이 기존 대비 명확히 넓어짐 (`sm` 이상, 모바일은 잘림 방지를 위해 소폭만)
- [x] 인보이스 상세가 카드 형태로 배경과 시각적으로 분리되고, 다크모드·라이트모드 모두 대비 정상
- [x] `npm run typecheck` / `lint` / `build` 통과
- [x] Playwright MCP 테스트 전 항목 통과

## 테스트 체크리스트

> 도구: Playwright MCP · 구현 완료 후 필수 수행 · 전 항목 통과 시에만 Task 완료 처리
> (UI 스타일링 전용 Task — 비즈니스 로직/API 변경 없음 → 오류 처리 섹션은 해당 없음)

### 정상 흐름 (Happy Path)

- [x] 홈 / 인보이스 상세(3개 mock) / `not-found` 페이지가 모두 동일 폭(896px)으로 정렬되어 렌더링
- [x] 데스크톱(1280px)에서 테이블 컬럼 간 여백이 기존 대비 육안으로 확장됨

### 오류 처리

- [x] 해당 없음 (UI 스타일링 전용, 비즈니스 로직 변경 없음)

### 엣지 케이스

- [x] 참고사항 장문(`sample-003`)·할인 음수(`sample-002`) 케이스 모두 카드 레이아웃 안에서 줄바꿈/정렬
      깨짐 없음 (태블릿 768px에서 확인)
- [x] 모바일(375px)에서 여유 패딩 적용 후에도 테이블이 정상 표시 — 1차 시도에서 잘림 회귀 발견 → `px-3
    sm:px-4`로 수정 후 재검증하여 정상 표시 확인

### 반응형 & 품질

- [x] 모바일(375×812)·태블릿(768×1024)·데스크톱(1280×900) 3개 뷰포트 레이아웃 정상
- [x] 다크모드·라이트모드 모두에서 카드 테두리/그림자/강조 박스 대비 정상
- [x] 콘솔 에러 0건 (신선한 데스크톱 뷰포트 로드 기준). 좁은 뷰포트에서의 최초 로드 시 나타나는 헤더
      네비게이션 hydration mismatch는 Task 004 결과 요약에 기록한 기존 이슈로 이 Task 범위 밖

## 결과 요약

- `Container`(`src/components/layout/container.tsx`)를 `size` variant 없는 단일 폭(`max-w-4xl`, 896px)
  컴포넌트로 단순화. 헤더/푸터가 자동으로 이 폭을 따르게 됨(기존 1280px에서 축소).
- 홈(`src/app/page.tsx`) · 인보이스 상세(`src/app/invoice/[id]/page.tsx`) · `not-found.tsx` · `error.tsx`
  네 페이지 모두 각자 하드코딩했던 폭 대신 동일한 `<Container>`를 사용하도록 통일.
- 인보이스 상세 페이지 전체를 `Card`(둥근 모서리+테두리+옅은 그림자)로 감싸 배경과 분리된 "문서" 톤 적용,
  데스크톱에서 내부 패딩을 `sm:p-8`로 넉넉하게 설정.
- `invoice-items-table.tsx`: 헤더/셀 패딩 확장(`sm` 이상 `px-4`, 모바일은 `px-3`로 소폭만) + 단가/수량/
  금액 컬럼에 `tabular-nums`로 숫자 자릿수 정렬.
- `invoice-summary.tsx`: 합계 영역을 `bg-muted/50 rounded-lg p-4` 강조 박스로 변경, 숫자 `tabular-nums`
  적용.
- **구현 중 회귀 발견 및 수정**: 테이블 패딩을 모바일까지 동일하게 `px-4`로 늘렸더니 375px에서 "금액"
  컬럼이 잘리는 문제를 Playwright 스크린샷으로 발견 → 반응형 패딩(`px-3 sm:px-4`)으로 조정해 해결.
- `typecheck`/`lint`/`build`/`prettier --check` 모두 통과. Playwright로 데스크톱(1280)/태블릿(768)/
  모바일(375) 3개 뷰포트, 다크·라이트모드, mock 3건(`sample-001/002/003`) 전부 확인. 콘솔 에러 0건(신선한
  데스크톱 로드 기준).
