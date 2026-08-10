import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { useAuthSession } from "@/contexts/auth-session-context";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";

type AppSettingsContextValue = {
  timezone: string;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchAppSettings();
      setTimezone(settings.timezone);
    } catch {
      // mantém default — 401 já invalida sessão autenticada via barramento
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    void refresh();
  }, [status, refresh]);

  const saveTimezone = useCallback(async (next: string) => {
    const saved = await updateAppSettings({ timezone: next });
    setTimezone(saved.timezone);
  }, []);

  return (
    <AppSettingsContext.Provider value={{ timezone, loading, refresh, saveTimezone }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
}
