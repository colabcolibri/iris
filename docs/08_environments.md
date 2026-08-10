---
title: Environments
status: approved
version: 1.1
updated: 2026-08-10
depends_on: [01_tech_stack.md, 05_architecture.md]
blocks: []
---

# 08 — Environments

## Local development

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `8792` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `IRIS_DB_PATH` | `./data/iris.db` | SQLite file |
| `IRIS_ADMIN_EMAIL` | required (UI) | Email allowlisted para OTP |
| `IRIS_SESSION_SECRET` | required (UI) | HMAC da sessão HttpOnly |
| `IRIS_OTP_PEPPER` | required (prod) | Hash do código OTP |
| `RESEND_API_KEY` | prod | Envio de email (Resend) |
| `IRIS_FROM_EMAIL` | required com Resend | Remetente transacional |
| `IRIS_EMAIL_PROVIDER` | `smtp` (dev) | `smtp`, `resend`, `logging` ou `noop` |
| `IRIS_SMTP_HOST` | `127.0.0.1` | Host SMTP (dev: Mailpit) |
| `IRIS_SMTP_PORT` | `1025` | Porta SMTP (Mailpit) |
| `IRIS_AGENT_TOKEN` | required | Agent Bearer token (espelhar em `agent/iris.credentials.json`) |
| `IRIS_MCP_CONNECTION_CODE` | required (prod) | Código de conexão MCP (Cursor, ChatGPT, Claude, etc.) — **distinto** de `IRIS_AGENT_TOKEN`; gerar com `openssl rand -hex 32` |
| `IRIS_ADMIN_TOKEN` | optional | Bearer admin legacy (CLI) |
| `NODE_ENV` | `development` | |

## Agente local (`iris-agent/`)

Pacote **portável** na raiz do repo: `iris-agent/`. Kit Meridian em `.agent/` — **sem Node**.

| Campo | Obrigatório | Descrição |
| ----- | ----------- | --------- |
| `apiUrl` | sim | Base da API Iris (`http://127.0.0.1:8792` em dev) |
| `agentToken` | sim | Mesmo valor de `IRIS_AGENT_TOKEN` no `iris-app/.env` |
| `mcpUrl` | não | Base MCP (`http://127.0.0.1:8792` em dev) — URL do server sem `/mcp` |
| `mcpConnectionCode` | não | Mesmo valor de `IRIS_MCP_CONNECTION_CODE` no `iris-app/.env` |
| `insecureAllowHttp` | dev | `true` só para localhost em HTTP |
| `publicationsDir` | não | Default `./publications` |

```bash
cd iris-agent
cp iris.credentials.example.json iris.credentials.json
./.agent/scripts/sync_cursor_kit.sh
```

Push via agente `@iris-local` / skill `push-publication` (`curl` + Bearer). Ver `iris-agent/README.md`.

### MCP (clientes de IA)

Guia canônico: `docs/architecture/mcp-integration.md`.

Em dev, se `IRIS_MCP_CONNECTION_CODE` não estiver no `.env`, o server usa o default documentado `dev-mcp-connection-code-change-me` — **nunca** em produção.

| Client | Config | URL |
| ------ | ------ | --- |
| Cursor | `.cursor/mcp.json` na raiz do workspace | `http://127.0.0.1:8792/mcp` (dev) |
| ChatGPT | Settings → Apps & connectors → custom connector (Token) | `https://<domínio>/mcp` (HTTPS obrigatório) |
| Claude Desktop | `claude_desktop_config.json` → `mcpServers` | `http://127.0.0.1:8792/mcp` (dev) ou HTTPS em prod |

Exemplo `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "iris": {
      "url": "http://127.0.0.1:8792/mcp",
      "headers": {
        "Authorization": "Bearer SEU_IRIS_MCP_CONNECTION_CODE"
      }
    }
  }
}
```

Check antes de configurar qualquer client:

```bash
cd iris-agent && ./scripts/iris-mcp-check.sh
```

**ChatGPT em dev local:** o connector remoto não alcança `127.0.0.1` — use túnel HTTPS (ngrok, Cloudflare Tunnel, etc.).

**Risco aceito:** arquivo só local; nunca commitar. Produção: `apiUrl` HTTPS.

```bash
cd iris-app
cp .env.example .env
pnpm install
pnpm dev
```

UI (dev): `http://127.0.0.1:8792/` — servidor único com Vite embutido (HMR). `pnpm dev` define `NODE_ENV=development`.

UI (produção): `pnpm build:admin` + `pnpm start` — bundle em `public/`; login em `/login` com OTP enviado ao `IRIS_ADMIN_EMAIL`.

## Production

Configure no host de deploy (ex.: Railway com domínio custom). **Não commitar valores reais** — use variáveis de ambiente no provedor.

| Variable | Notes |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `IRIS_DB_PATH` | Persistent volume path (ex.: `/app/data/iris.db`) |
| `IRIS_PUBLIC_BASE_URL` | URL pública HTTPS (ex.: `https://iris.example.com`) |
| `META_OAUTH_REDIRECT_URI` | `{IRIS_PUBLIC_BASE_URL}/auth/meta/callback` |
| `IRIS_EMAIL_PROVIDER` | `resend` |
| `IRIS_FROM_EMAIL` | Remetente verificado no Resend |
| `RESEND_API_KEY` | API key Resend (somente no provedor) |
| `IRIS_ADMIN_EMAIL` | Email allowlisted para OTP |
| `META_*` | App credentials + access token |
| `LLM_API_KEY` | For comment responder (v1-S6) |

Requirements:
- HTTPS (Meta webhooks require public URL)
- Persistent disk for SQLite
- Process manager (systemd, Railway, Fly)

## Meta webhook URL

Production: `https://<your-public-host>/webhooks/meta`

Configure in Meta Developers → Webhooks → Instagram. OAuth callback: `https://<your-public-host>/auth/meta/callback`.

## Ports

| Service | Port |
| ------- | ---- |
| Iris HTTP | 8792 (dev); 443 (prod via reverse proxy) |

Do not conflict with Casper motor (8787) or license-server (8790).
