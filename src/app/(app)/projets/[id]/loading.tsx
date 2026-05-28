import { Skeleton } from '@/components/ui/skeleton'

export default function ProjetDetailLoading() {
  return (
    <div className="pb-24">
      <div className="bg-slate-800 px-4 pt-4 pb-5 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="px-4 space-y-6 mt-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
