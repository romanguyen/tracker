import type { StudyLedgerClient } from "@/lib/supabase"
import type { TaskRow } from "@/types/domain"

export const TASK_POSITION_STEP = 1000

export async function insertTask(
  client: StudyLedgerClient,
  input: { userId: string; topicId: string; title: string; position: number },
): Promise<void> {
  const { error } = await client.from("tasks").insert({
    user_id: input.userId,
    topic_id: input.topicId,
    title: input.title,
    position: input.position,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function renameTask(
  client: StudyLedgerClient,
  taskId: string,
  title: string,
): Promise<void> {
  const { error } = await client
    .from("tasks")
    .update({ title })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setTaskCompleted(
  client: StudyLedgerClient,
  taskId: string,
  completed: boolean,
): Promise<void> {
  const { error } = await client
    .from("tasks")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setTaskArchived(
  client: StudyLedgerClient,
  taskId: string,
  archived: boolean,
): Promise<void> {
  const { error } = await client
    .from("tasks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchTaskSessionCount(
  client: StudyLedgerClient,
  taskId: string,
): Promise<number> {
  const { count, error } = await client
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId)

  if (error) {
    throw new Error(error.message)
  }

  return count ?? 0
}

/**
 * Deletes a task. Sessions linked to it are first unlinked (task_id = null),
 * so their recorded time stays in topic totals but loses the task reference.
 */
export async function deleteTaskUnlinkingSessions(
  client: StudyLedgerClient,
  taskId: string,
): Promise<void> {
  const { error: unlinkError } = await client
    .from("sessions")
    .update({ task_id: null })
    .eq("task_id", taskId)

  if (unlinkError) {
    throw new Error(unlinkError.message)
  }

  const { error: deleteError } = await client
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

/** Swaps display positions of two adjacent tasks within their topic. */
export async function swapTaskPositions(
  client: StudyLedgerClient,
  first: TaskRow,
  second: TaskRow,
): Promise<void> {
  const { error: firstError } = await client
    .from("tasks")
    .update({ position: second.position })
    .eq("id", first.id)

  if (firstError) {
    throw new Error(firstError.message)
  }

  const { error: secondError } = await client
    .from("tasks")
    .update({ position: first.position })
    .eq("id", second.id)

  if (secondError) {
    throw new Error(secondError.message)
  }
}
