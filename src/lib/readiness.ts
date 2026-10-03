import type { Readiness } from "@/types/domain"

export const READINESS_ORDER: Readiness[] = [
  "not_started",
  "learning",
  "can_explain",
  "exam_ready",
]

export const READINESS_META: Record<
  Readiness,
  { label: string; badgeClass: string }
> = {
  not_started: {
    label: "Not started",
    badgeClass: "bg-muted text-muted-foreground",
  },
  learning: {
    label: "Learning",
    badgeClass:
      "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300",
  },
  can_explain: {
    label: "Can explain",
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
  },
  exam_ready: {
    label: "Exam-ready",
    badgeClass:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
}
