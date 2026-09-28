---
title: Environments
status: review
version: 1.2
updated: 2026-09-28
depends_on: [01_tech_stack.md, 05_architecture.md]
blocks: []
---

# 08 — Environments

## Onde configurar

Os nomes são os de `iris-app/.env.example`. Cada ambiente troca o valor, não a lista.

| Arquivo | Quem lê |
| ------- | ------- |
| `iris-app/.env.example` | Ninguém. Modelo para copiar. |
| `iris-app/.env` | `pnpm dev` |
| `.env.docker.example` | Ninguém. Modelo do Compose. |
| `.env.docker` | `docker compose`. Inclui `IRIS_HOST_PORT` e `MAILPIT_UI_PORT`, que o processo Iris ignora. |
| Painel do host | Railway ou VPS. O processo não lê arquivo. |

`pnpm dev`, `pnpm start` e o container Docker abrem um SQLite por conta. Quem pode criar conta é `IRIS_TENANT_SIGNUP`. Sem a variável, o modo é `open`. O Compose define `allowlist`.

Segredos ficam fora do git. A chave do modelo fica na conta, em Configurações, não em `LLM_API_KEY`.

## Local development

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `8792` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `IRIS_DB_PATH` | `./data/iris.db` | SQLite file — caminho relativo é resolvido a partir de `iris-app/` (workspace), **não** do `cwd` do processo (`server/`). Evita abrir um segundo DB vazio em `server/data/`. |
| `IRIS_ADMIN_EMAIL` | required (UI) sem conta por arquivo | Email do operador. Entra sempre na allowlist de `IRIS_TENANT_SIGNUP=allowlist`. |
| `IRIS_TENANT_SIGNUP` | `open` | `open` cria conta para qualquer email confirmado. `allowlist` só aceita `IRIS_ADMIN_EMAIL` e `IRIS_ALLOWED_EMAILS`. `closed` deixa entrar quem já tem conta e não abre conta nova. O Compose define `allowlist`. |
| `IRIS_ALLOWED_EMAILS` | vazio | Emails extras da allowlist, separados por vírgula. Com a lista vazia, só o admin abre conta. |
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
| `reply_delay_seconds` | `0` | Agente de comentários → **Resposta imediata** ou **Fila com delay** (1–60 min, armazenado em segundos) |
| `agent_reply_tick_interval_seconds` | `300` (5 min) | Agente de comentários → **Intervalo do worker** (presets 3, 5, 10, 15 ou 20 min) — compartilhado com DMs |
| `auto_monitor_enabled` | `true` | Auto-monitoramento de publicações → Ligado/Desligado |
| `auto_monitor_interval_seconds` | `300` (5 min) | Auto-monitoramento → intervalo do poll (60–3600s) |

Com `reply_delay_seconds = 0`, o agente processa no próximo ciclo do worker (intervalo configurável, default ~5 min). Com fila ativa, `agent_reply_not_before` define quando o item fica elegível; o worker só consulta a fila no tick — sem poll agressivo de 15s/60s.

Com `auto_monitor_enabled`, o worker lista mídias recentes no intervalo configurado e cadastra posts `monitored`; o webhook de comentário também auto-cadastra mídia desconhecida.

## Lojas virtuais (Yampi, v1.19)

Credenciais Yampi (**User Token**, **User Secret Key** e **alias**) **não** vêm de variáveis de ambiente — são cadastradas na UI admin em **Lojas** (`/stores`) ou via MCP `iris_create_store_connection`. O server cifra o blob em `store_connections.encrypted_credentials` com `IRIS_TOKEN_ENCRYPTION_KEY` (mesmo vault de tokens Meta/LLM).

| Onde | O que configurar |
| ---- | ---------------- |
| UI `/stores` | Formulário Yampi — secrets só no submit; não reexibidos após salvar |
| MCP | `iris_create_store_connection` — paridade com `POST /api/store-connections` |
| `.env` | Apenas `IRIS_TOKEN_ENCRYPTION_KEY` (obrigatório em produção) — **não** coloque User Token Yampi no `.env` |

Guia passo a passo: `docs/architecture/ecommerce-stores.md` — § Como conectar Yampi.

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

UI (produção): `pnpm build:admin` + `pnpm start` — bundle em `public/`. O login em `/login` segue `IRIS_TENANT_SIGNUP`. Com `allowlist` e lista vazia, o código vai só para `IRIS_ADMIN_EMAIL`.

## Production

Configure no host de deploy (ex.: Railway com domínio custom). **Não commitar valores reais** — use variáveis de ambiente no provedor.

### Docker Compose (self-hosted)

Para subir localmente ou em um VPS com o mínimo de fricção:

```bash
cp .env.docker.example .env.docker
# edite secrets, IRIS_ADMIN_EMAIL e, se quiser outros emails, IRIS_ALLOWED_EMAILS
docker compose up -d --build
```

