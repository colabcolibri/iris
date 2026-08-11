import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute } from "@/components/auth/guest-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { AppSettingsProvider } from "@/contexts/app-settings-context";
import { AuthSessionProvider } from "@/contexts/auth-session-context";
import { ConfirmDialogProvider } from "@/contexts/confirm-dialog-context";
import { MetaSessionProvider } from "@/contexts/meta-session-context";
import { ROUTES } from "@/lib/routes";
import { DashboardPage } from "@/pages/dashboard-page";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/pages/login-page";
import { PersonaPage } from "@/pages/persona-page";
import { CommentsPage } from "@/pages/comments-page";
import { SettingsPage } from "@/pages/settings-page";
import { WebhooksPage } from "@/pages/webhooks-page";
import { AgentRunsPage } from "@/pages/agent-runs-page";
import { AgentSimulatorPage } from "@/pages/agent-simulator-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";

const LEGACY_ADMIN_REDIRECTS = [
  ["/login", ROUTES.admin.login],
  ["/login.html", ROUTES.admin.login],
  ["/comments", ROUTES.admin.comments],
  ["/settings", ROUTES.admin.settings],
  ["/persona", ROUTES.admin.persona],
  ["/webhooks", ROUTES.admin.webhooks],
  ["/agent-runs", ROUTES.admin.agentRuns],
  ["/agent-simulator", ROUTES.admin.agentSimulator],
] as const;

export function App() {
  return (
    <AuthSessionProvider>
      <ConfirmDialogProvider>
        <AppSettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.home} element={<LandingPage />} />
              <Route path={ROUTES.privacy} element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

              {LEGACY_ADMIN_REDIRECTS.map(([from, to]) => (
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
              ))}

              <Route
                path={ROUTES.admin.login}
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <MetaSessionProvider>
                      <AppLayout />
                    </MetaSessionProvider>
                  </ProtectedRoute>
                }
              >
                <Route path={ROUTES.admin.root} element={<DashboardPage />} />
                <Route path={ROUTES.admin.comments} element={<CommentsPage />} />
                <Route path={ROUTES.admin.webhooks} element={<WebhooksPage />} />
                <Route path={ROUTES.admin.agentRuns} element={<AgentRunsPage />} />
                <Route path={ROUTES.admin.agentSimulator} element={<AgentSimulatorPage />} />
                <Route path={ROUTES.admin.settings} element={<SettingsPage />} />
                <Route path={ROUTES.admin.persona} element={<PersonaPage />} />
              </Route>

              <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
            </Routes>
          </BrowserRouter>
        </AppSettingsProvider>
      </ConfirmDialogProvider>
    </AuthSessionProvider>
  );
}
