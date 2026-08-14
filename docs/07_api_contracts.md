---
title: API contracts
status: approved
version: 1.4
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
| Insights | `/api/posts/:id/insights`, `/api/insights/account`, `/api/insights/refresh-all`, `/api/insights/refresh-media-page` |
| Comments | `/api/posts/:id/comments`, `/api/comments/*` |
| Meta | `/auth/meta`, `/api/meta/*` |
| Settings | `/api/settings/*` |
| Agent | `/api/agent-runs`, `/api/agent/simulate`, `/api/agent/simulator-scenarios` |
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

**Escopo MCP:** equivalente ao token agent — posts, assets, comentários, mensagens DM (leitura/contexto), insights, webhooks (leitura), catálogo de produtos, persona e conteúdo editorial do agente (comentários e DM). Sem LLM settings nem OAuth Meta.

### MCP tools (45)

| Tool | Equivalente REST | Descrição |
| ---- | ---------------- | --------- |
| `iris_list_posts` | `GET /api/posts` | Lista com `status`, `from`, `to` |
| `iris_get_post` | `GET /api/posts/:id` | Post + metadados de assets |
| `iris_create_post` | `POST /api/posts` | Cria rascunho |
| `iris_update_post` | `PATCH /api/posts/:id` | Atualiza legenda, `carousel_summary`, `reply_prompt`, flags `silence_*`, agenda ou status (**bloqueia** `status=cancelled` — use `iris_cancel_post`) |
| `iris_cancel_post` | `DELETE /api/posts/:id` | Soft-delete → `cancelled`. Exige `confirmPhrase: "cancelar"` após o usuário confirmar |
| `iris_purge_cancelled_post` | `DELETE /api/posts/:id/permanent` | Apaga do banco só se já estiver `cancelled`. Exige `confirmPhrase: "deletar"` após o usuário confirmar |
| `iris_list_post_assets` | `GET /api/posts/:id/assets` | Metadados + `url` assinada (`/publish/media/…`) |
| `iris_update_post_asset` | `PATCH /api/posts/:id/assets/:assetId` | Atualiza `altText` e/ou `userTags` (`[{username,x,y}]`) |
| `iris_prepare_post_asset_upload` | `POST /upload/assets/:sig/:postId` | Prepara URL assinada; host faz `curl -F file=@…` (sem base64) |
| `iris_delete_post_asset` | `DELETE /api/posts/:id/assets/:assetId` | Remove asset (row + arquivo) |
| `iris_generate_post_carousel_summary` | `POST /api/posts/:id/generate-carousel-summary` | Vision no server → grava `carousel_summary` |
| `iris_list_post_comments` | `GET /api/posts/:id/comments` | Comentários sincronizados |
| `iris_list_conversations` | `GET /api/conversations` | Conversas DM recentes |
| `iris_list_conversation_messages` | `GET /api/conversations/:id/messages` | Mensagens da conversa |
| `iris_get_message_reply_context` | `GET /api/messages/:id/reply-context` | Envelope completo para resposta DM |
| `iris_get_reply_context` | `GET /api/comments/:id/reply-context` | Envelope completo para resposta |
| `iris_get_post_insights` | `GET /api/posts/:id/insights` | Insights com cache 1h (`force`/`refresh`) |
| `iris_get_post_insights_history` | `GET /api/posts/:id/insights/history` | Snapshots persistidos |
| `iris_get_account_insights` | `GET /api/insights/account` | Insights da conta IG (`period`, `since`, `until`, `metrics`) — live, sem snapshot |
| `iris_refresh_all_post_insights` | `POST /api/insights/refresh-all` | Refresh em lote 1:1 (`limit`, `delay_ms`, `force`, `since`, `until`) |
| `iris_refresh_media_insights_page` | `POST /api/insights/refresh-media-page` | Uma página `/me/media` + field expansion (~1 call Meta) |
| `iris_list_webhooks` | `GET /api/settings/webhook-events` | Eventos Meta recentes |
| `iris_get_reply_persona` | `GET /api/settings/reply-persona` | Persona de resposta (`brand_name`, `signature_instruction`, `response_language`, `max_chars`) |
| `iris_update_reply_persona` | `PUT /api/settings/reply-persona` | Atualiza persona (campos parciais aceitos) |
| `iris_get_agent_content` | `GET /api/settings/agent-content` | Blocos Markdown do agente |
| `iris_update_agent_content` | `PUT /api/settings/agent-content` | Atualiza blocos (quatro campos obrigatórios) |
| `iris_get_app_settings` | `GET /api/settings/app` | Config operacional (timezone, reply, auto-monitor) |
| `iris_update_app_settings` | `PUT /api/settings/app` | Atualização parcial com mesmas validações REST |
| `iris_list_simulator_scenarios` | `GET /api/agent/simulator-scenarios` | Lista cenários persistidos (resumo — sem thread completa) |
| `iris_create_simulator_scenario` | `POST /api/agent/simulator-scenarios` | Cria cenário com mesmas validações REST admin |
| `iris_simulate_reply` | `POST /api/agent/simulate` | Harness sandbox comentários ou DM (`channel=dm`) — não publica na Meta |
| `iris_get_message_agent_content` | `GET /api/settings/message-agent-content` | Blocos DM |
| `iris_update_message_agent_content` | `PUT /api/settings/message-agent-content` | Atualiza blocos DM |
| `iris_list_products` | `GET /api/products` | Catálogo de produtos (`active_only` opcional) |
| `iris_get_product` | — | Produto por id (MCP usa repositório direto; REST expõe só listagem) |
| `iris_create_product` | `POST /api/products` | Cria produto (`slug`, `name`, …) |
| `iris_update_product` | `PATCH /api/products/:id` | Atualiza produto (campos parciais) |
| `iris_delete_product` | `DELETE /api/products/:id` | Remove produto |
| `iris_list_store_connections` | `GET /api/store-connections` | Lista conexões (sem secrets) |
| `iris_create_store_connection` | `POST /api/store-connections` | Cria conexão Yampi (`label`, `user_token`, `user_secret_key`; `alias` opcional — resolvido via `auth/me`) |
| `iris_delete_store_connection` | `DELETE /api/store-connections/:id` | Remove conexão |
| `iris_test_store_connection` | `POST /api/store-connections/:id/test` | Testa credenciais |
| `iris_sync_store_catalog` | `POST /api/store-connections/:id/sync` | Sync catálogo (`import_new` opcional) |
| `iris_get_product_field_policies` | `GET /api/products/:id/field-policies` | Políticas + preview (`store_connection_id`) |
| `iris_update_product_field_policies` | `PATCH /api/products/:id/field-policies` | Overrides por produto (`source: inherit` remove override) |

