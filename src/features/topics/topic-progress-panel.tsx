import { useState, type FormEvent } from "react"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { useTopicProgress } from "@/features/topics/use-topic-progress"
import { READINESS_META, READINESS_ORDER } from "@/lib/readiness"
import type { Readiness, TopicRow } from "@/types/domain"

export function TopicProgressPanel({ topic }: { topic: TopicRow }) {
  const { readiness, notes, isLoading, save } = useTopicProgress(topic.id)
  const [draftReadiness, setDraftReadiness] = useState<Readiness | null>(null)
  const [draftNotes, setDraftNotes] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentReadiness = draftReadiness ?? readiness
  const currentNotes = draftNotes ?? notes
  const hasChanges =
    (draftReadiness !== null && draftReadiness !== readiness) ||
    (draftNotes !== null && draftNotes !== notes)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      await save({ readiness: currentReadiness, notes: currentNotes })
      setDraftReadiness(null)
      setDraftNotes(null)
      toast.success("Progress saved")
    } catch {
      toast.error("Could not save progress. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
          <CardDescription>
            Your self-assessment — independent of hours studied or tasks
            checked off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="readiness-select">How confident are you?</Label>
          <Select
            value={currentReadiness}
            onValueChange={(value) => setDraftReadiness(value as Readiness)}
          >
            <SelectTrigger id="readiness-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {READINESS_ORDER.map((level) => (
                <SelectItem key={level} value={level}>
                  {READINESS_META[level].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="pt-2 text-xs leading-5 text-muted-foreground">
            “Can explain” means you could deliver the answer aloud without
            preparation; “Exam-ready” means you could withstand follow-up
            questions from the committee.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Topic notes</CardTitle>
          <CardDescription>
            Gaps, mnemonics, and questions to revisit — stored with the topic
            on every device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="topic-notes" className="sr-only">
            Topic notes
          </Label>
          <Textarea
            id="topic-notes"
            value={currentNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            placeholder="e.g. Dijkstra needs non-negative weights — watch why negative edges break it…"
            rows={7}
            maxLength={4000}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {hasChanges ? "Unsaved changes" : "Everything saved"}
            </p>
            <Button type="submit" disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <SaveIcon aria-hidden="true" />
              )}
              Save progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
