import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "../Button"

export function ErrorState({
  message = "Something went wrong in the arena.",
  onRetry
}: {
  message?: string,
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="p-4 bg-red-50 rounded-2xl mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">Technical Knockout</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Retry Connection
        </Button>
      )}
    </div>
  )
}
