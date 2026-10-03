import { DatabaseIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getMissingSupabaseEnvironmentVariables } from "@/lib/supabase"

export function SupabaseConfigurationNotice() {
  const missingVariables = getMissingSupabaseEnvironmentVariables()

  if (missingVariables.length === 0) {
    return null
  }

  return (
    <Alert className="border-amber-950/15 bg-amber-50/90 text-amber-950">
      <DatabaseIcon aria-hidden="true" />
      <AlertTitle>Set up Supabase to unlock data features</AlertTitle>
      <AlertDescription className="text-amber-900/90">
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, fill in{" "}
          {missingVariables.join(", ")}, then restart{" "}
          <code>npm run dev</code>. The interface remains available while
          backend setup is pending.
        </p>
        <p className="mt-2">
          Use the project URL and publishable key from{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            your Supabase dashboard
          </a>
          . Never put a service-role key in this frontend.
        </p>
      </AlertDescription>
    </Alert>
  )
}
