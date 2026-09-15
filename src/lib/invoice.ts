import type {
  BuildInvoicePublicUrl,
  Invoice,
  InvoiceStatus,
} from '@/types/invoice'

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

/**
 * 공개 인보이스 링크를 생성한다(Task 015, A002). 브라우저에서는 window.location.origin을,
 * 서버에서는 NEXT_PUBLIC_SITE_URL → 호출부가 넘긴 origin(요청 origin) 순으로 폴백한다.
 *
 * lib/env.ts의 env 객체를 import하지 않는다 — 이 함수는 클라이언트 컴포넌트(copy-link-button.tsx)에서도
 * 호출되는데, env.ts는 모듈 로드 시점에 NOTION_API_KEY 등 서버 전용 값을 Zod로 즉시 검증해서 클라이언트
 * 번들에 포함되면 그 자리에서 예외를 던진다. NEXT_PUBLIC_ 변수는 Next.js가 서버/클라이언트 번들 모두에
 * 빌드 타임에 안전하게 인라인하므로 process.env로 직접 읽어 이 문제를 피한다.
 */
export const buildInvoicePublicUrl: BuildInvoicePublicUrl = (id, origin) => {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? origin ?? '')

  return `${base}/invoice/${id}`
}
