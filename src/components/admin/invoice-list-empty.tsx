import { Inbox } from 'lucide-react'

export function InvoiceListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <Inbox className="text-muted-foreground h-10 w-10" />
      <p className="font-medium">견적서가 없습니다</p>
      <p className="text-muted-foreground text-sm">
        Notion 데이터베이스에 견적서를 추가하면 이 목록에 표시됩니다.
      </p>
    </div>
  )
}
