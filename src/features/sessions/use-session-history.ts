import { useEffect, useState } from "react"

import {
  fetchSessionsPage,
  type SessionFilters,
  type SessionWithTitles,
} from "@/features/sessions/sessions-api"
import { getSupabaseClient } from "@/lib/supabase"

export const SESSIONS_PAGE_SIZE = 20

export type SessionHistoryState = {
  sessions: SessionWithTitles[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  filters: SessionFilters
  setFilters: (nextFilters: SessionFilters) => void
  offset: number
  setOffset: (offset: number) => void
}

export function useSessionHistory(
  initialFilters: SessionFilters,
): SessionHistoryState {
  const [supabase] = useState(() => getSupabaseClient())
  const [filters, setFiltersState] = useState(initialFilters)
  const [offset, setOffset] = useState(0)
  const [sessions, setSessions] = useState<SessionWithTitles[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  function setFilters(nextFilters: SessionFilters) {
    setOffset(0)
    setFiltersState(nextFilters)
  }

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isCancelled = false

    void fetchSessionsPage(supabase, filters, offset, SESSIONS_PAGE_SIZE)
      .then(({ sessions: page, hasMore: more }) => {
        if (isCancelled) {
          return
        }

        setSessions((current) => (offset === 0 ? page : [...current, ...page]))
        setHasMore(more)
        setError(null)
        setIsLoading(false)
      })
      .catch((fetchError: unknown) => {
        if (isCancelled) {
          return
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load sessions.",
        )
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, filters, offset, refreshIndex])

  return {
    sessions,
    isLoading,
    error,
    hasMore,
    loadMore: () => setOffset((current) => current + SESSIONS_PAGE_SIZE),
    refresh: () => {
      setOffset(0)
      setRefreshIndex((index) => index + 1)
    },
    filters,
    setFilters,
    offset,
    setOffset,
  }
}
