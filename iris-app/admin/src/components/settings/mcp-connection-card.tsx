import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { McpSetupGuide } from "@/components/settings/mcp-setup-guide";
import { Button } from "@/components/ui/button";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchMcpSettings,
  generateMcpConnection,
  revokeMcpConnection,
  type McpSettings,
  type McpSettingsGenerateResult,
} from "@/lib/api";

type McpConnectionCardProps = {
  embedded?: boolean;
};

export function McpConnectionCard({ embedded = false }: McpConnectionCardProps) {
  const { locale } = useAppLocale();
  const t = useDomainMessages("settings").mcp;
  const { confirm } = useConfirmDialog();
  const [settings, setSettings] = useState<McpSettings | null>(null);
  const [generated, setGenerated] = useState<McpSettingsGenerateResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMcpSettings();
      setSettings(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [locale, t.toasts.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerateClick() {
    const isRotation = settings?.configured && settings.source === "database";

    if (isRotation) {
      const ok = await confirm({
        title: t.confirmRotate.title,
        description: t.confirmRotate.description,
        confirmLabel: t.confirmRotate.confirmLabel,
        variant: "destructive",
      });
      if (!ok) {
        return;
      }
    }

    setWorking(true);
    try {
      const result = await generateMcpConnection();
      setGenerated(result);
      setSettings({
        configured: true,
        source: "database",
        code_hint: result.code_hint,
        mcp_path: result.mcp_path,
        mcp_url: result.mcp_url,
        updated_at: result.updated_at,
        env_override: settings?.env_override ?? false,
      });
      toast.success(isRotation ? t.toasts.rotated : t.toasts.generated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.generateFailed);
    } finally {
      setWorking(false);
    }
  }

  async function handleRevokeClick() {
    const ok = await confirm({
      title: t.confirmRevoke.title,
      description: t.confirmRevoke.description,
      confirmLabel: t.confirmRevoke.confirmLabel,
      variant: "destructive",
    });
    if (!ok) {
      return;
    }

    setWorking(true);
    try {
      const data = await revokeMcpConnection();
      setGenerated(null);
      setSettings(data);
      toast.success(t.toasts.revoked);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.revokeFailed);
    } finally {
      setWorking(false);
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(interpolate(t.toasts.copied, { label }));
    } catch {
      toast.error(t.toasts.copyFailed);
    }
  }

  const displayCode = generated?.connection_code ?? null;
  const mcpUrl = generated?.mcp_url ?? settings?.mcp_url ?? "";

  const statusLabel =
    settings?.source === "database"
      ? t.statusDatabase
      : settings?.source === "environment"
        ? t.statusEnvironment
        : t.statusDevelopment;

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : (
        <>
          {settings?.env_override && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              {interpolate(t.envOverride, {
                envVar: "IRIS_MCP_CONNECTION_CODE",
              })}
            </p>
          )}

          {settings?.configured ? (
            <div className="space-y-2 text-sm">
              <p>
                {t.statusLabel}{" "}
                <span className="font-semibold text-foreground">{statusLabel}</span>
              </p>
              {settings.code_hint && (
                <p className="text-muted-foreground">
                  {t.codeHintPrefix}{" "}
                  <span className="font-mono text-foreground">
                    {settings.code_hint}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.notConfigured}</p>
          )}

          {displayCode && (
            <div className="space-y-3 rounded-(--iris-radius-sm) border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                {t.codeOneTimeTitle}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={displayCode} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => void copyText(t.copyCode, displayCode)}
                >
                  {t.copyCode}
                </Button>
              </div>
            </div>
          )}

          {mcpUrl ? (
            <McpSetupGuide mcpUrl={mcpUrl} connectionCode={displayCode} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void handleGenerateClick()}
              disabled={working}
            >
              {settings?.configured && settings.source === "database"
                ? t.rotate
                : t.generate}
            </Button>
            {settings?.source === "database" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRevokeClick()}
                disabled={working}
              >
                {t.revoke}
              </Button>
            )}
            {mcpUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyText(t.copyUrl, mcpUrl)}
              >
                {t.copyUrl}
              </Button>
            )}
          </div>
        </>
      )}
    </SettingsCardShell>
  );
}
