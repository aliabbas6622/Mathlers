export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Arena...</p>
    </div>
  )
}
