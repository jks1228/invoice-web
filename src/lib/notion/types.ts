/**
 * Notion API 필터링 및 데이터베이스 관련 타입 정의
 */

// 필터 연산자
export type FilterOperator =
  | 'equals'
  | 'does_not_equal'
  | 'contains'
  | 'does_not_contain'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal_to'
  | 'less_than_or_equal_to'
  | 'is_empty'
  | 'is_not_empty'

// 논리 연산자 (AND, OR)
export type LogicalOperator = 'and' | 'or'

// 속성 타입
export type PropertyType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'status'
  | 'checkbox'
  | 'rich_text'
  | 'title'
  | 'people'
  | 'files'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'

// 기본 필터 인터페이스
export interface BaseFilter {
  property: string
}

// 텍스트 필터
export interface TextFilter extends BaseFilter {
  rich_text?: {
    contains?: string
    does_not_contain?: string
    equals?: string
    does_not_equal?: string
    starts_with?: string
    ends_with?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
  title?: {
    contains?: string
    does_not_contain?: string
    equals?: string
    does_not_equal?: string
    starts_with?: string
    ends_with?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
  text?: {
    contains?: string
    does_not_contain?: string
    equals?: string
    does_not_equal?: string
    starts_with?: string
    ends_with?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
}

// 숫자 필터
export interface NumberFilter extends BaseFilter {
  number?: {
    equals?: number
    does_not_equal?: number
    greater_than?: number
    less_than?: number
    greater_than_or_equal_to?: number
    less_than_or_equal_to?: number
    is_empty?: boolean
    is_not_empty?: boolean
  }
}

// 날짜 필터
export interface DateFilter extends BaseFilter {
  date?: {
    equals?: string
    before?: string
    after?: string
    on_or_before?: string
    on_or_after?: string
    past_week?: Record<string, never>
    past_month?: Record<string, never>
    past_year?: Record<string, never>
    next_week?: Record<string, never>
    next_month?: Record<string, never>
    next_year?: Record<string, never>
    this_week?: Record<string, never>
    this_month?: Record<string, never>
    this_year?: Record<string, never>
    is_empty?: boolean
    is_not_empty?: boolean
  }
}

// 선택(Select) 필터
export interface SelectFilter extends BaseFilter {
  select?: {
    equals?: string
    does_not_equal?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
  multi_select?: {
    contains?: string
    does_not_contain?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
}

// 체크박스 필터
export interface CheckboxFilter extends BaseFilter {
  checkbox?: {
    equals?: boolean
    does_not_equal?: boolean
  }
}

// 상태(Status) 필터
export interface StatusFilter extends BaseFilter {
  status?: {
    equals?: string
    does_not_equal?: string
    is_empty?: boolean
    is_not_empty?: boolean
  }
}

// 모든 필터 타입의 조합
export type PropertyFilter =
  | TextFilter
  | NumberFilter
  | DateFilter
  | SelectFilter
  | CheckboxFilter
  | StatusFilter

// 복합 필터 (AND/OR 조합)
export interface CompoundFilter {
  and?: (PropertyFilter | CompoundFilter)[]
  or?: (PropertyFilter | CompoundFilter)[]
}

// 전체 필터 조건
export type Filter =
  | PropertyFilter
  | CompoundFilter
  | (PropertyFilter | CompoundFilter)[]

// Notion API 요청 본문
export interface DatabaseQueryRequest {
  filter?: Filter
  sorts?: Sort[]
  start_cursor?: string
  page_size?: number
}

// 정렬
export interface Sort {
  property: string
  direction: 'ascending' | 'descending'
  timestamp?: 'created_time' | 'last_edited_time'
}

// Notion API 응답
export interface DatabaseQueryResponse<T = unknown> {
  object: 'list'
  results: T[]
  next_cursor: string | null
  has_more: boolean
  type: 'page_or_database'
  page?: unknown
  database?: unknown
}

// 페이지(항목) 기본 인터페이스
export interface NotionPage {
  object: 'page'
  id: string
  created_time: string
  last_edited_time: string
  created_by: {
    object: 'user'
    id: string
  }
  last_edited_by: {
    object: 'user'
    id: string
  }
  cover: unknown
  icon: unknown
  parent: {
    type: 'database_id' | 'page_id' | 'workspace'
    database_id?: string
    page_id?: string
  }
  archived: boolean
  properties: Record<string, unknown>
  url: string
  public_url: string | null
}

// API 클라이언트 설정
export interface NotionClientConfig {
  apiKey: string
  baseUrl?: string
  version?: string
}

// 필터 빌더 옵션
export interface FilterBuilderOptions {
  combineWith?: LogicalOperator
}
