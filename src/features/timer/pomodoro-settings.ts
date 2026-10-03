export type PomodoroSettings = {
  focusMinutes: number
  breakMinutes: number
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
}

export const FOCUS_MINUTE_OPTIONS = [15, 20, 25, 30, 45, 60]
export const BREAK_MINUTE_OPTIONS = [3, 5, 10, 15]

const STORAGE_KEY = "study-ledger-pomodoro-settings"

export function loadPomodoroSettings(): PomodoroSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_POMODORO_SETTINGS
    }

    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>
    const focusMinutes = FOCUS_MINUTE_OPTIONS.includes(parsed.focusMinutes ?? -1)
      ? (parsed.focusMinutes ?? DEFAULT_POMODORO_SETTINGS.focusMinutes)
      : DEFAULT_POMODORO_SETTINGS.focusMinutes
    const breakMinutes = BREAK_MINUTE_OPTIONS.includes(parsed.breakMinutes ?? -1)
      ? (parsed.breakMinutes ?? DEFAULT_POMODORO_SETTINGS.breakMinutes)
      : DEFAULT_POMODORO_SETTINGS.breakMinutes

    return { focusMinutes, breakMinutes }
  } catch {
    return DEFAULT_POMODORO_SETTINGS
  }
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Preferences are a per-device nicety; failing silently is fine.
  }
}
