import { Skeleton } from '@/components/ui/skeleton'

export default function ParametresLoading() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  )
}
