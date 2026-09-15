import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

// 실패 원인은 서버 로그(getInvoiceList의 console.error)에만 남기고,
// 화면에는 내부 오류 메시지를 노출하지 않는다(V1 Task 008과 동일 정책).
export function InvoiceListError() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <p className="font-medium">견적서 목록을 불러오지 못했습니다</p>
      <p className="text-muted-foreground text-sm">
        잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin">
          <RefreshCw />
          다시 시도
        </Link>
      </Button>
    </div>
  )
}
