import { Skeleton } from '@/components/ui/skeleton'

export function InvoiceSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-2 sm:items-end">
          <Skeleton className="ml-auto h-5 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="ml-auto h-24 w-full max-w-xs" />
    </div>
  )
}
