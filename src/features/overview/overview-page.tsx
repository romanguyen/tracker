import { useState } from "react"
import { Link } from "react-router"
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  CalendarClockIcon,
  FlameIcon,
  ListChecksIcon,
  SparklesIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useOverviewWindows,
  windowsMondayStart,
} from "@/features/overview/use-overview-windows"
import {
  COMMON_TIMEZONES,
  detectBrowserTimezone,
  useProfile,
} from "@/features/overview/use-profile"
import { useSessionHistory } from "@/features/sessions/use-session-history"
import { EMPTY_SESSION_FILTERS } from "@/features/sessions/sessions-api"
import { useTaskSummaries } from "@/features/tasks/use-task-summaries"
import { StartSessionControl } from "@/features/timer/start-session-control"
import { useTopicStudyStats } from "@/features/timer/use-time-totals"
import { useTopics } from "@/features/topics/use-topics"
import { formatRecordedSeconds, formatDateTime } from "@/lib/time"

function greetingForHour(hour: number): string {
  if (hour < 11) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function OverviewPage() {
  const { topics, isConfigured } = useTopics()
  const { timezone, setTimezone } = useProfile()
  const { windows } = useOverviewWindows(timezone)
  const { stats } = useTopicStudyStats()
  const { summaries } = useTaskSummaries()
  const { sessions } = useSessionHistory(EMPTY_SESSION_FILTERS)

  const topicById = new Map(topics.map((topic) => [topic.id, topic]))
  const studiedCount = Object.keys(stats).filter(
    (topicId) => (stats[topicId]?.seconds ?? 0) > 0,
  ).length

  const taskTotals = Object.values(summaries).reduce(
    (acc, summary) => ({
      total: acc.total + summary.total,
      completed: acc.completed + summary.completed,
    }),
    { total: 0, completed: 0 },
  )

  const breakdown = Object.entries(stats)
    .map(([topicId, stat]) => ({
      topic: topicById.get(topicId),
      seconds: stat.seconds,
    }))
    .filter(
      (entry): entry is { topic: NonNullable<typeof entry.topic>; seconds: number } =>
        Boolean(entry.topic) && entry.seconds > 0,
    )
    .sort((a, b) => b.seconds - a.seconds)

  const maxBreakdownSeconds = breakdown.at(0)?.seconds ?? 1
  const topBreakdown = breakdown.slice(0, 6)
  const restSeconds = breakdown
    .slice(6)
    .reduce((sum, entry) => sum + entry.seconds, 0)

  const [{ hour, mondayLabel }] = useState(() => ({
    hour: new Date().getHours(),
    ...windowsMondayStart(),
  }))
  const hasAnyStudy = (windows?.allTimeSeconds ?? 0) > 0

  if (!isConfigured) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Overview"
          title="Your study command center unlocks with Supabase."
          description="Connect the project to see daily and weekly totals, topic breakdowns, and recent sessions."
        >
          <Badge variant="secondary">Setup required</Badge>
        </PageHeader>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`${greetingForHour(hour)}. Time to study.`}
        description="Your totals, breakdowns, and recent work — always reconciled straight from recorded sessions."
      >
        {topics.length > 0 ? (
          <StartSessionControl topicId={topics[0].id} label="Start studying" />
        ) : null}
      </PageHeader>

      {!hasAnyStudy ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-5 text-primary" aria-hidden="true" />
              No recorded sessions yet
            </CardTitle>
            <CardDescription>
              Your tracker is fully set up. Pick a topic, split it into
              mini-tasks, and start the timer — the first statistic appears
              right here.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/topics">
                Open topics <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <section
        aria-label="Study totals"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlameIcon className="size-4 text-primary" aria-hidden="true" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {formatRecordedSeconds(windows?.todaySeconds ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClockIcon
                className="size-4 text-primary"
                aria-hidden="true"
              />
              This week
            </CardTitle>
            <CardDescription>since {mondayLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {formatRecordedSeconds(windows?.weekSeconds ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {formatRecordedSeconds(windows?.allTimeSeconds ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheckIcon
                className="size-4 text-primary"
                aria-hidden="true"
              />
              Topics studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {studiedCount}
              <span className="text-muted-foreground"> / {topics.length}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Topic time breakdown</CardTitle>
            <CardDescription>
              Recorded study time per topic, ordered by volume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing recorded yet — the first finished session draws the
                chart.
              </p>
            ) : (
              <ul className="space-y-3">
                {topBreakdown.map((entry) => (
                  <li key={entry.topic.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <Link
                        to={`/topics/${entry.topic.id}`}
                        className="min-w-0 truncate font-medium hover:underline"
                      >
                        {entry.topic.title_cs}
                      </Link>
                      <span className="text-muted-foreground tabular-nums">
                        {formatRecordedSeconds(entry.seconds)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.max(
                            2,
                            Math.round((entry.seconds / maxBreakdownSeconds) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
                {restSeconds > 0 ? (
                  <li className="pt-1 text-sm text-muted-foreground">
                    + {formatRecordedSeconds(restSeconds)} across the remaining
                    topics.
                  </li>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecksIcon className="size-4 text-primary" aria-hidden="true" />
                Mini-tasks
              </CardTitle>
              <CardDescription>
                Completed across every topic (archived excluded).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-semibold tabular-nums">
                {taskTotals.completed}
                <span className="text-muted-foreground">
                  {" "}
                  / {taskTotals.total}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study timezone</CardTitle>
              <CardDescription>
                Day and week boundaries follow this zone — saved to your
                profile and used on every device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="timezone-select">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => void setTimezone(value)}
                >
                  <SelectTrigger id="timezone-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...new Set([
                        timezone,
                        detectBrowserTimezone(),
                        ...COMMON_TIMEZONES,
                      ]),
                    ].map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Weeks always start on Monday.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <section aria-label="Recent sessions">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>
                The latest work — jump back in with one click or manage
                everything in History.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/history">
                Open history <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sessions you finish appear here instantly.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {sessions.slice(0, 5).map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.topicTitle}
                        {session.taskTitle ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {session.taskTitle}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(session.started_at)} ·{" "}
                        {session.ended_at
                          ? formatRecordedSeconds(
                              Math.max(
                                0,
                                Math.round(
                                  (Date.parse(session.ended_at) -
                                    Date.parse(session.started_at)) /
                                    1000,
                                ),
                              ),
                            )
                          : "running"}
                      </p>
                    </div>
                    <StartSessionControl
                      topicId={session.topic_id}
                      taskId={session.task_id}
                      size="icon-sm"
                      variant="outline"
                      iconOnly
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
