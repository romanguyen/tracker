import { useState, type FormEvent } from "react"
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  ListChecksIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/features/auth/auth-context"
import {
  insertTask,
  renameTask,
  setTaskArchived,
  setTaskCompleted,
  swapTaskPositions,
  TASK_POSITION_STEP,
} from "@/features/tasks/tasks-api"
import { useTopicTasks } from "@/features/tasks/use-topic-tasks"
import { StartSessionControl } from "@/features/timer/start-session-control"
import { useTaskTimeTotals } from "@/features/timer/use-time-totals"
import { getSupabaseClient } from "@/lib/supabase"
import { formatRecordedSeconds } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { TaskRow } from "@/types/domain"

const NEW_TASK_SUGGESTIONS = [
  "Read the official description",
  "Summarize the key concepts",
  "Draft one exam-style answer aloud",
]

type TaskActions = {
  busyTaskId: string | null
  onToggle: (task: TaskRow, completed: boolean) => void
  onMove: (task: TaskRow, direction: -1 | 1) => void
  onRenameStart: (task: TaskRow) => void
  onArchive: (task: TaskRow) => void
}

function TaskItem({
  task,
  index,
  count,
  recordedSeconds,
  actions,
}: {
  task: TaskRow
  index: number
  count: number
  recordedSeconds: number
  actions: TaskActions
}) {
  const isCompleted = Boolean(task.completed_at)
  const isBusy = actions.busyTaskId === task.id

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
      <Checkbox
        id={`task-${task.id}`}
        checked={isCompleted}
        disabled={isBusy}
        onCheckedChange={(checked) => actions.onToggle(task, checked === true)}
        aria-label={`Mark “${task.title}” as ${isCompleted ? "not done" : "done"}`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className={cn(
            "cursor-pointer text-sm leading-6 font-medium",
            isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </label>
        {recordedSeconds > 0 ? (
          <p className="text-xs text-muted-foreground">
            Studied {formatRecordedSeconds(recordedSeconds)}
          </p>
        ) : null}
      </div>
      {isBusy ? (
        <Loader2Icon
          className="mt-0.5 size-4 animate-spin text-muted-foreground"
          aria-label="Saving"
        />
      ) : null}
      <StartSessionControl
        topicId={task.topic_id}
        taskId={task.id}
        size="icon-sm"
        variant="outline"
        iconOnly
        className="mt-0.5 shrink-0"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isBusy}
            aria-label={`Actions for “${task.title}”`}
          >
            <EllipsisVerticalIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => actions.onRenameStart(task)}>
            <PencilIcon aria-hidden="true" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === 0}
            onSelect={() => actions.onMove(task, -1)}
          >
            <ChevronUpIcon aria-hidden="true" /> Move up
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === count - 1}
            onSelect={() => actions.onMove(task, 1)}
          >
            <ChevronDownIcon aria-hidden="true" /> Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => actions.onArchive(task)}>
            <ArchiveIcon aria-hidden="true" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

