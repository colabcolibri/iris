---
title: API contracts
status: approved
version: 1.3
updated: 2026-08-11
depends_on: [05_architecture.md, 06_database.md, 02_security.md]
blocks: []
---

# 07 — API contracts

Inventário alinhado ao código em `iris-app/server/src/api/` (router declarativo + `http-server.ts`). **Produção** expõe as mesmas rotas após deploy do commit em `main` (Railway).

## Base URL

- Dev: `http://127.0.0.1:8792`
- Prod: `https://iris.sergioluciano.com` (ou domínio configurado)

## Índice rápido de rotas

| Grupo | Prefixo / paths |
| ----- | ---------------- |
| Auth | `/api/auth/*` |
| MCP | `/api/mcp/validate`, `/mcp`, `/api/settings/mcp` |
| Posts | `/api/posts`, `/api/posts/:id`, publish, carousel-summary |
| Assets | `/api/posts/:id/assets` |
| Insights | `/api/posts/:id/insights`, `/api/insights/refresh-all` |
| Comments | `/api/posts/:id/comments`, `/api/comments/*` |
| Meta | `/auth/meta`, `/api/meta/*` |
| Settings | `/api/settings/*` |
| Agent | `/api/agent-runs`, `/api/agent/simulate` |
| Events | `/api/events` (SSE) |
| Webhooks Meta | `/webhooks/meta` |
| Publish (IG) | `/publish/media/*` (URL assinada, sem Bearer) |
| Health | `/health` |

## Authentication

### UI (operador)

1. `POST /api/auth/request-code` com `{ "email": "..." }` — público (rate limit por IP)
2. `POST /api/auth/confirm` com `{ "email": "...", "code": "123456" }` — define cookie `iris_session` (HttpOnly)
3. `GET /api/auth/me` — `{ "authenticated": true, "email": "..." }` ou `401`
4. Chamadas `/api/*` da UI usam cookie (`credentials: include`)

### API (agente / scripts)

| Header | Value |
| ------ | ----- |
| `Authorization` | `Bearer <token>` |

| Token | Access |
| ----- | ------ |
| Admin (legacy) | Todas as rotas `/api/*` |
| Agent | Posts, assets, comentários (leitura + escrita editorial), `reply-context` |

Rotas **admin-only** rejeitam token agent com `403`.

### Auth routes

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/auth/request-code` | public | Envia OTP ao email allowlisted |
| POST | `/api/auth/confirm` | public | Valida OTP e emite cookie de sessão |
| GET | `/api/auth/me` | public (cookie) | Bootstrap de sessão para a UI |
| POST | `/api/auth/logout` | public | Limpa cookie de sessão |

## MCP (clientes de IA)

### MCP admin (interface)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/settings/mcp` | admin | Status (`configured`, `code_hint`, `mcp_url`, `source`) |
| POST | `/api/settings/mcp` | admin | Gera ou rotaciona código (`connection_code` uma vez) |
| DELETE | `/api/settings/mcp` | admin | Revoga código da interface |

Código via interface (SQLite) ou `IRIS_MCP_CONNECTION_CODE` no `.env`. Guia: `docs/architecture/mcp-integration.md`.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/mcp/validate` | public | `{ "connectionCode": "..." }` → `200` ou `401` |
| POST | `/mcp` | `Bearer <código MCP>` | Transport Streamable HTTP (tools editoriais) |

**Headers:** `Accept: application/json, text/event-stream` em `POST /mcp`.

**Escopo MCP:** equivalente ao token agent — posts, assets, comentários, insights, webhooks (leitura). Sem settings admin nem OAuth Meta.

### MCP tools (11)

| Tool | Equivalente REST | Descrição |
| ---- | ---------------- | --------- |
| `iris_list_posts` | `GET /api/posts` | Lista com `status`, `from`, `to` |
| `iris_get_post` | `GET /api/posts/:id` | Post + metadados de assets |
| `iris_create_post` | `POST /api/posts` | Cria rascunho |
| `iris_update_post` | `PATCH /api/posts/:id` | Atualiza legenda, agenda ou status |
| `iris_prepare_post_asset_upload` | `POST /upload/assets/:sig/:postId` | Prepara URL assinada; host faz `curl -F file=@…` (sem base64) |
| `iris_list_post_comments` | `GET /api/posts/:id/comments` | Comentários sincronizados |
| `iris_get_reply_context` | `GET /api/comments/:id/reply-context` | Envelope completo para resposta |
| `iris_get_post_insights` | `GET /api/posts/:id/insights` | Insights com cache 1h (`force`/`refresh`) |
| `iris_get_post_insights_history` | `GET /api/posts/:id/insights/history` | Snapshots persistidos |
| `iris_refresh_all_post_insights` | `POST /api/insights/refresh-all` | Refresh em lote (throttle) |
| `iris_list_webhooks` | `GET /api/settings/webhook-events` | Eventos Meta recentes |

## Error envelope

```json
{ "error": "human-readable message" }
```

Erros de domínio Meta podem incluir `code` (ex.: `meta_not_connected`).

## Posts

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts` | admin, agent | Lista (`status`, `from`, `to`, `calendar_only=1`) |
| POST | `/api/posts` | admin, agent | Cria post |
| GET | `/api/posts/:id` | admin, agent | Detalhe |
| PATCH | `/api/posts/:id` | admin, agent | Atualiza (`auto_reply_enabled` exige admin) |
| DELETE | `/api/posts/:id` | admin | Cancela (`status=cancelled`) |
| POST | `/api/posts/:id/publish` | admin, agent | Publica agora (bypass agenda) |
| POST | `/api/posts/:id/generate-carousel-summary` | admin | Gera resumo de carrossel via LLM |

