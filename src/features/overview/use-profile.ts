import { useEffect, useState } from "react"

import { useAuth } from "@/features/auth/auth-context"
import { getSupabaseClient } from "@/lib/supabase"

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

export const COMMON_TIMEZONES = [
  "Europe/Prague",
  "Europe/Bratislava",
  "Europe/Vienna",
  "Europe/Berlin",
  "UTC",
  "Europe/London",
  "Europe/Helsinki",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
]

export function useProfile(): {
  timezone: string
  isLoading: boolean
  setTimezone: (next: string) => Promise<void>
} {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const [timezone, setTimezoneState] = useState("UTC")
  const [isLoading, setIsLoading] = useState(Boolean(supabase && user))

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .from("profiles")
      .select("timezone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isCancelled) {
          setTimezoneState(data?.timezone ?? "UTC")
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user])

  async function setTimezone(next: string) {
    if (!supabase || !user) {
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ timezone: next })
      .eq("user_id", user.id)

    if (!error) {
      setTimezoneState(next)
    }
  }

  return { timezone, isLoading, setTimezone }
}