export function TasksPanel({ topicId }: { topicId: string }) {
  const supabase = getSupabaseClient()
  const { user } = useAuth()
  const { tasks, isLoading, error, refresh } = useTopicTasks(topicId)
  const { totals: taskTotals } = useTaskTimeTotals(topicId)

  const [newTitle, setNewTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [renameTarget, setRenameTarget] = useState<TaskRow | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameError, setRenameError] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const activeTasks = tasks.filter((task) => !task.archived_at)
  const archivedTasks = tasks.filter((task) => task.archived_at)
  const completedCount = activeTasks.filter((task) => task.completed_at).length
  const progressValue = activeTasks.length
    ? Math.round((completedCount / activeTasks.length) * 100)
    : 0

  async function runTaskOperation(taskId: string, operation: () => Promise<void>) {
    setBusyTaskId(taskId)
    try {
      await operation()
      refresh()
    } catch (operationError) {
      toast.error(
        operationError instanceof Error
          ? operationError.message
          : "Something went wrong while saving.",
      )
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user) {
      return
    }

    const title = newTitle.trim()

    if (!title) {
      return
    }

    setIsAdding(true)
    const nextPosition =
      Math.max(0, ...tasks.map((task) => task.position)) + TASK_POSITION_STEP

    try {
      await insertTask(supabase, {
        userId: user.id,
        topicId,
        title,
        position: nextPosition,
      })
      setNewTitle("")
      refresh()
    } catch (operationError) {
      toast.error(
        operationError instanceof Error
          ? operationError.message
          : "Could not add the mini-task.",
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !renameTarget) {
      return
    }

    const title = renameValue.trim()
    setRenameError(null)

    if (!title) {
      setRenameError("The title cannot be empty.")
      return
    }

    setIsRenaming(true)

    try {
      await renameTask(supabase, renameTarget.id, title)
      setRenameTarget(null)
      refresh()
    } catch (operationError) {
      setRenameError(
        operationError instanceof Error
          ? operationError.message
          : "Could not rename the mini-task.",
      )
    } finally {
      setIsRenaming(false)
    }
  }

  const actions: TaskActions = {
    busyTaskId,
    onToggle: (task, completed) =>
      void runTaskOperation(task.id, () =>
        setTaskCompleted(supabase!, task.id, completed),
      ),
    onMove: (task, direction) => {
      const index = activeTasks.findIndex((item) => item.id === task.id)
      const neighbor = activeTasks[index + direction]

      if (!neighbor || !supabase) {
        return
      }

      const client = supabase
      void runTaskOperation(task.id, () =>
        swapTaskPositions(client, task, neighbor),
      )
    },
    onRenameStart: (task) => {
      setRenameTarget(task)
      setRenameValue(task.title)
      setRenameError(null)
    },
    onArchive: (task) =>
      void runTaskOperation(task.id, async () => {
        await setTaskArchived(supabase!, task.id, true)
        toast(`Archived “${task.title}”`, {
          duration: 10000,
          action: {
            label: "Undo",
            onClick: () => {
              if (supabase) {
                void runTaskOperation(task.id, () =>
                  setTaskArchived(supabase, task.id, false),
                )
              }
            },
          },
        })
      }),
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading mini-tasks">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Could not load mini-tasks</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ListChecksIcon className="size-4 text-primary" aria-hidden="true" />
              Mini-tasks
            </span>
            <Badge variant="secondary">
              {completedCount} of {activeTasks.length} done
            </Badge>
          </CardTitle>
          <CardDescription>
            Break this topic into small, winnable pieces and tick them off as
            you study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressValue} aria-label="Mini-task completion" />
        </CardContent>
      </Card>

      {activeTasks.length > 0 ? (
        <ul className="space-y-2">
          {activeTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              count={activeTasks.length}
              recordedSeconds={taskTotals[task.id] ?? 0}
              actions={actions}
            />
          ))}
        </ul>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No mini-tasks yet</CardTitle>
            <CardDescription>
              Start with one of these, or add your own below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {NEW_TASK_SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="secondary"
                size="sm"
                onClick={() => setNewTitle(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a mini-task, e.g. Explain Dijkstra's algorithm"
          aria-label="New mini-task title"
          maxLength={200}
        />
        <Button type="submit" disabled={isAdding || !newTitle.trim()}>
          {isAdding ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <PlusIcon aria-hidden="true" />
          )}
          Add
        </Button>
      </form>

      {archivedTasks.length > 0 ? (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived((current) => !current)}
            aria-expanded={showArchived}
          >
            {showArchived ? (
              <ChevronUpIcon aria-hidden="true" />
            ) : (
              <ChevronDownIcon aria-hidden="true" />
            )}
            {showArchived ? "Hide" : "Show"} archived ({archivedTasks.length})
          </Button>
          {showArchived ? (
            <ul className="space-y-2">
              {archivedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 border-dashed px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="line-through">{task.title}</span>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busyTaskId === task.id}
                    onClick={() =>
                      void runTaskOperation(task.id, () =>
                        setTaskArchived(supabase!, task.id, false),
                      )
                    }
                  >
                    <ArchiveRestoreIcon aria-hidden="true" /> Restore
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename mini-task</DialogTitle>
            <DialogDescription>
              Changing the title keeps the task's history and position.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              aria-label="Mini-task title"
              maxLength={200}
              autoFocus
            />
            {renameError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertDescription>{renameError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                Save title
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
