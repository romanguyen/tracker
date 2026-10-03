import { useState } from "react"
import { HourglassIcon } from "lucide-react"
import { toast } from "sonner"
import type { VariantProps } from "class-variance-authority"

import { Button, type buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BREAK_MINUTE_OPTIONS,
  FOCUS_MINUTE_OPTIONS,
} from "@/features/timer/pomodoro-settings"
import { useTimer } from "@/features/timer/timer-context"

type PomodoroControlProps = {
  topicId: string
  taskId?: string | null
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
  iconOnly?: boolean
}

/**
 * "Pomodoro" always opens a round-setup dialog first — focus and break
 * lengths are picked before anything starts. Choices persist per device.
 */
export function PomodoroControl({
  topicId,
  taskId = null,
  variant = "outline",
  size = "sm",
  className,
  iconOnly = false,
}: PomodoroControlProps) {
  const {
    activeTimer,
    pomodoro,
    pomodoroSettings,
    savePomodoroSettings,
    startPomodoro,
    nextPomodoroRound,
    switchTo,
    isBusy,
  } = useTimer()

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null)
  const [breakMinutes, setBreakMinutes] = useState<number | null>(null)

  const matchesThisTarget = pomodoro
    ? pomodoro.target.topicId === topicId && pomodoro.target.taskId === taskId
    : false
  const sessionActive = Boolean(activeTimer)

  function openConfig() {
    setFocusMinutes(pomodoroSettings.focusMinutes)
    setBreakMinutes(pomodoroSettings.breakMinutes)
    setIsConfigOpen(true)
  }

  async function handleStartRound() {
    if (focusMinutes === null || breakMinutes === null) {
      return
    }

    savePomodoroSettings({ focusMinutes, breakMinutes })
    setIsConfigOpen(false)

    if (pomodoro?.phase === "ready" && matchesThisTarget) {
      const result = await nextPomodoroRound()
      if (result && !result.ok) {
        toast.error(result.message || "Could not start the next round.")
      }
      return
    }

    if (sessionActive && activeTimer?.session.mode === "stopwatch") {
      const result = await switchTo({
        topicId,
        taskId,
        mode: "pomodoro",
        plannedSeconds: focusMinutes * 60,
      })
      if (!result.ok) {
        toast.error(result.message || "Could not switch to a pomodoro round.")
      }
      return
    }

    if (sessionActive) {
      // Someone else's pomodoro is running on another target — confirmless
      // switch (the dialog copy already warned about it).
      const result = await switchTo({
        topicId,
        taskId,
        mode: "pomodoro",
        plannedSeconds: focusMinutes * 60,
      })
      if (!result.ok) {
        toast.error(result.message || "Could not switch to a pomodoro round.")
      }
      return
    }

    const result = await startPomodoro({ topicId, taskId })
    if (!result.ok) {
      toast.error(result.message || "Could not start the pomodoro.")
    }
  }

  const startLabel = matchesThisTarget && pomodoro?.phase === "ready"
    ? `Start round ${pomodoro.round + 1}`
    : sessionActive
      ? "Stop current & start round"
      : "Start round 1"

  return (
    <>
      {pomodoro && matchesThisTarget && pomodoro.phase === "focus" ? (
        <Button size={size} variant="secondary" className={className} disabled>
          <HourglassIcon aria-hidden="true" />
          {!iconOnly && ` Round ${pomodoro.round}`}
        </Button>
      ) : pomodoro && matchesThisTarget && pomodoro.phase === "break" ? (
        <Button
          size={size}
          variant="secondary"
          className={className}
          aria-label="Break in progress"
          disabled
        >
          <HourglassIcon aria-hidden="true" />
          {!iconOnly && " Break"}
        </Button>
      ) : (
        <Button
          size={size}
          variant={variant}
          className={className}
          aria-label={
            iconOnly
              ? matchesThisTarget && pomodoro?.phase === "ready"
                ? `Start pomodoro round ${pomodoro.round + 1}`
                : "Set up a pomodoro round"
              : undefined
          }
          onClick={openConfig}
        >
          <HourglassIcon aria-hidden="true" />
          {!iconOnly &&
            (matchesThisTarget && pomodoro?.phase === "ready"
              ? ` Round ${pomodoro.round + 1}`
              : " Pomodoro")}
        </Button>
      )}

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up a pomodoro round</DialogTitle>
            <DialogDescription>
              Pick your lengths, then start. Your choices are remembered.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="config-focus">Focus</Label>
              <Select
                value={focusMinutes !== null ? String(focusMinutes) : undefined}
                onValueChange={(value) => setFocusMinutes(Number(value))}
              >
                <SelectTrigger id="config-focus" className="w-full">
                  <SelectValue placeholder="Focus minutes" />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_MINUTE_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-break">Break</Label>
              <Select
                value={breakMinutes !== null ? String(breakMinutes) : undefined}
                onValueChange={(value) => setBreakMinutes(Number(value))}
              >
                <SelectTrigger id="config-break" className="w-full">
                  <SelectValue placeholder="Break minutes" />
                </SelectTrigger>
                <SelectContent>
                  {BREAK_MINUTE_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sessionActive ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              “{activeTimer?.topicTitle}”
              {activeTimer?.taskTitle ? ` · ${activeTimer.taskTitle}` : ""} is
              timing right now. Starting switches it: that session ends and
              round 1 begins at the same moment.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Focus time is recorded as study time; breaks are never counted.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStartRound()}
              disabled={isBusy || focusMinutes === null || breakMinutes === null}
            >
              <HourglassIcon aria-hidden="true" />
              {startLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
