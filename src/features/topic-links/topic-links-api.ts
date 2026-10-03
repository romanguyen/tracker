import type { StudyLedgerClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type TopicLinkRow =
  Database["public"]["Tables"]["topic_links"]["Row"]

const URL_SCHEME = /^https?:\/\//i
const FILE_SCHEME = /^file:\/\//i
const HAS_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+/i

/**
 * Accepts "example.com/x" too, normalizing to an https URL.
 * file:// links (local documents) pass through as typed.
 */
export function normalizePinnedUrl(rawUrl: string): string {
  const value = rawUrl.trim()

  if (!value) {
    throw new Error("The link URL is required.")
  }

  if (FILE_SCHEME.test(value)) {
    return value
  }

  const withScheme = URL_SCHEME.test(value) ? value : `https://${value}`

  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    throw new Error("That doesn't look like a valid URL.")
  }

  if (!HAS_DOMAIN.test(parsed.host)) {
    throw new Error("Add a full domain, e.g. notes.example.com/page.")
  }

  return parsed.toString()
}

export async function fetchTopicLinks(
  client: StudyLedgerClient,
  topicId: string,
): Promise<TopicLinkRow[]> {
  const { data, error } = await client
    .from("topic_links")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function insertTopicLink(
  client: StudyLedgerClient,
  input: { userId: string; topicId: string; label: string; url: string },
): Promise<void> {
  const { error } = await client.from("topic_links").insert({
    user_id: input.userId,
    topic_id: input.topicId,
    label: input.label,
    url: input.url,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateTopicLink(
  client: StudyLedgerClient,
  linkId: string,
  input: { label: string; url: string },
): Promise<void> {
  const { error } = await client
    .from("topic_links")
    .update({ label: input.label, url: input.url })
    .eq("id", linkId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteTopicLink(
  client: StudyLedgerClient,
  linkId: string,
): Promise<void> {
  const { error } = await client
    .from("topic_links")
    .delete()
    .eq("id", linkId)

  if (error) {
    throw new Error(error.message)
  }
}
