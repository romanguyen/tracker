import { useState } from "react"
import { PlusIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SessionDeleteDialog } from "@/features/sessions/session-delete-dialog"
import { SessionFormDialog } from "@/features/sessions/session-form-dialog"
import { SessionList } from "@/features/sessions/session-list"
import {
  EMPTY_SESSION_FILTERS,
  type SessionWithTitles,
} from "@/features/sessions/sessions-api"
import { useSessionHistory } from "@/features/sessions/use-session-history"
import { useTimer } from "@/features/timer/timer-context"
import type { TopicRow } from "@/types/domain"

export function TopicSessions({ topic }: { topic: TopicRow }) {
  const {
    sessions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useSessionHistory({ ...EMPTY_SESSION_FILTERS, topicId: topic.id })
  const { refreshSessions } = useTimer()

  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null)
  const [editedSession, setEditedSession] = useState<SessionWithTitles | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<SessionWithTitles | null>(
    null,
  )

  async function handleSaved() {
    refresh()
    refreshSessions()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sessions recorded under this topic and its mini-tasks.
        </p>
        <Button size="sm" variant="outline" onClick={() => setDialogMode("add")}>
          <PlusIcon aria-hidden="true" /> Add manual session
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Could not load sessions</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading && sessions.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <SessionList
          sessions={sessions}
          showTopic={false}
          onEdit={(session) => {
            setEditedSession(session)
            setDialogMode("edit")
          }}
          onDelete={(session) => setDeleteTarget(session)}
        />
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={loadMore} disabled={isLoading}>
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
        topics={[topic]}
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
