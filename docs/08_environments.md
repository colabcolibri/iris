---
title: Environments
status: approved
version: 1.0
updated: 2026-08-09
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
| `IRIS_ADMIN_TOKEN` | optional | Bearer admin legacy (CLI) |
| `NODE_ENV` | `development` | |

## Agente local (`iris-agent/`)

Pacote **portável** na raiz do repo: `iris-agent/`. Kit Meridian em `.agent/` — **sem Node**.

| Campo | Obrigatório | Descrição |
| ----- | ----------- | --------- |
| `apiUrl` | sim | Base da API Iris (`http://127.0.0.1:8792` em dev) |
| `agentToken` | sim | Mesmo valor de `IRIS_AGENT_TOKEN` no `iris-app/.env` |
| `insecureAllowHttp` | dev | `true` só para localhost em HTTP |
| `publicationsDir` | não | Default `./publications` |

```bash
cd iris-agent
cp iris.credentials.example.json iris.credentials.json
./.agent/scripts/sync_cursor_kit.sh
```

Push via agente `@iris-local` / skill `push-publication` (`curl` + Bearer). Ver `iris-agent/README.md`.

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

| Variable | Notes |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `IRIS_DB_PATH` | Persistent volume path |
| `META_*` | App credentials + access token |
| `LLM_API_KEY` | For comment responder (v1-S6) |

Requirements:
- HTTPS (Meta webhooks require public URL)
- Persistent disk for SQLite
- Process manager (systemd, Railway, Fly)

## Meta webhook URL

Production: `https://<host>/webhooks/meta`

Configure in Meta Developers → Webhooks → Instagram.

## Ports

| Service | Port |
| ------- | ---- |
| Iris HTTP | 8792 (dev); 443 (prod via reverse proxy) |

Do not conflict with Casper motor (8787) or license-server (8790).
