import type { Database } from "@/types/database"

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"]
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]
export type TopicProgressRow =
  Database["public"]["Tables"]["topic_progress"]["Row"]
export type TopicRow = Database["public"]["Tables"]["topics"]["Row"]

export type Readiness = Database["public"]["Enums"]["readiness"]
export type TopicSection = Database["public"]["Enums"]["topic_section"]

export type CourseLink = {
  code: string
  url: string
}

export function parseCourseLinks(json: unknown): CourseLink[] {
  if (!Array.isArray(json)) {
    return []
  }

  return json.filter(
    (item): item is CourseLink =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).code === "string" &&
      typeof (item as Record<string, unknown>).url === "string",
  )
}
