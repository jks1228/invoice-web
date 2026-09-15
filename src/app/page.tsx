import Link from 'next/link'

import { Container } from '@/components/layout/container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InvoiceLookupForm } from '@/components/invoice/invoice-lookup-form'

export default function HomePage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">견적서 확인</CardTitle>
          <CardDescription>
            전달받은 링크를 클릭했다면 자동으로 견적서가 열립니다. 링크 대신
            인보이스 ID만 전달받았다면 아래에 직접 입력해 조회할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <InvoiceLookupForm />

          {/* 데모 견적서 — Notion 실데이터 */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-sm">
              가지고 있는 ID가 없다면 데모 견적서를 먼저 살펴보세요.
            </p>
            <Link
              href="/invoice/3d5eed15f2bc800389f4fc748aaa1df4"
              className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-block rounded-md border px-3 py-1.5 text-sm transition-colors"
            >
              INV-2026-001 보기
            </Link>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
