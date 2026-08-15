---
title: "Troubleshooting — Meta / Instagram"
description: "Symptoms, causes, and fixes"
---

Symptom → likely cause → **which guide to redo**.

## OAuth / connection

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| Redirect URI mismatch | URL not registered | [02](./02-criar-app-meta/) step 4 |
| App not available | Not a tester (Development) | [02](./02-criar-app-meta/) step 6 or [08](./08-app-review/) |
| Connected but no insights/messages | Old token without scopes | [05](./05-conectar-instagram-admin/) → Switch account |
| Wrong `META_INSTAGRAM_APP_ID` | Used Basic App ID | [02](./02-criar-app-meta/) step 3 |

## Webhooks

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| Verification fails | `META_WEBHOOK_VERIFY_TOKEN` mismatch | [03](./03-variaveis-de-ambiente/) + [04](./04-webhooks/) |
| Comment missing | `comments` not subscribed | [04](./04-webhooks/) step 4 |
| DM missing | `messages` not subscribed | [04](./04-webhooks/) step 4 |

## DMs

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| `not the thread owner` | Not primary receiver | [06](./06-mensagens-receptor-primario/) |
| `#210` page token required | Wrong `META_PAGE_ACCESS_TOKEN` | [07](./07-page-access-token/) |

## Quick Page token check

```bash
curl -s "https://graph.facebook.com/debug_token?input_token=TOKEN&access_token=APP_ID|APP_SECRET" \
  | jq '.data | {type, is_valid, scopes}'
```

## Back to full path

→ [Meta index](./)
