import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { InvoiceListEmpty } from '@/components/admin/invoice-list-empty'
import { InvoiceListError } from '@/components/admin/invoice-list-error'
import { InvoiceListTable } from '@/components/admin/invoice-list-table'
import { getInvoiceList } from '@/lib/notion/invoices'

// 관리자 목록은 최신성이 어느 정도 중요하지만 매 요청마다 Notion을 호출할 필요는 없다.
// Next.js 15+ 기본 fetch 정책이 no-store라 revalidate만으로는 캐시되지 않으므로
// fetchCache를 함께 지정해야 실제로 히트한다(V1 Task 010에서 확인된 교훈).
export const revalidate = 30
export const fetchCache = 'default-cache'

export default async function AdminPage() {
  const result = await getInvoiceList()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="견적서 목록"
        description="Notion에 등록된 전체 견적서를 확인하고 공개 링크를 복사할 수 있습니다."
      />
      {!result.ok ? (
        <InvoiceListError />
      ) : result.data.length === 0 ? (
        <InvoiceListEmpty />
      ) : (
        <InvoiceListTable items={result.data} />
      )}
    </div>
  )
}
