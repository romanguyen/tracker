import { useState } from "react"
import { PlayIcon, RepeatIcon, SquareIcon } from "lucide-react"
import { toast } from "sonner"

import { Button, type buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTimer } from "@/features/timer/timer-context"
import type { VariantProps } from "class-variance-authority"

type StartSessionControlProps = {
  topicId: string
  taskId?: string | null
  label?: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
  /** Render only an icon; the action text moves to an accessible label. */
  iconOnly?: boolean
}

/**
 * Topic/task timer control: starts a session, confirms a switch when another
 * session is running, or stops when the current one matches.
 */
export function StartSessionControl({
  topicId,
  taskId = null,
  label = "Start studying",
  variant = "default",
  size = "default",
  className,
  iconOnly = false,
}: StartSessionControlProps) {
  const { activeTimer, start, stop, switchTo, isBusy } = useTimer()
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false)

  const currentTaskId = activeTimer?.session.task_id ?? null
  const isThisActive =
    activeTimer?.session.topic_id === topicId && currentTaskId === taskId
  const isOtherActive = Boolean(activeTimer) && !isThisActive

  async function handlePrimaryClick() {
    if (isThisActive) {
      const result = await stop()
      if (result && !result.ok) {
        toast.error(result.message || "Could not stop the session.")
      }
      return
    }

    if (isOtherActive) {
      setIsSwitchDialogOpen(true)
      return
    }

    const result = await start({ topicId, taskId })

    if (!result.ok) {
      if (result.reason === "conflict") {
        setIsSwitchDialogOpen(true)
      } else {
        toast.error(result.message || "Could not start the session.")
      }
    }
  }

  async function handleConfirmSwitch() {
    const result = await switchTo({ topicId, taskId })

    if (result.ok) {
      setIsSwitchDialogOpen(false)
    } else {
      toast.error(result.message || "Could not switch the session.")
    }
  }

  const actionText = isThisActive
    ? "Stop"
    : isOtherActive
      ? "Switch here"
      : label

  return (
    <>
      <Button
        variant={isThisActive ? "secondary" : variant}
        size={size}
        className={className}
        onClick={() => void handlePrimaryClick()}
        disabled={isBusy}
        aria-label={iconOnly ? actionText : undefined}
      >
        {isThisActive ? (
          <>
            <SquareIcon aria-hidden="true" />
            {!iconOnly && " Stop"}
          </>
        ) : isOtherActive ? (
          <>
            <RepeatIcon aria-hidden="true" /> {!iconOnly && " Switch here"}
          </>
        ) : (
          <>
            <PlayIcon aria-hidden="true" /> {!iconOnly && ` ${label}`}
          </>
        )}
      </Button>

      <Dialog open={isSwitchDialogOpen} onOpenChange={setIsSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch study focus?</DialogTitle>
            <DialogDescription>
              {activeTimer?.topicTitle
                ? `“${activeTimer.topicTitle}${
                    activeTimer.taskTitle ? ` · ${activeTimer.taskTitle}` : ""
                  }” is being timed right now.`
                : "Another session is being timed right now."}{" "}
              Switching stops it and starts a new session here at the same
              moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSwitchDialogOpen(false)}
            >
              Keep current session
            </Button>
            <Button onClick={() => void handleConfirmSwitch()} disabled={isBusy}>
              {isBusy ? "Switching…" : "Stop current & start here"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
