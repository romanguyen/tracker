import { useEffect, useState } from "react"

import { useAuth } from "@/features/auth/auth-context"
import { useTimer } from "@/features/timer/timer-context"
import { getSupabaseClient } from "@/lib/supabase"

type SecondsById = Record<string, number>

export type TopicStudyStats = {
  seconds: number
  lastEndedAt: string | null
}

/** Recorded seconds + last-studied timestamp per topic for the user. */
export function useTopicStudyStats(): {
  stats: Record<string, TopicStudyStats>
  isLoading: boolean
} {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const { sessionsVersion } = useTimer()
  const [stats, setStats] = useState<Record<string, TopicStudyStats>>({})
  const [isLoading, setIsLoading] = useState(Boolean(supabase && user))

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase.rpc("topic_study_stats").then(({ data }) => {
      if (isCancelled) {
        return
      }

      const next: Record<string, TopicStudyStats> = {}
      for (const row of data ?? []) {
        next[row.topic_id] = {
          seconds: row.total_seconds,
          lastEndedAt: row.last_ended_at,
        }
      }
      setStats(next)
      setIsLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [supabase, user, sessionsVersion])

  return { stats, isLoading }
}

/** Recorded seconds for one topic (completed sessions only). */
export function useTopicTimeTotal(topicId: string): {
  totalSeconds: number | null
} {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const { sessionsVersion } = useTimer()
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .rpc("topic_time_total", { p_topic_id: topicId })
      .then(({ data }) => {
        if (!isCancelled) {
          setTotalSeconds(data ?? 0)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user, sessionsVersion, topicId])

  return { totalSeconds }
}

/** Recorded seconds per task within a topic (completed sessions only). */
export function useTaskTimeTotals(topicId: string): {
  totals: SecondsById
} {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const { sessionsVersion } = useTimer()
  const [totals, setTotals] = useState<SecondsById>({})

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .rpc("task_time_totals", { p_topic_id: topicId })
      .then(({ data }) => {
        if (isCancelled) {
          return
        }

        const next: SecondsById = {}
        for (const row of data ?? []) {
          next[row.task_id] = row.total_seconds
        }
        setTotals(next)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user, sessionsVersion, topicId])

  return { totals }
}
