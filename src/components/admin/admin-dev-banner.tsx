import { ShieldAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Task 018(인증)이 완료되기 전까지 관리자 영역이 인증 없이 접근 가능함을 명시한다.
// Task 018 완료 시 이 컴포넌트와 admin-shell의 사용처를 제거한다.
export function AdminDevBanner() {
  return (
    <Alert variant="destructive">
      <ShieldAlert />
      <AlertTitle>인증이 적용되지 않은 개발용 화면입니다</AlertTitle>
      <AlertDescription>
        이 URL을 아는 누구나 견적서 목록에 접근할 수 있습니다. 인증(Task 018)이
        완료되기 전에는 공개 도메인에 배포하지 마세요.
      </AlertDescription>
    </Alert>
  )
}
