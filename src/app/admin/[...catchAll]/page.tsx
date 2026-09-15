import { notFound } from 'next/navigation'

// 완전히 매치되지 않는 /admin/* 경로는 기본적으로 루트 not-found.tsx로 폴백된다.
// notFound()를 명시 호출해 가장 가까운 not-found 경계(src/app/admin/not-found.tsx)를 타도록 강제한다.
export default function AdminCatchAll() {
  notFound()
}