### MCP post tools — `iris_get_post` / `iris_update_post`

Paridade com REST (`PATCH /api/posts/:id`), com convenção de naming do client MCP:

| Direção | Convenção | Campos |
| ------- | --------- | ------ |
| Resposta (`iris_get_post`, `iris_list_posts`, retorno de update) | snake_case via `serializePost` | `reply_prompt` (string\|null), `silence_soul`, `silence_page`, `silence_knowledge`, `silence_restrictions` (boolean) |
| Argumentos (`iris_update_post`) | camelCase (mesmo padrão de `carouselSummary`) | `replyPrompt` (string\|null, máx. 32 000), `silenceSoul`, `silencePage`, `silenceKnowledge`, `silenceRestrictions` (boolean opcionais) |

Validação e persistência delegadas a `normalizeUpdatePost` — mesmas regras que REST. Silenciar `silenceRestrictions` não desliga guardrails hardcoded do harness de resposta.

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
| PATCH | `/api/posts/:id` | admin, agent | Atualiza (`auto_reply_enabled` exige admin). Campos opcionais: `reply_prompt` (string\|null, máx. 32 000), `silence_soul`, `silence_page`, `silence_knowledge`, `silence_restrictions` (boolean) |
| DELETE | `/api/posts/:id` | admin | Cancela (`status=cancelled`) — soft-delete |
| DELETE | `/api/posts/:id/permanent` | admin | Apaga do banco só se já estiver `cancelled` (mídias + comentários vinculados; `agent_runs` preservados) |
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
| GET | `/api/posts/:id/insights` | admin | Insights do post (`force=1` ou `refresh=1` ignora cache). Métricas de mídia são lifetime — `since`/`until` na query são ignorados (no-op documentado). |
| GET | `/api/posts/:id/insights/history` | admin | Snapshots (`limit`, default 30, máx. 200) |
| GET | `/api/insights/account` | admin + Meta | Insights da **conta** IG (`period`, `since`, `until` unix ou ISO, `metrics` CSV). Live — sem persistência. |
| POST | `/api/insights/refresh-all` | admin + Meta | Atualiza insights 1:1 em lote (`limit`, `delay_ms`, `force`, `since`, `until` ISO filtrando `published_at`) |
| POST | `/api/insights/refresh-media-page` | admin + Meta | Uma página de mídia com `insights.metric(...)` (~1 call). Body: `limit`, `after`, `since`, `until`, `force`. Só atualiza posts já `published`/`monitored` (não cria posts). |

