import { useState } from "react"
import { Link, NavLink, Outlet } from "react-router"
import { BookOpenTextIcon, LogOutIcon, MenuIcon } from "lucide-react"

import { LOGIN_PATH, MAIN_NAVIGATION } from "@/app/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { SupabaseConfigurationNotice } from "@/components/supabase-configuration-notice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/auth-context"
import { TimerBar } from "@/features/timer/timer-bar"
import { getSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

function navigationClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive && "bg-primary text-primary-foreground hover:bg-primary",
  )
}

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { user, isConfigured } = useAuth()

  async function handleSignOut() {
    const supabase = getSupabaseClient()

    if (!supabase || isSigningOut) {
      return
    }

    setIsSigningOut(true)
    await supabase.auth.signOut()
    setIsSigningOut(false)
    setIsMenuOpen(false)
  }

  const accountControls = user ? (
    <>
      <span
        className="max-w-44 truncate text-sm text-muted-foreground"
        title={user.email ?? undefined}
      >
        {user.email}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
      >
        <LogOutIcon aria-hidden="true" />
        {isSigningOut ? "Signing out…" : "Sign out"}
      </Button>
    </>
  ) : (
    <Button asChild size="sm" variant="outline">
      <Link to={LOGIN_PATH}>
        {isConfigured ? "Sign in" : "Set up sign-in"}
      </Link>
    </Button>
  )

  return (
    <div className="min-h-svh">
      <a
        href="#main-content"
        className="sr-only z-100 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-border/70 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-2">
              <BookOpenTextIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-lg leading-none font-semibold">
                Study Ledger
              </span>
              <span className="block text-[0.68rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                PVA state exam
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 md:flex"
          >
            {MAIN_NAVIGATION.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={navigationClass}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ModeToggle />
            <Badge variant="secondary">Milestone 7</Badge>
            {accountControls}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Open navigation menu"
                >
                  <MenuIcon aria-hidden="true" />
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,86vw)]">
              <SheetHeader>
                <SheetTitle>Study Ledger</SheetTitle>
                <SheetDescription>
                  {user ? `Signed in as ${user.email}` : "Not signed in yet."}
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="grid gap-2 px-4 pb-6"
              >
                {MAIN_NAVIGATION.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setIsMenuOpen(false)}
                    className={navigationClass}
                  >
                    <item.icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
                {user ? (
                  <Button
                    variant="outline"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                  >
                    <LogOutIcon aria-hidden="true" />
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </Button>
                ) : (
                  <NavLink
                    to={LOGIN_PATH}
                    onClick={() => setIsMenuOpen(false)}
                    className={navigationClass}
                  >
                    {isConfigured ? "Sign in" : "Set up sign-in"}
                  </NavLink>
                )}
              </nav>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <TimerBar />

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl space-y-8 px-4 py-7 sm:px-6 sm:py-10 lg:px-8"
      >
        <SupabaseConfigurationNotice />
        <Outlet />
      </main>

      <footer className="border-border/70 border-t py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Built for 23 applicable FI MU PVA exam topics.</p>
          <p>React · Vite · Tailwind · shadcn/ui · Supabase</p>
        </div>
      </footer>
    </div>
  )
}
