import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { STATUS_LABEL, isOverdue } from '@/lib/invoice'
import type { Invoice, InvoiceStatus } from '@/types/invoice'

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'outline'
> = {
  대기: 'outline',
  발송: 'secondary',
  확인함: 'secondary',
  완료: 'default',
}

interface InvoiceHeaderProps {
  invoice: Pick<Invoice, 'invoiceNumber' | 'invoiceDate' | 'dueDate' | 'status'>
}

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  const overdue = isOverdue(invoice.dueDate, invoice.status)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">견적서</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {invoice.invoiceNumber}
        </h1>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={STATUS_VARIANT[invoice.status]}>
            {STATUS_LABEL[invoice.status]}
          </Badge>
          {overdue && <Badge variant="destructive">기한 지남</Badge>}
        </div>
        <dl className="text-muted-foreground grid grid-cols-[auto_auto] gap-x-2 text-sm">
          <dt>발행일</dt>
          <dd>{formatDate(invoice.invoiceDate)}</dd>
          {invoice.dueDate && (
            <>
              <dt>만료일</dt>
              <dd>{formatDate(invoice.dueDate)}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
