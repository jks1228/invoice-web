import type { Metadata } from 'next'

// 인증(Task 018)과 무관하게 검색 노출을 이중으로 차단하는 상시 정책 — 접근 제어는 proxy.ts가 담당한다.
export const metadata: Metadata = {
  title: '관리자 — 견적서 목록',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
