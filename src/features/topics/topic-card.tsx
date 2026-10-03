import { Link } from "react-router"
import { CalendarClockIcon, ChevronRightIcon, Clock3Icon, ListChecksIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SECTION_META } from "@/lib/text"
import { READINESS_META } from "@/lib/readiness"
import { formatDateTime, formatRecordedSeconds } from "@/lib/time"
import type { Readiness, TopicRow } from "@/types/domain"

type TopicCardProps = {
  topic: TopicRow
  taskTotal: number
  taskCompleted: number
  recordedSeconds: number
  lastEndedAt: string | null
  readiness: Readiness
}

export function TopicCard({
  topic,
  taskTotal,
  taskCompleted,
  recordedSeconds,
  lastEndedAt,
  readiness,
}: TopicCardProps) {
  const section = SECTION_META[topic.section]

  return (
    <Link
      to={`/topics/${topic.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-[box-shadow,transform] group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="line-clamp-2 text-lg">{topic.title_cs}</span>
            <ChevronRightIcon
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Question {topic.official_number}</Badge>
            <Badge variant="secondary">{section.eyebrowEn}</Badge>
            {readiness !== "not_started" ? (
              <Badge className={READINESS_META[readiness].badgeClass}>
                {READINESS_META[readiness].label}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="line-clamp-3 leading-6">
            {topic.description_cs}
          </CardDescription>
          {taskTotal > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ListChecksIcon className="size-4 text-primary" aria-hidden="true" />
              {taskCompleted} of {taskTotal} mini-tasks done
            </p>
          ) : null}
          {recordedSeconds > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Clock3Icon className="size-4 text-primary" aria-hidden="true" />
              Recorded {formatRecordedSeconds(recordedSeconds)}
            </p>
          ) : null}
          {lastEndedAt ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClockIcon className="size-4 text-primary" aria-hidden="true" />
              Last studied {formatDateTime(lastEndedAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
