import { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  HourglassIcon,
  PlayIcon,
  Settings2Icon,
  SquareIcon,
  WifiOffIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BREAK_MINUTE_OPTIONS,
  FOCUS_MINUTE_OPTIONS,
} from "@/features/timer/pomodoro-settings"
import { useTimer } from "@/features/timer/timer-context"
import { elapsedSecondsSince, formatElapsedSeconds } from "@/lib/time"

function useNowMs(): number {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return nowMs
}

function formatRemainingSeconds(ms: number): string {
  return formatElapsedSeconds(Math.max(0, Math.ceil(ms / 1000)))
}

export function TimerBar() {
  const {
    activeTimer,
    connection,
    serverOffsetMs,
    stop,
    isBusy,
    pomodoro,
    endPomodoro,
    nextPomodoroRound,
    pomodoroSettings,
    savePomodoroSettings,
  } = useTimer()
  const nowMs = useNowMs()

  if (!activeTimer && !pomodoro) {
    return null
  }

  const session = activeTimer?.session ?? null
  const topicTitle = activeTimer?.topicTitle ?? null
  const taskTitle = activeTimer?.taskTitle ?? null

  const isPomodoroFocus =
    pomodoro?.phase === "focus" && session?.mode === "pomodoro"
  const isBreak = pomodoro?.phase === "break"
  const isReady = pomodoro?.phase === "ready"

  const focusRemainingMs = isPomodoroFocus
    ? Date.parse(session!.started_at) +
      (session!.planned_seconds ?? 0) * 1000 -
      (nowMs + serverOffsetMs)
    : 0
  const breakRemainingMs =
    isBreak && pomodoro?.breakEndsAtMs
      ? pomodoro.breakEndsAtMs - nowMs
      : 0

  const elapsed = session
    ? formatElapsedSeconds(
        elapsedSecondsSince(session.started_at, nowMs, serverOffsetMs),
      )
    : "00:00"

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={
        isPomodoroFocus
          ? `Pomodoro round ${pomodoro!.round}, ${formatRemainingSeconds(focusRemainingMs)} left on ${topicTitle ?? "topic"}`
          : isBreak
            ? `Pomodoro break, ${formatRemainingSeconds(breakRemainingMs)} left`
            : session
              ? `Studying ${topicTitle ?? "topic"}, elapsed time ${elapsed}`
              : "Pomodoro round finished"
      }
      className={
        isBreak || isReady
          ? "sticky top-16 z-30 border-accent border-y bg-accent text-accent-foreground"
          : "sticky top-16 z-30 border-primary/20 border-y bg-primary text-primary-foreground"
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <span
          className="relative flex size-2.5 shrink-0"
          aria-hidden="true"
        >
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:hidden ${
              isBreak || isReady ? "bg-sky-300" : "bg-emerald-300"
            }`}
          />
          <span
            className={`relative inline-flex size-2.5 rounded-full ${
              isBreak || isReady ? "bg-sky-400" : "bg-emerald-300"
            }`}
          />
        </span>

        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {isBreak ? (
            <>
              Break after round {pomodoro!.round}
              <span className="opacity-75"> · study time paused</span>
            </>
          ) : isReady ? (
            <>Round {pomodoro!.round} complete — break over</>
          ) : session && topicTitle ? (
            <>
              {isPomodoroFocus ? "Pomodoro: " : "Timing: "}
              <Link
                to={`/topics/${session.topic_id}`}
                className="underline-offset-2 hover:underline"
              >
                {topicTitle}
              </Link>
              {taskTitle ? (
                <span className="opacity-80"> · {taskTitle}</span>
              ) : null}
            </>
          ) : (
            "Timer loading…"
          )}
        </p>

        {connection === "offline" ? (
          <Badge className="bg-amber-300 text-amber-950">
            <WifiOffIcon aria-hidden="true" /> Offline — timer keeps counting
          </Badge>
        ) : null}

        {pomodoro ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Pomodoro settings"
              >
                <Settings2Icon aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <p className="text-sm font-medium">Pomodoro rounds</p>
              <div className="space-y-2">
                <Label htmlFor="pomo-focus">Focus length</Label>
                <Select
                  value={String(pomodoroSettings.focusMinutes)}
                  onValueChange={(value) =>
                    savePomodoroSettings({
                      focusMinutes: Number(value),
                      breakMinutes: pomodoroSettings.breakMinutes,
                    })
                  }
                >
                  <SelectTrigger id="pomo-focus" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOCUS_MINUTE_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pomo-break">Break length</Label>
                <Select
                  value={String(pomodoroSettings.breakMinutes)}
                  onValueChange={(value) =>
                    savePomodoroSettings({
                      focusMinutes: pomodoroSettings.focusMinutes,
                      breakMinutes: Number(value),
                    })
                  }
                >
                  <SelectTrigger id="pomo-break" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BREAK_MINUTE_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Applies to new rounds only; the running round keeps its plan.
              </p>
            </PopoverContent>
          </Popover>
        ) : null}

        {isPomodoroFocus ? (
          <>
            <Badge className="bg-primary-foreground/15 text-primary-foreground">
              <HourglassIcon aria-hidden="true" /> Round {pomodoro!.round}
            </Badge>
            <span
              className={`font-mono text-lg font-semibold tracking-wide tabular-nums ${
                focusRemainingMs <= 0 ? "animate-pulse" : ""
              }`}
            >
              {focusRemainingMs > 0
                ? `-${formatRemainingSeconds(focusRemainingMs)}`
                : "completing…"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void endPomodoro()}
              disabled={isBusy}
            >
              <SquareIcon aria-hidden="true" />
              End round
            </Button>
          </>
        ) : isBreak ? (
          <>
            <span className="font-mono text-lg font-semibold tracking-wide tabular-nums">
              {formatRemainingSeconds(breakRemainingMs)}
            </span>
            <Button variant="secondary" size="sm" onClick={() => void nextPomodoroRound()} disabled={isBusy}>
              <PlayIcon aria-hidden="true" /> Next round
            </Button>
            <Button variant="outline" size="sm" onClick={() => void endPomodoro()}>
              End pomodoro
            </Button>
          </>
        ) : isReady ? (
          <>
            <Button size="sm" onClick={() => void nextPomodoroRound()} disabled={isBusy}>
              <PlayIcon aria-hidden="true" /> Start round {pomodoro!.round + 1}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void endPomodoro()}>
              Finish
            </Button>
          </>
        ) : session ? (
          <>
            {session.mode === "pomodoro" ? (
              <Badge className="bg-primary-foreground/15 text-primary-foreground">
                <HourglassIcon aria-hidden="true" /> Pomodoro
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
          </>
        ) : null}
      </div>
    </div>
  )
}
