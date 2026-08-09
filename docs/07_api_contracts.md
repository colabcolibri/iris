---
title: API contracts
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [05_architecture.md, 06_database.md, 02_security.md]
blocks: []
---

# 07 — API contracts

## Base URL

- Dev: `http://127.0.0.1:8792`
- Prod: `https://iris.<domain>` (TBD)

## Authentication

| Header | Value |
| ------ | ----- |
| `Authorization` | `Bearer <token>` |

| Token | Access |
| ----- | ------ |
| Admin | All `/api/*` |
| Agent | `/api/posts`, `/api/comments` (read/write per scope) |

## Error envelope

```json
{ "error": "human-readable message" }
```

## Posts

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts` | admin, agent | List posts (query: `status`, `from`, `to`) |
| GET | `/api/posts/:id` | admin, agent | Single post + assets |
| POST | `/api/posts` | admin, agent | Create post |
| PATCH | `/api/posts/:id` | admin, agent | Update caption, schedule, status |
| DELETE | `/api/posts/:id` | admin | Soft cancel (`status=cancelled`) |

### POST /api/posts body

```json
{
  "caption": "string",
  "scheduled_at": "2026-08-10T18:00:00.000Z",
  "deck_ref": "d-abc123",
  "media_urls": ["https://..."],
  "status": "draft"
}
```

## Comments

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts/:id/comments` | admin, agent | Comments for post |
| POST | `/api/comments/:id/reply` | admin | Manual reply (sends to Meta) |

## Events (SSE)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/events` | admin | `text/event-stream`; events: `posts-changed`, `comments-changed` |

## Webhooks

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/webhooks/meta` | verify token | Meta subscription challenge |
| POST | `/webhooks/meta` | HMAC | Comment notifications |

## Health

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/health` | none |

## Static UI

| Method | Path |
| ------ | ---- |
| GET | `/`, `/app.js`, `/style.css` |

## Casper integration contract

Agent Casper (ou operador) envia a Iris:

- `deck_ref`: id da pasta slide no workspace Casper
- `media_urls`: URLs públicas ou paths servidos por export Casper
- `caption`: de `copy_instagram.md` ou gerado

Sem endpoint Casper→Iris automático na v1; agente orquestra.
