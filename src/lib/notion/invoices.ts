/**
 * Notion → 인보이스 도메인 매핑 레이어
 *
 * 실제 Notion 데이터베이스(export 샘플 기준)에는 PRD가 가정한 세금/비고/발행자 필드가
 * 없다. 이 프로젝트에서는 다음과 같이 단순화한다:
 * - subtotal = totalAmount, taxRate/taxAmount/notes는 항상 미설정
 * - businessInfo는 Notion이 아니라 환경 변수(BUSINESS_*)로 고정 관리
 */

import { env } from '@/lib/env'
import { isOverdue } from '@/lib/invoice'

import { getNotionClient } from './client'

import type { NotionPage, StatusFilter } from './types'
import type {
  BusinessInfo,
  Invoice,
  InvoiceItem,
  InvoiceListItem,
  InvoiceListQuery,
  InvoiceListResult,
  InvoiceLookupResult,
  InvoiceStatus,
} from '@/types/invoice'

/**
 * 도메인 필드 → Notion property 표시명 매핑.
 * property 이름 문자열은 이 상수에서만 정의하고 다른 곳에서 재선언하지 않는다.
 * 목록 조회(Task 017 getInvoiceList)에서도 이 상수를 그대로 재사용한다 —
 * items(항목 relation)를 제외한 나머지 필드가 InvoiceListItem과 그대로 대응된다.
 */
export const INVOICE_PROPS = {
  invoiceNumber: '견적서 번호',
  clientName: '클라이언트',
  invoiceDate: '발행일',
  dueDate: '유효기간',
  // 실제 Notion property 표시명에 공백이 포함되어 있다(Notion DB 스키마 확인 결과).
  totalAmount: '총금 액',
  status: '상태',
  items: '항목',
} as const

/**
 * Items DB(relation으로 연결된 개별 페이지)의 property 표시명 매핑.
 * 별도 데이터베이스 ID는 필요 없다 — 항목 relation이 페이지 ID를 직접 준다.
 */
export const ITEM_PROPS = {
  itemName: '항목명',
  unitPrice: '단가',
  quantity: '수량',
} as const

const KNOWN_STATUSES: readonly InvoiceStatus[] = [
  '대기',
  '발송',
  '확인함',
  '완료',
]

// Notion property 값은 { id, type, [type]: ... } 형태의 판별 유니온이다.
type NotionPropertyValue = { type?: unknown } & Record<string, unknown>

function getProperty(
  page: NotionPage,
  prop: string
): NotionPropertyValue | null {
  const value = page.properties[prop]
  if (!value || typeof value !== 'object') {
    return null
  }
  return value as NotionPropertyValue
}

function extractPlainText(richText: unknown): string | null {
  if (!Array.isArray(richText) || richText.length === 0) {
    return null
  }
  const text = richText
    .map(item =>
      item && typeof item === 'object' && 'plain_text' in item
        ? String((item as { plain_text: unknown }).plain_text ?? '')
        : ''
    )
    .join('')
    .trim()
  return text.length > 0 ? text : null
}

/**
 * Notion page의 property를 타입별로 안전하게 추출하는 유틸.
 * 값이 없거나 타입이 맞지 않으면 null(관계는 빈 배열)을 반환한다.
 */
export interface NotionPropertyReaders {
  readTitle(page: NotionPage, prop: string): string | null
  readRichText(page: NotionPage, prop: string): string | null
  readNumber(page: NotionPage, prop: string): number | null
  readDate(page: NotionPage, prop: string): string | null
  readSelect(page: NotionPage, prop: string): string | null
  readStatus(page: NotionPage, prop: string): string | null
  readRelationIds(page: NotionPage, prop: string): string[]
}

