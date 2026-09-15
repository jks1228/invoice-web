import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/admin-shell'

// 인증(Task 018) 전까지의 임시 완화책 — 검색엔진 노출을 차단한다(접근 제어는 아님).
export const metadata: Metadata = {
  title: '관리자 — 견적서 목록',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
