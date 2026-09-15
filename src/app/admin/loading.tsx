import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { InvoiceListSkeleton } from '@/components/admin/invoice-list-skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="견적서 목록"
        description="Notion에 등록된 전체 견적서를 확인하고 공개 링크를 복사할 수 있습니다."
      />
      <InvoiceListSkeleton />
    </div>
  )
}
