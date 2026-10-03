import { Navigate, Outlet, useLocation } from "react-router"

import { PageLoader } from "@/components/page-loader"
import { useAuth } from "@/features/auth/auth-context"

/**
 * Redirects signed-out visitors to /login while preserving the intended
 * destination. When Supabase is not configured yet, routes stay reachable as
 * a setup preview.
 */
export function ProtectedRoute() {
  const { session, isLoading, isConfigured } = useAuth()
  const location = useLocation()

  if (!isConfigured) {
    return <Outlet />
  }

  if (isLoading) {
    return <PageLoader label="Restoring your sign-in" />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
