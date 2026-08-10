import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute } from "@/components/auth/guest-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { AppSettingsProvider } from "@/contexts/app-settings-context";
import { AuthSessionProvider } from "@/contexts/auth-session-context";
import { ConfirmDialogProvider } from "@/contexts/confirm-dialog-context";
import { MetaSessionProvider } from "@/contexts/meta-session-context";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { PersonaPage } from "@/pages/persona-page";
import { CommentsPage } from "@/pages/comments-page";
import { SettingsPage } from "@/pages/settings-page";
import { WebhooksPage } from "@/pages/webhooks-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";

export function App() {
  return (
    <AuthSessionProvider>
      <ConfirmDialogProvider>
        <AppSettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <MetaSessionProvider>
                      <AppLayout />
                    </MetaSessionProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/comments" element={<CommentsPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/persona" element={<PersonaPage />} />
              </Route>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/login.html" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppSettingsProvider>
      </ConfirmDialogProvider>
    </AuthSessionProvider>
  );
}
