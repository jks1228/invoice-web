'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { env } from '@/lib/env'
import { verifyPassword } from '@/lib/auth/password'
import {
  checkRateLimit,
  recordFailure,
  resetRateLimit,
} from '@/lib/auth/rate-limit'
import { loginSchema, type LoginFormData } from '@/lib/auth/schema'
import { createSession, destroySession } from '@/lib/auth/session'

export type LoginActionResult =
  | { ok: true }
  | {
      ok: false
      reason: 'invalid_credentials' | 'rate_limited'
      retryAfterSeconds?: number
    }

async function getClientKey(): Promise<string> {
  const headerList = await headers()
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function loginAction(
  input: LoginFormData
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const key = await getClientKey()
  const limit = checkRateLimit(key)
  if (!limit.allowed) {
    return {
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: limit.retryAfterSeconds,
    }
  }

  const isValid = verifyPassword(parsed.data.password, env.ADMIN_PASSWORD_HASH)
  if (!isValid) {
    recordFailure(key)
    console.error('관리자 로그인 실패: 잘못된 비밀번호 시도')
    return { ok: false, reason: 'invalid_credentials' }
  }

  resetRateLimit(key)
  await createSession()
  return { ok: true }
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/admin/login')
}
