import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchMcpSettings,
  generateMcpConnection,
  revokeMcpConnection,
  type McpSettings,
  type McpSettingsGenerateResult,
} from "@/lib/api";

export function McpConnectionCard() {
  const [settings, setSettings] = useState<McpSettings | null>(null);
  const [generated, setGenerated] = useState<McpSettingsGenerateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMcpSettings();
      setSettings(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar MCP.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerate() {
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
      toast.success("Código MCP gerado. Copie agora — não será exibido de novo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar código.");
    } finally {
      setWorking(false);
    }
  }

  async function handleRevoke() {
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
  const cursorSnippet = displayCode
    ? JSON.stringify(
        {
          mcpServers: {
            iris: {
              url: generated.mcp_url,
              headers: {
                Authorization: `Bearer ${generated.connection_code}`,
              },
            },
          },
        },
        null,
        2,
      )
    : null;

  return (
    <Card className="space-y-5 border-border/80 bg-card/90 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Conexão MCP</h2>
        <p className="text-sm text-muted-foreground">
          Gere um código para conectar Cursor, ChatGPT ou Claude ao Iris via protocolo MCP.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {settings?.env_override && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              Há um código definido em <code className="font-mono">IRIS_MCP_CONNECTION_CODE</code> no
              servidor. Ele continua válido junto com códigos gerados aqui.
            </p>
          )}

          {settings?.configured ? (
            <div className="space-y-2 text-sm">
              <p>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {settings.source === "database"
                    ? "ativo (gerado na interface)"
                    : settings.source === "environment"
                      ? "ativo (variável de ambiente)"
                      : "ativo (desenvolvimento)"}
                </span>
              </p>
              {settings.code_hint && (
                <p className="text-muted-foreground">
                  Termina em <span className="font-mono text-foreground">{settings.code_hint}</span>
                </p>
              )}
              <p className="break-all text-muted-foreground">
                URL: <span className="font-mono text-foreground">{settings.mcp_url}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum código configurado. Gere um para habilitar clientes MCP.
            </p>
          )}

          {displayCode && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Copie agora — exibido uma única vez
              </p>
              <div className="space-y-2">
                <Label htmlFor="mcp-code">Código de conexão</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="mcp-code" readOnly value={displayCode} className="font-mono text-xs" />
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
              {cursorSnippet && (
                <div className="space-y-2">
                  <Label htmlFor="mcp-cursor">Exemplo Cursor (.cursor/mcp.json)</Label>
                  <textarea
                    id="mcp-cursor"
                    readOnly
                    rows={10}
                    value={cursorSnippet}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyText("Configuração", cursorSnippet)}
                  >
                    Copiar JSON
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handleGenerate()} disabled={working}>
              {settings?.configured && settings.source === "database"
                ? "Rotacionar código"
                : "Gerar código"}
            </Button>
            {settings?.source === "database" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRevoke()}
                disabled={working}
              >
                Revogar
              </Button>
            )}
            {settings?.mcp_url && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyText("URL MCP", settings.mcp_url)}
              >
                Copiar URL
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
