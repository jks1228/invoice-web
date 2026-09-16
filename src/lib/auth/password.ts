import { scryptSync, timingSafeEqual } from 'node:crypto'

// Node 런타임 전용 (scryptSync는 Edge에서 동작하지 않음).
// proxy.ts(Edge 실행)에서는 이 파일을 절대 import하지 않는다 — 세션 검증은 session.ts(jose)만 사용한다.

const SCRYPT_KEY_LENGTH = 64

// ADMIN_PASSWORD_HASH 값 생성 예시는 .env.example 참고 (동일 salt:hash 형식이어야 한다).
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) {
    console.error(
      'ADMIN_PASSWORD_HASH 형식이 올바르지 않습니다 (salt:hash 형식 필요)'
    )
    return false
  }

  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = scryptSync(password, salt, SCRYPT_KEY_LENGTH)

    if (actual.length !== expected.length) return false
    return timingSafeEqual(actual, expected)
  } catch (error) {
    console.error('비밀번호 검증 중 오류:', error)
    return false
  }
}
