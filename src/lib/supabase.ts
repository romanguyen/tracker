import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database"

const SUPABASE_URL_KEY = "VITE_SUPABASE_URL"
const SUPABASE_PUBLISHABLE_KEY = "VITE_SUPABASE_PUBLISHABLE_KEY"

const supabaseUrl = import.meta.env[SUPABASE_URL_KEY]?.trim()
const supabasePublishableKey = import.meta.env[SUPABASE_PUBLISHABLE_KEY]?.trim()

export type StudyLedgerClient = SupabaseClient<Database>

let supabaseClient: StudyLedgerClient | null | undefined

function isConfiguredValue(value: string | undefined): value is string {
  return Boolean(
    value &&
      !value.includes("your-project-ref") &&
      !value.includes("your_key_here"),
  )
}

export function getMissingSupabaseEnvironmentVariables(): string[] {
  return [
    [!isConfiguredValue(supabaseUrl), SUPABASE_URL_KEY],
    [!isConfiguredValue(supabasePublishableKey), SUPABASE_PUBLISHABLE_KEY],
  ]
    .filter(([isMissing]) => isMissing)
    .map(([, key]) => key as string)
}

/**
 * Returns the typed Supabase client, or null when environment variables are
 * missing so the app can stay usable as an unconfigured preview.
 */
export function getSupabaseClient(): StudyLedgerClient | null {
  if (supabaseClient !== undefined) {
    return supabaseClient
  }

  if (getMissingSupabaseEnvironmentVariables().length > 0) {
    supabaseClient = null
    return null
  }

  supabaseClient = createClient<Database>(supabaseUrl!, supabasePublishableKey!)
  return supabaseClient
}

export function requireSupabaseClient(): StudyLedgerClient {
  const client = getSupabaseClient()

  if (!client) {
    throw new Error(
      `Supabase is not configured. Set ${getMissingSupabaseEnvironmentVariables().join(
        ", ",
      )} in your environment, then restart the Vite development server.`,
    )
  }

  return client
}
