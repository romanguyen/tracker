import { useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/auth-context"
import {
  loadPomodoroSettings,
  savePomodoroSettings,
  type PomodoroSettings,
} from "@/features/timer/pomodoro-settings"
import {
  fetchServerOffsetMs,
  rpcCompletePomodoro,
  rpcStartSession,
  rpcStopSession,
  rpcSwitchSession,
  type TimerOpResult,
  type TimerTarget,
} from "@/features/timer/timer-api"
import {
  TimerContext,
  type ActiveTimer,
  type PomodoroRun,
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
  const [pomodoro, setPomodoro] = useState<PomodoroRun | null>(null)
  const [pomodoroSettings, setPomodoroSettingsState] =
    useState<PomodoroSettings>(() => loadPomodoroSettings())

  const completingRef = useRef(false)

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

  // Pomodoro derivation: adopt runs from any device and move the series
  // from focus to break whenever the focus session ends — by this tab
  // auto-completing or by someone stopping it elsewhere.
  useEffect(() => {
    const session = activeTimer?.session ?? null

    if (session?.mode === "pomodoro") {
      const target: TimerTarget = {
        topicId: session.topic_id,
        taskId: session.task_id,
        mode: "pomodoro",
        plannedSeconds: session.planned_seconds,
      }

      setPomodoro((current) => {
        if (
          current &&
          current.phase === "focus" &&
          current.target.topicId === target.topicId &&
          current.target.taskId === target.taskId
        ) {
          return current
        }
        return {
          round: current?.round ?? 1,
          phase: "focus",
          target,
          breakEndsAtMs: null,
        }
      })
      return
    }

    setPomodoro((current) => {
      if (!current) {
        return current
      }

      if (current.phase === "focus") {
        const completedRound = current.round
        window.setTimeout(() => {
          toast.success(`Pomodoro round ${completedRound} complete — break time`)
        }, 0)
        return {
          ...current,
          phase: "break",
          breakEndsAtMs:
            Date.now() + pomodoroSettings.breakMinutes * 60 * 1000,
        }
      }

      if (
        session &&
        (session.mode !== "pomodoro" ||
          current.target.topicId !== session.topic_id ||
          current.target.taskId !== session.task_id)
      ) {
        return null
      }

      return current
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimer?.session?.id, sessionsVersion])

  // Pomodoro engine: one interval drives focus auto-completion (clamped by
  // the server) and the end-of-break transition.
  useEffect(() => {
    if (!pomodoro || !supabase || !user) {
      return undefined
    }

    const tick = () => {
      const session = activeTimer?.session ?? null
      const nowMs = Date.now() + serverOffsetMs

      if (
        pomodoro.phase === "focus" &&
        session?.mode === "pomodoro" &&
        session.planned_seconds !== null
      ) {
        const endsAtMs =
          Date.parse(session.started_at) + session.planned_seconds * 1000

        if (nowMs >= endsAtMs && !completingRef.current) {
          completingRef.current = true
          void rpcCompletePomodoro(supabase, session.id)
            .then(() => loadActiveRef.current())
            .finally(() => {
              completingRef.current = false
            })
        }
      }

      if (
        pomodoro.phase === "break" &&
        pomodoro.breakEndsAtMs !== null &&
        Date.now() >= pomodoro.breakEndsAtMs
      ) {
        toast.success("Break over — ready for the next round")
        setPomodoro({ ...pomodoro, phase: "ready" })
      }
    }

    const intervalId = window.setInterval(tick, 1000)
    tick()
    return () => window.clearInterval(intervalId)
  }, [pomodoro, activeTimer, serverOffsetMs, supabase, user])

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

  function saveSettings(settings: PomodoroSettings): void {
    savePomodoroSettings(settings)
    setPomodoroSettingsState(settings)
  }

  async function startPomodoro(target: TimerTarget): Promise<TimerOpResult> {
    // Read fresh settings so settings saved in the same click apply now.
    const currentSettings = loadPomodoroSettings()
    const pomodoroTarget: TimerTarget = {
      ...target,
      mode: "pomodoro",
      plannedSeconds: currentSettings.focusMinutes * 60,
    }

    const result = await start(pomodoroTarget)

    if (result.ok) {
      setPomodoro({
        round: 1,
        phase: "focus",
        target: pomodoroTarget,
        breakEndsAtMs: null,
      })
    }

    return result
  }

  async function nextPomodoroRound(): Promise<TimerOpResult | null> {
    if (!pomodoro) {
      return null
    }

    // Read fresh settings so settings saved in the same click apply now.
    const currentSettings = loadPomodoroSettings()
    const pomodoroTarget: TimerTarget = {
      ...pomodoro.target,
      mode: "pomodoro",
      plannedSeconds: currentSettings.focusMinutes * 60,
    }

    const result = await start(pomodoroTarget)

    if (result.ok) {
      setPomodoro((current) =>
        current
          ? {
              ...current,
              round: current.round + 1,
              phase: "focus",
              breakEndsAtMs: null,
            }
          : current,
      )
    } else {
      toast.error(result.message)
    }

    return result
  }

  async function endPomodoro(): Promise<void> {
    const current = pomodoro

    if (!current) {
      return
    }

    setPomodoro(null)

    if (current.phase === "focus" && activeTimer?.session.mode === "pomodoro") {
      await stop()
      toast.success("Round stopped early — elapsed time kept")
      return
    }

    toast.success("Pomodoro series ended")
  }

  async function switchTo(target: TimerTarget): Promise<TimerOpResult> {
    if (!supabase || !user) {
      return { ok: false, reason: "error", message: "Not signed in." }
    }

    setIsBusy(true)
    const id = crypto.randomUUID()
    const result = await rpcSwitchSession(supabase, id, target)

    if (result.ok) {
      if ((target.mode ?? "stopwatch") === "pomodoro") {
        setPomodoro({
          round: 1,
          phase: "focus",
          target,
          breakEndsAtMs: null,
        })
      } else {
        setPomodoro(null)
      }

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
        pomodoro,
        pomodoroSettings,
        savePomodoroSettings: saveSettings,
        startPomodoro,
        nextPomodoroRound,
        endPomodoro,
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
