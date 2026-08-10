import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchLlmSettings, updateLlmSettings, type LlmSettings } from "@/lib/api";

export function LlmSettingsCard() {
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [supportsVision, setSupportsVision] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLlmSettings();
      setSettings(data);
      setApiUrl(data.api_url);
      setModel(data.model);
      setSupportsVision(data.supports_vision);
      setApiKey("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar LLM.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await updateLlmSettings({
        api_url: apiUrl.trim(),
        model: model.trim(),
        supports_vision: supportsVision,
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
      });
      setSettings(saved);
      setApiKey("");
      toast.success("Configuração de IA salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-5 border-border/80 bg-card/90 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Provedor de IA (respostas automáticas)</h2>
        <p className="text-xs text-muted-foreground">
          API key, URL e modelo usados pelo agente de comentários. Valores do servidor em{" "}
          <code className="text-[11px]">.env</code> servem de fallback.
        </p>
      </header>

      {settings?.env_override && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          Variáveis <code className="text-[11px]">LLM_*</code> no ambiente estão definidas. O banco
          tem prioridade quando configurado aqui.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="llm-api-url">URL da API</Label>
            <Input
              id="llm-api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="llm-model">Modelo</Label>
            <Input
              id="llm-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="llm-api-key">API key</Label>
            <Input
              id="llm-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings?.key_hint
                  ? `••••${settings.key_hint} — deixe em branco para manter`
                  : "sk-…"
              }
              autoComplete="off"
            />
            {settings?.configured && settings.key_hint ? (
              <p className="text-xs text-muted-foreground">
                Configurado — termina em{" "}
                <span className="font-mono text-foreground">{settings.key_hint}</span>
                {settings.source ? ` (${settings.source})` : ""}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={supportsVision}
              onChange={(e) => setSupportsVision(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Modelo suporta visão (analisa imagens do post)
          </label>

          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Salvando…" : "Salvar provedor de IA"}
          </Button>
        </div>
      )}
    </Card>
  );
}
