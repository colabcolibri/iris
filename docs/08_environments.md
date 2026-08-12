---
title: Environments
status: review
version: 1.2
updated: 2026-08-11
depends_on: [01_tech_stack.md, 05_architecture.md]
blocks: []
---

# 08 — Environments

## Local development

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `8792` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `IRIS_DB_PATH` | `./data/iris.db` | SQLite file — caminho relativo é resolvido a partir de `iris-app/` (workspace), **não** do `cwd` do processo (`server/`). Evita abrir um segundo DB vazio em `server/data/`. |
| `IRIS_ADMIN_EMAIL` | required (UI) | Email allowlisted para OTP |
| `IRIS_SESSION_SECRET` | required (UI) | HMAC da sessão HttpOnly |
| `IRIS_OTP_PEPPER` | required (prod) | Hash do código OTP |
| `RESEND_API_KEY` | prod | Envio de email (Resend) |
| `IRIS_FROM_EMAIL` | required com Resend | Remetente transacional |
| `IRIS_EMAIL_PROVIDER` | `smtp` (dev) | `smtp`, `resend`, `logging` ou `noop` |
| `IRIS_SMTP_HOST` | `127.0.0.1` | Host SMTP (dev: Mailpit) |
| `IRIS_SMTP_PORT` | `1025` | Porta SMTP (Mailpit) |
| `IRIS_AGENT_TOKEN` | required | Agent Bearer token (espelhar em `agent/iris.credentials.json`) |
| `IRIS_MCP_CONNECTION_CODE` | optional | Código MCP — **opcional** se gerado em Configurações → Conexão MCP; útil para infra/CI. Distinto de `IRIS_AGENT_TOKEN` |
| `IRIS_PUBLIC_BASE_URL` | required p/ publish + MCP upload | URL alcançável pelo host (dev: `http://127.0.0.1:8792`) |
| `IRIS_PUBLISH_URL_SECRET` | required p/ publish + MCP upload | HMAC das URLs assinadas (`/publish/media/…` e `/upload/assets/…`) |
| `IRIS_ADMIN_TOKEN` | optional | Bearer admin legacy (CLI) |
| `NODE_ENV` | `development` | |
| `IRIS_REPLY_MAX_CONCURRENT` | `10` | Máximo de `processCommentReply` em paralelo (webhook + worker); mínimo efetivo `1` |
| `IRIS_RETENTION_DAYS` | `90` | Idade máxima de linhas em `meta_webhook_events` antes do purge |
| `IRIS_RETENTION_TICK_MS` | `86400000` (24h) | Intervalo do worker de retenção de webhooks |

## Configuração na UI (admin)

Estes valores **não** vêm de `.env` — persistem em `app_settings` via **Configurações** (`/settings`):

| Campo | Default | Onde na UI |
| ----- | ------- | ---------- |
| `reply_mode` | `auto` | Agente de comentários → modo global |
| `reply_delay_seconds` | `0` | Agente de comentários → **Resposta imediata** ou **Fila com delay** (30–600s) |
| `auto_monitor_enabled` | `true` | Auto-monitoramento de publicações → Ligado/Desligado |
| `auto_monitor_interval_seconds` | `300` (5 min) | Auto-monitoramento → intervalo do poll (60–3600s) |

Com `reply_delay_seconds = 0`, o agente processa no próximo ciclo do worker (~60s). Com fila ativa, o worker acelera o poll (~15s) automaticamente — sem variável de ambiente.

Com `auto_monitor_enabled`, o worker lista mídias recentes no intervalo configurado e cadastra posts `monitored`; o webhook de comentário também auto-cadastra mídia desconhecida.

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

**Fluxo recomendado:** admin em `/settings` → seção **Conexão MCP** → **Gerar código** → copiar e colar no client (Cursor, ChatGPT, Claude).

Em dev, se não houver código na interface nem no `.env`, o server aceita o default documentado `dev-mcp-connection-code-change-me` — **nunca** em produção.

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
| `IRIS_REPLY_MAX_CONCURRENT` | Default `10` — ajuste conforme quota/custo do provedor LLM |
| `IRIS_RETENTION_DAYS` | Default `90` — purge de `meta_webhook_events` antigos |
| `VITE_UMAMI_WEBSITE_ID` | Website ID Umami (build-time; omitir em dev local) |
| `VITE_UMAMI_SCRIPT_URL` | Opcional — default `https://umami.sergioluciano.com/script.js` |

Requirements:
- HTTPS (Meta webhooks require public URL)
- Persistent disk for SQLite
- Process manager (systemd, Railway, Fly)

## Meta webhook URL

Production: `https://<your-public-host>/webhooks/meta`

Configure in Meta Developers → Webhooks → Instagram. OAuth callback: `https://<your-public-host>/auth/meta/callback`.

Self-hosters create their own Meta app (BYOA) — credentials are per deployment, not shared via the repo. Setup guide: `docs/architecture/meta-integration.md`.

## Ports

| Service | Port |
| ------- | ---- |
| Iris HTTP | 8792 (dev); 443 (prod via reverse proxy) |

Do not conflict with Casper motor (8787) or license-server (8790).
