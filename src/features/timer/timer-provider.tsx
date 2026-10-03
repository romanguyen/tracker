import { useEffect, useRef, useState, type ReactNode } from "react"

import { useAuth } from "@/features/auth/auth-context"
import {
  fetchServerOffsetMs,
  rpcStartSession,
  rpcStopSession,
  rpcSwitchSession,
  type TimerOpResult,
  type TimerTarget,
} from "@/features/timer/timer-api"
import {
  TimerContext,
  type ActiveTimer,
  type TimerConnection,
} from "@/features/timer/timer-context"
import { getSupabaseClient } from "@/lib/supabase"
import { elapsedSecondsSince, formatElapsedSeconds } from "@/lib/time"
import type { SessionRow } from "@/types/domain"

const BASE_DOCUMENT_TITLE = "Study Ledger — PVA State Exam"

export function TimerProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => getSupabaseClient())
  const { user } = useAuth()

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase && user))
  const [isBusy, setIsBusy] = useState(false)
  const [connection, setConnection] = useState<TimerConnection>(() =>
    typeof navigator === "undefined" || navigator.onLine
      ? "online"
      : "offline",
  )
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [sessionsVersion, setSessionsVersion] = useState(0)

  const loadActiveRef = useRef<() => Promise<ActiveTimer | null>>(
    async () => null,
  )
  const loadOffsetRef = useRef<() => Promise<void>>(async () => {})

  async function loadActiveInternal(): Promise<ActiveTimer | null> {
    if (!supabase || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .is("ended_at", null)
      .maybeSingle()

    if (error || !data) {
      setIsLoading(false)
      return null
    }

    const session = data as SessionRow
    const { data: topicRow } = await supabase
      .from("topics")
      .select("title_cs")
      .eq("id", session.topic_id)
      .maybeSingle()

    let taskTitle: string | null = null

    if (session.task_id) {
      const { data: taskRow } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", session.task_id)
        .maybeSingle()
      taskTitle = taskRow?.title ?? null
    }

    setIsLoading(false)
    return {
      session,
      topicTitle: topicRow?.title_cs ?? null,
      taskTitle,
    }
  }

  useEffect(() => {
    loadActiveRef.current = async () => {
      const timer = await loadActiveInternal()
      setActiveTimer(timer)
      setSessionsVersion((version) => version + 1)
      return timer
    }

    loadOffsetRef.current = async () => {
      if (!supabase || !user) {
        return
      }
      setServerOffsetMs(await fetchServerOffsetMs(supabase))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user])

  // Initial load whenever the signed-in user changes.
  useEffect(() => {
    let isCancelled = false

    setActiveTimer(null)
    setIsLoading(Boolean(supabase && user))

    void (async () => {
      const timer = await loadActiveRef.current()
      if (!isCancelled) {
        setActiveTimer(timer)
        setIsLoading(false)
      }
      if (!isCancelled) {
        await loadOffsetRef.current()
      }
    })()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user])

  // Realtime: keep every open tab/device in sync with exact session changes.
  useEffect(() => {
    if (!supabase || !user) {
      return undefined
    }

    const channel = supabase
      .channel(`study-sessions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadActiveRef.current()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user])

  // Live elapsed time in the browser tab while a session runs.
  useEffect(() => {
    if (!activeTimer) {
      document.title = BASE_DOCUMENT_TITLE
      return undefined
    }

    const { started_at } = activeTimer.session
    const label = activeTimer.taskTitle ?? activeTimer.topicTitle ?? "Study"

    const paintTitle = () => {
      const elapsed = elapsedSecondsSince(started_at, Date.now(), serverOffsetMs)
      document.title = `${formatElapsedSeconds(elapsed)} · ${label} — Study Ledger`
    }

    paintTitle()
    const intervalId = window.setInterval(paintTitle, 1000)

    return () => {
      window.clearInterval(intervalId)
      document.title = BASE_DOCUMENT_TITLE
    }
  }, [activeTimer, serverOffsetMs])

  // Refresh authoritative state on focus/reconnect; surface offline state.
  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadActiveRef.current()
        void loadOffsetRef.current()
      }
    }

    function handleOnline() {
      setConnection("online")
      void loadActiveRef.current()
      void loadOffsetRef.current()
    }

    function handleOffline() {
      setConnection("offline")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  async function start(target: TimerTarget): Promise<TimerOpResult> {
    if (!supabase || !user) {
      return { ok: false, reason: "error", message: "Not signed in." }
    }

    setIsBusy(true)
    const id = crypto.randomUUID()
    const result = await rpcStartSession(supabase, id, target)

    if (result.ok) {
      await loadOffsetRef.current()
      await loadActiveRef.current()
      setIsBusy(false)
      return result
    }

    if (result.reason === "conflict") {
      setIsBusy(false)
      return result
    }

    // Unknown failure (e.g. network drop after the insert): reconcile.
    const reconciled = await loadActiveRef.current()

    if (reconciled?.session.id === id) {
      setIsBusy(false)
      return { ok: true, session: reconciled.session }
    }

    setIsBusy(false)
    return result
  }

  async function stop(): Promise<TimerOpResult | null> {
    const current = activeTimer

    if (!supabase || !user || !current) {
      return null
    }

    setIsBusy(true)
    const result = await rpcStopSession(supabase, current.session.id)

    if (result.ok) {
      await loadActiveRef.current()
      setIsBusy(false)
      return result
    }

    // Reconcile: the stop may have succeeded without a usable response.
    const reconciled = await loadActiveRef.current()

    if (!reconciled) {
      setIsBusy(false)
      return {
        ok: true,
        session: {
          ...current.session,
          ended_at: new Date().toISOString(),
        },
      }
    }

    setIsBusy(false)
    return result
  }

  async function switchTo(target: TimerTarget): Promise<TimerOpResult> {
    if (!supabase || !user) {
      return { ok: false, reason: "error", message: "Not signed in." }
    }

    setIsBusy(true)
    const id = crypto.randomUUID()
    const result = await rpcSwitchSession(supabase, id, target)

    if (result.ok) {
      await loadOffsetRef.current()
      await loadActiveRef.current()
      setIsBusy(false)
      return result
    }

    const reconciled = await loadActiveRef.current()

    if (
      reconciled &&
      reconciled.session.topic_id === target.topicId &&
      (reconciled.session.task_id ?? null) === (target.taskId ?? null)
    ) {
      setIsBusy(false)
      return { ok: true, session: reconciled.session }
    }

    setIsBusy(false)
    return result
  }

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        isLoading,
        isBusy,
        connection,
        serverOffsetMs,
        sessionsVersion,
        start,
        stop,
        switchTo,
        refreshSessions: () => {
          void loadActiveRef.current()
        },
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}