Cache padrão por post: 1 hora (`from_cache` na resposta). Requer Meta conectada.

**Custo Meta:** refresh-all = N calls; refresh-media-page ≈ 1 call por página; account = 1 call.

Resposta de post inclui `ig_media_status` (`on_feed` \| `archived` \| `unavailable`), `ig_media_status_detail` e `ig_media_status_checked_at` quando a Iris já verificou a mídia na Meta. Posts arquivados no IG costumam falhar no GET da mídia, mas ainda podem expor comentários — a Iris distingue isso de publicação excluída ou sem permissão.

### GET /api/insights/account — query

| Param | Type | Description |
| ----- | ---- | ----------- |
| `period` | string | Default `day`. Valores Meta: `day`, `week`, `days_28`, … |
| `since` | ISO ou unix | Início do intervalo (conta) |
| `until` | ISO ou unix | Fim do intervalo (conta) |
| `metrics` | CSV | Opcional; default documentado no server (`reach`, `follower_count`, `profile_views`, `website_clicks`) |

### POST /api/insights/refresh-media-page — body

```json
{
  "limit": 25,
  "after": "cursor-opcional",
  "since": "2026-08-01T00:00:00.000Z",
  "until": "2026-08-31T23:59:59.999Z",
  "force": true
}
```

Resposta: `refreshed[]`, `unmatched_ig_media_ids[]`, `next_cursor`, `meta_call_count` (1), `items_scanned`.

### POST /api/insights/refresh-all — body (extensão)

Além de `limit`, `delay_ms`, `force`: `since` / `until` (ISO) filtram posts gerenciados por `published_at`.

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

## Conversations e messages (DM)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/conversations` | admin | Lista conversas recentes (`limit`; inclui `pending_count`, `can_reply`) |
| GET | `/api/conversations/:id/messages` | admin | Thread + metadados da conversa |
| POST | `/api/conversations/:id/sync` | admin + Meta | Importa mensagens da Graph API |
| PATCH | `/api/conversations/:id` | admin | `reply_mode`, `reply_prompt` |
| GET | `/api/conversations/activity` | admin | Fila transversal (`kind=pending_approval` \| `recent`) |
| GET | `/api/messages/:id/reply-context` | admin, agent | Contexto completo para resposta DM |
| GET | `/api/messages/:id/reply-audit` | admin | Trilha do message-harness |
| POST | `/api/messages/:id/ai-reply` | admin | Dispara harness (`mode`: `auto` \| `draft`) |
| PATCH | `/api/messages/:id/draft` | admin | Salva rascunho |
| DELETE | `/api/messages/:id/draft` | admin | Remove rascunho |
| POST | `/api/messages/:id/approve-reply` | admin | Envia rascunho na Meta (exige `can_reply`) |
| POST | `/api/messages/:id/reply` | admin | Resposta manual imediata |

