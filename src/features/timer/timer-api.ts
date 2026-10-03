import type { StudyLedgerClient } from "@/lib/supabase"
import type { SessionRow } from "@/types/domain"

export type TimerTarget = {
  topicId: string
  taskId: string | null
  /** Defaults to a free-running stopwatch when omitted. */
  mode?: "stopwatch" | "pomodoro"
  plannedSeconds?: number | null
}

export type TimerOpResult =
  | { ok: true; session: SessionRow }
  | { ok: false; reason: "conflict" | "error"; message: string }

const RUNNING_CONFLICT = /another study session is already running/i
const RPC_TIMEOUT_MS = 12_000
const OFFSET_TIMEOUT_MS = 5_000

type RpcResponse<T> = {
  data: T | null
  error: { message: string } | null
}

/**
 * Bounds how long a request can hang before the UI reconciles.
 * A slow network must never freeze the timer controls indefinitely:
 * after the timeout the provider refetches and surfaces a visible error.
 */
async function runRpc<T>(
  promise: PromiseLike<RpcResponse<T>>,
  timeoutMs: number,
): Promise<RpcResponse<T>> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<RpcResponse<T>>((resolve) => {
      window.setTimeout(() => {
        resolve({
          data: null,
          error: {
            message: "The request timed out — the network may be slow.",
          },
        })
      }, timeoutMs)
    }),
  ])
}

function rpcEnvelope(
  message: string,
): { ok: false; reason: "conflict" | "error"; message: string } {
  if (/failed to fetch|timed out|network/i.test(message)) {
    return {
      ok: false,
      reason: "error",
      message: "Couldn't reach the server — check your connection and try again.",
    }
  }

  return {
    ok: false,
    reason: RUNNING_CONFLICT.test(message) ? "conflict" : "error",
    message,
  }
}

export async function fetchServerOffsetMs(
  client: StudyLedgerClient,
): Promise<number> {
  const { data, error } = await runRpc(client.rpc("server_now"), OFFSET_TIMEOUT_MS)

  if (error || !data) {
    // Fall back to the client clock when the server cannot be reached.
    return 0
  }

  return Date.parse(data) - Date.now()
}

export async function rpcStartSession(
  client: StudyLedgerClient,
  id: string,
  target: TimerTarget,
): Promise<TimerOpResult> {
  const { data, error } = await runRpc(
    client.rpc("start_session", {
      p_id: id,
      p_topic_id: target.topicId,
      p_task_id: target.taskId,
      p_mode: target.mode ?? "stopwatch",
      p_planned_seconds: target.plannedSeconds ?? null,
    }),
    RPC_TIMEOUT_MS,
  )

  if (error) {
    return rpcEnvelope(error.message)
  }

  const session = data?.[0]
  return session
    ? { ok: true, session }
    : { ok: false, reason: "error", message: "Start returned no session." }
}

/** Ends a pomodoro round at exactly started_at + planned_seconds. */
export async function rpcCompletePomodoro(
  client: StudyLedgerClient,
  id: string,
): Promise<TimerOpResult> {
  const { data, error } = await runRpc(
    client.rpc("complete_pomodoro", { p_id: id }),
    RPC_TIMEOUT_MS,
  )

  if (error) {
    return rpcEnvelope(error.message)
  }

  const session = data?.[0]
  return session
    ? { ok: true, session }
    : { ok: false, reason: "error", message: "Complete returned no session." }
}

export async function rpcStopSession(
  client: StudyLedgerClient,
  id: string,
): Promise<TimerOpResult> {
  const { data, error } = await runRpc(
    client.rpc("stop_session", { p_id: id }),
    RPC_TIMEOUT_MS,
  )

  if (error) {
    return rpcEnvelope(error.message)
  }

  const session = data?.[0]
  return session
    ? { ok: true, session }
    : { ok: false, reason: "error", message: "Stop returned no session." }
}

export async function rpcSwitchSession(
  client: StudyLedgerClient,
  id: string,
  target: TimerTarget,
): Promise<TimerOpResult> {
  const { data, error } = await runRpc(
    client.rpc("switch_session", {
      p_id: id,
      p_topic_id: target.topicId,
      p_task_id: target.taskId,
      p_mode: target.mode ?? "stopwatch",
      p_planned_seconds: target.plannedSeconds ?? null,
    }),
    RPC_TIMEOUT_MS,
  )

  if (error) {
    return rpcEnvelope(error.message)
  }

  const session = data?.[0]?.active_session
  return session
    ? { ok: true, session }
    : { ok: false, reason: "error", message: "Switch returned no session." }
}
