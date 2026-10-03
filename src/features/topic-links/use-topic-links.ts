import { useEffect, useState } from "react"

import {
  fetchTopicLinks,
  type TopicLinkRow,
} from "@/features/topic-links/topic-links-api"
import { getSupabaseClient } from "@/lib/supabase"

export function useTopicLinks(topicId: string): {
  links: TopicLinkRow[]
  isLoading: boolean
  error: string | null
  refresh: () => void
} {
  const [supabase] = useState(() => getSupabaseClient())
  const [links, setLinks] = useState<TopicLinkRow[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isCancelled = false

    void fetchTopicLinks(supabase, topicId)
      .then((rows) => {
        if (!isCancelled) {
          setLinks(rows)
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((fetchError: unknown) => {
        if (!isCancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Could not load pinned links.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, topicId, refreshIndex])

  return {
    links,
    isLoading,
    error,
    refresh: () => setRefreshIndex((index) => index + 1),
  }
}
