import { useEffect, useState } from "react"

import { useAuth } from "@/features/auth/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Readiness } from "@/types/domain"

export type TopicProgressState = {
  readiness: Readiness
  notes: string
  isLoading: boolean
  save: (input: { readiness: Readiness; notes: string }) => Promise<void>
}

export function useTopicProgress(topicId: string): TopicProgressState {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const [readiness, setReadiness] = useState<Readiness>("not_started")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(Boolean(supabase && user))

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("topic_progress")
      .select("readiness, notes")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isCancelled) {
          setReadiness(data?.readiness ?? "not_started")
          setNotes(data?.notes ?? "")
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user, topicId])

  async function save(input: { readiness: Readiness; notes: string }) {
    if (!supabase || !user) {
      return
    }

    const { error } = await supabase.from("topic_progress").upsert(
      {
        user_id: user.id,
        topic_id: topicId,
        readiness: input.readiness,
        notes: input.notes,
      },
      { onConflict: "user_id,topic_id" },
    )

    if (!error) {
      setReadiness(input.readiness)
      setNotes(input.notes)
    }
  }

  return { readiness, notes, isLoading, save }
}

export function useReadinessMap(): { map: Record<string, Readiness> } {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const [map, setMap] = useState<Record<string, Readiness>>({})

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("topic_progress")
      .select("topic_id, readiness")
      .then(({ data }) => {
        if (isCancelled) {
          return
        }

        const next: Record<string, Readiness> = {}
        for (const row of data ?? []) {
          next[row.topic_id] = row.readiness
        }
        setMap(next)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user])

  return { map }
}