- **Iris:** `http://localhost:8792` (ou `IRIS_HOST_PORT`)
- **Mailpit (OTP em trial):** `http://localhost:8025`
- **Dados:** volume `iris-data` → diretório `/app/data` (`control.db`, `tenants/`, `media/` e o `iris.db` de origem)

Em produção com domínio público, use `IRIS_EMAIL_PROVIDER=resend`, HTTPS em `IRIS_PUBLIC_BASE_URL` e configure Meta conforme `iris-app/docs/configuracao/README.md`.

A conta que já existe em `iris.db` não entra sozinha. Com o processo parado, na pasta `iris-app/server`:

```bash
pnpm import-account seu@email.com ../data/iris.db ../data/media
```

O comando cria a conta se o email ainda não existir, copia o arquivo por cima do SQLite vazio e copia a mídia. Não apaga a origem. Se a conta já tiver posts, não copia de novo. Mantenha o mesmo `IRIS_TOKEN_ENCRYPTION_KEY`.

| Variable | Notes |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `IRIS_DB_PATH` | Caminho do arquivo antigo no volume (ex.: `/app/data/iris.db`). As contas ficam ao lado, em `/app/data/tenants`. |
| `IRIS_TENANT_SIGNUP` | `allowlist` ou `closed` num host público. `open` deixa qualquer email confirmado criar conta. |
| `IRIS_PUBLIC_BASE_URL` | URL pública HTTPS (ex.: `https://iris.example.com`) |
| `META_OAUTH_REDIRECT_URI` | `{IRIS_PUBLIC_BASE_URL}/auth/meta/callback` |
| `IRIS_EMAIL_PROVIDER` | `resend` |
| `IRIS_FROM_EMAIL` | Remetente verificado no Resend |
| `RESEND_API_KEY` | API key Resend (somente no provedor) |
| `IRIS_ADMIN_EMAIL` | Email do operador. Com `IRIS_TENANT_SIGNUP=allowlist`, é o único email se `IRIS_ALLOWED_EMAILS` estiver vazio. |
| `META_*` | App credentials + access token |
| `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` | Opcionais — DMs: guias [07](../iris-app/docs/configuracao/07-page-access-token.md) e [06](../iris-app/docs/configuracao/06-mensagens-receptor-primario.md) em `iris-app/docs/configuracao/` |
| `LLM_API_KEY` | Não chama o modelo. Cada conta salva a própria chave e a URL em Configurações. |
| `IRIS_REPLY_MAX_CONCURRENT` | Default `10` — ajuste conforme quota/custo do provedor LLM |
| `IRIS_RETENTION_DAYS` | Default `90` — purge de `meta_webhook_events` antigos |
| `VITE_UMAMI_WEBSITE_ID` | Opcional — website ID Umami (build-time; exige também `VITE_UMAMI_SCRIPT_URL`) |
| `VITE_UMAMI_SCRIPT_URL` | Opcional — URL do `script.js` do Umami (build-time; sem default no código) |

Requirements:
- HTTPS (Meta webhooks require public URL)
- Persistent disk for SQLite
- Process manager (systemd, Railway, Fly)

## Meta webhook URL

A URL é `https://<your-public-host>/webhooks/meta`. App id, app secret e verify token são os da Iris, no ambiente do servidor. Não há tela para colar esses três. O `entry.id` escolhe o arquivo da conta que conectou aquele Instagram.

OAuth callback: `https://<your-public-host>/auth/meta/callback`. O `state` assinado indica a conta. O token do Instagram grava no arquivo dela.

Quem sobe a Iris cria o próprio app na Meta. As chaves ficam no ambiente daquele deploy, não no repositório e não na conta de cada pessoa. Setup: `iris-app/docs/configuracao/README.md` or **`/docs/`** no próprio Iris.

## Site de documentação

Pacote fonte **`iris-app/docs-site/`** — Astro Starlight. O build gera HTML em **`iris-app/public/docs/`**, servido na **mesma origem** que o admin:

| URL | Conteúdo |
| --- | -------- |
| `https://<host>/docs/` | Hub (uso + configuração) |
| `https://<host>/docs/uso/…` | Guia de uso (fonte: `iris-app/docs/uso/`) |
| `https://<host>/docs/configuracao/…` | Redirect → início (config interna não publicada) |

| Command | Description |
| ------- | ----------- |
| `pnpm docs:build` | Gera `public/docs/` (incluído em `pnpm build:admin`) |
| `pnpm docs:dev` | Preview isolado na porta Astro (opcional) |
| `pnpm docs:preview` | Preview do build estático |

Content source: `iris-app/docs/inicio/`, `iris-app/docs/uso/` via `sync-docs-content.mjs`; rotas em `docs-site/docs-routes.json`. Detail: `docs/architecture/docs-site.md`.

## Ports

| Service | Port |
| ------- | ---- |
| Iris HTTP | 8792 (dev); 443 (prod via reverse proxy) |

Do not conflict with Casper motor (8787) or license-server (8790).
