import { Link, useParams } from "react-router"
import {
  ArrowLeftIcon,
  CompassIcon,
  ExternalLinkIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PageLoader } from "@/components/page-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TasksPanel } from "@/features/tasks/tasks-panel"
import { PinnedLinksManager } from "@/features/topic-links/pinned-links-manager"
import { TopicProgressPanel } from "@/features/topics/topic-progress-panel"
import { TopicSessions } from "@/features/sessions/topic-sessions"
import { StartSessionControl } from "@/features/timer/start-session-control"
import { useTopicTimeTotal } from "@/features/timer/use-time-totals"
import { useTopic } from "@/features/topics/use-topic"
import { SECTION_META } from "@/lib/text"
import { formatRecordedSeconds } from "@/lib/time"
import { parseCourseLinks } from "@/types/domain"

export function TopicDetailPage() {
  const { topicId } = useParams()
  const { topic, status, error } = useTopic(topicId)
  const { totalSeconds } = useTopicTimeTotal(topicId ?? "")

  if (status === "loading") {
    return <PageLoader label="Loading topic" />
  }

  if (status === "unconfigured") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Connect Supabase to view topics</CardTitle>
          <CardDescription>
            Topic details load from your Supabase project once the environment
            variables are set up.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="mx-auto max-w-xl">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Could not load this topic</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (status === "not-found" || !topic) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CardHeader className="items-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <CompassIcon className="size-7" aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl">Topic not found</CardTitle>
          <CardDescription>
            No topic with ID <code>{topicId}</code> exists in the curriculum.
          </CardDescription>
          <Button asChild className="mt-2 w-fit">
            <Link to="/topics">
              <ArrowLeftIcon aria-hidden="true" /> Back to all topics
            </Link>
          </Button>
        </CardHeader>
      </Card>
    )
  }

  const courseLinks = parseCourseLinks(topic.course_links)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${SECTION_META[topic.section].eyebrowEn} · Question ${topic.official_number}`}
        title={topic.title_cs}
        description={topic.description_cs}
      >
        <Badge variant="secondary">
          Recorded:{" "}
          {totalSeconds === null
            ? "…"
            : formatRecordedSeconds(totalSeconds)}
        </Badge>
        <StartSessionControl topicId={topic.id} size="lg" />
        <Button asChild variant="outline">
          <Link to="/topics">
            <ArrowLeftIcon aria-hidden="true" /> Back to topics
          </Link>
        </Button>
      </PageHeader>

      <section aria-label="Study materials" className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Course materials:
        </span>
        {courseLinks.map((link) => (
          <Button key={link.code} asChild size="sm" variant="secondary">
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.code}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        ))}
        <Button asChild size="sm" variant="link">
          <a href={topic.source_url} target="_blank" rel="noreferrer">
            Official exam page
            <ExternalLinkIcon aria-hidden="true" />
          </a>
        </Button>
        <PinnedLinksManager topicId={topic.id} topicTitle={topic.title_cs} />
      </section>

      <Tabs defaultValue="tasks" orientation="horizontal">
        <TabsList>
          <TabsTrigger value="tasks">Mini-tasks</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-5">
          <TasksPanel topicId={topic.id} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-5">
          <TopicSessions topic={topic} />
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          <TopicProgressPanel topic={topic} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
