import { useState } from "react";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS } from "@iris/domain/timezone";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { McpConnectionCard } from "@/components/settings/mcp-connection-card";
import { AgentAutoReplyCard } from "@/components/settings/agent-auto-reply-card";
import { LlmSettingsCard } from "@/components/settings/llm-settings-card";
import { MetaReviewCard } from "@/components/settings/meta-review-card";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { formatInTimeZone } from "@/lib/datetime";

export function SettingsPage() {
  const { meta, handleMetaHealth } = useMetaSession();
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
          description="Fuso horário editorial, conexão MCP, provedor de IA e testes de revisão Meta."
        />

        <Card className="space-y-5 border-border/80 bg-card/90 p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-xs font-semibold tracking-wide uppercase">
                  Fuso horário editorial
                </Label>
                <select
                  id="timezone"
                  value={selected}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Agora neste fuso: <span className="font-medium text-foreground">{preview}</span>
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
                  <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                    Descartar
                  </Button>
                )}
              </div>
            </>
          )}
          </Card>

          <AgentAutoReplyCard />

          <McpConnectionCard />

        <LlmSettingsCard />

        <MetaReviewCard meta={meta} onMetaHealth={handleMetaHealth} />
      </PageContainer.Content>
    </PageContainer>
  );
}
