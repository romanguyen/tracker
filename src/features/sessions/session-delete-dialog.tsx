import { useEffect, useRef, useState } from "react"
import { Loader2Icon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { deleteSession } from "@/features/sessions/sessions-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/time"
import { getSupabaseClient } from "@/lib/supabase"
import type { SessionWithTitles } from "@/features/sessions/sessions-api"

export type SessionDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: SessionWithTitles | null
  onDeleted: () => void
}

export function SessionDeleteDialog({
  open,
  onOpenChange,
  session,
  onDeleted,
}: SessionDeleteDialogProps) {
  const supabase = getSupabaseClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null
      return undefined
    }

    if (openerRef.current) {
      openerRef.current.focus()
      openerRef.current = null
    }
    return undefined
  }, [open])

  if (!session) {
    return null
  }

  const isRunning = !session.ended_at

  async function handleDelete() {
    if (!supabase || !session) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteSession(supabase, session.id)
      toast.success(isRunning ? "Running session discarded" : "Session deleted")
      onDeleted()
      onOpenChange(false)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the session.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRunning ? "Discard the running session?" : "Delete this session?"}
          </DialogTitle>
          <DialogDescription>
            {session.topicTitle}
            {session.taskTitle ? ` · ${session.taskTitle}` : ""} — started{" "}
            {formatDateTime(session.started_at)}.
            {isRunning
              ? " Discarding stops the timer without recording any time."
              : " Deleting removes its time from all totals."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isRunning ? "Discard session" : "Delete session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
