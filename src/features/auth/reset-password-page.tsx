import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import {
  CircleCheckIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabase"

const MIN_PASSWORD_LENGTH = 8
const RECOVERY_LINK_TIMEOUT_MS = 5000

type RecoveryStatus = "waiting" | "recovery" | "invalid"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [supabase] = useState(() => getSupabaseClient())
  const [status, setStatus] = useState<RecoveryStatus>(() =>
    supabase ? "waiting" : "invalid",
  )
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setStatus((current) => (current === "waiting" ? "invalid" : current))
    }, RECOVERY_LINK_TIMEOUT_MS)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("recovery")
      }
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("recovery")
      }
    })

    return () => {
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setFormError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`,
      )
      return
    }

    if (password !== passwordConfirm) {
      setFormError("The two passwords do not match.")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (error) {
      setFormError(error.message)
      return
    }

    setIsSuccess(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            Set a new password
          </CardTitle>
          <CardDescription>
            Choose a new password for your Study Ledger account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "waiting" ? (
            <div
              className="flex items-center gap-3 text-muted-foreground"
              role="status"
            >
              <Loader2Icon className="size-5 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm">Checking your recovery link…</p>
            </div>
          ) : null}

          {status === "invalid" ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Recovery link is invalid or expired</AlertTitle>
                <AlertDescription>
                  Request a fresh recovery link from the sign-in page and open it
                  on this device.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : null}

          {status === "recovery" && !isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New password (at least {MIN_PASSWORD_LENGTH} characters)
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repeat new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </div>
              {formError ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon aria-hidden="true" />
                  <AlertTitle>Could not update password</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                Update password
              </Button>
            </form>
          ) : null}

          {isSuccess ? (
            <div className="space-y-4">
              <Alert className="border-emerald-900/15 bg-emerald-50/90 text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200">
                <CircleCheckIcon aria-hidden="true" />
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription className="text-emerald-900/90 dark:text-emerald-200/90">
                  Your password has been changed. You are signed in on this
                  device.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => navigate("/")}>
                Continue to overview
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
