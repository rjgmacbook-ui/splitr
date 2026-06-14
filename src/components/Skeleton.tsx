interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/50 ${className}`}
      aria-hidden="true"
    />
  )
}

export function ExpenseCardSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="p-5 flex flex-col gap-3 items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}
