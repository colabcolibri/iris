import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type McpCopyFieldProps = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

function McpCopyField({ id, label, value, hint }: McpCopyFieldProps) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium text-foreground"
      >
        {label}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id={id} readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void copy()}
        >
          Copiar
        </Button>
      </div>
    </div>
  );
}

type McpSetupGuideProps = {
  mcpUrl: string;
  connectionCode: string | null;
};

export function McpSetupGuide({ mcpUrl, connectionCode }: McpSetupGuideProps) {
  const bearerValue = connectionCode ? `Bearer ${connectionCode}` : null;

  const cursorSnippet = connectionCode
    ? JSON.stringify(
        {
          mcpServers: {
            iris: {
              url: mcpUrl,
              headers: {
                Authorization: `Bearer ${connectionCode}`,
              },
            },
          },
        },
        null,
        2,
      )
    : null;

  const claudeSnippet = connectionCode
    ? JSON.stringify(
        {
          mcpServers: {
            iris: {
              url: mcpUrl,
              headers: {
                Authorization: `Bearer ${connectionCode}`,
              },
            },
          },
        },
        null,
        2,
      )
    : null;

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-sm border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">ChatGPT</h3>
          <p className="text-xs text-muted-foreground">
            Projeto → Plugins → Conectar MCP personalizado → tipo{" "}
            <span className="font-semibold text-foreground">
              HTTP com streaming
            </span>
            . Preencha campo a campo (não aceita JSON completo).
          </p>
        </div>

        <McpCopyField id="chatgpt-name" label="Nome" value="Iris" />
        <McpCopyField
          id="chatgpt-url"
          label="URL"
          value={mcpUrl}
          hint="Use HTTPS público (ex.: ngrok) — não localhost."
        />

        <p className="rounded-md border border-border/80 bg-background px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Variável de ambiente de token do portador:
          </span>{" "}
          deixe vazio. Esse campo é só o <em>nome</em> de uma variável no seu
          computador (ex. <span className="font-mono">MCP_BEARER_TOKEN</span>) —
          não cole o código do Iris aí. Para o Iris, use o cabeçalho{" "}
          <span className="font-mono">Authorization</span> abaixo.
        </p>

        {connectionCode ? (
          <>
            <McpCopyField
              id="chatgpt-header-key"
              label="Cabeçalhos — chave"
              value="Authorization"
              hint='Em "Cabeçalhos", clique em + Adicionar cabeçalho.'
            />
            <McpCopyField
              id="chatgpt-header-value"
              label="Cabeçalhos — valor"
              value={bearerValue!}
              hint="Cole exatamente assim: a palavra Bearer, um espaço e o código."
            />
            <p className="text-xs text-muted-foreground">
              Não preencha &quot;Cabeçalhos a partir de variáveis do
              ambiente&quot; — isso é alternativa avançada. Com o cabeçalho fixo
              acima, basta clicar em Salvar.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Gere ou rotacione o código acima para ver os campos de autenticação.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-sm border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Cursor</h3>
          <p className="text-xs text-muted-foreground">
            Arquivo <span className="font-mono">.cursor/mcp.json</span> na raiz
            do workspace.
          </p>
        </div>

        {cursorSnippet ? (
          <>
            <textarea
              readOnly
              rows={10}
              value={cursorSnippet}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-none outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyText("JSON do Cursor", cursorSnippet)}
            >
              Copiar JSON
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Gere o código para montar o JSON.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-sm border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Claude Desktop</h3>
          <p className="text-xs text-muted-foreground">
            Arquivo{" "}
            <span className="font-mono">
              ~/Library/Application Support/Claude/claude_desktop_config.json
            </span>{" "}
            (macOS) — ou preencha URL + header manualmente.
          </p>
        </div>

        <McpCopyField id="claude-url" label="URL" value={mcpUrl} />

        {connectionCode ? (
          <>
            <McpCopyField
              id="claude-header-key"
              label="Header — chave"
              value="Authorization"
            />
            <McpCopyField
              id="claude-header-value"
              label="Header — valor"
              value={bearerValue!}
            />
            {claudeSnippet ? (
              <>
                <Label className="text-xs font-medium text-foreground">
                  JSON completo
                </Label>
                <textarea
                  readOnly
                  rows={10}
                  value={claudeSnippet}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-none outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyText("JSON do Claude", claudeSnippet)}
                >
                  Copiar JSON
                </Button>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Gere o código para ver autenticação e JSON.
          </p>
        )}
      </div>
    </div>
  );
}
