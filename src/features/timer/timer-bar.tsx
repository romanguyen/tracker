import { useEffect, useState } from "react"
import { Link } from "react-router"
import { SquareIcon, WifiOffIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTimer } from "@/features/timer/timer-context"
import { elapsedSecondsSince, formatElapsedSeconds } from "@/lib/time"

function useElapsedDisplay(
  startedAtIso: string | null,
  serverOffsetMs: number,
): string {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAtIso) {
      return undefined
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [startedAtIso])

  if (!startedAtIso) {
    return "00:00"
  }

  return formatElapsedSeconds(
    elapsedSecondsSince(startedAtIso, nowMs, serverOffsetMs),
  )
}

export function TimerBar() {
  const { activeTimer, connection, serverOffsetMs, stop, isBusy } = useTimer()
  const elapsed = useElapsedDisplay(
    activeTimer?.session.started_at ?? null,
    serverOffsetMs,
  )

  if (!activeTimer) {
    return null
  }

  const { session, topicTitle, taskTitle } = activeTimer

  return (
    <div
      role="timer"
      aria-label={`Studying ${topicTitle ?? "topic"}, elapsed time ${elapsed}`}
      className="sticky top-16 z-30 border-primary/20 border-y bg-primary text-primary-foreground"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-300" />
        </span>

        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          Timing:{" "}
          <Link
            to={`/topics/${session.topic_id}`}
            className="underline-offset-2 hover:underline"
          >
            {topicTitle ?? "Unknown topic"}
          </Link>
          {taskTitle ? <span className="opacity-80"> · {taskTitle}</span> : null}
        </p>

        {connection === "offline" ? (
          <Badge className="bg-amber-300 text-amber-950">
            <WifiOffIcon aria-hidden="true" /> Offline — timer keeps counting
          </Badge>
        ) : null}

        <span className="font-mono text-lg font-semibold tracking-wide tabular-nums">
          {elapsed}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void stop()}
          disabled={isBusy}
        >
          <SquareIcon aria-hidden="true" />
          {isBusy ? "Stopping…" : "Stop"}
        </Button>
      </div>
    </div>
  )
}
