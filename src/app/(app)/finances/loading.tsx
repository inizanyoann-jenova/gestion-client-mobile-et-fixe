import { Skeleton } from '@/components/ui/skeleton'

export default function FinancesLoading() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )
}
