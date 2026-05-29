export default function EchangesLoading() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
      <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}
