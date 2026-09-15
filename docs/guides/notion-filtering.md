# Notion API 복잡한 필터링 완전 가이드

이 가이드는 Notion API를 사용하여 강력한 필터링을 구현하는 방법을 다룹니다. 기본부터 고급 패턴까지, 실제 운영 중인 애플리케이션에서 사용할 수 있는 모든 내용을 포함합니다.

## 목차

1. [기본 개념](#기본-개념)
2. [필터 타입](#필터-타입)
3. [기본 필터링](#기본-필터링)
4. [복합 필터링 (AND/OR)](#복합-필터링)
5. [고급 필터링](#고급-필터링)
6. [성능 최적화](#성능-최적화)
7. [API 제한사항](#api-제한사항)
8. [오류 처리](#오류-처리)
9. [실전 예제](#실전-예제)

## 기본 개념

Notion API의 필터링은 **HTTP POST 요청**을 통해 `databases/:database_id/query` 엔드포인트로 전송됩니다.

### 기본 요청 구조

```typescript
const request = {
  filter?: Filter,        // 조건
  sorts?: Sort[],         // 정렬
  start_cursor?: string,  // 페이지네이션
  page_size?: number      // 한 번에 가져올 항목 수 (1-100)
}
```

### 응답 구조

```typescript
{
  object: 'list',
  results: [...],           // 조회된 페이지 배열
  next_cursor: 'abc123',    // 다음 페이지 커서 (없으면 null)
  has_more: true,           // 더 많은 데이터 있음
  type: 'page_or_database'
}
```

---

## 필터 타입

Notion API는 필드 타입에 따라 다른 필터 연산자를 사용합니다.

### 1. 텍스트 필터 (rich_text, title, text)

**연산자:**

- `equals` - 정확히 일치
- `does_not_equal` - 일치하지 않음
- `contains` - 포함 (부분 일치)
- `does_not_contain` - 포함하지 않음
- `starts_with` - ~로 시작
- `ends_with` - ~로 끝남
- `is_empty` - 비어있음
- `is_not_empty` - 비어있지 않음

```typescript
// 예: Title에 "invoice" 포함
{
  property: 'Title',
  rich_text: {
    contains: 'invoice'
  }
}
```

### 2. 숫자 필터

**연산자:**

- `equals` - 동일
- `does_not_equal` - 다름
- `greater_than` - 초과 (>)
- `less_than` - 미만 (<)
- `greater_than_or_equal_to` - 이상 (>=)
- `less_than_or_equal_to` - 이하 (<=)
- `is_empty` - 비어있음
- `is_not_empty` - 비어있지 않음

```typescript
// 예: 가격이 100 이상
{
  property: 'Price',
  number: {
    greater_than_or_equal_to: 100
  }
}
```

### 3. 날짜 필터

**연산자:**

**정확한 날짜:**

- `equals` - 정확히 같은 날
- `before` - 이전
- `after` - 이후
- `on_or_before` - 이전 또는 같음
- `on_or_after` - 이후 또는 같음

**상대적 날짜:**

- `past_week` - 지난 7일
- `past_month` - 지난 30일
- `past_year` - 지난 1년
- `next_week` - 앞으로 7일
- `next_month` - 앞으로 30일
- `next_year` - 앞으로 1년
- `this_week` - 이번 주
- `this_month` - 이번 달
- `this_year` - 올해

**특수:**

- `is_empty` - 비어있음
- `is_not_empty` - 비어있지 않음

```typescript
// 예: 2024-09-01 이후
{
  property: 'Created Date',
  date: {
    on_or_after: '2024-09-01'
  }
}

// 예: 지난 주
{
  property: 'Created Date',
  date: {
    past_week: {}
  }
}
```

### 4. 선택 필터 (select, multi_select, status)

**select/status 연산자:**

- `equals` - 정확히 일치
- `does_not_equal` - 일치하지 않음
- `is_empty` - 비어있음
- `is_not_empty` - 비어있지 않음

**multi_select 연산자:**

- `contains` - 포함
- `does_not_contain` - 포함하지 않음
- `is_empty` - 비어있음
- `is_not_empty` - 비어있지 않음

```typescript
// 예: 상태 = Done
{
  property: 'Status',
  select: {
    equals: 'Done'
  }
}

// 예: 태그에 "important" 포함
{
  property: 'Tags',
  multi_select: {
    contains: 'important'
  }
}
```

### 5. 체크박스 필터

**연산자:**

- `equals` - 값 비교 (true/false)
- `does_not_equal` - 다름

```typescript
{
  property: 'IsArchived',
  checkbox: {
    equals: false
  }
}
```

---

## 기본 필터링

### 패턴 1: 단일 필터

```typescript
import { FilterBuilder } from '@/lib/notion/filters'
import { getNotionClient } from '@/lib/notion/client'

const notion = getNotionClient()

// 상태가 'Done'인 항목
const filter = new FilterBuilder().addSelect('Status', 'equals', 'Done').build()

const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

### 패턴 2: 범위 필터

```typescript
// 가격이 $100 ~ $500 사이
const filter = {
  and: [
    {
      property: 'Price',
      number: {
        greater_than_or_equal_to: 100,
      },
    },
    {
      property: 'Price',
      number: {
        less_than_or_equal_to: 500,
      },
    },
  ],
}

const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

또는 헬퍼 함수 사용:

```typescript
import { createNumberRangeFilter } from '@/lib/notion/filters'

const filter = createNumberRangeFilter('Price', 100, 500)
const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

### 패턴 3: 비어있음 확인

```typescript
// Assignee가 지정되지 않은 작업
const filter = new FilterBuilder().addText('Assignee', 'is_empty').build()

const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

---

## 복합 필터링

### AND 조합 (모든 조건을 만족)

FilterBuilder는 기본적으로 AND로 조합합니다.

```typescript
// 상태 = "In Progress" AND 우선순위 = "High"
const filter = new FilterBuilder()
  .addSelect('Status', 'equals', 'In Progress')
  .addSelect('Priority', 'equals', 'High')
  .build()

// 결과:
// {
//   and: [
//     { property: 'Status', select: { equals: 'In Progress' } },
//     { property: 'Priority', select: { equals: 'High' } }
//   ]
// }
```

### OR 조합 (하나 이상의 조건 만족)

```typescript
import { createMultiValueFilter } from '@/lib/notion/filters'

// 상태가 "Done" 또는 "Archived"
const filter = createMultiValueFilter('Status', 'select', ['Done', 'Archived'])

// 결과:
// {
//   or: [
//     { property: 'Status', select: { equals: 'Done' } },
//     { property: 'Status', select: { equals: 'Archived' } }
//   ]
// }
```

### 복합 AND/OR 조합

```typescript
import { ComplexFilterBuilder } from '@/lib/notion/filters'

// (상태 = "Done" AND 우선순위 = "High")
// OR (상태 = "In Review" AND 우선순위 = "Urgent")

const filter = new ComplexFilterBuilder('or') // 최상위는 OR
  .addConditionGroup('and', builder => {
    builder.addSelect('Status', 'equals', 'Done')
    builder.addSelect('Priority', 'equals', 'High')
  })
  .addConditionGroup('and', builder => {
    builder.addSelect('Status', 'equals', 'In Review')
    builder.addSelect('Priority', 'equals', 'Urgent')
  })
  .build()
```

### NOT 조합 (does_not_equal 사용)

```typescript
import { createNotFilter } from '@/lib/notion/filters'

// 상태가 "Cancelled"이 아닌 항목
const filter = createNotFilter('Status', 'select', 'Cancelled')

const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

**주의:** Notion API는 직접 NOT 연산자를 지원하지 않습니다. 대신 `does_not_equal`, `does_not_contain` 등을 사용합니다.

---

## 고급 필터링

### 1. 날짜 범위 필터

```typescript
import { createDateRangeFilter } from '@/lib/notion/filters'

// 2024-09-01 ~ 2024-09-30 사이의 항목
const filter = createDateRangeFilter('Created Date', '2024-09-01', '2024-09-30')

const results = await notion.queryDatabase('DATABASE_ID', {
  filter,
  sorts: [{ property: 'Created Date', direction: 'ascending' }],
})
```

### 2. 텍스트 검색 (여러 필드)

```typescript
import { createTextSearchFilter } from '@/lib/notion/filters'

// Title 또는 Description에 "invoice" 포함
const filter = createTextSearchFilter(['Title', 'Description'], 'invoice')

const results = await notion.queryDatabase('DATABASE_ID', { filter })
```

### 3. 조건부 필터 (동적 필터)

```typescript
// 사용자 입력에 따라 동적으로 필터 구성
function buildSearchFilter(params: {
  status?: string
  minPrice?: number
  maxPrice?: number
  dateFrom?: string
  dateTo?: string
}): Filter | undefined {
  const builder = new FilterBuilder()

  if (params.status) {
    builder.addSelect('Status', 'equals', params.status)
  }

  if (params.minPrice !== undefined) {
    builder.addNumber('Price', 'greater_than_or_equal_to', params.minPrice)
  }

  if (params.maxPrice !== undefined) {
    builder.addNumber('Price', 'less_than_or_equal_to', params.maxPrice)
  }

  if (params.dateFrom && params.dateTo) {
    builder.addDate('Created Date', 'on_or_after', params.dateFrom)
    builder.addDate('Created Date', 'on_or_before', params.dateTo)
  }

  return builder.build()
}

// 사용
const filter = buildSearchFilter({
  status: 'Done',
  minPrice: 100,
  maxPrice: 500,
})
```

### 4. 정렬 (Sort)

```typescript
const sorts = [
  { property: 'Priority', direction: 'descending' }, // 1차 정렬
  { property: 'Due Date', direction: 'ascending' }, // 2차 정렬
  { property: 'Created Date', direction: 'descending' }, // 3차 정렬
]

const results = await notion.queryDatabase('DATABASE_ID', {
  filter,
  sorts,
})
```

**정렬 방향:**

- `ascending` - 오름차순 (A→Z, 1→9, 과거→현재)
- `descending` - 내림차순 (Z→A, 9→1, 현재→과거)

---

## 성능 최적화

### 1. 페이지네이션 (Pagination)

```typescript
// 수동 페이지네이션
let cursor = undefined
let hasMore = true
const allResults = []

while (hasMore) {
  const response = await notion.queryDatabase('DATABASE_ID', {
    filter,
    start_cursor: cursor,
    page_size: 100, // 최대값
  })

  allResults.push(...response.results)
  cursor = response.next_cursor
  hasMore = response.has_more

  // API 레이트 제한을 피하기 위해 지연
  if (hasMore) {
    await new Promise(r => setTimeout(r, 100))
  }
}
```

또는 자동 페이지네이션:

```typescript
// 모든 데이터 자동으로 가져오기
const allResults = await notion.getAllPages('DATABASE_ID', filter)

// 또는 반복자 사용 (메모리 효율적)
for await (const page of notion.iteratePages('DATABASE_ID', filter)) {
  // 각 페이지 처리
  console.log(page.id)
}
```

### 2. 페이지 크기 최적화

```typescript
// page_size는 1 ~ 100 사이
// 기본값: 100 (권장)
const results = await notion.queryDatabase('DATABASE_ID', {
  filter,
  page_size: 100, // 최대값 사용
})
```

### 3. 필터와 정렬 조합으로 API 호출 최소화

```typescript
// ❌ 나쁜 예: 가져온 후 클라이언트에서 필터링
const allData = await notion.getAllPages('DATABASE_ID')
const filtered = allData.filter(item => item.price > 100)

// ✅ 좋은 예: 서버에서 필터링
const filter = new FilterBuilder()
  .addNumber('Price', 'greater_than_or_equal_to', 100)
  .build()

const filtered = await notion.queryDatabase('DATABASE_ID', {
  filter,
  page_size: 100,
})
```

### 4. 캐싱 전략

```typescript
import { unstable_cache } from 'next/cache'
import { getNotionClient } from '@/lib/notion/client'

// 데이터를 1시간 캐시
export const getCachedInvoices = unstable_cache(
  async () => {
    const notion = getNotionClient()
    const filter = new FilterBuilder()
      .addSelect('Status', 'equals', 'Done')
      .build()

    return notion.queryDatabase('DATABASE_ID', { filter })
  },
  ['invoices-done'],
  { revalidate: 3600 } // 1시간
)

// 페이지에서 사용
const data = await getCachedInvoices()
```

### 5. 배치 요청

```typescript
// 여러 데이터베이스에서 동시에 데이터 가져오기
const [invoices, expenses] = await Promise.all([
  notion.queryDatabase('INVOICES_DB_ID', { filter: invoiceFilter }),
  notion.queryDatabase('EXPENSES_DB_ID', { filter: expenseFilter }),
])
```

---

## API 제한사항

### 1. 레이트 제한 (Rate Limiting)

- **한도**: 초당 3개 요청 (기본)
- **응답**: HTTP 429 (Too Many Requests)
- **복구**: `Retry-After` 헤더에 초 단위 대기 시간 명시

```typescript
// 클라이언트는 자동으로 재시도를 처리합니다
const notion = new NotionClient()

// 필요시 재시도 설정 변경
notion.setRetryConfig(
  5, // 최대 재시도 횟수
  500 // 초기 대기 시간 (ms)
)
```

### 2. 필터 깊이 제한

- **최대 깊이**: 중첩된 필터 구조는 너무 깊으면 안 됨
- 권장: 2~3 단계까지만 중첩

```typescript
// ✅ 좋은 예
const filter = {
  and: [
    { ... },
    { or: [ { ... }, { ... } ] }
  ]
}

// ❌ 피해야 할 예 (너무 깊음)
const filter = {
  and: [
    { or: [
      { and: [
        { or: [ ... ] }
      ]}
    ]}
  ]
}
```

### 3. 페이지 크기 제한

- **최소**: 1
- **최대**: 100
- **기본**: 100 (권장)

### 4. API 버전

현재 권장 버전: `2024-06-15`

```typescript
const notion = new NotionClient()
// 버전은 자동으로 설정됨
```

### 5. 데이터 타입 호환성

특정 필드 타입에서만 특정 필터가 작동합니다.

| 필드 타입              | 지원 연산자                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| title, rich_text, text | contains, does_not_contain, equals, does_not_equal, starts_with, ends_with, is_empty, is_not_empty                                                                             |
| number                 | equals, does_not_equal, greater_than, less_than, greater_than_or_equal_to, less_than_or_equal_to, is_empty, is_not_empty                                                       |
| date                   | equals, before, after, on_or_before, on_or_after, past_week, past_month, past_year, next_week, next_month, next_year, this_week, this_month, this_year, is_empty, is_not_empty |
| select, status         | equals, does_not_equal, is_empty, is_not_empty                                                                                                                                 |
| multi_select           | contains, does_not_contain, is_empty, is_not_empty                                                                                                                             |
| checkbox               | equals, does_not_equal                                                                                                                                                         |

---

## 오류 처리

### 1. API 키 검증

```typescript
const notion = new NotionClient()

const isValid = await notion.validateApiKey()
if (!isValid) {
  throw new Error('유효하지 않은 Notion API 키')
}
```

### 2. 필터 유효성 검사

```typescript
import { validateFilter } from '@/lib/notion/filters'

const filter = buildSomeFilter()
if (!validateFilter(filter)) {
  throw new Error('유효하지 않은 필터 형식')
}
```

### 3. 오류 처리

```typescript
try {
  const results = await notion.queryDatabase('DATABASE_ID', { filter })
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('429')) {
      // 레이트 제한 - 나중에 재시도
      console.error('API 레이트 제한. 나중에 다시 시도하세요.')
    } else if (error.message.includes('401')) {
      // 인증 실패
      console.error('인증 실패. API 키를 확인하세요.')
    } else if (error.message.includes('404')) {
      // 데이터베이스를 찾을 수 없음
      console.error('데이터베이스를 찾을 수 없습니다.')
    } else {
      console.error('API 오류:', error.message)
    }
  }
}
```

---

## 실전 예제

### 예제 1: 인보이스 검색

```typescript
async function searchInvoices(params: {
  status?: string
  minAmount?: number
  maxAmount?: number
  clientName?: string
  dateFrom?: string
  dateTo?: string
}) {
  const notion = new NotionClient()

  const filter = new ComplexFilterBuilder('and')

  // 상태
  if (params.status) {
    filter.addCondition({
      property: 'Status',
      select: { equals: params.status },
    })
  }

  // 금액 범위
  if (params.minAmount !== undefined) {
    filter.addCondition({
      property: 'Amount',
      number: { greater_than_or_equal_to: params.minAmount },
    })
  }

  if (params.maxAmount !== undefined) {
    filter.addCondition({
      property: 'Amount',
      number: { less_than_or_equal_to: params.maxAmount },
    })
  }

  // 클라이언트 이름
  if (params.clientName) {
    filter.addCondition({
      property: 'Client Name',
      rich_text: { contains: params.clientName },
    })
  }

  // 날짜 범위
  if (params.dateFrom) {
    filter.addCondition({
      property: 'Created Date',
      date: { on_or_after: params.dateFrom },
    })
  }

  if (params.dateTo) {
    filter.addCondition({
      property: 'Created Date',
      date: { on_or_before: params.dateTo },
    })
  }

  const results = await notion.queryDatabase('INVOICES_DB_ID', {
    filter: filter.build(),
    sorts: [
      { property: 'Amount', direction: 'descending' },
      { property: 'Created Date', direction: 'descending' },
    ],
  })

  return results
}
```

### 예제 2: 일일 보고서

```typescript
async function generateDailyReport() {
  const notion = new NotionClient()
  const today = new Date().toISOString().split('T')[0]

  // 오늘 생성된 모든 항목
  const filter = new FilterBuilder()
    .addDate('Created Date', 'equals', today)
    .build()

  const items = await notion.getAllPages('DATABASE_ID', filter)

  // 통계 계산
  const stats = {
    totalItems: items.length,
    byStatus: {} as Record<string, number>,
    totalAmount: 0,
  }

  for (const item of items) {
    const status = item.properties.Status?.select?.name || 'Unknown'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

    if (item.properties.Amount?.number) {
      stats.totalAmount += item.properties.Amount.number
    }
  }

  return stats
}
```

### 예제 3: 기한 초과 알림

```typescript
async function checkOverdueItems() {
  const notion = new NotionClient()
  const today = new Date().toISOString().split('T')[0]

  // 상태 = "Pending" AND 기한일 < 오늘
  const filter = new ComplexFilterBuilder('and')
    .addCondition({
      property: 'Status',
      select: { equals: 'Pending' },
    })
    .addCondition({
      property: 'Due Date',
      date: { before: today },
    })
    .build()

  const overdueItems = await notion.getAllPages('DATABASE_ID', filter)

  // 알림 발송
  for (const item of overdueItems) {
    console.log(
      `[경고] 기한 초과: ${item.properties.Title?.title[0]?.plain_text}`
    )
  }

  return overdueItems
}
```

---

## 최종 체크리스트

- [ ] 환경 변수 `NOTION_API_KEY` 설정 확인
- [ ] 필터 형식이 올바른지 검증
- [ ] page_size는 100 (최대값) 사용
- [ ] 많은 데이터는 페이지네이션 처리
- [ ] API 호출 사이에 지연 추가 (레이트 제한 방지)
- [ ] 오류 처리 구현
- [ ] 캐싱 전략 고려
- [ ] 성능 모니터링 추가

---

## 참고 자료

- [Notion API 공식 문서](https://developers.notion.com)
- [Database Query 엔드포인트](https://developers.notion.com/reference/post-database-query)
- [필터링 참고](https://developers.notion.com/reference/database-query-filter-condition)
- [정렬 참고](https://developers.notion.com/reference/database-query-sort)
