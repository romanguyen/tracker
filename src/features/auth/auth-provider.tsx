import { useEffect, useRef, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"

import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context"
import { getSupabaseClient } from "@/lib/supabase"

function detectBrowserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timezone && timezone.length > 0 ? timezone : "UTC"
  } catch {
    return "UTC"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => getSupabaseClient())
  const [state, setState] = useState<AuthContextValue>({
    session: null,
    user: null,
    isLoading: Boolean(supabase),
    isConfigured: Boolean(supabase),
  })
  const timezoneSyncedForUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    const applySession = (session: Session | null) => {
      if (isMounted) {
        setState({
          session,
          user: session?.user ?? null,
          isLoading: false,
          isConfigured: true,
        })
      }
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // On each sign-in, save the browser's detected timezone to the profile.
  // The profile is auto-created by the handle_new_user trigger with 'UTC';
  // we only update while the value is still 'UTC' so a manually changed
  // preference (Milestone 6 settings) is never overwritten.
  useEffect(() => {
    const user = state.user

    if (!supabase || !user || timezoneSyncedForUserId.current === user.id) {
      return
    }

    timezoneSyncedForUserId.current = user.id
    const timezone = detectBrowserTimezone()

    void supabase
      .from("profiles")
      .update({ timezone })
      .eq("user_id", user.id)
      .eq("timezone", "UTC")
      .then(({ error }) => {
        if (error) {
          timezoneSyncedForUserId.current = null
        }
      })
  }, [supabase, state.user])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
