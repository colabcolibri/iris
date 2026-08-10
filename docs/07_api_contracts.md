---
title: API contracts
status: approved
version: 1.2
updated: 2026-08-10
depends_on: [05_architecture.md, 06_database.md, 02_security.md]
blocks: []
---

# 07 — API contracts

## Base URL

- Dev: `http://127.0.0.1:8792`
- Prod: `https://iris.<your-domain>`

## Authentication

### UI (operador)

1. `POST /api/auth/request-code` com `{ "email": "..." }` — público
2. `POST /api/auth/confirm` com `{ "email": "...", "code": "123456" }` — define cookie `iris_session` (HttpOnly)
3. `GET /api/auth/me` — retorna `{ "authenticated": true, "email": "..." }` com cookie válido; `401` sem sessão (bootstrap da UI)
4. Chamadas `/api/*` da UI usam cookie (`credentials: include`) — sem header `Authorization`

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
| GET | `/api/auth/me` | public (cookie) | Bootstrap de sessão para a UI; `200` com email ou `401` |
| POST | `/api/auth/logout` | public | Limpa cookie de sessão |

### MCP (clientes de IA — Cursor, ChatGPT, Claude, etc.)

#### MCP admin (interface)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/settings/mcp` | admin (sessão UI) | Status da conexão (`configured`, `code_hint`, `mcp_url`, `source`) |
| POST | `/api/settings/mcp` | admin | Gera ou rotaciona código — resposta inclui `connection_code` (exibido uma vez) |
| DELETE | `/api/settings/mcp` | admin | Revoga código gerado na interface |

O código pode vir da **interface** (hash no SQLite) ou de `IRIS_MCP_CONNECTION_CODE` no `.env` (ambos válidos em paralelo). Preferir a interface para operadores não técnicos.

Guia completo: `docs/architecture/mcp-integration.md`.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/mcp/validate` | public | Valida `{ "connectionCode": "..." }` — `200` `{ "valid": true, "server": "iris", "mcpPath": "/mcp" }` ou `401` |
| POST | `/mcp` | `Bearer <código MCP>` | Transport Streamable HTTP do protocolo MCP (tools editoriais) |

O código MCP é **distinto** de `IRIS_AGENT_TOKEN`. Gerar em **Configurações → Conexão MCP** (recomendado) ou via `IRIS_MCP_CONNECTION_CODE` no `.env`.

**Headers do transporte MCP:** clientes devem enviar `Accept: application/json, text/event-stream` em `POST /mcp`. Ausência pode resultar em `406`.

**Escopo:** equivalente ao token agent REST — posts, assets, comentários. Sem rotas admin-only nem tokens Meta.

#### MCP tools

| Tool | Equivalente REST | Descrição |
| ---- | ---------------- | --------- |
| `iris_list_posts` | `GET /api/posts` | Lista com filtros opcionais (`status`, `from`, `to`) |
| `iris_get_post` | `GET /api/posts/:id` | Post + metadados de assets |
| `iris_create_post` | `POST /api/posts` | Cria rascunho (`caption`, `channel`, `scheduledAt`) |
| `iris_update_post` | `PATCH /api/posts/:id` | Atualiza legenda, agenda ou status |
| `iris_upload_post_asset` | `POST /api/posts/:id/assets` | Upload de imagem via base64 |
| `iris_list_post_comments` | `GET /api/posts/:id/comments` | Comentários sincronizados |

#### POST /api/mcp/validate

```bash
curl -s -X POST http://127.0.0.1:8792/api/mcp/validate \
  -H 'Content-Type: application/json' \
  -d '{"connectionCode":"SEU_CODIGO"}'
```

Resposta `200`:

```json
{ "valid": true, "server": "iris", "mcpPath": "/mcp" }
```

Resposta `401`:

```json
{ "error": "invalid connection code" }
```

## Error envelope

```json
{ "error": "human-readable message" }
```

## Posts

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts` | admin, agent | List (query: `status`, `from`, `to`) |

### GET /api/posts — query params

| Param | Type | Description |
| ----- | ---- | ----------- |
| `status` | string | Optional filter: `draft`, `scheduled`, `published`, `cancelled`, `failed` |
| `from` | ISO 8601 UTC | Inclusive lower bound on display date |
| `to` | ISO 8601 UTC | Inclusive upper bound on display date |

