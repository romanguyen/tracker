/** Live timer display: mm:ss while under an hour, then h:mm:ss. */
export function formatElapsedSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  const mm = String(minutes).padStart(2, "0")
  const ss = String(seconds).padStart(2, "0")

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Recorded study time: "12 s", "45 min", or "2 h 5 min". */
export function formatRecordedSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))

  if (safeSeconds < 60) {
    return `${safeSeconds} s`
  }

  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
  }

  return `${minutes} min`
}

export function elapsedSecondsSince(
  startedAtIso: string,
  nowMs: number,
  serverOffsetMs: number,
): number {
  return Math.max(
    0,
    Math.floor((nowMs + serverOffsetMs - Date.parse(startedAtIso)) / 1000),
  )
}

/** Browser-local "3 Oct, 14:05" for session lists and last-studied dates. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** Browser-local "Fri 3 Oct" for history grouping. */
export function formatDateHeading(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}
