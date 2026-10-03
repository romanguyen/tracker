import type { StudyLedgerClient } from "@/lib/supabase"
import type { SessionRow } from "@/types/domain"

export type SessionWithTitles = SessionRow & {
  topicTitle: string
  taskTitle: string | null
}

export type SessionFilters = {
  topicId: string | null
  taskId: string | null
  fromIso: string | null
  toIso: string | null
}

export const EMPTY_SESSION_FILTERS: SessionFilters = {
  topicId: null,
  taskId: null,
  fromIso: null,
  toIso: null,
}

type SessionRowWithTopic = SessionRow & {
  topics: { title_cs: string } | null
}

/** Turns Postgres errors into messages a studying human can act on. */
export function translateSessionError(message: string): string {
  if (message.includes("sessions_no_overlap")) {
    return "That session overlaps an existing one. Adjust the times — touching edges (one ends exactly when another starts) is fine."
  }

  if (message.includes("end must be later")) {
    return "The end time must be later than the start time."
  }

  if (message.includes("in the future")) {
    return "The end time cannot be in the future."
  }

  if (message.includes("cannot change topic or task")) {
    return "A running session keeps its topic and task. Stop it first, then start a new one."
  }

  if (message.includes("task does not exist")) {
    return "Choose a mini-task that belongs to the selected topic."
  }

  return message
}

export async function fetchSessionsPage(
  client: StudyLedgerClient,
  filters: SessionFilters,
  offset: number,
  limit: number,
): Promise<{ sessions: SessionWithTitles[]; hasMore: boolean }> {
  let query = client
    .from("sessions")
    .select("*, topics(title_cs)")
    .order("started_at", { ascending: false })

  if (filters.topicId) {
    query = query.eq("topic_id", filters.topicId)
  }
  if (filters.taskId) {
    query = query.eq("task_id", filters.taskId)
  }
  if (filters.fromIso) {
    query = query.gte("started_at", filters.fromIso)
  }
  if (filters.toIso) {
    query = query.lte("started_at", filters.toIso)
  }

  // One extra row tells us whether another page exists.
  const { data, error } = await query.range(offset, offset + limit)

  if (error) {
    throw new Error(error.message)
  }

  const rows = ((data ?? []) as SessionRowWithTopic[]).slice(0, limit)
  const hasMore = (data ?? []).length > limit

  const taskIds = [
    ...new Set(
      rows
        .map((row) => row.task_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ]
  const taskTitles = new Map<string, string>()

  if (taskIds.length > 0) {
    const { data: taskRows } = await client
      .from("tasks")
      .select("id, title")
      .in("id", taskIds)

    for (const task of taskRows ?? []) {
      taskTitles.set(task.id, task.title)
    }
  }

  const sessions: SessionWithTitles[] = rows.map((row) => ({
    ...(row as SessionRow),
    topicTitle: row.topics?.title_cs ?? "Unknown topic",
    taskTitle: row.task_id ? (taskTitles.get(row.task_id) ?? null) : null,
  }))

  return { sessions, hasMore }
}

export type SessionUpsertInput = {
  topicId: string
  taskId: string | null
  startedAtIso: string
  endedAtIso: string
  note: string
}

export async function insertManualSession(
  client: StudyLedgerClient,
  userId: string,
  input: SessionUpsertInput,
): Promise<void> {
  const { error } = await client.from("sessions").insert({
    user_id: userId,
    topic_id: input.topicId,
    task_id: input.taskId,
    started_at: input.startedAtIso,
    ended_at: input.endedAtIso,
    note: input.note,
  })

  if (error) {
    throw new Error(translateSessionError(error.message))
  }
}

export async function updateSession(
  client: StudyLedgerClient,
  sessionId: string,
  input: SessionUpsertInput,
): Promise<void> {
  const { error } = await client
    .from("sessions")
    .update({
      topic_id: input.topicId,
      task_id: input.taskId,
      started_at: input.startedAtIso,
      ended_at: input.endedAtIso,
      note: input.note,
    })
    .eq("id", sessionId)

  if (error) {
    throw new Error(translateSessionError(error.message))
  }
}

export async function updateActiveSession(
  client: StudyLedgerClient,
  sessionId: string,
  input: { startedAtIso: string; note: string },
): Promise<void> {
  const { error } = await client
    .from("sessions")
    .update({ started_at: input.startedAtIso, note: input.note })
    .eq("id", sessionId)
    .is("ended_at", null)

  if (error) {
    throw new Error(translateSessionError(error.message))
  }
}

export async function deleteSession(
  client: StudyLedgerClient,
  sessionId: string,
): Promise<void> {
  const { error } = await client.from("sessions").delete().eq("id", sessionId)

  if (error) {
    throw new Error(translateSessionError(error.message))
  }
}
