import { useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabase"
import type { TaskRow } from "@/types/domain"

export type TopicTasksState = {
  tasks: TaskRow[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useTopicTasks(topicId: string): TopicTasksState {
  const [supabase] = useState(() => getSupabaseClient())
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("tasks")
      .select("*")
      .eq("topic_id", topicId)
      .order("position", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (isCancelled) {
          return
        }

        if (fetchError) {
          setError(fetchError.message)
          setTasks([])
        } else {
          setError(null)
          setTasks(data ?? [])
        }
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, topicId, refreshIndex])

  return {
    tasks,
    isLoading,
    error,
    refresh: () => setRefreshIndex((index) => index + 1),
  }
}
