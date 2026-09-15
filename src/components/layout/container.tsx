import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

// 앱 전체가 항상 같은 폭을 쓰도록 단일 상수로 고정한다 (헤더·푸터·페이지 콘텐츠 공용).
export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8', className)}
    >
      {children}
    </div>
  )
}