**Display date rule:** posts are matched by `COALESCE(scheduled_at, created_at)` — drafts without `scheduled_at` use `created_at`. Results are ordered by that same coalesced datetime descending.

**Response fields (list):** each post includes `id`, `status`, `scheduled_at`, `published_at`, `created_at`, `caption`, `assets_count` (integer ≥ 0, from subquery — no per-post asset fetch).

**Examples:**

```bash
# Agent token
curl -H "Authorization: Bearer $IRIS_AGENT_TOKEN" \
  "http://127.0.0.1:8792/api/posts?from=2026-08-01T00:00:00.000Z&to=2026-08-31T23:59:59.999Z"

# UI session (cookie after OTP login)
curl -b "iris_session=..." \
  "http://127.0.0.1:8792/api/posts?from=2026-08-01T00:00:00.000Z&to=2026-08-31T23:59:59.999Z"
```

Invalid `from`/`to` values return `422` with `{ "error": "from must be a valid ISO 8601 date" }`.

| GET | `/api/posts/:id` | admin, agent | Post + asset metadata |
| POST | `/api/posts` | admin, agent | Create post |
| PATCH | `/api/posts/:id` | admin, agent | Update caption, schedule, status, `reply_mode` (`off` \| `auto` \| `draft`; `auto_reply_enabled` aceito como alias) |
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
| GET | `/api/posts/:id/comments` | admin, agent | Comments for post (`parent_ig_comment_id` nullable) |
| GET | `/api/posts/:id/reply-inspection` | admin | Post context + comment threads for supervision (`thread[].depth`) |
| GET | `/api/comments/:id/reply-context` | admin, agent | Full reply envelope: target comment, thread, post, images, persona |
| GET | `/api/comments/posts` | admin | Posts gerenciados (`published` + `monitored`) com contagens locais |
| POST | `/api/comments/monitored-posts` | admin | Registra post externo por `ig_media_id` ou permalink (valida na Graph) |
| POST | `/api/posts/:id/comments/sync` | admin | Sync comments from Meta for one post (`ig_media_id` required); upserts SQLite |
| GET | `/api/comments/inbox?days=30` | admin | **Legacy** — inbox sync; prefer per-post sync above |
| POST | `/api/comments/:id/reply` | admin | Manual reply → Meta |
| POST | `/api/comments/:id/approve-reply` | admin | Publica rascunho da IA (`draft_text`) na Meta; body `message` opcional para editar |

## Meta (Instagram connection)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/auth/meta` | admin session | Redirect to Meta OAuth dialog |
| GET | `/auth/meta/callback` | signed `state` | OAuth callback; stores Page token + IG account |
| GET | `/api/meta/status` | admin | Connection status (`connected`, `@handle`, expiry) |
| GET | `/api/meta/health` | admin | Probe Graph API (`ok` / error code) |
| POST | `/api/meta/disconnect` | admin | Remove stored Instagram token + connection |

## Meta test (app review)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/meta/test/insights?media_id=` | admin | Fetch Instagram media insights; default media = latest published/monitored post |
| GET | `/api/meta/test/conversations?limit=5` | admin | List Instagram conversations summary (`id`, `updated_time`); no message bodies |

Responses: `{ ok: true, ... }` or `{ ok: false, code, message }`. Codes: `not_connected`, `no_media`, `insights_failed`, `unsupported`, `conversations_failed`.

## Settings (reply persona)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/settings/reply-persona` | admin | Read global reply persona (defaults if unset) |
| PUT | `/api/settings/reply-persona` | admin | Update `system_prompt`, `tone`, `brand_name`, `max_chars` (100–1000) |
| GET | `/api/settings/llm` | admin | LLM provider status (`configured`, `api_url`, `model`, `key_hint`, `source`) |
| PUT | `/api/settings/llm` | admin | Set `api_key` (optional on rotate), `api_url`, `model`, `supports_vision` |
| GET | `/api/settings/webhook-events?limit=50` | admin | Recent Meta webhook payloads (truncated JSON) for audit |

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
| GET | `/` — admin UI (OTP session) |

## Contrato local (agente, não é HTTP)

Pacote em `publications/{slug}/` — ver `docs/architecture/local-publications.md`. O agente traduz isso em chamadas HTTP acima. **Iris não lê a pasta local** — só recebe uploads.
