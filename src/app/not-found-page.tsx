import { Link } from "react-router"
import { CompassIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-secondary text-primary">
        <CompassIcon className="size-8" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <p className="text-sm font-bold tracking-[0.22em] text-primary uppercase">
          404
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          This study page does not exist
        </h1>
        <p className="text-muted-foreground">
          The route may be a placeholder for a future feature or the address may
          contain a typo.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Return to overview</Link>
      </Button>
    </div>
  )
}
