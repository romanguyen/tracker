import { useEffect, useRef, useState, type FormEvent } from "react"
import { Loader2Icon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/auth-context"
import {
  insertManualSession,
  updateActiveSession,
  updateSession,
  type SessionWithTitles,
} from "@/features/sessions/sessions-api"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabase"
import type { TaskRow, TopicRow } from "@/types/domain"

const NO_TASK_VALUE = "__none__"
const FUTURE_GRACE_MS = 60 * 1000

const TIME_PAD = (value: number) => String(value).padStart(2, "0")

function toInputValue(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${TIME_PAD(date.getMonth() + 1)}-${TIME_PAD(
    date.getDate(),
  )}T${TIME_PAD(date.getHours())}:${TIME_PAD(date.getMinutes())}`
}

function fromInputValue(value: string): string {
  return new Date(value).toISOString()
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

export type SessionFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  topics: TopicRow[]
  /** Required when mode === "edit". */
  session: SessionWithTitles | null
  onSaved: () => void
}

export function SessionFormDialog({
  open,
  onOpenChange,
  mode,
  topics,
  session,
  onSaved,
}: SessionFormDialogProps) {
  const supabase = getSupabaseClient()
  const { user } = useAuth()

  const isActive = Boolean(session && !session.ended_at)
  const originalTopicId =
    session?.topic_id ?? (topics.length === 1 ? topics[0].id : "")
  const openerRef = useRef<HTMLElement | null>(null)

  // Radix doesn't reliably return focus on controlled closes; restore it.
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

  const [topicId, setTopicId] = useState(originalTopicId)
  const [taskId, setTaskId] = useState<string | null>(session?.task_id ?? null)
  const [taskOptions, setTaskOptions] = useState<TaskRow[]>([])
  const [startValue, setStartValue] = useState(
    toInputValue(session?.started_at ?? minutesAgoIso(60)),
  )
  const [endValue, setEndValue] = useState(
    toInputValue(session?.ended_at ?? new Date().toISOString()),
  )
  const [note, setNote] = useState(session?.note ?? "")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Re-seed the form whenever a different session is edited.
  useEffect(() => {
    if (!open) {
      return
    }

    setTopicId(originalTopicId)
    setTaskId(session?.task_id ?? null)
    setStartValue(toInputValue(session?.started_at ?? minutesAgoIso(60)))
    setEndValue(toInputValue(session?.ended_at ?? new Date().toISOString()))
    setNote(session?.note ?? "")
    setFormError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session])

  // Assignable mini-tasks follow the chosen topic.
  useEffect(() => {
    if (!supabase || !topicId || isActive) {
      setTaskOptions([])
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("tasks")
      .select("*")
      .eq("topic_id", topicId)
      .is("archived_at", null)
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (!isCancelled) {
          setTaskOptions(data ?? [])
        }
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, topicId, isActive])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setFormError(null)

    let startedAtIso: string
    let endedAtIso: string

    try {
      startedAtIso = fromInputValue(startValue)
      endedAtIso = isActive
        ? (session?.ended_at ?? new Date().toISOString())
        : fromInputValue(endValue)
    } catch {
      setFormError("Check the date fields — one of them is not a valid time.")
      return
    }

    if (!topicId) {
      setFormError("Choose a topic for this session.")
      return
    }

    if (!isActive) {
      if (Date.parse(endedAtIso) <= Date.parse(startedAtIso)) {
        setFormError("The end time must be later than the start time.")
        return
      }

      if (Date.parse(endedAtIso) > Date.now() + FUTURE_GRACE_MS) {
        setFormError("The end time cannot be in the future.")
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === "add") {
        if (!user) {
          return
        }

        await insertManualSession(supabase, user.id, {
          topicId,
          taskId,
          startedAtIso,
          endedAtIso,
          note,
        })
      } else if (session) {
        if (isActive) {
          await updateActiveSession(supabase, session.id, {
            startedAtIso,
            note,
          })
        } else {
          await updateSession(supabase, session.id, {
            topicId,
            taskId,
            startedAtIso,
            endedAtIso,
            note,
          })
        }
      }

      toast.success(mode === "add" ? "Session added" : "Session updated")
      onSaved()
      onOpenChange(false)
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the session.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Add a manual session"
              : isActive
                ? "Adjust the running session"
                : "Edit session"}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? "While running, a session can only change its start time or note. Topic and task stay fixed."
              : "Recorded time contributes to topic, task, and overall totals."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isActive ? (
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              <p className="font-medium">{session?.topicTitle}</p>
              {session?.taskTitle ? (
                <p className="text-muted-foreground">{session.taskTitle}</p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="session-topic">Topic</Label>
                <Select
                  value={topicId}
                  onValueChange={(value) => {
                    setTopicId(value)
                    setTaskId(null)
                  }}
                  disabled={topics.length <= 1}
                >
                  <SelectTrigger id="session-topic" className="w-full">
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title_cs}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-task">Mini-task (optional)</Label>
                <Select
                  value={taskId ?? NO_TASK_VALUE}
                  onValueChange={(value) =>
                    setTaskId(value === NO_TASK_VALUE ? null : value)
                  }
                  disabled={!topicId || taskOptions.length === 0}
                >
                  <SelectTrigger id="session-task" className="w-full">
                    <SelectValue
                      placeholder={
                        topicId
                          ? taskOptions.length > 0
                            ? "No mini-task"
                            : "This topic has no mini-tasks yet"
                          : "Choose a topic first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TASK_VALUE}>No mini-task</SelectItem>
                    {taskOptions.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div
            className={
              isActive
                ? "w-full"
                : "grid gap-4 sm:grid-cols-2"
            }
          >
            <div className="space-y-2">
              <Label htmlFor="session-start">Start</Label>
              <Input
                id="session-start"
                type="datetime-local"
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                required
              />
            </div>
            {!isActive ? (
              <div className="space-y-2">
                <Label htmlFor="session-end">End</Label>
                <Input
                  id="session-end"
                  type="datetime-local"
                  value={endValue}
                  onChange={(event) => setEndValue(event.target.value)}
                  required
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-note">Note (optional)</Label>
            <Textarea
              id="session-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you cover?"
              rows={3}
              maxLength={1000}
            />
          </div>

          {formError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isActive === false && !topicId}>
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {mode === "add" ? "Save session" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
