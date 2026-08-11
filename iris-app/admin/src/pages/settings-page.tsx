import { useState } from "react";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS } from "@iris/domain/timezone";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { McpConnectionCard } from "@/components/settings/mcp-connection-card";
import { AgentAutoReplyCard } from "@/components/settings/agent-auto-reply-card";
import { AutoMonitorCard } from "@/components/settings/auto-monitor-card";
import { LlmSettingsCard } from "@/components/settings/llm-settings-card";
import { useAppSettings } from "@/contexts/app-settings-context";
import { formatInTimeZone } from "@/lib/datetime";

export function SettingsPage() {
  const { timezone, loading, saveTimezone } = useAppSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = draft ?? timezone;

  async function handleSave() {
    setSaving(true);
    try {
      await saveTimezone(selected);
      setDraft(null);
      toast.success("Configurações salvas.");
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

  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Preferências"
          title="Configurações"
          description="Fuso horário editorial, monitoramento Instagram, conexão MCP e provedor de IA."
        />

        <Card className="space-y-5 border-border bg-card p-6 shadow-none">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="timezone"
                  className="text-xs font-semibold tracking-wide uppercase"
                >
                  Fuso horário editorial
                </Label>
                <select
                  id="timezone"
                  value={selected}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-none outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Agora neste fuso:{" "}
                  <span className="font-semibold text-foreground">
                    {preview}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || selected === timezone}
                >
                  Salvar alterações
                </Button>
                {draft && draft !== timezone && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDraft(null)}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>

        <AutoMonitorCard />

        <AgentAutoReplyCard />

        <McpConnectionCard />

        <LlmSettingsCard />
      </PageContainer.Content>
    </PageContainer>
  );
}
