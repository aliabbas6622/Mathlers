import { Inbox } from "lucide-react"

export function EmptyState({
  title = "No data found",
  description = "The arena is currently empty. Start training to see results!"
}: {
  title?: string,
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="p-4 bg-slate-50 rounded-2xl mb-4">
        <Inbox className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs">{description}</p>
    </div>
  )
}
