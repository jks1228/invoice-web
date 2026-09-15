# Notion API 필터링 - 빠른 시작 가이드

Notion API 필터링을 5분 안에 시작하기.

## 1. 환경 설정

### API 키 생성

1. [Notion Developers](https://www.notion.so/my-integrations) 접속
2. "New Integration" 클릭
3. 통합명: `InvoiceWebApp`
4. 워크스페이스 선택
5. 생성 후 **API 토큰** 복사

### 환경 변수 설정

`.env.local` 파일에 추가:

```bash
NOTION_API_KEY=ntn_your_api_key_here
```

### 데이터베이스 접근 권한 설정

Notion에서:

1. 데이터베이스 열기
2. 우측 상단의 "..." (더보기) → Connections
3. 위에서 만든 Integration 선택

## 2. 가장 간단한 예제

```typescript
// app/api/invoices/route.ts
import { getNotionClient, FilterBuilder } from '@/lib/notion'

export async function GET() {
  const notion = getNotionClient()

  // 상태가 "Done"인 모든 인보이스
  const filter = new FilterBuilder()
    .addSelect('Status', 'equals', 'Done')
    .build()

  const results = await notion.queryDatabase('YOUR_DATABASE_ID', {
    filter,
  })

  return Response.json(results)
}
```

## 3. 자주 사용하는 패턴

### 패턴 A: 텍스트 검색

```typescript
import { FilterBuilder } from '@/lib/notion'

const filter = new FilterBuilder()
  .addText('Title', 'contains', '인보이스')
  .build()
```

### 패턴 B: 숫자 범위

```typescript
import { createNumberRangeFilter } from '@/lib/notion'

// 가격: $100 ~ $500
const filter = createNumberRangeFilter('Price', 100, 500)
```

### 패턴 C: 날짜 범위

```typescript
import { createDateRangeFilter } from '@/lib/notion'

// 2024-09-01 ~ 2024-09-30
const filter = createDateRangeFilter('Created Date', '2024-09-01', '2024-09-30')
```

### 패턴 D: 여러 선택값 (OR)

```typescript
import { createMultiValueFilter } from '@/lib/notion'

// 상태가 "Pending" 또는 "Overdue"
const filter = createMultiValueFilter('Status', 'select', [
  'Pending',
  'Overdue',
])
```

### 패턴 E: 복합 조건 (AND/OR)

```typescript
import { ComplexFilterBuilder } from '@/lib/notion'

// (Status = "Done" AND Priority = "High")
// OR (Status = "In Review" AND Priority = "Urgent")
const filter = new ComplexFilterBuilder('or')
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

## 4. React 컴포넌트에서 사용

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getNotionClient, FilterBuilder } from '@/lib/notion'

export function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const notion = getNotionClient()

        const filter = new FilterBuilder()
          .addSelect('Status', 'equals', 'Done')
          .build()

        const results = await notion.queryDatabase('DATABASE_ID', {
          filter,
          sorts: [{ property: 'Amount', direction: 'descending' }]
        })

        setInvoices(results.results)
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {invoices.map((invoice: any) => (
        <div key={invoice.id}>
          <h3>{invoice.properties.Title?.title[0]?.plain_text}</h3>
          <p>Amount: {invoice.properties.Amount?.number}</p>
        </div>
      ))}
    </div>
  )
}
```

## 5. Server Action 사용

```typescript
// app/actions/invoices.ts
'use server'

import {
  getNotionClient,
  FilterBuilder,
  ComplexFilterBuilder,
} from '@/lib/notion'

export async function searchInvoices(params: {
  status?: string
  minAmount?: number
  maxAmount?: number
}) {
  const notion = getNotionClient()

  const builder = new FilterBuilder()

  if (params.status) {
    builder.addSelect('Status', 'equals', params.status)
  }

  if (params.minAmount) {
    builder.addNumber('Amount', 'greater_than_or_equal_to', params.minAmount)
  }

  if (params.maxAmount) {
    builder.addNumber('Amount', 'less_than_or_equal_to', params.maxAmount)
  }

  const filter = builder.build()

  return notion.queryDatabase('DATABASE_ID', {
    filter,
    sorts: [{ property: 'Amount', direction: 'descending' }],
  })
}
```

```typescript
// app/components/search-form.tsx
'use client'

import { searchInvoices } from '@/app/actions/invoices'

export function SearchForm() {
  return (
    <form action={async (formData) => {
      const results = await searchInvoices({
        status: formData.get('status'),
        minAmount: formData.get('minAmount') ? Number(formData.get('minAmount')) : undefined,
        maxAmount: formData.get('maxAmount') ? Number(formData.get('maxAmount')) : undefined
      })
      console.log(results)
    }}>
      <input name="status" placeholder="Status" />
      <input name="minAmount" placeholder="Min Amount" type="number" />
      <input name="maxAmount" placeholder="Max Amount" type="number" />
      <button type="submit">Search</button>
    </form>
  )
}
```

## 6. 모든 데이터 가져오기 (자동 페이지네이션)

```typescript
// 수동으로 페이지네이션 처리하기
const notion = getNotionClient()
const filter = new FilterBuilder().addSelect('Status', 'equals', 'Done').build()

// 방법 1: getAllPages (한 번에 모두 가져오기)
const allInvoices = await notion.getAllPages('DATABASE_ID', filter)
console.log(`총 ${allInvoices.length}개`)

// 방법 2: iteratePages (메모리 효율적)
for await (const invoice of notion.iteratePages('DATABASE_ID', filter)) {
  console.log(invoice.id)
  // 각 항목 처리
}
```

## 7. 디버깅 팁

### 필터 JSON 확인

```typescript
import { filterToJson } from '@/lib/notion'

const filter = new FilterBuilder().addSelect('Status', 'equals', 'Done').build()

console.log(filterToJson(filter))
// 출력:
// {
//   "and": [
//     {
//       "property": "Status",
//       "select": {
//         "equals": "Done"
//       }
//     }
//   ]
// }
```

### 필터 유효성 검사

```typescript
import { validateFilter } from '@/lib/notion'

const filter = new FilterBuilder().addSelect('Status', 'equals', 'Done').build()

if (validateFilter(filter)) {
  console.log('✓ 유효한 필터')
} else {
  console.log('✗ 잘못된 필터')
}
```

### 특정 필드의 필터 찾기

```typescript
import { findFiltersByProperty } from '@/lib/notion'

const filter = new ComplexFilterBuilder()
  .addCondition({ property: 'Status', select: { equals: 'Done' } })
  .addCondition({ property: 'Amount', number: { greater_than: 100 } })
  .build()

const statusFilters = findFiltersByProperty(filter, 'Status')
console.log(statusFilters) // Status 필터만 반환
```

## 8. 성능 최적화

### 캐싱 적용

```typescript
// lib/notion/cache.ts
import { unstable_cache } from 'next/cache'
import { getNotionClient, FilterBuilder } from '@/lib/notion'

export const getCachedDoneInvoices = unstable_cache(
  async () => {
    const notion = getNotionClient()
    const filter = new FilterBuilder()
      .addSelect('Status', 'equals', 'Done')
      .build()

    return notion.queryDatabase('DATABASE_ID', { filter })
  },
  ['invoices-done'],
  { revalidate: 3600 } // 1시간마다 갱신
)
```

### 페이지 크기 최적화

```typescript
// page_size는 항상 100 (최대값) 사용
const results = await notion.queryDatabase('DATABASE_ID', {
  filter,
  page_size: 100, // ✓ 좋음
})

// 페이지네이션 시에도 최대값 사용
for await (const page of notion.iteratePages('DATABASE_ID', filter)) {
  // 자동으로 page_size = 100 사용
}
```

## 9. 오류 처리

```typescript
try {
  const results = await notion.queryDatabase('DATABASE_ID', { filter })
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      console.error('API 키가 잘못되었습니다.')
    } else if (error.message.includes('404')) {
      console.error('데이터베이스를 찾을 수 없습니다.')
    } else if (error.message.includes('429')) {
      console.error('API 레이트 제한 - 나중에 다시 시도하세요.')
    } else {
      console.error('API 오류:', error.message)
    }
  }
}
```

## 10. API 키 검증

```typescript
async function checkNotionConnection() {
  const notion = getNotionClient()
  const isValid = await notion.validateApiKey()

  if (isValid) {
    console.log('✓ Notion API 연결 성공')
  } else {
    console.log('✗ API 키가 유효하지 않습니다.')
  }
}
```

## 문제 해결

### "NOTION_API_KEY 환경 변수가 설정되지 않았습니다"

**해결:**

1. `.env.local` 파일 확인
2. `NOTION_API_KEY=ntn_...` 형식 확인
3. 개발 서버 재시작

### "401 Unauthorized"

**해결:**

1. API 키 다시 생성
2. 권한 범위 확인
3. 데이터베이스 연결 확인

### "404 Not Found"

**해결:**

1. 데이터베이스 ID 확인 (URL에서 `?v=` 이전 부분)
2. Integration 권한 설정 확인
3. 데이터베이스가 삭제되지 않았는지 확인

### "필터가 작동하지 않음"

**해결:**

1. `filterToJson(filter)` 로그 확인
2. 필드 이름 대소문자 확인
3. 필드 타입 확인 (select vs multi_select 등)

## 다음 단계

1. [완전 가이드](./notion-filtering.md) 읽기
2. [실전 예제](../notion/examples.ts) 분석
3. 프로젝트에 맞게 커스터마이징

## 지원하는 필터 타입

- ✓ 텍스트 (contains, equals, starts_with 등)
- ✓ 숫자 (greater_than, less_than 등)
- ✓ 날짜 (before, after, this_month 등)
- ✓ 선택 (select, multi_select, status)
- ✓ 체크박스 (true/false)
- ✓ 범위 (AND, OR 조합)

## 함수 참조

| 함수                      | 설명                    |
| ------------------------- | ----------------------- |
| `FilterBuilder`           | 기본 필터 구성          |
| `ComplexFilterBuilder`    | 복합 필터 (AND/OR 중첩) |
| `createDateRangeFilter`   | 날짜 범위               |
| `createMultiValueFilter`  | 여러 값 중 하나 (OR)    |
| `createNumberRangeFilter` | 숫자 범위               |
| `createTextSearchFilter`  | 텍스트 검색 (여러 필드) |
| `createNotFilter`         | NOT 조건                |
| `validateFilter`          | 필터 유효성 검사        |
| `filterToJson`            | 필터를 JSON으로         |

## 추가 자료

- [완전 가이드](./notion-filtering.md)
- [API 클라이언트 코드](../notion/client.ts)
- [필터 빌더 코드](../notion/filters.ts)
- [실전 예제](../notion/examples.ts)
- [Notion 공식 API 문서](https://developers.notion.com)