export const propertyReaders: NotionPropertyReaders = {
  readTitle(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'title') return null
    return extractPlainText(value.title)
  },
  readRichText(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'rich_text') return null
    return extractPlainText(value.rich_text)
  },
  readNumber(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'number') return null
    return typeof value.number === 'number' ? value.number : null
  },
  readDate(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'date' || !value.date) return null
    const date = value.date as { start?: unknown }
    return typeof date.start === 'string' ? date.start : null
  },
  readSelect(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'select' || !value.select) return null
    const select = value.select as { name?: unknown }
    return typeof select.name === 'string' ? select.name : null
  },
  readStatus(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'status' || !value.status) return null
    const status = value.status as { name?: unknown }
    return typeof status.name === 'string' ? status.name : null
  },
  // 주의: Notion API는 relation을 페이지 조회 응답에서 최대 25개까지만 반환한다
  // (has_more 시 truncate). 이 MVP 규모에서는 문제되지 않아 페이지네이션은 다루지 않는다.
  readRelationIds(page, prop) {
    const value = getProperty(page, prop)
    if (!value || value.type !== 'relation' || !Array.isArray(value.relation)) {
      return []
    }
    return value.relation
      .filter(
        (item): item is { id: string } =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as { id?: unknown }).id === 'string'
      )
      .map(item => item.id)
  },
}

// 상태/select 필드 타입이 워크스페이스마다 다를 수 있어 status를 우선 시도하고 select로 폴백한다.
function readStatusValue(page: NotionPage, prop: string): string | null {
  return (
    propertyReaders.readStatus(page, prop) ??
    propertyReaders.readSelect(page, prop)
  )
}

function parseStatus(raw: string | null): InvoiceStatus {
  if (raw && (KNOWN_STATUSES as readonly string[]).includes(raw)) {
    return raw as InvoiceStatus
  }
  console.warn(`알 수 없는 인보이스 상태값 "${raw}" — "대기"로 대체합니다.`)
  return '대기'
}

function normalizeId(id: string): string {
  return id.replace(/-/g, '').toLowerCase()
}

// Notion page ID는 하이픈 유무와 무관하게 32자리 16진수다.
function isValidNotionId(id: string): boolean {
  return /^[0-9a-f]{32}$/i.test(normalizeId(id))
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('(404)')
}

async function mapItemPage(
  page: NotionPage,
  order: number
): Promise<InvoiceItem> {
  const itemName =
    propertyReaders.readTitle(page, ITEM_PROPS.itemName) ?? '(이름 없음)'
  const unitPrice = propertyReaders.readNumber(page, ITEM_PROPS.unitPrice) ?? 0
  const quantity = propertyReaders.readNumber(page, ITEM_PROPS.quantity) ?? 0

  return {
    id: page.id,
    itemName,
    // 단가 × 수량으로 재계산한다 — Notion의 "금액" 필드는 신뢰하지 않는다.
    unitPrice,
    quantity,
    amount: unitPrice * quantity,
    order,
  }
}

/**
 * 인보이스 ID로 견적서를 조회한다. 예외 대신 InvoiceLookupResult 판별 유니온을 반환한다.
 */
export async function getInvoiceById(id: string): Promise<InvoiceLookupResult> {
  if (!isValidNotionId(id)) {
    return { ok: false, reason: 'invalid_id' }
  }

  const client = getNotionClient()

  let page: NotionPage
  try {
    page = await client.getPage(id)
  } catch (error) {
    if (isNotFoundError(error)) {
      return { ok: false, reason: 'not_found' }
    }
    console.error('Notion 인보이스 조회 실패:', error)
    return { ok: false, reason: 'notion_error' }
  }

  // 다른 데이터베이스의 임의 페이지 ID로 접근하는 것을 막는다(F004 데이터 보안).
  const pageDatabaseId = page.parent.database_id
  if (
    !pageDatabaseId ||
    normalizeId(pageDatabaseId) !== normalizeId(env.NOTION_DATABASE_ID)
  ) {
    return { ok: false, reason: 'not_found' }
  }

  const invoiceNumber =
    propertyReaders.readTitle(page, INVOICE_PROPS.invoiceNumber) ?? id
  const clientName =
    propertyReaders.readRichText(page, INVOICE_PROPS.clientName) ??
    '(클라이언트 미상)'
  const invoiceDate =
    propertyReaders.readDate(page, INVOICE_PROPS.invoiceDate) ??
    page.created_time
  const dueDate =
    propertyReaders.readDate(page, INVOICE_PROPS.dueDate) ?? undefined
  const totalAmount =
    propertyReaders.readNumber(page, INVOICE_PROPS.totalAmount) ?? 0
  const status = parseStatus(readStatusValue(page, INVOICE_PROPS.status))
  const itemIds = propertyReaders.readRelationIds(page, INVOICE_PROPS.items)

  const items: InvoiceItem[] = []
  for (let index = 0; index < itemIds.length; index += 1) {
    try {
      const itemPage = await client.getPage(itemIds[index])
      items.push(await mapItemPage(itemPage, index + 1))
    } catch (error) {
      // 항목 하나가 깨져도 인보이스 전체 조회를 실패시키지 않고 건너뛴다.
      console.warn(
        `인보이스 항목(${itemIds[index]}) 조회 실패 — 건너뜁니다:`,
        error
      )
    }
  }

  const businessInfo = (await getBusinessInfo()) ?? undefined

  const invoice: Invoice = {
    id: page.id,
    invoiceNumber,
    clientName,
    invoiceDate,
    dueDate,
    items,
    // Notion에 별도 소계/세금 필드가 없어 총금액을 그대로 소계로 사용한다.
    subtotal: totalAmount,
    totalAmount,
    status,
    businessInfo,
  }

  return { ok: true, data: invoice }
}

