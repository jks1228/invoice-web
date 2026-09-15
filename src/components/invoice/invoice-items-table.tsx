import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'
import type { InvoiceItem } from '@/types/invoice'

interface InvoiceItemsTableProps {
  items: InvoiceItem[]
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-12 px-3 sm:px-4">항목명</TableHead>
            <TableHead className="hidden px-3 sm:table-cell sm:px-4">
              설명
            </TableHead>
            <TableHead className="px-3 text-right sm:px-4">단가</TableHead>
            <TableHead className="px-3 text-right sm:px-4">수량</TableHead>
            <TableHead className="px-3 text-right sm:px-4">금액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map(item => (
            <TableRow key={item.id}>
              <TableCell className="px-3 py-3 font-medium whitespace-normal sm:px-4">
                {item.itemName}
                {item.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs sm:hidden">
                    {item.description}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground hidden px-3 py-3 whitespace-normal sm:table-cell sm:px-4">
                {item.description ?? '-'}
              </TableCell>
              <TableCell className="px-3 py-3 text-right tabular-nums sm:px-4">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell className="px-3 py-3 text-right tabular-nums sm:px-4">
                {item.quantity}
              </TableCell>
              <TableCell className="px-3 py-3 text-right font-medium tabular-nums sm:px-4">
                {formatCurrency(item.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
