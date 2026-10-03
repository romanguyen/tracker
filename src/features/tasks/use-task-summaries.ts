import { useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabase"

export type TaskCompletionSummary = { total: number; completed: number }
export type TaskSummaries = Record<string, TaskCompletionSummary>

type TaskSummaryRow = {
  topic_id: string
  completed_at: string | null
  archived_at: string | null
}

export function useTaskSummaries(): {
  summaries: TaskSummaries
  isLoading: boolean
} {
  const [supabase] = useState(() => getSupabaseClient())
  const [summaries, setSummaries] = useState<TaskSummaries>({})
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("tasks")
      .select("topic_id, completed_at, archived_at")
      .is("archived_at", null)
      .then(({ data }: { data: TaskSummaryRow[] | null }) => {
        if (isCancelled) {
          return
        }

        const next: TaskSummaries = {}

        for (const row of data ?? []) {
          const summary = (next[row.topic_id] ??= { total: 0, completed: 0 })
          summary.total += 1
          if (row.completed_at) {
            summary.completed += 1
          }
        }

        setSummaries(next)
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase])

  return { summaries, isLoading }
}
