/**
 * Notion API 모듈 - 모든 기능을 export
 *
 * 사용:
 * import {
 *   NotionClient,
 *   FilterBuilder,
 *   createDateRangeFilter,
 *   ...
 * } from '@/lib/notion'
 */

export { NotionClient, getNotionClient, resetNotionClient } from './client'

export {
  INVOICE_PROPS,
  ITEM_PROPS,
  propertyReaders,
  getInvoiceById,
  getInvoiceList,
  getBusinessInfo,
} from './invoices'

export type { NotionPropertyReaders } from './invoices'

export {
  FilterBuilder,
  ComplexFilterBuilder,
  createDateRangeFilter,
  createMultiValueFilter,
  createNumberRangeFilter,
  createTextSearchFilter,
  createNotFilter,
  filterToJson,
  validateFilter,
  findFiltersByProperty,
} from './filters'

export type {
  FilterOperator,
  LogicalOperator,
  PropertyType,
  BaseFilter,
  TextFilter,
  NumberFilter,
  DateFilter,
  SelectFilter,
  CheckboxFilter,
  StatusFilter,
  PropertyFilter,
  CompoundFilter,
  Filter,
  DatabaseQueryRequest,
  DatabaseQueryResponse,
  Sort,
  NotionPage,
  NotionClientConfig,
  FilterBuilderOptions,
} from './types'
