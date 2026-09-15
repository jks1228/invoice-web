import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { Container } from '@/components/layout/container'
import { InvoiceActions } from '@/components/invoice/invoice-actions'
import { InvoiceHeader } from '@/components/invoice/invoice-header'
import { InvoiceItemsTable } from '@/components/invoice/invoice-items-table'
import { InvoiceNotes } from '@/components/invoice/invoice-notes'
import { InvoiceParties } from '@/components/invoice/invoice-parties'
import { InvoiceSummary } from '@/components/invoice/invoice-summary'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { resolveSubtotal } from '@/lib/invoice'
import { getInvoiceById } from '@/lib/notion/invoices'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

// 인보이스 상태가 실시간으로 바뀔 필요는 없는 도메인이라 2분 캐시로 Notion 재조회를 줄인다
export const revalidate = 120
// Next.js 15+부터 fetch는 기본이 no-store라 revalidate만으로는 캐시되지 않는다.
// NotionClient가 명시적 cache 옵션을 주지 않으므로 이 세그먼트의 fetch 기본값을 force-cache로 바꾼다.
export const fetchCache = 'default-cache'

export async function generateMetadata({
  params,
}: InvoiceDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getInvoiceById(id)

  if (!result.ok) {
    // notion_error(일시적 장애)까지 "찾을 수 없음"으로 단정하지 않도록 사유별로 제목을 나눈다.
    return result.reason === 'notion_error'
      ? {
          title: '일시적인 오류가 발생했습니다',
          description: '견적서 데이터를 불러오는 중 문제가 생겼습니다.',
        }
      : {
          title: '견적서를 찾을 수 없습니다',
          description: '요청하신 견적서를 찾을 수 없습니다.',
        }
  }

  return {
    title: `${result.data.invoiceNumber} — 견적서 확인`,
    description: `${result.data.clientName}에게 발행한 견적서입니다.`,
  }
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params
  const result = await getInvoiceById(id)

  if (!result.ok) {
    if (result.reason === 'invalid_id' || result.reason === 'not_found') {
      notFound()
    }
    throw new Error(`Notion 조회 실패: ${result.reason}`)
  }

  const invoice = result.data
  const displaySubtotal = resolveSubtotal(invoice)

  return (
    <Container className="py-12">
      <Card>
        <CardContent className="space-y-8 sm:p-8">
          <InvoiceHeader invoice={invoice} />
          <Separator />
          <InvoiceParties
            clientName={invoice.clientName}
            businessInfo={invoice.businessInfo}
          />
          <InvoiceItemsTable items={invoice.items} />
          <InvoiceSummary
            subtotal={displaySubtotal}
            taxRate={invoice.taxRate}
            taxAmount={invoice.taxAmount}
            totalAmount={invoice.totalAmount}
          />
          <InvoiceNotes notes={invoice.notes} />
          <Separator />
          <InvoiceActions
            invoiceId={id}
            invoiceNumber={invoice.invoiceNumber}
          />
        </CardContent>
      </Card>
    </Container>
  )
}
