import { Loader2Icon } from "lucide-react"

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2Icon className="size-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
