import { createContext, useContext } from "react"

import type { TimerTarget, TimerOpResult } from "@/features/timer/timer-api"
import type { SessionRow } from "@/types/domain"

export type ActiveTimer = {
  session: SessionRow
  topicTitle: string | null
  taskTitle: string | null
}

export type TimerConnection = "online" | "offline"

export type PomodoroPhase = "focus" | "break" | "ready"

export type PomodoroRun = {
  round: number
  phase: PomodoroPhase
  target: TimerTarget
  breakEndsAtMs: number | null
}

export type TimerContextValue = {
  activeTimer: ActiveTimer | null
  isLoading: boolean
  isBusy: boolean
  connection: TimerConnection
  /** serverNow ≈ Date.now() + serverOffsetMs */
  serverOffsetMs: number
  /** Bumps on every authoritative sessions reload; aggregate widgets re-fetch on it. */
  sessionsVersion: number
  /** Non-null while a pomodoro series is in any phase on this device. */
  pomodoro: PomodoroRun | null
  pomodoroSettings: { focusMinutes: number; breakMinutes: number }
  savePomodoroSettings: (settings: {
    focusMinutes: number
    breakMinutes: number
  }) => void
  startPomodoro: (target: TimerTarget) => Promise<TimerOpResult>
  /** Start the next focus round once a break has finished. */
  nextPomodoroRound: () => Promise<TimerOpResult | null>
  /** Stops a running round early (keeps partial time) or ends the series. */
  endPomodoro: () => Promise<void>
  start: (target: TimerTarget) => Promise<TimerOpResult>
  stop: () => Promise<TimerOpResult | null>
  switchTo: (target: TimerTarget) => Promise<TimerOpResult>
  /** Reconcile timer state and bump sessionsVersion so aggregates refetch. */
  refreshSessions: () => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext)

  if (!context) {
    throw new Error("useTimer must be used within TimerProvider")
  }

  return context
}
