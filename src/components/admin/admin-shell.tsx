import { Button } from '@/components/ui/button'
import { logoutAction } from '@/lib/auth/actions'

interface AdminShellProps {
  children: React.ReactNode
}

// 메뉴가 목록/링크 복사뿐이라 사이드바 대신 상단 서브바만 둔다.
// 메뉴가 늘어나면(Task 019 이후) 좌측 네비게이션으로 확장한다.
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-muted-foreground text-sm font-medium">
            관리자 영역
          </p>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
