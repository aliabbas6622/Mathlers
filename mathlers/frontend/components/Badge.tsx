import { cn } from "@/utils/cn"

export function Badge({
  children,
  variant = 'default',
  className
}: {
  children: React.ReactNode,
  variant?: 'default' | 'success' | 'outline',
  className?: string
}) {
  const styles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-600',
    outline: 'border border-slate-200 text-slate-400'
  }

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight",
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
