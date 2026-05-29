export default function DocumentsLoading() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}
