import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_TIMEZONE } from "@iris/domain/timezone";
import { useAuthSession } from "@/contexts/auth-session-context";
import { getDemoMode } from "@/demo/demo-mode-context";
import { fetchAppSettings, updateAppSettings } from "@/lib/api";
import type { ReplyMode } from "@/lib/types";

type AppSettingsContextValue = {
  timezone: string;
  replyMode: ReplyMode;
  replyDelaySeconds: number;
  replyMaxAgeDays: number;
  agentReplyTickIntervalSeconds: number;
  messageReplyMode: ReplyMode;
  messageReplyDelaySeconds: number;
  autoMonitorEnabled: boolean;
  autoMonitorIntervalSeconds: number;
  /** Compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  messageAutoReplyEnabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  saveTimezone: (timezone: string) => Promise<void>;
  saveReplyMode: (mode: ReplyMode) => Promise<void>;
  saveReplyDelaySeconds: (seconds: number) => Promise<void>;
  saveReplyMaxAgeDays: (days: number) => Promise<void>;
  saveAgentReplyTickIntervalSeconds: (seconds: number) => Promise<void>;
  saveMessageReplyMode: (mode: ReplyMode) => Promise<void>;
  saveMessageReplyDelaySeconds: (seconds: number) => Promise<void>;
  saveAutoMonitorEnabled: (enabled: boolean) => Promise<void>;
  saveAutoMonitorIntervalSeconds: (seconds: number) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuthSession();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [replyMode, setReplyMode] = useState<ReplyMode>("auto");
  const [replyDelaySeconds, setReplyDelaySeconds] = useState(0);
  const [replyMaxAgeDays, setReplyMaxAgeDays] = useState(15);
  const [agentReplyTickIntervalSeconds, setAgentReplyTickIntervalSeconds] =
    useState(300);
  const [messageReplyMode, setMessageReplyMode] = useState<ReplyMode>("draft");
  const [messageReplyDelaySeconds, setMessageReplyDelaySeconds] = useState(0);
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);
  const [autoMonitorIntervalSeconds, setAutoMonitorIntervalSeconds] =
    useState(300);
  const [loading, setLoading] = useState(false);

  const applySettings = useCallback(
    (settings: Awaited<ReturnType<typeof fetchAppSettings>>) => {
      setTimezone(settings.timezone);
      setReplyMode(
        settings.reply_mode ?? (settings.auto_reply_enabled ? "auto" : "off"),
      );
      setReplyDelaySeconds(settings.reply_delay_seconds ?? 0);
      setReplyMaxAgeDays(settings.reply_max_age_days ?? 15);
      setAgentReplyTickIntervalSeconds(
        settings.agent_reply_tick_interval_seconds ?? 300,
      );
      setMessageReplyMode(
        settings.message_reply_mode ??
          (settings.message_auto_reply_enabled ? "auto" : "draft"),
      );
      setMessageReplyDelaySeconds(settings.message_reply_delay_seconds ?? 0);
      setAutoMonitorEnabled(settings.auto_monitor_enabled ?? true);
      setAutoMonitorIntervalSeconds(
        settings.auto_monitor_interval_seconds ?? 300,
      );
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
    if (status !== "authenticated" && !getDemoMode()) {
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

  const saveReplyMaxAgeDays = useCallback(
    async (days: number) => {
      const saved = await updateAppSettings({ reply_max_age_days: days });
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
      const saved = await updateAppSettings({
        auto_monitor_interval_seconds: seconds,
      });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveAgentReplyTickIntervalSeconds = useCallback(
    async (seconds: number) => {
      const saved = await updateAppSettings({
        agent_reply_tick_interval_seconds: seconds,
      });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveMessageReplyMode = useCallback(
    async (mode: ReplyMode) => {
      const saved = await updateAppSettings({ message_reply_mode: mode });
      applySettings(saved);
    },
    [applySettings],
  );

  const saveMessageReplyDelaySeconds = useCallback(
    async (seconds: number) => {
      const saved = await updateAppSettings({ message_reply_delay_seconds: seconds });
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
        replyMaxAgeDays,
        agentReplyTickIntervalSeconds,
        messageReplyMode,
        messageReplyDelaySeconds,
        autoMonitorEnabled,
        autoMonitorIntervalSeconds,
        autoReplyEnabled: replyMode !== "off",
        messageAutoReplyEnabled: messageReplyMode !== "off",
        loading,
        refresh,
        saveTimezone,
        saveReplyMode,
        saveReplyDelaySeconds,
        saveReplyMaxAgeDays,
        saveAgentReplyTickIntervalSeconds,
        saveMessageReplyMode,
        saveMessageReplyDelaySeconds,
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
