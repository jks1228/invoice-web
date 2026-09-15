/**
 * 표시용 포맷터. 기본값은 한국(ko-KR) / 원화(KRW).
 *
 * 잘못된 날짜 문자열(Invalid Date) 방어는 호출부/파서(Task 006·007) 책임이며
 * 이 모듈은 순수 포맷 변환만 담당한다.
 */

export function formatCurrency(
  amount: number,
  currency = 'KRW',
  locale = 'ko-KR'
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amount
  )
}

export function formatDate(value: string | Date, locale = 'ko-KR'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)
}
