// 인메모리 로그인 실패 카운터. DB/Redis 없는 1인 관리자 서비스를 위한 실용적 절충안이다.
// 한계: Vercel 등 서버리스 환경에서는 인스턴스마다 별도 Map을 가지므로 완벽한 방어가 아니며,
// 콜드스타트/스케일아웃 시 카운터가 초기화될 수 있다. 강한 보장이 필요해지면 Upstash Redis 등
// 외부 스토어로 교체한다(아래 함수 시그니처는 스토리지 구현과 분리되어 있어 교체가 쉽다).

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000
const STALE_MS = 60 * 60 * 1000

interface AttemptRecord {
  count: number
  lockedUntil: number
  lastAttemptAt: number
}

const attempts = new Map<string, AttemptRecord>()

function pruneStale(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.lastAttemptAt > STALE_MS) attempts.delete(key)
  }
}

export function checkRateLimit(
  key: string
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now()
  pruneStale(now)

  const record = attempts.get(key)
  if (record && record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    }
  }

  return { allowed: true }
}

export function recordFailure(key: string): void {
  const now = Date.now()
  const record = attempts.get(key) ?? {
    count: 0,
    lockedUntil: 0,
    lastAttemptAt: now,
  }

  record.count += 1
  record.lastAttemptAt = now
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    record.count = 0
  }

  attempts.set(key, record)
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}
