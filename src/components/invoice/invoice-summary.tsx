import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format'

interface InvoiceSummaryProps {
  subtotal: number
  taxRate?: number
  taxAmount?: number
  totalAmount: number
}

export function InvoiceSummary({
  subtotal,
  taxRate,
  taxAmount,
  totalAmount,
}: InvoiceSummaryProps) {
  // 세금 필드가 없거나 0이면 라벨을 생략한다 (할인 전용 인보이스 대응)
  const taxLabel =
    taxRate !== undefined && taxAmount ? `세금 (VAT ${taxRate}%)` : null

  return (
    <div className="bg-muted/50 ml-auto w-full max-w-xs space-y-2 rounded-lg p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">소계</span>
        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
      </div>
      {taxLabel && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{taxLabel}</span>
          <span className="tabular-nums">{formatCurrency(taxAmount ?? 0)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between text-base font-bold">
        <span>총액</span>
        <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  )
}
