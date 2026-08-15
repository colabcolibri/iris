---
title: "Technical reference — Meta integration"
description: "Developer-oriented integration notes"
---

Documentation for **developers**. Step-by-step setup → [index](../configuracao/).

## BYOA (bring your own app)

Iris reads credentials from environment variables. Each deployment configures its own Meta app.

## OAuth and tokens

- Main flow: **Instagram Login** (`instagram_business_*`, `graph.instagram.com`).
- Long-lived token: `meta_tokens` table after admin OAuth.
- Page Token (`META_PAGE_ACCESS_TOKEN`): only `take_thread_control` on `graph.facebook.com`.

## Publishing (carousel)

1. `POST /{ig-user-id}/media` per image
2. Carousel container + `media_publish`

## Comments

- Webhook field: `comments`
- Reply: `POST /{comment-id}/replies`

## DMs — thread control

| Layer | Config | Code |
| ------ | ------ | ------ |
| Primary receiver | Facebook Page (guide 06) | Handover |
| `take_thread_control` | `META_PAGE_*` (guide 07) | `graph-api-message-sender.ts` |

## Links

- [Troubleshooting](./troubleshooting/)
- Repository `docs/07_api_contracts.md` — HTTP contracts
- Repository `docs/08_environments.md` — environment variables
