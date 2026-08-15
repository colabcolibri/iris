---
title: "07 — Page Access Token (DMs)"
description: "Recover threads after native Instagram replies"
---

**Time:** ~30 min · **Who:** Business Manager admin + deploy

## Goal

Configure `META_PAGE_ID` and `META_PAGE_ACCESS_TOKEN` so Iris recovers conversations when someone replied via the **native Instagram app**.

Iris calls `take_thread_control` automatically — you only set variables.

## When

- After [06 — Primary receiver](./06-mensagens-receptor-primario/).
- When logs show `take_thread_control failed` or error `#210`.

## What NOT to put in `META_PAGE_ACCESS_TOKEN`

| Token | Works? |
| ----- | ------ |
| Admin OAuth token (Instagram Login) | ❌ |
| Personal / Graph API Explorer token | ❌ |
| System User **without** `pages_messaging` | ❌ (#210) |
| Page Access Token with `pages_messaging` | ✅ |

## Summary steps

1. Note Page ID in Business Manager → `META_PAGE_ID`.
2. Enable Facebook Login for Business on app; create configuration with `pages_messaging`.
3. Create System User; assign to app.
4. Generate token with `pages_messaging` and Page selected.
5. Validate with `debug_token` (`is_valid: true`, `pages_messaging` in scopes).
6. Set on server and redeploy.

```env
META_PAGE_ID=YOUR_PAGE_ID
META_PAGE_ACCESS_TOKEN=<token from step 4>
```

## Security

- Never commit the token.
- If leaked: revoke in Business Manager and regenerate.

## Checklist

- [ ] `META_PAGE_ID` correct
- [ ] Token validated with `debug_token`
- [ ] Production variables set + redeploy
- [ ] Post-native-reply test passed

## Back to index

→ [Meta index](./)
