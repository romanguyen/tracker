import { useState } from "react"
import { SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskSummaries } from "@/features/tasks/use-task-summaries"
import { useTopicStudyStats } from "@/features/timer/use-time-totals"
import { useReadinessMap } from "@/features/topics/use-topic-progress"
import { groupTopicsBySection, useTopics } from "@/features/topics/use-topics"
import { normalizeForSearch, SECTION_META } from "@/lib/text"
import { READINESS_META, READINESS_ORDER } from "@/lib/readiness"
import type { TopicRow, Readiness } from "@/types/domain"
import { TopicCard } from "@/features/topics/topic-card"
import type { TopicsFetchState } from "@/features/topics/use-topics"

type StudyStatusFilter = "all" | "not_studied" | "studied"
type ReadinessFilter = "any" | Readiness

const STUDY_STATUS_OPTIONS: Array<{ value: StudyStatusFilter; label: string }> = [
  { value: "all", label: "All topics" },
  { value: "not_studied", label: "Not yet studied" },
  { value: "studied", label: "Already studied" },
]

function TopicsGrid({
  state,
  query,
  studyStatus,
  readinessFilter,
}: {
  state: TopicsFetchState
  query: string
  studyStatus: StudyStatusFilter
  readinessFilter: ReadinessFilter
}) {
  const { summaries } = useTaskSummaries()
  const { stats: studyStats } = useTopicStudyStats()
  const { map: readinessMap } = useReadinessMap()
  const normalizedQuery = normalizeForSearch(query.trim())

  function matchesFilters(topic: TopicRow): boolean {
    if (
      normalizedQuery &&
      !normalizeForSearch(topic.title_cs).includes(normalizedQuery)
    ) {
      return false
    }

    const studied = (studyStats[topic.id]?.seconds ?? 0) > 0
    if (studyStatus === "not_studied" && studied) {
      return false
    }
    if (studyStatus === "studied" && !studied) {
      return false
    }

    if (readinessFilter !== "any") {
      const readiness = readinessMap[topic.id] ?? "not_started"
      if (readiness !== readinessFilter) {
        return false
      }
    }

    return true
  }

  const groups = groupTopicsBySection(state.topics)
    .map(([section, topics]) => {
      const filtered = topics.filter(matchesFilters)
      return [section, filtered] as const
    })
    .filter(([, topics]) => topics.length > 0)

  if (state.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading topics">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Could not load topics</AlertTitle>
        <AlertDescription>
          {state.error}. Check that the migration and seed were applied to your
          Supabase project, then reload.
        </AlertDescription>
      </Alert>
    )
  }

  if (!state.isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Supabase to load the curriculum</CardTitle>
          <CardDescription>
            Once your project URL and publishable key are in place, all 23
            official topics appear here automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No topics match the current search or filters</CardTitle>
          <CardDescription>
            Try a different query or clear a filter. Diacritics are ignored, so
            “grafov” matches “Grafové algoritmy”.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-10">
      {groups.map(([section, topics]) => (
        <section key={section} aria-labelledby={`section-${section}`} className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-2 border-border/80 border-b pb-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {SECTION_META[section].eyebrowEn}
              </p>
              <h2
                id={`section-${section}`}
                className="font-heading text-2xl font-semibold tracking-tight"
              >
                {SECTION_META[section].titleCs}
              </h2>
            </div>
            <Badge variant="secondary">
              {topics.length} {topics.length === 1 ? "topic" : "topics"}
            </Badge>
          </header>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topics.map((topic) => {
              const summary = summaries[topic.id] ?? { total: 0, completed: 0 }
              const stats = studyStats[topic.id]
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  taskTotal={summary.total}
                  taskCompleted={summary.completed}
                  recordedSeconds={stats?.seconds ?? 0}
                  lastEndedAt={stats?.lastEndedAt ?? null}
                  readiness={readinessMap[topic.id] ?? "not_started"}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function TopicsPage() {
  const topicsState = useTopics()
  const [query, setQuery] = useState("")
  const [studyStatus, setStudyStatus] = useState<StudyStatusFilter>("all")
  const [readinessFilter, setReadinessFilter] =
    useState<ReadinessFilter>("any")

  const hasActiveFilters =
    query.trim() !== "" || studyStatus !== "all" || readinessFilter !== "any"

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Exam topics"
        title="Czech curriculum, organized for English-first navigation."
        description="All 23 applicable B-PVA topics with official Czech titles and descriptions. Search tolerates typos in diacritics."
      >
        <Badge variant="secondary">11 + 12 topics</Badge>
      </PageHeader>

      <div className="grid items-end gap-3 sm:grid-cols-[1.4fr_1fr_1fr] xl:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="relative">
          <Label htmlFor="topic-search" className="sr-only">
            Search topics
          </Label>
          <SearchIcon
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="topic-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, e.g. grafové or slozitost…"
            className="pr-10 pl-9"
          />
          {query ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <XIcon aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-status">Study status</Label>
          <Select
            value={studyStatus}
            onValueChange={(value) => setStudyStatus(value as StudyStatusFilter)}
          >
            <SelectTrigger id="filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDY_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-readiness">Readiness</Label>
          <Select
            value={readinessFilter}
            onValueChange={(value) => setReadinessFilter(value as ReadinessFilter)}
          >
            <SelectTrigger id="filter-readiness" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any readiness</SelectItem>
              {READINESS_ORDER.map((level) => (
                <SelectItem key={level} value={level}>
                  {READINESS_META[level].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="xl:justify-self-end"
            onClick={() => {
              setQuery("")
              setStudyStatus("all")
              setReadinessFilter("any")
            }}
          >
            <XIcon aria-hidden="true" /> Clear all
          </Button>
        ) : null}
      </div>

      <TopicsGrid
        state={topicsState}
        query={query}
        studyStatus={studyStatus}
        readinessFilter={readinessFilter}
      />
    </div>
  )
}
