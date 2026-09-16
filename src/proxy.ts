import { NextResponse, type NextRequest } from 'next/server'

import { decryptSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'

// matcher를 /admin/:path*로 좁혀 공개 라우트(/, /invoice/*, /api/*)는 이 함수 자체가 실행되지
// 않는다(Task 018, A005). password.ts(node:crypto)는 Edge 런타임에서 동작하지 않으므로 여기서는
// session.ts(jose, Edge 호환)만 사용한다 — 비밀번호 검증은 Server Action(actions.ts)에서만 수행.
export default async function proxy(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await decryptSession(token)

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
