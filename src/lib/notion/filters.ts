/**
 * Notion API 필터링 유틸리티 및 필터 빌더
 * 복잡한 필터 조건을 쉽게 구성하기 위한 헬퍼 함수들
 */

import type {
  PropertyFilter,
  CompoundFilter,
  Filter,
  LogicalOperator,
  DateFilter,
  TextFilter,
  NumberFilter,
  SelectFilter,
  CheckboxFilter,
  StatusFilter,
} from './types'

/**
 * 필터 빌더 클래스 - 유연한 필터 생성
 *
 * 사용 예:
 * const filter = new FilterBuilder()
 *   .addText('name', 'contains', 'invoice')
 *   .addSelect('status', 'equals', 'Done')
 *   .build()
 */
export class FilterBuilder {
  private filters: PropertyFilter[] = []
  private combineWith: LogicalOperator = 'and'

  constructor(combineWith: LogicalOperator = 'and') {
    this.combineWith = combineWith
  }

  /**
   * 텍스트 필터 추가 (rich_text, title, text)
   */
  addText(
    property: string,
    operator:
      | 'contains'
      | 'does_not_contain'
      | 'equals'
      | 'does_not_equal'
      | 'starts_with'
      | 'ends_with'
      | 'is_empty'
      | 'is_not_empty',
    value?: string
  ): this {
    const filter: TextFilter = { property }

    // 필터 타입 자동 감지 (rich_text로 기본 설정)
    if (operator === 'is_empty' || operator === 'is_not_empty') {
      filter.rich_text = { [operator]: true }
    } else {
      filter.rich_text = { [operator]: value }
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 숫자 필터 추가
   */
  addNumber(
    property: string,
    operator:
      | 'equals'
      | 'does_not_equal'
      | 'greater_than'
      | 'less_than'
      | 'greater_than_or_equal_to'
      | 'less_than_or_equal_to'
      | 'is_empty'
      | 'is_not_empty',
    value?: number
  ): this {
    const filter: NumberFilter = {
      property,
      number:
        operator === 'is_empty' || operator === 'is_not_empty'
          ? { [operator]: true }
          : { [operator]: value },
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 날짜 필터 추가
   *
   * 예제:
   * .addDate('created_date', 'after', '2024-01-01')
   * .addDate('due_date', 'this_month', undefined)
   */
  addDate(
    property: string,
    operator:
      | 'equals'
      | 'before'
      | 'after'
      | 'on_or_before'
      | 'on_or_after'
      | 'past_week'
      | 'past_month'
      | 'past_year'
      | 'next_week'
      | 'next_month'
      | 'next_year'
      | 'this_week'
      | 'this_month'
      | 'this_year'
      | 'is_empty'
      | 'is_not_empty',
    value?: string
  ): this {
    const filter: DateFilter = { property }

    // 사전 정의된 연산자 (값이 필요 없음)
    if (
      [
        'past_week',
        'past_month',
        'past_year',
        'next_week',
        'next_month',
        'next_year',
        'this_week',
        'this_month',
        'this_year',
      ].includes(operator)
    ) {
      filter.date = { [operator]: {} }
    } else if (operator === 'is_empty' || operator === 'is_not_empty') {
      filter.date = { [operator]: true }
    } else {
      filter.date = { [operator]: value }
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 선택(Select) 필터 추가
   */
  addSelect(
    property: string,
    operator: 'equals' | 'does_not_equal' | 'is_empty' | 'is_not_empty',
    value?: string
  ): this {
    const filter: SelectFilter = { property }

    if (operator === 'is_empty' || operator === 'is_not_empty') {
      filter.select = { [operator]: true }
    } else {
      filter.select = { [operator]: value }
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 다중 선택(Multi-select) 필터 추가
   */
  addMultiSelect(
    property: string,
    operator: 'contains' | 'does_not_contain' | 'is_empty' | 'is_not_empty',
    value?: string
  ): this {
    const filter: SelectFilter = { property }

    if (operator === 'is_empty' || operator === 'is_not_empty') {
      filter.multi_select = { [operator]: true }
    } else {
      filter.multi_select = { [operator]: value }
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 체크박스 필터 추가
   */
  addCheckbox(property: string, value: boolean): this {
    const filter: CheckboxFilter = {
      property,
      checkbox: { equals: value },
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 상태(Status) 필터 추가
   */
  addStatus(
    property: string,
    operator: 'equals' | 'does_not_equal' | 'is_empty' | 'is_not_empty',
    value?: string
  ): this {
    const filter: StatusFilter = { property }

    if (operator === 'is_empty' || operator === 'is_not_empty') {
      filter.status = { [operator]: true }
    } else {
      filter.status = { [operator]: value }
    }

    this.filters.push(filter)
    return this
  }

  /**
   * 필터 조합 논리 변경 (AND -> OR 또는 그 반대)
   */
  setCombineWith(operator: LogicalOperator): this {
    this.combineWith = operator
    return this
  }

  /**
   * 필터 초기화
   */
  clear(): this {
    this.filters = []
    return this
  }

  /**
   * 최종 필터 객체 생성
   */
  build(): PropertyFilter | CompoundFilter | undefined {
    if (this.filters.length === 0) {
      return undefined
    }

    if (this.filters.length === 1) {
      return this.filters[0]
    }

    // 여러 필터는 AND/OR로 조합
    const compound: CompoundFilter = {}
    compound[this.combineWith] = this.filters
    return compound
  }

  /**
   * 필터 수 반환
   */
  count(): number {
    return this.filters.length
  }

  /**
   * 현재 필터들 반환
   */
  getFilters(): PropertyFilter[] {
    return [...this.filters]
  }
}

/**
 * 날짜 범위 필터 생성 헬퍼
 *
 * 예제:
 * const filter = createDateRangeFilter('created_date', '2024-01-01', '2024-12-31')
 */
export function createDateRangeFilter(
  property: string,
  startDate: string,
  endDate: string
): CompoundFilter {
  return {
    and: [
      {
        property,
        date: {
          on_or_after: startDate,
        },
      },
      {
        property,
        date: {
          on_or_before: endDate,
        },
      },
    ],
  }
}

/**
 * 복수 선택값 필터 생성 (OR 조합)
 * 여러 상태 중 하나와 매치되는 항목 찾기
 *
 * 예제:
 * const filter = createMultiValueFilter('status', 'select', ['Done', 'In Review'])
 */
export function createMultiValueFilter(
  property: string,
  fieldType: 'select' | 'status' | 'multi_select',
  values: string[]
): CompoundFilter {
  const conditions = values.map(value => {
    const filter: Record<string, unknown> = { property }
    filter[fieldType] = { equals: value }
    return filter as unknown as PropertyFilter
  })

  return { or: conditions }
}

/**
 * 범위 필터 생성 (숫자)
 *
 * 예제:
 * const filter = createNumberRangeFilter('price', 100, 500)
 */
export function createNumberRangeFilter(
  property: string,
  minValue: number,
  maxValue: number
): CompoundFilter {
  return {
    and: [
      {
        property,
        number: {
          greater_than_or_equal_to: minValue,
        },
      },
      {
        property,
        number: {
          less_than_or_equal_to: maxValue,
        },
      },
    ],
  }
}

/**
 * 텍스트 검색 필터 생성 (여러 필드에서 검색)
 *
 * 예제:
 * const filter = createTextSearchFilter(['title', 'description'], 'invoice')
 */
export function createTextSearchFilter(
  properties: string[],
  searchText: string
): CompoundFilter {
  const conditions = properties.map(property => ({
    property,
    rich_text: {
      contains: searchText,
    },
  }))

  return { or: conditions }
}

/**
 * NOT 필터 생성 (특정 조건 제외)
 *
 * 주의: Notion API는 직접 NOT을 지원하지 않으므로 does_not_equal 등을 사용
 *
 * 예제:
 * const filter = createNotFilter('status', 'select', 'Cancelled')
 */
export function createNotFilter(
  property: string,
  fieldType: 'select' | 'status' | 'text',
  value: string
): PropertyFilter {
  const filter: Record<string, unknown> = { property }

  if (fieldType === 'select' || fieldType === 'status') {
    filter[fieldType] = { does_not_equal: value }
  } else {
    filter.rich_text = { does_not_contain: value }
  }

  return filter as unknown as PropertyFilter
}

/**
 * 복잡한 중첩 필터 빌더
 * AND/OR을 조합하여 더 복잡한 조건 생성
 *
 * 예제:
 * const filter = new ComplexFilterBuilder()
 *   .addConditionGroup('and', (builder) => {
 *     builder.addText('status', 'equals', 'Done')
 *     builder.addNumber('price', 'greater_than', 100)
 *   })
 *   .addConditionGroup('or', (builder) => {
 *     builder.addSelect('priority', 'equals', 'High')
 *     builder.addSelect('priority', 'equals', 'Urgent')
 *   })
 *   .build()
 */
export class ComplexFilterBuilder {
  private conditions: (PropertyFilter | CompoundFilter)[] = []
  private topLevelOperator: LogicalOperator = 'and'

  constructor(topLevelOperator: LogicalOperator = 'and') {
    this.topLevelOperator = topLevelOperator
  }

  /**
   * 조건 그룹 추가 (내부 논리 연산자 지정 가능)
   */
  addConditionGroup(
    operator: LogicalOperator,
    callback: (builder: FilterBuilder) => void
  ): this {
    const builder = new FilterBuilder(operator)
    callback(builder)
    const filter = builder.build()

    if (filter) {
      this.conditions.push(filter)
    }

    return this
  }

  /**
   * 단일 조건 추가
   */
  addCondition(filter: PropertyFilter): this {
    this.conditions.push(filter)
    return this
  }

  /**
   * 최종 필터 생성
   */
  build(): Filter | undefined {
    if (this.conditions.length === 0) {
      return undefined
    }

    if (this.conditions.length === 1) {
      return this.conditions[0]
    }

    const compound: CompoundFilter = {}
    compound[this.topLevelOperator] = this.conditions as PropertyFilter[]
    return compound
  }
}

/**
 * 필터를 JSON 문자열로 변환 (로깅/디버깅용)
 */
export function filterToJson(filter: Filter | undefined): string {
  return JSON.stringify(filter, null, 2)
}

/**
 * 필터 유효성 검사
 * 필터 객체가 올바른 형식인지 확인
 */
export function validateFilter(filter: unknown): boolean {
  if (!filter) {
    return true // undefined/null은 유효
  }

  if (typeof filter !== 'object') {
    return false
  }

  // 배열 필터
  if (Array.isArray(filter)) {
    return filter.every(f => validateFilter(f))
  }

  const obj = filter as Record<string, unknown>

  // property 필드 확인
  if ('property' in obj) {
    return typeof obj.property === 'string'
  }

  // AND/OR 필터
  const hasLogicalOperator = 'and' in obj || 'or' in obj
  if (hasLogicalOperator) {
    const operator = 'and' in obj ? 'and' : 'or'
    const value = obj[operator]
    return Array.isArray(value) && value.every(f => validateFilter(f))
  }

  return false
}

/**
 * 필터에서 특정 property 찾기
 */
export function findFiltersByProperty(
  filter: Filter | undefined,
  propertyName: string
): PropertyFilter[] {
  if (!filter) {
    return []
  }

  const results: PropertyFilter[] = []

  function traverse(node: unknown): void {
    if (!node) return

    if (Array.isArray(node)) {
      node.forEach(item => traverse(item))
      return
    }

    if (typeof node !== 'object') return

    const obj = node as Record<string, unknown>

    // Property 필터인 경우
    if ('property' in obj && obj.property === propertyName) {
      results.push(obj as unknown as PropertyFilter)
      return
    }

    // AND/OR 필터인 경우
    if (Array.isArray(obj.and)) {
      obj.and.forEach(item => traverse(item))
    } else if (Array.isArray(obj.or)) {
      obj.or.forEach(item => traverse(item))
    }
  }

  traverse(filter)
  return results
}
