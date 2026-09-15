import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/format'
import { STATUS_LABEL } from '@/lib/invoice'
import type { InvoiceListItem, InvoiceStatus } from '@/types/invoice'

import { CopyLinkButton } from './copy-link-button'
import { InvoiceRowActionsMenu } from './invoice-row-actions-menu'

// invoice-header.tsx와 동일한 색상 체계를 유지한다(두 곳뿐이라 상수 승격은 보류 — 설계 결정 2 참고).
const STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'outline'
> = {
  대기: 'outline',
  발송: 'secondary',
  확인함: 'secondary',
  완료: 'default',
}

interface InvoiceListTableProps {
  items: InvoiceListItem[]
}

function StatusBadges({ item }: { item: InvoiceListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={STATUS_VARIANT[item.status]}>
        {STATUS_LABEL[item.status]}
      </Badge>
      {item.isOverdue && <Badge variant="destructive">기한 지남</Badge>}
    </div>
  )
}

function OpenInvoiceLink({ id }: { id: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link
        href={`/invoice/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="새 탭에서 공개 견적서 열기"
      >
        <ExternalLink />새 탭에서 열기
      </Link>
    </Button>
  )
}

export function InvoiceListTable({ items }: InvoiceListTableProps) {
  return (
    <>
      {/* 데스크톱/태블릿(md 이상): 테이블 */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>견적서 번호</TableHead>
              <TableHead>클라이언트</TableHead>
              <TableHead>발행일</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead className="text-right">총금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/invoice/${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {item.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="max-w-64 min-w-40 whitespace-normal">
                  {item.clientName}
                </TableCell>
                <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                <TableCell>
                  {item.dueDate ? formatDate(item.dueDate) : '-'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(item.totalAmount)}
                </TableCell>
                <TableCell>
                  <StatusBadges item={item} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <CopyLinkButton invoiceId={item.id} />
                    <OpenInvoiceLink id={item.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일(md 미만): 카드 리스트 */}
      <div className="space-y-3 md:hidden">
        {items.map(item => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/invoice/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {item.invoiceNumber}
              </Link>
              <StatusBadges item={item} />
            </div>
            <p className="text-sm break-words">{item.clientName}</p>
            <dl className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <dt>발행일</dt>
              <dd className="text-foreground text-right">
                {formatDate(item.invoiceDate)}
              </dd>
              <dt>유효기간</dt>
              <dd className="text-foreground text-right">
                {item.dueDate ? formatDate(item.dueDate) : '-'}
              </dd>
              <dt>총금액</dt>
              <dd className="text-foreground text-right tabular-nums">
                {formatCurrency(item.totalAmount)}
              </dd>
            </dl>
            <div className="flex justify-end">
              <InvoiceRowActionsMenu invoiceId={item.id} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
