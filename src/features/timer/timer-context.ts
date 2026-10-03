import { createContext, useContext } from "react"

import type { TimerTarget, TimerOpResult } from "@/features/timer/timer-api"
import type { SessionRow } from "@/types/domain"

export type ActiveTimer = {
  session: SessionRow
  topicTitle: string | null
  taskTitle: string | null
}

export type TimerConnection = "online" | "offline"

export type TimerContextValue = {
  activeTimer: ActiveTimer | null
  isLoading: boolean
  isBusy: boolean
  connection: TimerConnection
  /** serverNow ≈ Date.now() + serverOffsetMs */
  serverOffsetMs: number
  /** Bumps on every authoritative sessions reload; aggregate widgets re-fetch on it. */
  sessionsVersion: number
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
