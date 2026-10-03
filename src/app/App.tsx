import { Route, Routes } from "react-router"

import { AppShell } from "@/app/app-shell"
import { NotFoundPage } from "@/app/not-found-page"
import { Toaster } from "@/components/ui/sonner"
import { LoginPage } from "@/features/auth/login-page"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { ResetPasswordPage } from "@/features/auth/reset-password-page"
import { OverviewPage } from "@/features/overview/overview-page"
import { SessionHistoryPage } from "@/features/sessions/session-history-page"
import { TopicDetailPage } from "@/features/topics/topic-detail-page"
import { TopicsPage } from "@/features/topics/topics-page"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="topics" element={<TopicsPage />} />
            <Route path="topics/:topicId" element={<TopicDetailPage />} />
            <Route path="history" element={<SessionHistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster richColors={false} closeButton />
    </>
  )
}
