import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { interpolate } from "@/i18n/compose";
import {
  fetchLlmSettings,
  updateLlmSettings,
  type LlmSettings,
} from "@/lib/api";

type LlmSettingsCardProps = {
  embedded?: boolean;
};

export function LlmSettingsCard({ embedded = false }: LlmSettingsCardProps) {
  const { locale } = useAppLocale();
  const t = useDomainMessages("settings").llm;
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
      toast.error(getApiErrorMessage(err, locale) || t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [locale, t.toasts.loadFailed]);

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
      toast.success(t.toasts.saved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {settings?.env_override && (
        <p className="rounded-[var(--iris-radius-sm)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          {interpolate(t.envOverride, { envVars: "LLM_*" })}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="llm-api-url">{t.apiUrlLabel}</Label>
            <Input
              id="llm-api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={t.apiUrlPlaceholder}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="llm-model">{t.modelLabel}</Label>
            <Input
              id="llm-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t.modelPlaceholder}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="llm-api-key">{t.apiKeyLabel}</Label>
            <Input
              id="llm-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings?.key_hint
                  ? interpolate(t.keyPlaceholderBlank, { hint: settings.key_hint })
                  : t.keyPlaceholderNew
              }
              autoComplete="off"
            />
            {settings?.configured && settings.key_hint ? (
              <p className="text-sm text-muted-foreground">
                {interpolate(t.configuredHint, {
                  hint: settings.key_hint,
                  source: settings.source ? ` (${settings.source})` : "",
                })}
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
            {t.visionLabel}
          </label>

          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </div>
      )}
    </SettingsCardShell>
  );
}
