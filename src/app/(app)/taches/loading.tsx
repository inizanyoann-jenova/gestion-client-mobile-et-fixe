export default function TachesLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-16 bg-slate-800 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
