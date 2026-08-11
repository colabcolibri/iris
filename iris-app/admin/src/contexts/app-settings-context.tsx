import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { useAuthSession } from "@/contexts/auth-session-context";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";
import type { ReplyMode } from "@/lib/types";

type AppSettingsContextValue = {
  timezone: string;
  replyMode: ReplyMode;
  replyDelaySeconds: number;
  autoMonitorEnabled: boolean;
  autoMonitorIntervalSeconds: number;
  /** Compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
  saveReplyMode: (mode: ReplyMode) => Promise<void>;
  saveReplyDelaySeconds: (seconds: number) => Promise<void>;
  saveAutoMonitorEnabled: (enabled: boolean) => Promise<void>;
  saveAutoMonitorIntervalSeconds: (seconds: number) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [replyMode, setReplyMode] = useState<ReplyMode>("auto");
  const [replyDelaySeconds, setReplyDelaySeconds] = useState(0);
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);
  const [autoMonitorIntervalSeconds, setAutoMonitorIntervalSeconds] = useState(300);
  const [loading, setLoading] = useState(false);

  const applySettings = useCallback(
    (settings: Awaited<ReturnType<typeof fetchAppSettings>>) => {
      setTimezone(settings.timezone);
      setReplyMode(settings.reply_mode ?? (settings.auto_reply_enabled ? "auto" : "off"));
      setReplyDelaySeconds(settings.reply_delay_seconds ?? 0);
      setAutoMonitorEnabled(settings.auto_monitor_enabled ?? true);
      setAutoMonitorIntervalSeconds(settings.auto_monitor_interval_seconds ?? 300);
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchAppSettings();
      applySettings(settings);
    } catch {
      // mantém default — 401 já invalida sessão autenticada via barramento
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    void refresh();
  }, [status, refresh]);

  const saveTimezone = useCallback(
    async (next: string) => {
      const saved = await updateAppSettings({ timezone: next });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveReplyMode = useCallback(
    async (mode: ReplyMode) => {
      const saved = await updateAppSettings({ reply_mode: mode });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveReplyDelaySeconds = useCallback(
    async (seconds: number) => {
      const saved = await updateAppSettings({ reply_delay_seconds: seconds });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveAutoMonitorEnabled = useCallback(
    async (enabled: boolean) => {
      const saved = await updateAppSettings({ auto_monitor_enabled: enabled });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveAutoMonitorIntervalSeconds = useCallback(
    async (seconds: number) => {
      const saved = await updateAppSettings({ auto_monitor_interval_seconds: seconds });
      applySettings(saved);
    },
    [applySettings],
  );

  return (
    <AppSettingsContext.Provider
      value={{
        timezone,
        replyMode,
        replyDelaySeconds,
        autoMonitorEnabled,
        autoMonitorIntervalSeconds,
        autoReplyEnabled: replyMode !== "off",
        loading,
        refresh,
        saveTimezone,
        saveReplyMode,
        saveReplyDelaySeconds,
        saveAutoMonitorEnabled,
        saveAutoMonitorIntervalSeconds,
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
