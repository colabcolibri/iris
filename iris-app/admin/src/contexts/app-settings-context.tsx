import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { useAuthSession } from "@/contexts/auth-session-context";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";

type AppSettingsContextValue = {
  timezone: string;
  autoReplyEnabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
  saveAutoReplyEnabled: (enabled: boolean) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchAppSettings();
      setTimezone(settings.timezone);
      setAutoReplyEnabled(settings.auto_reply_enabled);
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
    setAutoReplyEnabled(saved.auto_reply_enabled);
  }, []);

  const saveAutoReplyEnabled = useCallback(async (enabled: boolean) => {
    const saved = await updateAppSettings({ auto_reply_enabled: enabled });
    setAutoReplyEnabled(saved.auto_reply_enabled);
  }, []);

  return (
    <AppSettingsContext.Provider
      value={{
        timezone,
        autoReplyEnabled,
        loading,
        refresh,
        saveTimezone,
        saveAutoReplyEnabled,
      }}
    >
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
