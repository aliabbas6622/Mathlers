import { cn } from "@/utils/cn"

export function Progress({
  value,
  max = 100,
  className
}: {
  value: number,
  max?: number,
  className?: string
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("h-2 w-full bg-slate-100 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
