import { NextResponse } from 'next/server'

import { getBusinessInfo } from '@/lib/notion'

// error.tsx(Client Component)는 서버 함수를 직접 호출할 수 없어, 연락처 표시용으로만 이 엔드포인트를 둔다.
export async function GET() {
  const businessInfo = await getBusinessInfo()
  return NextResponse.json(businessInfo)
}
