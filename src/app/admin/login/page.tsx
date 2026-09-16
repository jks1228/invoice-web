import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Container } from '@/components/layout/container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/components/admin/login-form'
import { decryptSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: '관리자 로그인',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  const cookieStore = await cookies()
  const session = await decryptSession(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  )

  if (session) {
    redirect('/admin')
  }

  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">관리자 로그인</CardTitle>
          <CardDescription>
            견적서 목록을 확인하려면 관리자 비밀번호를 입력해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </Container>
  )
}
