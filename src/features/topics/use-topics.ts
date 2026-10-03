import { useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabase"
import { SECTION_ORDER } from "@/lib/text"
import type { TopicRow, TopicSection } from "@/types/domain"

export type TopicsFetchState = {
  topics: TopicRow[]
  isLoading: boolean
  isConfigured: boolean
  error: string | null
  refresh: () => void
}

export function useTopics(): TopicsFetchState {
  const [supabase] = useState(() => getSupabaseClient())
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("topics")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (isCancelled) {
          return
        }

        if (fetchError) {
          setError(fetchError.message)
          setTopics([])
        } else {
          setError(null)
          setTopics(data ?? [])
        }
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, refreshIndex])

  return {
    topics,
    isLoading,
    isConfigured: Boolean(supabase),
    error,
    refresh: () => setRefreshIndex((index) => index + 1),
  }
}

export function groupTopicsBySection(
  topics: TopicRow[],
): Array<[TopicSection, TopicRow[]]> {
  return SECTION_ORDER.map((section) => [
    section,
    topics
      .filter((topic) => topic.section === section)
      .sort((a, b) => a.display_order - b.display_order),
  ])
}
