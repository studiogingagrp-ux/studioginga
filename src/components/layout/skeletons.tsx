import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Cabeçalho de página (título + ação). */
function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
  )
}

function Card({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-soft', className)}>{children}</div>
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-24" />
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </Card>
        <Card className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </Card>
      </div>
    </div>
  )
}

export function AgendaSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
      </div>
      <div className="grid grid-cols-[64px_1fr_1fr_1fr] gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {Array.from({ length: 4 * 8 }).map((_, i) => (
          <div key={i} className="bg-card p-2">
            <Skeleton className="h-10 w-full rounded-lg opacity-60" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-3xl">
      <HeaderSkeleton />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 p-4 last:border-0">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Card key={i}><Skeleton className="h-20" /></Card>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><Skeleton className="mb-4 h-4 w-40" /><Skeleton className="h-56 w-full rounded-xl" /></Card>
        ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="w-full max-w-xs space-y-3 border-r border-border p-4">
        <Skeleton className="h-9 w-full rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-40" /></div>
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-10 rounded-2xl', i % 2 ? 'ml-auto w-2/3' : 'w-1/2')} />
        ))}
      </div>
    </div>
  )
}
