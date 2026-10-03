import { useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabase"
import type { TopicRow } from "@/types/domain"

export type TopicDetailState = {
  topic: TopicRow | null
  status: "loading" | "ready" | "not-found" | "error" | "unconfigured"
  error: string | null
}

export function useTopic(topicId: string | undefined): TopicDetailState {
  const [supabase] = useState(() => getSupabaseClient())
  const [topic, setTopic] = useState<TopicRow | null>(null)
  const [status, setStatus] = useState<TopicDetailState["status"]>(
    supabase ? "loading" : "unconfigured",
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !topicId) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (isCancelled) {
          return
        }

        if (fetchError) {
          setError(fetchError.message)
          setStatus("error")
          return
        }

        setError(null)
        setTopic(data)
        setStatus(data ? "ready" : "not-found")
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, topicId])

  return { topic, status, error }
}
