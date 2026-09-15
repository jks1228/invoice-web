import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AdminNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <FileQuestion className="text-muted-foreground mx-auto h-12 w-12" />
          <CardTitle className="text-2xl font-bold">
            페이지를 찾을 수 없습니다
          </CardTitle>
          <CardDescription>
            요청하신 관리자 페이지가 존재하지 않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/admin">견적서 목록으로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
