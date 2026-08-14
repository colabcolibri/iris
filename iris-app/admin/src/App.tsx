import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute } from "@/components/auth/guest-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { DemoAppLayout } from "@/components/layout/demo-app-layout";
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
import { MessagesPage } from "@/pages/messages-page";
import { ProductsPage } from "@/pages/products-page";
import { StoresPage } from "@/pages/stores-page";
import { SettingsPage } from "@/pages/settings-page";
import { WebhooksPage } from "@/pages/webhooks-page";
import { AgentRunsPage } from "@/pages/agent-runs-page";
import { AgentSimulatorPage } from "@/pages/agent-simulator-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";
import { UmamiAnalytics } from "@/components/analytics/umami-analytics";
import { DemoModeProvider } from "@/demo/demo-mode-context";
import { resetDemoState } from "@/demo/demo-state";
import { AppI18nProvider } from "@/i18n/provider";
import type { AppLocale } from "@/i18n/types";

const ADMIN_APP_ROUTES = [
  { path: ROUTES.admin.root, element: <DashboardPage /> },
  { path: ROUTES.admin.comments, element: <CommentsPage /> },
  { path: ROUTES.admin.messages, element: <MessagesPage /> },
  { path: ROUTES.admin.products, element: <ProductsPage /> },
  { path: ROUTES.admin.stores, element: <StoresPage /> },
  { path: ROUTES.admin.webhooks, element: <WebhooksPage /> },
  { path: ROUTES.admin.agentRuns, element: <AgentRunsPage /> },
  { path: ROUTES.admin.agentSimulator, element: <AgentSimulatorPage /> },
  { path: ROUTES.admin.settings, element: <SettingsPage /> },
  { path: ROUTES.admin.persona, element: <PersonaPage /> },
] as const;

const DEMO_APP_ROUTES = [
  { path: ROUTES.demo.root, element: <DashboardPage /> },
  { path: ROUTES.demo.comments, element: <CommentsPage /> },
  { path: ROUTES.demo.messages, element: <MessagesPage /> },
  { path: ROUTES.demo.products, element: <ProductsPage /> },
  { path: ROUTES.demo.stores, element: <StoresPage /> },
  { path: ROUTES.demo.webhooks, element: <WebhooksPage /> },
  { path: ROUTES.demo.agentRuns, element: <AgentRunsPage /> },
  { path: ROUTES.demo.agentSimulator, element: <AgentSimulatorPage /> },
  { path: ROUTES.demo.settings, element: <SettingsPage /> },
  { path: ROUTES.demo.persona, element: <PersonaPage /> },
] as const;

const LEGACY_ADMIN_REDIRECTS = [
  ["/login", ROUTES.admin.login],
  ["/login.html", ROUTES.admin.login],
  ["/comments", ROUTES.admin.comments],
  ["/messages", ROUTES.admin.messages],
  ["/products", ROUTES.admin.products],
  ["/stores", ROUTES.admin.stores],
  ["/settings", ROUTES.admin.settings],
  ["/persona", ROUTES.admin.persona],
  ["/webhooks", ROUTES.admin.webhooks],
  ["/agent-runs", ROUTES.admin.agentRuns],
  ["/agent-simulator", ROUTES.admin.agentSimulator],
] as const;

export function App() {
  function handleLocaleChange(_locale: AppLocale) {
    resetDemoState();
  }

  return (
    <AuthSessionProvider>
      <ConfirmDialogProvider>
        <AppSettingsProvider>
          <AppI18nProvider onLocaleChange={handleLocaleChange}>
            <BrowserRouter>
            <UmamiAnalytics />
            <Routes>
              <Route path={ROUTES.home} element={<LandingPage locale="pt" />} />
              <Route path="/en" element={<LandingPage locale="en" />} />
              <Route path={ROUTES.privacy} element={<PrivacyPolicyPage locale="pt" />} />
              <Route path={ROUTES.privacyEn} element={<PrivacyPolicyPage locale="en" />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage locale="pt" />} />

              {LEGACY_ADMIN_REDIRECTS.map(([from, to]) => (
                <Route
                  key={from}
                  path={from}
                  element={<Navigate to={to} replace />}
                />
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
                {ADMIN_APP_ROUTES.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>

              <Route
                element={
                  <DemoModeProvider>
                    <MetaSessionProvider>
                      <DemoAppLayout />
                    </MetaSessionProvider>
                  </DemoModeProvider>
                }
              >
                {DEMO_APP_ROUTES.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>

              <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
            </Routes>
          </BrowserRouter>
          </AppI18nProvider>
        </AppSettingsProvider>
      </ConfirmDialogProvider>
    </AuthSessionProvider>
  );
}
