import { useEffect, useState } from "react"

import { useAuth } from "@/features/auth/auth-context"
import { useTimer } from "@/features/timer/timer-context"
import { getSupabaseClient } from "@/lib/supabase"

export type StudyWindows = {
  todaySeconds: number
  weekSeconds: number
  allTimeSeconds: number
}

export function windowsMondayStart(): { mondayLabel: string } {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return {
    mondayLabel: new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(monday),
  }
}

export function useOverviewWindows(timezone: string): {
  windows: StudyWindows | null
  isLoading: boolean
} {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()
  const { sessionsVersion } = useTimer()
  const [windows, setWindows] = useState<StudyWindows | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase && user))

  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    let isCancelled = false

    void supabase
      .rpc("study_windows", { p_timezone: timezone })
      .then(({ data }) => {
        if (isCancelled) {
          return
        }

        const row = data?.[0]
        if (row) {
          setWindows({
            todaySeconds: row.today_seconds,
            weekSeconds: row.week_seconds,
            allTimeSeconds: row.all_time_seconds,
          })
        }
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [supabase, user, sessionsVersion, timezone])

  return { windows, isLoading }
}
