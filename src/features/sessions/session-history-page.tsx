import { useState } from "react"
import { PlusIcon, SlidersHorizontalIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SessionDeleteDialog } from "@/features/sessions/session-delete-dialog"
import { SessionFormDialog } from "@/features/sessions/session-form-dialog"
import { SessionList } from "@/features/sessions/session-list"
import {
  EMPTY_SESSION_FILTERS,
  type SessionWithTitles,
} from "@/features/sessions/sessions-api"
import { useSessionHistory } from "@/features/sessions/use-session-history"
import { useTopics } from "@/features/topics/use-topics"
import { useTopicTasks } from "@/features/tasks/use-topic-tasks"
import { useTimer } from "@/features/timer/timer-context"

const ALL_TOPICS_VALUE = "__all__"
const ALL_TASKS_VALUE = "__all-tasks__"

export function SessionHistoryPage() {
  const { topics, isLoading: isTopicsLoading, isConfigured, error: topicsError } =
    useTopics()
  const {
    sessions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    filters,
    setFilters,
  } = useSessionHistory(EMPTY_SESSION_FILTERS)
  const { refreshSessions } = useTimer()

  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null)
  const [editedSession, setEditedSession] = useState<SessionWithTitles | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<SessionWithTitles | null>(
    null,
  )

  const filterTasks = useTopicTasks(filters.topicId ?? "")

  const hasActiveFilters = Boolean(
    filters.topicId || filters.taskId || filters.fromIso || filters.toIso,
  )

  async function handleSaved() {
    refresh()
    refreshSessions()
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Study history"
        title="Every study session, from start to corrected record."
        description="Filter, annotate, add, adjust, or remove sessions. All totals everywhere update automatically."
      >
        <Button onClick={() => setDialogMode("add")} disabled={!isConfigured}>
          <PlusIcon aria-hidden="true" />
          Add manual session
        </Button>
      </PageHeader>

      <section aria-label="Session filters" className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="filter-topic">Topic</Label>
            <Select
              value={filters.topicId ?? ALL_TOPICS_VALUE}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  topicId: value === ALL_TOPICS_VALUE ? null : value,
                  taskId: null,
                })
              }
            >
              <SelectTrigger id="filter-topic" className="w-full">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TOPICS_VALUE}>All topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title_cs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-task">Mini-task</Label>
            <Select
              value={filters.taskId ?? ALL_TASKS_VALUE}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  taskId: value === ALL_TASKS_VALUE ? null : value,
                })
              }
              disabled={!filters.topicId}
            >
              <SelectTrigger id="filter-task" className="w-full">
                <SelectValue
                  placeholder={
                    filters.topicId ? "Any mini-task" : "Choose a topic first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TASKS_VALUE}>Any mini-task</SelectItem>
                {filterTasks.tasks
                  .filter((task) => !task.archived_at)
                  .map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-from">From</Label>
            <Input
              id="filter-from"
              type="date"
              value={filters.fromIso?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  fromIso: event.target.value
                    ? `${event.target.value}T00:00:00.000Z`
                    : null,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-to">To</Label>
            <Input
              id="filter-to"
              type="date"
              value={filters.toIso?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  toIso: event.target.value
                    ? `${event.target.value}T23:59:59.999Z`
                    : null,
                })
              }
            />
          </div>

          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY_SESSION_FILTERS)}
              className="justify-self-start xl:justify-self-end"
            >
              <XIcon aria-hidden="true" /> Clear
            </Button>
          ) : null}
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
        {hasActiveFilters ? (
          <span>
            Showing sessions matching the current filters
            <Badge variant="secondary" className="ml-2">
              filtered
            </Badge>
          </span>
        ) : (
          <span>Newest sessions first</span>
        )}
      </div>

      {error ?? topicsError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Could not load sessions</AlertTitle>
          <AlertDescription>{error ?? topicsError}</AlertDescription>
        </Alert>
      ) : null}

      {!isTopicsLoading || sessions.length > 0 ? (
        <SessionList
          sessions={sessions}
          onEdit={(session) => {
            setEditedSession(session)
            setDialogMode("edit")
          }}
          onDelete={(session) => setDeleteTarget(session)}
        />
      ) : null}

      {(isLoading || isTopicsLoading) && sessions.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            Load older sessions
          </Button>
        </div>
      ) : null}

      <SessionFormDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
            setEditedSession(null)
          }
        }}
        mode={dialogMode === "edit" ? "edit" : "add"}
        topics={topics}
        session={editedSession}
        onSaved={() => void handleSaved()}
      />

      <SessionDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        session={deleteTarget}
        onDeleted={() => void handleSaved()}
      />
    </div>
  )
}
