import { renderToBuffer } from '@react-pdf/renderer'

import { resolveSubtotal } from '@/lib/invoice'
import { getInvoiceById } from '@/lib/notion/invoices'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-document'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 동일 ID 반복 다운로드 시 매번 렌더링하지 않도록 PDF 응답 자체를 5분간 캐시
export const revalidate = 300
// Next.js 15+부터 fetch는 기본이 no-store라 revalidate만으로는 캐시되지 않는다.
// NotionClient가 명시적 cache 옵션을 주지 않으므로 이 세그먼트의 fetch 기본값을 force-cache로 바꾼다.
export const fetchCache = 'default-cache'

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const result = await getInvoiceById(id)

  if (!result.ok) {
    if (result.reason === 'invalid_id' || result.reason === 'not_found') {
      return Response.json(
        { error: '견적서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    return Response.json(
      { error: '견적서를 불러오는 중 문제가 발생했습니다.' },
      { status: 500 }
    )
  }

  const invoice = result.data
  const displaySubtotal = resolveSubtotal(invoice)

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      <InvoicePdfDocument invoice={invoice} displaySubtotal={displaySubtotal} />
    )
  } catch (error) {
    console.error(`PDF 생성 실패 (인보이스 ${invoice.invoiceNumber}):`, error)
    return Response.json(
      { error: 'PDF 생성 중 문제가 발생했습니다.' },
      { status: 500 }
    )
  }

  // 파일명은 ASCII로 정규화한 fallback과 RFC 5987 UTF-8 인코딩을 함께 제공한다.
  const safeAscii = invoice.invoiceNumber.replace(/[^\w.-]/g, '_')
  const fileName = `invoice-${safeAscii}.pdf`

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(buffer.length),
    },
  })
}
