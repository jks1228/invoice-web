'use client'

import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCopyInvoiceLink } from '@/hooks/use-copy-invoice-link'

interface CopyLinkButtonProps {
  invoiceId: string
}

export function CopyLinkButton({ invoiceId }: CopyLinkButtonProps) {
  const { copied, fallbackUrl, copy } = useCopyInvoiceLink(invoiceId)

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={copy}
        aria-label="공개 링크 복사"
      >
        {copied ? <Check /> : <Copy />}
        링크 복사
      </Button>
      {/* 성공 여부를 스크린리더에 안내한다. sonner 토스트가 시각적으로는 이미 보여준다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? '링크가 복사되었습니다' : ''}
      </span>
      {fallbackUrl && (
        <Input
          readOnly
          value={fallbackUrl}
          onFocus={event => event.currentTarget.select()}
          aria-label="공개 링크(직접 복사)"
          className="w-64"
        />
      )}
    </div>
  )
}
