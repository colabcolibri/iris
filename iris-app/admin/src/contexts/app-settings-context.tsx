import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";

type AppSettingsContextValue = {
  timezone: string;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const settings = await fetchAppSettings();
      setTimezone(settings.timezone);
    } catch {
      // login and public routes keep default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
