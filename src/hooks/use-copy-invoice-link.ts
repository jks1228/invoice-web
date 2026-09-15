'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { buildInvoicePublicUrl } from '@/lib/invoice'

// 임시 <textarea>를 만들어 선택 후 execCommand('copy')를 시도하는 레거시 폴백.
// Clipboard API가 없거나(구형 브라우저) 비보안 컨텍스트(HTTP)일 때 사용한다.
function tryLegacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}

interface UseCopyInvoiceLinkResult {
  copied: boolean
  // 모든 복사 방법이 실패했을 때만 채워진다 — 채워지면 호출부가 읽기 전용 입력창으로 URL을 노출한다.
  fallbackUrl: string | null
  copy: () => Promise<void>
}

export function useCopyInvoiceLink(
  invoiceId: string
): UseCopyInvoiceLinkResult {
  const [copied, setCopied] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSuccess = useCallback(() => {
    setCopied(true)
    toast.success('링크를 복사했습니다')
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
  }, [])

  const copy = useCallback(async () => {
    const url = buildInvoicePublicUrl(invoiceId)
    setFallbackUrl(null)

    // navigator.clipboard는 보안 컨텍스트(HTTPS/localhost)에서만 지원된다 — 폴백 필수(설계 결정 4)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url)
        onSuccess()
        return
      } catch {
        // 권한 거부 등 — 아래 레거시 폴백으로 이어짐
      }
    }

    if (tryLegacyCopy(url)) {
      onSuccess()
      return
    }

    setFallbackUrl(url)
    toast.error('자동 복사에 실패했습니다. 아래에서 링크를 직접 복사해주세요.')
  }, [invoiceId, onSuccess])

  return { copied, fallbackUrl, copy }
}