function mapListItem(page: NotionPage): InvoiceListItem {
  const invoiceNumber =
    propertyReaders.readTitle(page, INVOICE_PROPS.invoiceNumber) ?? page.id
  const clientName =
    propertyReaders.readRichText(page, INVOICE_PROPS.clientName) ??
    '(클라이언트 미상)'
  const invoiceDate =
    propertyReaders.readDate(page, INVOICE_PROPS.invoiceDate) ??
    page.created_time
  const dueDate =
    propertyReaders.readDate(page, INVOICE_PROPS.dueDate) ?? undefined
  const totalAmount =
    propertyReaders.readNumber(page, INVOICE_PROPS.totalAmount) ?? 0
  const status = parseStatus(readStatusValue(page, INVOICE_PROPS.status))

  return {
    id: page.id,
    invoiceNumber,
    clientName,
    invoiceDate,
    dueDate,
    totalAmount,
    status,
    isOverdue: isOverdue(dueDate, status),
  }
}

/**
 * 관리자 목록용 견적서 목록을 조회한다(Task 017, A001·A004).
 * getAllPages()(전체 자동 페이지네이션)는 대량 데이터에서 API 호출이 폭증할 위험이 있어 쓰지 않고,
 * queryDatabase()를 직접 호출해 page_size + start_cursor로 첫 페이지만 가져온다.
 * 항목(relation)은 개별 조회하지 않는다(N+1 방지) — 총금액은 Notion 값을 그대로 사용.
 */
export async function getInvoiceList(
  query: InvoiceListQuery = {}
): Promise<InvoiceListResult> {
  const client = getNotionClient()
  const pageSize = Math.min(query.pageSize ?? 20, 100)

  const filter: StatusFilter | undefined = query.status
    ? { property: INVOICE_PROPS.status, status: { equals: query.status } }
    : undefined

  try {
    const response = await client.queryDatabase<NotionPage>(
      env.NOTION_DATABASE_ID,
      {
        filter,
        sorts: [
          { property: INVOICE_PROPS.invoiceDate, direction: 'descending' },
        ],
        start_cursor: query.cursor,
        page_size: pageSize,
      }
    )

    return {
      ok: true,
      data: response.results.map(mapListItem),
      nextCursor: response.next_cursor ?? undefined,
    }
  } catch (error) {
    // 사용자에게는 상위 호출부(admin/page.tsx)가 일반화된 오류 UI만 보여주고,
    // 실패 원인은 여기 서버 로그에만 남긴다(V1 Task 008과 동일 정책).
    console.error('Notion 견적서 목록 조회 실패:', error)
    return { ok: false, reason: 'notion_error' }
  }
}

/**
 * 발행자(사업자) 정보를 조회한다. Notion에는 해당 필드가 없어 환경 변수로 관리하며,
 * BUSINESS_NAME이 설정되지 않으면 null을 반환한다.
 */
export async function getBusinessInfo(): Promise<BusinessInfo | null> {
  if (!env.BUSINESS_NAME) {
    return null
  }

  return {
    id: 'env-business-info',
    businessName: env.BUSINESS_NAME,
    ownerName: env.BUSINESS_OWNER_NAME,
    phone: env.BUSINESS_PHONE,
    email: env.BUSINESS_EMAIL,
    address: env.BUSINESS_ADDRESS,
    taxId: env.BUSINESS_TAX_ID,
  }
}
