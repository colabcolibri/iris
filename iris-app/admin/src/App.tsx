import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppSettingsProvider } from "@/contexts/app-settings-context";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { PersonaPage } from "@/pages/persona-page";
import { SettingsPage } from "@/pages/settings-page";

export function App() {
  return (
    <AppSettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/persona" element={<PersonaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppSettingsProvider>
  );
}