### GET /api/posts — query params

| Param | Type | Description |
| ----- | ---- | ----------- |
| `status` | string | `draft`, `scheduled`, `published`, `cancelled`, `failed`, `monitored` |
| `from` | ISO 8601 UTC | Limite inferior (data de exibição) |
| `to` | ISO 8601 UTC | Limite superior |
| `calendar_only` | `1` | Só posts com `scheduled_at` no intervalo |

Data de exibição: `COALESCE(scheduled_at, created_at)`.

### POST /api/posts body

```json
{
  "caption": "string",
  "channel": "instagram",
  "scheduled_at": "2026-08-10T18:00:00.000Z",
  "source_note": "opcional",
  "status": "draft"
}
```

## Assets (mídia)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts/:id/assets` | admin, agent | Lista metadados |
| POST | `/api/posts/:id/assets` | admin, agent | Multipart (`file`, `sort_order`) |
| PUT | `/api/posts/:id/assets/reorder` | admin, agent | Reordena (`asset_ids[]`) |
| GET | `/api/posts/:id/assets/:filename` | admin | Bytes da imagem (preview UI) |
| DELETE | `/api/posts/:id/assets/:assetId` | admin | Remove asset |
| POST | `/upload/assets/:sig/:postId` | URL assinada (query `exp`, `sort`, `fn`, `jti`) | Multipart one-shot para MCP — sem Bearer |

Post só vai para `scheduled` com ≥ 1 asset. Otimização JPEG server-side — ver `docs/architecture/image-optimization.md`.

**MCP upload (sem base64):** a tool `iris_prepare_post_asset_upload` devolve `upload_url` + `curl_command`. O host substitui `LOCAL_IMAGE_PATH` e faz `POST` multipart; a URL é single-use (~5 min), assinada com `IRIS_PUBLISH_URL_SECRET`. Requer `IRIS_PUBLIC_BASE_URL`.

## Insights

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts/:id/insights` | admin | Insights do post (`force=1` ou `refresh=1` ignora cache) |
| GET | `/api/posts/:id/insights/history` | admin | Snapshots (`limit`, default 30, máx. 200) |
| POST | `/api/insights/refresh-all` | admin | Atualiza insights em lote (`limit`, `delay_ms`, `force`) |

Cache padrão: 1 hora (`from_cache` na resposta). Requer Meta conectada.

Resposta inclui `ig_media_status` (`on_feed` \| `archived` \| `unavailable`), `ig_media_status_detail` e `ig_media_status_checked_at` quando a Iris já verificou a mídia na Meta. Posts arquivados no IG costumam falhar no GET da mídia, mas ainda podem expor comentários — a Iris distingue isso de publicação excluída ou sem permissão.

## Comments

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/posts/:id/comments` | admin, agent | Comentários do post |
| GET | `/api/posts/:id/reply-inspection` | admin | Supervisão de threads |
| GET | `/api/posts/:id/comments/reconcile-preview` | admin + Meta | Sincroniza comentários com a Meta, marca removidos e retorna preview de vínculos |
| POST | `/api/posts/:id/comments/reconcile` | admin + Meta | Sincroniza, marca removidos e vincula respostas da marca já existentes no IG |
| POST | `/api/posts/:id/comments/sync` | admin | Sync Graph API → SQLite |
| GET | `/api/comments/posts` | admin | Posts gerenciados + contagens (`ig_media_status`, `ig_media_status_detail`, `ig_media_status_checked_at`) |
| GET | `/api/comments/activity` | admin | Filas transversais (`kind=pending_approval` \| `recent_public` \| `recent_iris`, `limit` default 20, máx. 50) |
| GET | `/api/comments/inbox` | admin | Inbox Meta/local (`days`, `source`, `scope`, `ig_media_id`, `post_id`) |
| POST | `/api/comments/monitored-posts` | admin | Importa post externo (`ig_media_id` / permalink) |
| POST | `/api/comments/monitored-posts/batch` | admin | Import em lote (`ig_media_ids[]`) |
| GET | `/api/comments/:id/reply-context` | admin, agent | Contexto completo para resposta |
| GET | `/api/comments/:id/reply-audit` | admin | Trilha do harness (agent run + steps) |
| POST | `/api/comments/:id/ai-reply` | admin | Dispara resposta IA (`mode`: `auto` \| `draft`) |
| PATCH | `/api/comments/:id/draft` | admin | Salva rascunho manual (`message`) |
| DELETE | `/api/comments/:id/draft` | admin | Remove rascunho |
| POST | `/api/comments/:id/approve-reply` | admin | Publica rascunho na Meta |
| POST | `/api/comments/:id/reply` | admin | Resposta manual imediata na Meta |

