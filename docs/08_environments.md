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
| `IRIS_ADMIN_TOKEN` | required | Admin Bearer token |
| `IRIS_AGENT_TOKEN` | required | Agent Bearer token |
| `NODE_ENV` | `development` | |

```bash
cp .env.example .env
pnpm install
pnpm dev
```

UI: `http://127.0.0.1:8792/`

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
