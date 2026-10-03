import {
  CircleDotIcon,
  Clock3Icon,
  HistoryIcon,
  HourglassIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SessionWithTitles } from "@/features/sessions/sessions-api"
import {
  formatDateHeading,
  formatDateTime,
  formatRecordedSeconds,
} from "@/lib/time"

export type SessionListProps = {
  sessions: SessionWithTitles[]
  showTopic?: boolean
  onEdit: (session: SessionWithTitles) => void
  onDelete: (session: SessionWithTitles) => void
}

function sessionDurationSeconds(session: SessionWithTitles): number {
  if (!session.ended_at) {
    return 0
  }
  return Math.max(
    0,
    Math.round(
      (Date.parse(session.ended_at) - Date.parse(session.started_at)) / 1000,
    ),
  )
}

export function SessionList({
  sessions,
  showTopic = true,
  onEdit,
  onDelete,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader className="items-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <HistoryIcon className="size-7" aria-hidden="true" />
          </span>
          <CardTitle className="text-xl">No sessions match</CardTitle>
          <CardDescription>
            Start the timer on a topic, or add a manual session for time you
            already studied.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const rows = sessions.map((session, index) => ({
    session,
    showHeading:
      index === 0 ||
      formatDateHeading(sessions.at(index - 1)?.started_at ?? "") !==
        formatDateHeading(session.started_at),
    heading: formatDateHeading(session.started_at),
  }))

  return (
    <ol className="space-y-4">
      {rows.map(({ session, showHeading, heading }) => {
        const isRunning = !session.ended_at
        const duration = sessionDurationSeconds(session)

        return (
          <li key={session.id} className="space-y-2">
            {showHeading ? (
              <h3 className="pt-2 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                {heading}
              </h3>
            ) : null}
            <div
              className={
                isRunning
                  ? "rounded-xl border border-primary/40 bg-primary/5 px-4 py-3"
                  : "rounded-xl border border-border/70 bg-card px-4 py-3"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {showTopic ? <span>{session.topicTitle}</span> : null}
                    {session.taskTitle ? (
                      <span className="text-muted-foreground">
                        {showTopic ? "· " : ""}
                        {session.taskTitle}
                      </span>
                    ) : null}
                    {session.mode === "pomodoro" ? (
                      <Badge variant="outline">
                        <HourglassIcon aria-hidden="true" /> Pomodoro
                      </Badge>
                    ) : null}
                    {isRunning ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <CircleDotIcon aria-hidden="true" /> Running
                      </Badge>
                    ) : null}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                    <Clock3Icon className="size-3.5" aria-hidden="true" />
                    {formatDateTime(session.started_at)} –{" "}
                    {session.ended_at
                      ? formatDateTime(session.ended_at)
                      : "now"}
                  </p>
                  {session.note ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {session.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {!isRunning ? (
                    <Badge variant="secondary">
                      {formatRecordedSeconds(duration)}
                    </Badge>
                  ) : null}
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onEdit(session)}
                      aria-label={isRunning ? "Adjust running session" : "Edit session"}
                    >
                      <PencilIcon aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDelete(session)}
                      aria-label={isRunning ? "Discard running session" : "Delete session"}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
