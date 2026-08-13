import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { McpSetupGuide } from "@/components/settings/mcp-setup-guide";
import { Button } from "@/components/ui/button";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
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
      toast.error(
        err instanceof Error ? err.message : "Falha ao carregar MCP.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerateClick() {
    const isRotation = settings?.configured && settings.source === "database";

    if (isRotation) {
      const ok = await confirm({
        title: "Rotacionar código MCP?",
        description:
          "O código atual deixará de funcionar. Atualize Cursor, ChatGPT ou Claude com o novo valor.",
        confirmLabel: "Rotacionar",
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
      toast.success(
        isRotation
          ? "Código rotacionado. Copie os campos abaixo agora — o código não será exibido de novo."
          : "Código MCP gerado. Copie os campos abaixo agora — o código não será exibido de novo.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao gerar código.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleRevokeClick() {
    const ok = await confirm({
      title: "Revogar código MCP?",
      description:
        "Clientes conectados deixarão de autenticar até você gerar um novo código na interface.",
      confirmLabel: "Revogar",
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
      toast.success("Código MCP revogado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao revogar.");
    } finally {
      setWorking(false);
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  const displayCode = generated?.connection_code ?? null;
  const mcpUrl = generated?.mcp_url ?? settings?.mcp_url ?? "";

  return (
    <SettingsCardShell
      embedded={embedded}
      title="Conexão MCP"
      description="Gere um código e copie os campos para Cursor, ChatGPT ou Claude — cada client no formato que aceita."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {settings?.env_override && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              Há um código definido em{" "}
              <code className="font-mono">IRIS_MCP_CONNECTION_CODE</code> no
              servidor. Ele continua válido junto com códigos gerados aqui.
            </p>
          )}

          {settings?.configured ? (
            <div className="space-y-2 text-sm">
              <p>
                Status:{" "}
                <span className="font-semibold text-foreground">
                  {settings.source === "database"
                    ? "ativo (gerado na interface)"
                    : settings.source === "environment"
                      ? "ativo (variável de ambiente)"
                      : "ativo (desenvolvimento)"}
                </span>
              </p>
              {settings.code_hint && (
                <p className="text-muted-foreground">
                  Termina em{" "}
                  <span className="font-mono text-foreground">
                    {settings.code_hint}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum código configurado. Gere um para habilitar clientes MCP.
            </p>
          )}

          {displayCode && (
            <div className="space-y-3 rounded-[var(--iris-radius-sm)] border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Código de conexão — copie agora (exibido uma única vez)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  readOnly
                  value={displayCode}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => void copyText("Código", displayCode)}
                >
                  Copiar código
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
                ? "Rotacionar código"
                : "Gerar código"}
            </Button>
            {settings?.source === "database" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRevokeClick()}
                disabled={working}
              >
                Revogar
              </Button>
            )}
            {mcpUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyText("URL MCP", mcpUrl)}
              >
                Copiar URL
              </Button>
            )}
          </div>
        </>
      )}
    </SettingsCardShell>
  );
}
