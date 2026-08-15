---
title: "04 — Webhooks"
description: "Receive comments and messages in real time"
---

**Time:** ~15 min · **Who:** deploy owner

## Goal

Meta sends comments (and messages) to Iris in real time.

## Prerequisites

- [03 — Environment variables](./03-variaveis-de-ambiente/) applied
- Iris reachable over **HTTPS** (production or tunnel)
- `META_WEBHOOK_VERIFY_TOKEN` set on server

## URLs

| Environment | Callback URL |
| -------- | ------------ |
| Production | `https://YOUR-DOMAIN/webhooks/meta` |
| Dev + tunnel | `https://YOUR-TUNNEL.ngrok-free.app/webhooks/meta` |

## Steps

### 1. Confirm endpoint responds

```bash
curl -s "https://YOUR-DOMAIN/health"
# expected: {"ok":true}
```

### 2. Open Webhooks in Meta app

1. [developers.facebook.com](https://developers.facebook.com) → your app.
2. **Webhooks** menu (or **Instagram** product → Webhooks).

### 3. Add subscription

1. **Callback URL:** `https://YOUR-DOMAIN/webhooks/meta`
2. **Verify token:** exactly `META_WEBHOOK_VERIFY_TOKEN` on server.
3. Click **Verify and save**.

### 4. Subscribe fields

| Field | Iris use |
| ----- | ---------------- |
| `comments` | Real-time post comments |
| `messages` | DMs (if using message agent) |

### 5. Align API version

Set `META_GRAPH_API_VERSION=v21.0` (or same as Webhooks panel).

### 6. Test

Comment on Instagram from another account; event should appear in Iris admin within seconds.

## Checklist

- [ ] Callback URL verified (✓)
- [ ] `comments` subscribed
- [ ] `messages` subscribed (if using DMs)
- [ ] `META_GRAPH_API_VERSION` matches panel
- [ ] Test event received

## Next step

→ [05 — Connect in Iris admin](./05-conectar-instagram-admin/)
