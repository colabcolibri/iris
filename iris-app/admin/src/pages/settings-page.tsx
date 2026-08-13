import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS } from "@iris/domain/timezone";
import {
  PreferencesSplitLayout,
  type PreferencesSection,
} from "@/components/templates/preferences-split-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { McpConnectionCard } from "@/components/settings/mcp-connection-card";
import { McpPermissionsCard } from "@/components/settings/mcp-permissions-card";
import { AgentAutoReplyCard } from "@/components/settings/agent-auto-reply-card";
import { MessageAgentAutoReplyCard } from "@/components/settings/message-agent-auto-reply-card";
import { AutoMonitorCard } from "@/components/settings/auto-monitor-card";
import { InsightsRefreshCard } from "@/components/settings/insights-refresh-card";
import { LlmSettingsCard } from "@/components/settings/llm-settings-card";
import { useAppSettings } from "@/contexts/app-settings-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { formatInTimeZone } from "@/lib/datetime";

function TimezoneSection() {
  const { locale } = useAppLocale();
  const settings = useDomainMessages("settings");
  const { timezone, loading, saveTimezone } = useAppSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = draft ?? timezone;

  async function handleSave() {
    setSaving(true);
    try {
      await saveTimezone(selected);
      setDraft(null);
      toast.success(settings.timezone.toasts.saved);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || settings.timezone.toasts.failed,
      );
    } finally {
      setSaving(false);
    }
  }

  const preview = formatInTimeZone(new Date().toISOString(), selected, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">{settings.page.loading}</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-semibold">
          {settings.sections.timezone.label}
        </Label>
        <select
          id="timezone"
          value={selected}
          onChange={(e) => setDraft(e.target.value)}
          className="flex h-11 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm shadow-none outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          {settings.sections.timezone.preview}{" "}
          <span className="font-semibold text-foreground">{preview}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || selected === timezone}
        >
          {settings.sections.timezone.save}
        </Button>
        {draft && draft !== timezone ? (
          <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
            {settings.sections.timezone.cancel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const settings = useDomainMessages("settings");

  const sections = useMemo<PreferencesSection[]>(
    () => [
      {
        id: settings.sections.timezone.id,
        title: settings.sections.timezone.title,
        description: settings.sections.timezone.description,
        content: <TimezoneSection />,
      },
      {
        id: settings.sections.autoMonitor.id,
        title: settings.sections.autoMonitor.title,
        description: settings.sections.autoMonitor.description,
        content: <AutoMonitorCard embedded />,
      },
      {
        id: settings.sections.insights.id,
        title: settings.sections.insights.title,
        description: settings.sections.insights.description,
        content: <InsightsRefreshCard embedded />,
      },
      {
        id: settings.sections.commentAgent.id,
        title: settings.sections.commentAgent.title,
        description: settings.sections.commentAgent.description,
        content: <AgentAutoReplyCard embedded />,
      },
      {
        id: settings.sections.messageAgent.id,
        title: settings.sections.messageAgent.title,
        description: settings.sections.messageAgent.description,
        content: <MessageAgentAutoReplyCard embedded />,
      },
      {
        id: settings.sections.mcpConnection.id,
        title: settings.sections.mcpConnection.title,
        description: settings.sections.mcpConnection.description,
        content: <McpConnectionCard embedded />,
      },
      {
        id: settings.sections.mcpPermissions.id,
        title: settings.sections.mcpPermissions.title,
        description: settings.sections.mcpPermissions.description,
        content: <McpPermissionsCard embedded />,
      },
      {
        id: settings.sections.llm.id,
        title: settings.sections.llm.title,
        description: settings.sections.llm.description,
        content: <LlmSettingsCard embedded />,
      },
    ],
    [settings],
  );

  return (
    <PreferencesSplitLayout
      eyebrow={settings.page.eyebrow}
      title={settings.page.title}
      description={settings.page.description}
      sections={sections}
    />
  );
}
