import { cn } from "@/utils/cn"

export function Badge({
  children,
  variant = 'default',
  className
}: {
  children: React.ReactNode,
  variant?: 'default' | 'belt' | 'outline',
  className?: string
}) {
  const styles = {
    default: 'bg-slate-800 text-slate-300',
    belt: 'bg-arena-gold text-black font-black',
    outline: 'border border-slate-700 text-slate-400'
  }

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-tighter",
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
