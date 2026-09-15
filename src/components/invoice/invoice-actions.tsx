'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface InvoiceActionsProps {
  invoiceId: string
  invoiceNumber: string
}

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
}: InvoiceActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const response = await fetch(`/invoice/${invoiceId}/pdf`)
      if (!response.ok) {
        toast.error('PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="sm:w-auto"
      >
        {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
        {isDownloading ? '다운로드 중...' : 'PDF 다운로드'}
      </Button>
      <Button asChild variant="outline">
        <Link href="/">홈으로</Link>
      </Button>
    </div>
  )
}
