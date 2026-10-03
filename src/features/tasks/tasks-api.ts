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
