import { useState } from "react";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS } from "@iris/domain/timezone";
import { PreferencesAccordion } from "@/components/templates/preferences-accordion";
import { PreferencesPageShell } from "@/components/templates/preferences-page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { McpConnectionCard } from "@/components/settings/mcp-connection-card";
import { AgentAutoReplyCard } from "@/components/settings/agent-auto-reply-card";
import { MessageAgentAutoReplyCard } from "@/components/settings/message-agent-auto-reply-card";
import { AutoMonitorCard } from "@/components/settings/auto-monitor-card";
import { InsightsRefreshCard } from "@/components/settings/insights-refresh-card";
import { LlmSettingsCard } from "@/components/settings/llm-settings-card";
import { useAppSettings } from "@/contexts/app-settings-context";
import { formatInTimeZone } from "@/lib/datetime";

function TimezoneSection() {
  const { timezone, loading, saveTimezone } = useAppSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = draft ?? timezone;

  async function handleSave() {
    setSaving(true);
    try {
      await saveTimezone(selected);
      setDraft(null);
      toast.success("Fuso horário salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
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
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-semibold">
          Fuso horário editorial
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
          Agora neste fuso:{" "}
          <span className="font-semibold text-foreground">{preview}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || selected === timezone}
        >
          Salvar fuso horário
        </Button>
        {draft && draft !== timezone ? (
          <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
            Descartar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <PreferencesPageShell
      eyebrow="Preferências"
      title="Configurações"
      description="Fuso horário editorial, monitoramento Instagram, insights em lote, conexão MCP e provedor de IA."
    >
      <PreferencesAccordion
        className="mx-auto w-full max-w-4xl"
        defaultOpen={["timezone", "auto-monitor"]}
        sections={[
          {
            id: "timezone",
            title: "Fuso horário editorial",
            description:
              "Define como datas e horários aparecem no calendário e nos agendamentos.",
            content: <TimezoneSection />,
          },
          {
            id: "auto-monitor",
            title: "Auto-monitoramento de publicações",
            description:
              "Descobre mídias novas no Instagram (poll) e cadastra posts monitorados.",
            content: <AutoMonitorCard embedded />,
          },
          {
            id: "insights",
            title: "Insights Instagram em lote",
            description:
              "Atualiza métricas dos posts publicados ou monitorados.",
            content: <InsightsRefreshCard embedded />,
          },
          {
            id: "comment-agent",
            title: "Agente de comentários",
            description:
              "Modo padrão e fila de resposta para comentários públicos.",
            content: <AgentAutoReplyCard embedded />,
          },
          {
            id: "message-agent",
            title: "Agente de mensagens (DM)",
            description:
              "Modo padrão e fila de resposta para conversas privadas.",
            content: <MessageAgentAutoReplyCard embedded />,
          },
          {
            id: "mcp",
            title: "Conexão MCP",
            description:
              "Integração com Cursor, ChatGPT ou Claude via Model Context Protocol.",
            content: <McpConnectionCard embedded />,
          },
          {
            id: "llm",
            title: "Provedor de IA",
            description:
              "API key, URL e modelo usados pelos agentes de resposta automática.",
            content: <LlmSettingsCard embedded />,
          },
        ]}
      />
    </PreferencesPageShell>
  );
}
