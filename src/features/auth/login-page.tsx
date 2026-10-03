import { useState, type FormEvent } from "react"
import { Navigate, useLocation } from "react-router"
import {
  BookOpenTextIcon,
  CircleCheckIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import { SupabaseConfigurationNotice } from "@/components/supabase-configuration-notice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/auth-context"
import { getSupabaseClient } from "@/lib/supabase"

const MIN_PASSWORD_LENGTH = 8

type LoginLocationState = {
  from?: { pathname?: string; search?: string; hash?: string }
}

function friendlyAuthMessage(message: string): string {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "This email address is not confirmed yet. Check your inbox for the confirmation link, then try signing in again."
  }

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password. Try again or use account recovery."
  }

  return message
}

export function LoginPage() {
  const { session, isLoading, isConfigured } = useAuth()
  const location = useLocation()
  const supabase = getSupabaseClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)

  const state = location.state as LoginLocationState | null
  const redirectTarget =
    state?.from?.pathname && state.from.pathname !== "/login"
      ? `${state.from.pathname}${state.from.search ?? ""}${state.from.hash ?? ""}`
      : "/"

  if (isLoading) {
    return null
  }

  if (session && isConfigured) {
    return <Navigate to={redirectTarget} replace />
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setFormError(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setFormError(friendlyAuthMessage(error.message))
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setFormError(null)
    setInfoMessage(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`,
      )
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setIsSubmitting(false)

    if (error) {
      setFormError(friendlyAuthMessage(error.message))
      return
    }

    if (!data.session) {
      setInfoMessage(
        "Account created. Check your inbox for a confirmation link to finish signing in.",
      )
    }
  }

  async function handleRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setRecoveryError(null)
    setRecoveryMessage(null)
    setIsRecovering(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      recoveryEmail.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    )

    setIsRecovering(false)

    if (error) {
      setRecoveryError(friendlyAuthMessage(error.message))
      return
    }

    setRecoveryMessage(
      "If an account exists for that address, a recovery link is on its way to your inbox.",
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
            <BookOpenTextIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-xl leading-none font-semibold">
              Study Ledger
            </p>
            <p className="text-xs font-bold tracking-[0.18em] uppercase opacity-75">
              PVA state exam
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="font-heading text-4xl leading-tight font-semibold text-balance">
            Your study time, synced across phone and computer.
          </h1>
          <p className="max-w-md leading-7 text-primary-foreground/80">
            One personal account keeps your 23 Czech exam topics, mini-tasks,
            timer, and study history private and available everywhere.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Row Level Security keeps every record strictly yours.
        </p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          {!isConfigured ? (
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Connect Supabase to enable sign-in
                </h1>
                <p className="text-muted-foreground">
                  The app currently runs as a preview without an account.
                </p>
              </div>
              <SupabaseConfigurationNotice />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-2xl">
                  Welcome back
                </CardTitle>
                <CardDescription>
                  Sign in with your personal account or create a new one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sign-in" orientation="horizontal">
                  <TabsList className="w-full">
                    <TabsTrigger value="sign-in" className="flex-1">
                      Sign in
                    </TabsTrigger>
                    <TabsTrigger value="sign-up" className="flex-1">
                      Create account
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 space-y-4">
                    {formError ? (
                      <Alert variant="destructive">
                        <TriangleAlertIcon aria-hidden="true" />
                        <AlertTitle>Authentication failed</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    ) : null}
                    {infoMessage ? (
                      <Alert className="border-emerald-900/15 bg-emerald-50/90 text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <CircleCheckIcon aria-hidden="true" />
                        <AlertTitle>Check your email</AlertTitle>
                        <AlertDescription className="text-emerald-900/90 dark:text-emerald-200/90">
                          {infoMessage}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <TabsContent value="sign-in">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sign-in-email">Email</Label>
                          <Input
                            id="sign-in-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sign-in-password">Password</Label>
                            <Dialog
                              open={isRecoveryOpen}
                              onOpenChange={(open) => {
                                setIsRecoveryOpen(open)
                                setRecoveryError(null)
                                setRecoveryMessage(null)
                                if (open) {
                                  setRecoveryEmail(email)
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button type="button" variant="link" size="xs">
                                  Forgot password?
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Recover your account</DialogTitle>
                                  <DialogDescription>
                                    We will email you a password recovery link.
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={handleRecovery}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="recovery-email">Email</Label>
                                    <Input
                                      id="recovery-email"
                                      type="email"
                                      autoComplete="email"
                                      required
                                      value={recoveryEmail}
                                      onChange={(event) =>
                                        setRecoveryEmail(event.target.value)
                                      }
                                    />
                                  </div>
                                  {recoveryError ? (
                                    <Alert variant="destructive">
                                      <TriangleAlertIcon aria-hidden="true" />
                                      <AlertTitle>Recovery failed</AlertTitle>
                                      <AlertDescription>
                                        {recoveryError}
                                      </AlertDescription>
                                    </Alert>
                                  ) : null}
                                  {recoveryMessage ? (
                                    <Alert>
                                      <CircleCheckIcon aria-hidden="true" />
                                      <AlertTitle>Recovery email sent</AlertTitle>
                                      <AlertDescription>
                                        {recoveryMessage}
                                      </AlertDescription>
                                    </Alert>
                                  ) : null}
                                  <DialogFooter>
                                    <Button type="submit" disabled={isRecovering}>
                                      {isRecovering ? (
                                        <Loader2Icon
                                          className="animate-spin"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      Send recovery link
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <Input
                            id="sign-in-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2Icon className="animate-spin" aria-hidden="true" />
                          ) : null}
                          Sign in
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="sign-up">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sign-up-email">Email</Label>
                          <Input
                            id="sign-up-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sign-up-password">
                            Password (at least {MIN_PASSWORD_LENGTH} characters)
                          </Label>
                          <Input
                            id="sign-up-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={MIN_PASSWORD_LENGTH}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2Icon className="animate-spin" aria-hidden="true" />
                          ) : null}
                          Create account
                        </Button>
                        <p className="text-xs leading-5 text-muted-foreground">
                          If email confirmation is enabled in your Supabase
                          project, you will receive a confirmation link before
                          your first sign-in.
                        </p>
                      </form>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
