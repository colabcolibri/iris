---
title: API contracts
status: approved
version: 1.1
updated: 2026-08-09
depends_on: [05_architecture.md, 06_database.md, 02_security.md]
blocks: []
---

# 07 — API contracts

## Base URL

- Dev: `http://127.0.0.1:8792`
- Prod: `https://iris.<domain>` (TBD)

## Authentication

### UI (operador)

1. `POST /api/auth/request-code` com `{ "email": "..." }` — público
2. `POST /api/auth/confirm` com `{ "email": "...", "code": "123456" }` — define cookie `iris_session` (HttpOnly)
3. Chamadas `/api/*` da UI usam cookie (`credentials: include`) — sem header `Authorization`

### API (agente / scripts)

| Header | Value |
| ------ | ----- |
| `Authorization` | `Bearer <token>` |

| Token | Access |
| ----- | ------ |
| Admin (legacy) | All `/api/*` — emergência/CLI apenas |
| Agent | `posts`, `assets`, `comments` per scope |

### Auth routes

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/auth/request-code` | public | Envia OTP ao email allowlisted |
| POST | `/api/auth/confirm` | public | Valida OTP e emite cookie de sessão |
| POST | `/api/auth/logout` | public | Limpa cookie de sessão |

## Error envelope

```json
{ "error": "human-readable message" }
```

## Posts

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts` | admin, agent | List (query: `status`, `from`, `to`) |
| GET | `/api/posts/:id` | admin, agent | Post + asset metadata |
| POST | `/api/posts` | admin, agent | Create post |
| PATCH | `/api/posts/:id` | admin, agent | Update caption, schedule, status |
| DELETE | `/api/posts/:id` | admin | Cancel (`status=cancelled`) |

### POST /api/posts body

```json
{
  "caption": "string",
  "channel": "instagram",
  "scheduled_at": "2026-08-10T18:00:00.000Z",
  "source_note": "opcional — texto livre",
  "status": "draft"
}
```

## Assets (mídia)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/posts/:id/assets` | admin, agent | Multipart upload (`file`, `sort_order`) |
| GET | `/api/posts/:id/assets` | admin, agent | List assets metadata |
| GET | `/api/posts/:id/assets/:filename` | admin | Serve bytes (preview UI) |
| DELETE | `/api/posts/:id/assets/:assetId` | admin | Remove before publish |

### POST /api/posts/:id/assets

- `Content-Type: multipart/form-data`
- Field `file`: imagem PNG/JPG/WebP
- Field `sort_order`: integer (opcional)
- **Raw max:** `IRIS_UPLOAD_MAX_BYTES` (default 15 MB) — rejeita 413 acima disso
- **Server otimiza sempre:** resize (long edge ≤ 1080), JPEG quality 85, strip EXIF — ver `docs/architecture/image-optimization.md`
- **Armazena só JPEG otimizado** em `data/media/{post_id}/{sort_order}.jpg`
- Response inclui `width`, `height`, `original_size_bytes`, `optimized_size_bytes`

Regra: post só pode ir para `scheduled` se tiver ≥ 1 asset.

## Comments

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts/:id/comments` | admin, agent | Comments for post |
| POST | `/api/comments/:id/reply` | admin | Manual reply → Meta |

## Events (SSE)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/events` | admin | `posts-changed`, `comments-changed` |

## Webhooks

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/webhooks/meta` | verify token |
| POST | `/webhooks/meta` | HMAC |

## Health & static

| Method | Path |
| ------ | ---- |
| GET | `/health` |
| GET | `/`, `/app.js`, `/style.css` |

## Contrato local (agente, não é HTTP)

Pacote em `publications/{slug}/` — ver `docs/architecture/local-publications.md`. O agente traduz isso em chamadas HTTP acima. **Iris não lê a pasta local** — só recebe uploads.
