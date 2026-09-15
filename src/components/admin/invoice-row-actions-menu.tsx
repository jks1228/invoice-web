'use client'

import Link from 'next/link'
import { Check, Copy, ExternalLink, MoreVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useCopyInvoiceLink } from '@/hooks/use-copy-invoice-link'

interface InvoiceRowActionsMenuProps {
  invoiceId: string
}

// 모바일 카드에서 "링크 복사" + "새 탭에서 열기"를 드롭다운 메뉴로 접는다(로드맵 Task 015 지시).
export function InvoiceRowActionsMenu({
  invoiceId,
}: InvoiceRowActionsMenuProps) {
  const { copied, fallbackUrl, copy } = useCopyInvoiceLink(invoiceId)

  return (
    <div className="flex flex-col items-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="견적서 액션 메뉴">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copy}>
            {copied ? <Check /> : <Copy />}
            링크 복사
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/invoice/${invoiceId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />새 탭에서 열기
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? '링크가 복사되었습니다' : ''}
      </span>
      {fallbackUrl && (
        <Input
          readOnly
          value={fallbackUrl}
          onFocus={event => event.currentTarget.select()}
          aria-label="공개 링크(직접 복사)"
          className="text-xs"
        />
      )}
    </div>
  )
}
