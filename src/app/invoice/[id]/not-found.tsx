import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getBusinessInfo } from '@/lib/notion'

export default async function InvoiceNotFound() {
  const businessInfo = await getBusinessInfo()

  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <FileQuestion className="text-muted-foreground mx-auto h-12 w-12" />
          <CardTitle className="text-2xl font-bold">
            견적서를 찾을 수 없습니다
          </CardTitle>
          <CardDescription>
            입력한 링크나 ID가 정확한지 다시 확인해 주세요. 주소가 잘못되었거나,
            견적서가 삭제·만료되었을 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
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
