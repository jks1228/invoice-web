import type { Invoice, InvoiceStatus } from '@/types/invoice'

// 화면(뱃지)·PDF가 공통으로 쓰는 상태 표시 라벨.
export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  대기: '대기',
  발송: '발송됨',
  확인함: '열람됨',
  완료: '결제 완료',
}

// 완료된 견적서는 만료일이 지났어도 "기한 지남"으로 표시하지 않는다(이미 처리 끝난 건).
export function isOverdue(
  dueDate: string | undefined,
  status: InvoiceStatus
): boolean {
  if (!dueDate || status === '완료') return false
  return new Date(dueDate).getTime() < Date.now()
}

/**
 * 화면·PDF가 공통으로 쓰는 소계 계산.
 * 항목 금액 합계와 Notion 총금액(subtotal)이 다르면 항목 합계를 신뢰하고 경고 로그를 남긴다.
 */
export function resolveSubtotal(invoice: Invoice): number {
  const itemsTotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)

  if (itemsTotal !== invoice.subtotal) {
    console.warn(
      `[resolveSubtotal] 인보이스 ${invoice.invoiceNumber}: 항목 합계(${itemsTotal}) ≠ Notion 총금액(${invoice.subtotal})`
    )
    return itemsTotal
  }

  return invoice.subtotal
}
