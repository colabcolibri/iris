---
title: "05 — Connect Instagram in admin"
description: "OAuth connection from Iris admin"
---

**Time:** ~5 min · **Who:** Instagram account operator

## Goal

Authorize Iris to publish, read comments, insights, and messages on behalf of the Instagram account.

Token stays on the server (SQLite) — **do not** copy to `.env`.

## Prerequisites

- Steps [01](./01-conta-instagram/)–[04](./04-webhooks/) done
- Iris running with correct Meta variables
- Instagram account is app **tester** (Development) or app is **Live**

## Steps

1. Open admin at your domain (or `http://127.0.0.1:8792` locally).
2. Log in (OTP to `IRIS_ADMIN_EMAIL`).
3. Header → **Connect Instagram** → authorize on Meta.
4. Confirm @username in header.

If you changed scopes in Meta developers:

1. Header → Instagram menu → **Switch account**.
2. Re-authorize — old token lacks new scopes.

## Checklist

- [ ] @username in header
- [ ] Optional: test publish / comment via webhook

## Next step (DMs only)

→ [06 — Primary receiver](./06-mensagens-receptor-primario/)

Otherwise basic Meta setup is **complete**. For public production → [08 — App Review](./08-app-review/).
