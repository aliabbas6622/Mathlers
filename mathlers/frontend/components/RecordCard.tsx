import { cn } from "@/utils/cn"

export function RecordCard({
  title,
  holder,
  value,
  unit,
  category,
  date,
  source
}: {
  title: string
  holder: string
  value: number | string
  unit: string
  category: string
  date: string
  source: string
}) {
  return (
    <div className="arena-card group hover:border-slate-600 transition-colors">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-arena-gold">
          {category} Record
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{date}</span>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-black mb-1 leading-tight group-hover:text-arena-gold transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-sm mb-4">Held by: <span className="text-slate-200 font-semibold">{holder}</span></p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">{value}</span>
          <span className="text-sm font-bold text-slate-500 uppercase">{unit}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-500">Source: {source}</span>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
    </div>
  )
}
