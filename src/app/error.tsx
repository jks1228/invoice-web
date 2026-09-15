'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { BusinessInfo } from '@/types/invoice'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // 사용자에게는 항상 고정된 안내 문구만 보여준다. error.message(내부 사유)는 서버 로그로만 남긴다.
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    let cancelled = false
    fetch('/api/business-info')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setBusinessInfo(data)
      })
      .catch(() => {
        // 연락처 조회 실패는 에러 화면 자체를 방해하지 않는다 — 조용히 기본 안내로 대체한다.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <AlertTriangle className="text-muted-foreground mx-auto h-12 w-12" />
          <CardTitle className="text-2xl font-bold">
            일시적인 오류가 발생했습니다
          </CardTitle>
          <CardDescription>
            견적서 데이터를 불러오는 중 문제가 생겼습니다. 잠시 후 다시 시도해
            주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} className="sm:w-auto">
              다시 시도
            </Button>
            <Button asChild variant="outline" className="sm:w-auto">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {businessInfo
              ? `문의처: ${businessInfo.businessName}${businessInfo.phone ? ` · ${businessInfo.phone}` : ''}${businessInfo.email ? ` · ${businessInfo.email}` : ''}`
              : '문제가 계속되면 견적서를 보내주신 분께 문의해 주세요.'}
          </p>
        </CardContent>
      </Card>
    </Container>
  )
}