## Products

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/products` | admin | Lista (`active=1` opcional) |
| POST | `/api/products` | admin | Cria produto |
| PATCH | `/api/products/:id` | admin | Atualiza |
| DELETE | `/api/products/:id` | admin | Remove |
| GET | `/api/products/:id/store-links` | admin | Vínculos com lojas + snapshot |
| POST | `/api/products/:id/store-links` | admin | Vincula (`store_connection_id`, `external_product_id`) |
| DELETE | `/api/products/:id/store-links/:linkId` | admin | Remove vínculo |
| GET | `/api/products/:id/field-policies` | admin | Políticas + preview resolvido (`?store_connection_id=`) |
| PATCH | `/api/products/:id/field-policies` | admin | Overrides por produto (`store_connection_id`, `policies`) |

## Store connections (v1.19)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/store-connections` | admin | Lista conexões (sem secrets; inclui `yampi_alias`) |
| POST | `/api/store-connections/yampi/discover` | admin | Lista lojas da conta via `auth/me` (`user_token`, `user_secret_key`) |
| POST | `/api/store-connections` | admin | Cria conexão Yampi — valida alias contra `auth/me` + probe catálogo (`alias` opcional se conta tiver 1 loja) |
| GET | `/api/store-connections/:id` | admin | Detalhe |
| PATCH | `/api/store-connections/:id` | admin | Atualiza label/settings/credenciais |
| DELETE | `/api/store-connections/:id` | admin | Remove |
| POST | `/api/store-connections/:id/test` | admin | Testa credenciais na Yampi |
| POST | `/api/store-connections/:id/sync` | admin | Sync catálogo (`?import_new=true` opcional) |
| GET | `/api/store-connections/:id/field-policies` | admin | Políticas globais de campo |
| PATCH | `/api/store-connections/:id/field-policies` | admin | Atualiza políticas globais (mapa parcial por `field_key`) |

## Meta (Instagram)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/auth/meta` | admin session | Redirect OAuth Meta |
| GET | `/auth/meta/callback` | signed `state` | Callback OAuth |
| GET | `/api/meta/status` | admin | Status da conexão (`messaging_supported` quando Page vinculada) |
| GET | `/api/meta/health` | admin | Probe Graph API |
| GET | `/api/meta/media/browse` | admin | Lista mídia IG (`limit`, `after`) |
| POST | `/api/meta/disconnect` | admin | Remove token + conexão |

## Agent (harness / auditoria)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/agent-runs` | admin | Lista runs (`limit`, `cursor`, `terminal_status`, `reply_tier`); inclui `llm_call_count`, `tool_call_count`, `session_summary` |
| GET | `/api/agent-runs/:id` | admin | Detalhe + audit steps com `step_kind`, `tool_name`, `tool_input`/`tool_output`, `session_summary` |
| GET | `/api/agent/simulator-scenarios` | admin | Lista cenários editoriais persistidos |
| POST | `/api/agent/simulator-scenarios` | admin | Cria cenário (`id`, `label`, `description`, `caption`, `carousel_summary`, `thread[]`, `target_author`, `target_text`) |
| PUT | `/api/agent/simulator-scenarios/:id` | admin | Atualiza cenário (campos parciais permitidos) |
| DELETE | `/api/agent/simulator-scenarios/:id` | admin | Remove cenário |
| POST | `/api/agent/simulate` | admin | Simula resposta comentário ou DM (`channel=comment` \| `dm`). Sandbox — não publica na Meta. |

## Settings

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/settings/reply-persona` | admin | Persona (`brand_name`, `signature_instruction`, `response_language`, `max_chars`) |
| PUT | `/api/settings/reply-persona` | admin | Atualiza persona |
| GET | `/api/settings/agent-content` | admin | Blocos Markdown (`soul`, `page`, `knowledge`, `restrictions`) |
| PUT | `/api/settings/agent-content` | admin | Atualiza blocos |
| GET | `/api/settings/message-agent-content` | admin | Blocos DM (`dm_soul`, `dm_page`, `dm_knowledge`, `dm_restrictions`) |
| PUT | `/api/settings/message-agent-content` | admin | Atualiza blocos DM |
| GET | `/api/settings/app` | admin | App (`timezone`, `reply_mode`, `message_reply_mode`, delays, auto-monitor) |
| PUT | `/api/settings/app` | admin | Atualiza app settings (parcial; mesmas validações) |
| GET | `/api/settings/llm` | admin | Status LLM (`configured`, `model`, `key_hint`, …) |
| PUT | `/api/settings/llm` | admin | Configura LLM |
| GET | `/api/settings/webhook-events` | admin | Eventos webhook (`limit`, `status`, `field`, `signature_valid`) |
| GET | `/api/settings/webhook-events/export` | admin | Export JSON (`limit` obrigatório, máx. 10000) |
| GET/POST/DELETE | `/api/settings/mcp` | admin | Conexão MCP (ver seção MCP) |

**Assinatura nas respostas:** corpo + linha com `.` + assinatura (`\n.\n`) — ver `signature_instruction` na persona.

## Events (SSE)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/events` | admin | `posts-changed`, `comments-changed`, `messages-changed` (SSE) |

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
