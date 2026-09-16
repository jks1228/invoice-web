import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'

import { env } from '@/lib/env'

// jose는 Edge/Node 양쪽에서 동작하므로 proxy.ts(Edge)와 Server Action(Node) 모두에서 이 파일만 사용한다.
// 비밀번호 검증(password.ts, node:crypto)은 이 파일에서 import하지 않는다.

export const SESSION_COOKIE_NAME = 'admin_session'

const SESSION_DURATION = '7d'
const encodedSecret = new TextEncoder().encode(env.ADMIN_SESSION_SECRET)

interface SessionPayload {
  role: 'admin'
  [key: string]: unknown
}

async function encryptSession(): Promise<string> {
  const payload: SessionPayload = { role: 'admin' }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(encodedSecret)
}

// 서명 불일치·만료·형식 오류를 모두 미인증으로 취급한다(위조/만료 쿠키에 별도 안내를 주지 않음).
export async function decryptSession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, encodedSecret, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

export async function createSession(): Promise<void> {
  const token = await encryptSession()
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
