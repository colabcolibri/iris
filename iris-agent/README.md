# Iris agent — workspace local

Pacote **portável** do agente editorial Iris. Não é aplicativo Node — é um **kit Meridian** (`.agent/`) + credenciais + rascunhos.

Copie a pasta `iris-agent/` inteira para outro lugar; ajuste `iris.credentials.json` e continue.

## Estrutura

```txt
iris-agent/
  .agent/                    # kit Meridian (skills, agents) — fonte canônica
  scripts/iris-mcp-check.sh  # valida código MCP contra a API
  iris.credentials.json      # gitignored — sua config local
  iris.credentials.example.json
  publications/              # post.md + imagens por slug
  README.md
```

## Setup

```bash
cd iris-agent
cp iris.credentials.example.json iris.credentials.json
```

1. `agentToken` = mesmo valor de `IRIS_AGENT_TOKEN` no `iris-app/.env` do server
2. `apiUrl` = URL do Iris (ex. `http://127.0.0.1:8792` em dev)
3. `mcpUrl` + `mcpConnectionCode` = espelho de `IRIS_MCP_CONNECTION_CODE` (opcional, para MCP)
4. Em dev HTTP local: `"insecureAllowHttp": true`

## Adapters (Cursor / Claude / Codex)

```bash
./.agent/scripts/sync_cursor_kit.sh
```

Isso cria symlinks em `.cursor/skills/`, `.cursor/agents/`, etc. — padrão Meridian. **Não commitar** adapters.

## Uso — push de publicações (REST)

1. Abra a pasta `iris-agent` no Cursor (ou o monorepo `iris/` inteiro)
2. Invoque `@iris-local` ou a skill `push-publication`
3. O agente lê `iris.credentials.json`, valida `publications/*/post.md` e chama a API Iris com `curl`

Não há `pnpm`, `node` nem processo rodando neste pacote.

## Uso — MCP (clients de IA)

O Iris expõe um servidor MCP em `POST /mcp`, autenticado por `IRIS_MCP_CONNECTION_CODE` no `iris-app/.env`.

| Client | Onde configurar |
| ------ | --------------- |
| Cursor | `.cursor/mcp.json` na raiz do workspace |
| ChatGPT | Settings → Apps & connectors (HTTPS + Token) |
| Claude Desktop | `claude_desktop_config.json` |

**Passos:**

1. Gere o código: `openssl rand -hex 32` → coloque em `iris-app/.env` (`IRIS_MCP_CONNECTION_CODE`)
2. Espelhe em `iris.credentials.json` (`mcpUrl`, `mcpConnectionCode`)
3. Configure o client (skill `mcp-connection` ou guia em `docs/architecture/mcp-integration.md`)
4. Valide: `./scripts/iris-mcp-check.sh`

**REST vs MCP:**

| Cenário | Preferir |
| ------- | -------- |
| Push em lote de `publications/` | REST + skill `push-publication` |
| Criar/editar posts ad hoc no chat | MCP tools |
| ChatGPT / Claude perguntando sobre calendário | MCP connector |

Tokens são **distintos**: `IRIS_AGENT_TOKEN` (REST) e `IRIS_MCP_CONNECTION_CODE` (MCP).

## Admin (UI)

Calendário, kanban e edição de postagens ficam no **admin online** servido pelo `iris-app`:

```bash
cd iris-app && pnpm dev
# http://127.0.0.1:8792/
```

## Server

O Iris HTTP server fica em `iris-app/` (`pnpm dev`). Este pacote é só o **cliente agente** (push de publicações locais via API e setup MCP).

Documentação completa MCP: `docs/architecture/mcp-integration.md` (no monorepo `iris/docs/`).
