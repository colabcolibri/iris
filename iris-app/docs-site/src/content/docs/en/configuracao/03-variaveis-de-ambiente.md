---
title: "03 — Environment variables"
description: "Set Meta credentials on the server"
---

**Time:** ~10 min · **Who:** deploy owner

## Goal

Put all Meta credentials on the server — **never** in git.

## Reference files in the repo

| File | Use |
| ------- | --- |
| `iris-app/.env.example` | Full list with comments |
| `iris-app/.env.railway.example` | Names for Railway / production |
| `iris-app/.env` | Local (gitignored) |

## Steps — production

1. Open host panel (e.g. Railway → **iris** service → **Variables**).
2. Set each variable below (values from [step 02](./02-criar-app-meta/)).
3. Save and wait for redeploy (or restart the process).

## Steps — local development

1. Copy `iris-app/.env.example` → `iris-app/.env` (if not exists).
2. Fill the Meta block below.
3. Start server: `pnpm dev`.

## Required variables (Meta)

```env
IRIS_PUBLIC_BASE_URL=https://YOUR-DOMAIN
META_INSTAGRAM_APP_ID=
META_INSTAGRAM_APP_SECRET=
META_OAUTH_REDIRECT_URI=https://YOUR-DOMAIN/auth/meta/callback
META_WEBHOOK_VERIFY_TOKEN=
META_GRAPH_API_VERSION=v21.0
META_APP_ID=
META_APP_SECRET=
IRIS_TOKEN_ENCRYPTION_KEY=<64 hex — openssl rand -hex 32>
```

## Optional — advanced DMs

Only after guides **06** and **07**:

```env
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
```

## What does NOT go in .env

| Credential | Where it lives |
| ---------- | --------- |
| Instagram access token (long-lived) | OAuth → `meta_tokens` table (admin connection) |
| Legacy `META_ACCESS_TOKEN` | Do not use — flow is OAuth via admin |

## Checklist

- [ ] `IRIS_PUBLIC_BASE_URL` is HTTPS in production
- [ ] `META_OAUTH_REDIRECT_URI` = `{IRIS_PUBLIC_BASE_URL}/auth/meta/callback`
- [ ] Instagram App ID ≠ Basic App ID (different fields)
- [ ] Secrets only in panel / gitignored local `.env`
- [ ] Server restarted after changes

## Next step

→ [04 — Webhooks](./04-webhooks/)
