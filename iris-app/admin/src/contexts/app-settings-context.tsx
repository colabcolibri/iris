import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { useAuthSession } from "@/contexts/auth-session-context";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";
import type { ReplyMode } from "@/lib/types";

type AppSettingsContextValue = {
  timezone: string;
  replyMode: ReplyMode;
  /** Compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
  saveReplyMode: (mode: ReplyMode) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [replyMode, setReplyMode] = useState<ReplyMode>("auto");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchAppSettings();
      setTimezone(settings.timezone);
      setReplyMode(settings.reply_mode ?? (settings.auto_reply_enabled ? "auto" : "off"));
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
    setReplyMode(saved.reply_mode ?? (saved.auto_reply_enabled ? "auto" : "off"));
  }, []);

  const saveReplyMode = useCallback(async (mode: ReplyMode) => {
    const saved = await updateAppSettings({ reply_mode: mode });
    setReplyMode(saved.reply_mode ?? (saved.auto_reply_enabled ? "auto" : "off"));
  }, []);

  return (
    <AppSettingsContext.Provider
      value={{
        timezone,
        replyMode,
        autoReplyEnabled: replyMode !== "off",
        loading,
        refresh,
        saveTimezone,
        saveReplyMode,
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
