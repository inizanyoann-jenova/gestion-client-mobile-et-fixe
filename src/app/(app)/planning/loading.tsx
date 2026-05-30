import { Skeleton } from '@/components/ui/skeleton'

export default function PlanningLoading() {
  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  )
}