Comentários IG são upsert por `ig_comment_id` (único). Rascunhos (`comment_replies`) têm no máximo 1 draft por comentário.

## Meta (Instagram)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/auth/meta` | admin session | Redirect OAuth Meta |
| GET | `/auth/meta/callback` | signed `state` | Callback OAuth |
| GET | `/api/meta/status` | admin | Status da conexão |
| GET | `/api/meta/health` | admin | Probe Graph API |
| GET | `/api/meta/media/browse` | admin | Lista mídia IG (`limit`, `after`) |
| POST | `/api/meta/disconnect` | admin | Remove token + conexão |

## Agent (harness / auditoria)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/agent-runs` | admin | Lista runs (`limit`, `cursor`, `terminal_status`, `reply_tier`) |
| GET | `/api/agent-runs/:id` | admin | Detalhe + audit steps |
| POST | `/api/agent/simulate` | admin | Simula resposta (sandbox, sem publicar) |

## Settings

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/settings/reply-persona` | admin | Persona (`brand_name`, `signature_instruction`, `response_language`, `max_chars`) |
| PUT | `/api/settings/reply-persona` | admin | Atualiza persona |
| GET | `/api/settings/agent-content` | admin | Blocos Markdown (`soul`, `page`, `knowledge`, `restrictions`) |
| PUT | `/api/settings/agent-content` | admin | Atualiza blocos |
| GET | `/api/settings/app` | admin | App (`timezone`, `reply_mode`, `reply_delay_seconds`) |
| PUT | `/api/settings/app` | admin | Atualiza app settings |
| GET | `/api/settings/llm` | admin | Status LLM (`configured`, `model`, `key_hint`, …) |
| PUT | `/api/settings/llm` | admin | Configura LLM |
| GET | `/api/settings/webhook-events` | admin | Eventos webhook (`limit`, `status`, `field`, `signature_valid`) |
| GET | `/api/settings/webhook-events/export` | admin | Export JSON (`limit` obrigatório, máx. 10000) |
| GET/POST/DELETE | `/api/settings/mcp` | admin | Conexão MCP (ver seção MCP) |

**Assinatura nas respostas:** corpo + linha com `.` + assinatura (`\n.\n`) — ver `signature_instruction` na persona.

## Events (SSE)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/events` | admin | `posts-changed`, `comments-changed` (SSE) |

## Webhooks (Meta)

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/webhooks/meta` | `hub.verify_token` |
| POST | `/webhooks/meta` | HMAC `X-Hub-Signature-256` |

POST faz upsert de comentários por `ig_comment_id` quando o post está gerenciado.

## Publish media (Instagram fetch)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/publish/media/:postId/:filename` | URL assinada (`exp`, `sig`) | Meta baixa mídia na publicação |

Sem Bearer — HMAC em query string.

## Health & static

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | `{ "ok": true }` |
| GET | `/`, `/login`, … | Admin UI (React); rotas protegidas exigem sessão OTP |

## Contrato local (agente, não é HTTP)

Pacote em `publications/{slug}/` — ver `docs/architecture/local-publications.md`. O agente traduz em chamadas HTTP acima. **Iris não lê a pasta local** — só recebe uploads.

## Rotas removidas / não implementadas

- `GET /api/meta/test/insights` e `GET /api/meta/test/conversations` — **não existem** no código atual; usar `/api/meta/media/browse` e `/api/posts/:id/insights`.
