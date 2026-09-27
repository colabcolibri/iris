---
title: Database
status: review
version: 1.2
updated: 2026-09-27
depends_on: [05_architecture.md]
blocks: [07_api_contracts.md]
---

# 06 — Database

## Engine

SQLite (`node:sqlite`). Path: `IRIS_DB_PATH` (default `./data/iris.db`). Migrations em `migrations/`.

Com Turso (v1.31), o schema editorial abaixo vive **um banco por conta**. Nenhuma tabela editorial ganha `tenant_id`. O banco de controle é outro arquivo (ou outro banco Turso) e não mistura posts. Sem variáveis Turso, o arquivo único continua sendo o schema editorial inteiro. Detalhe: `docs/architecture/tenant-sqlite.md`.

## Tables (v1)

### `posts`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | UUID |
| status | TEXT | `draft`, `scheduled`, `published`, `cancelled`, `failed` |
| channel | TEXT | `instagram` (v1); extensível |
| caption | TEXT | Legenda |
| collaborators | TEXT | JSON array de até 3 usernames IG (collab no publish); null se vazio |
| scheduled_at | TEXT ISO | Nullable |
| published_at | TEXT ISO | Nullable |
| ig_media_id | TEXT | Após publish Meta |
| source_note | TEXT | Opcional — texto livre (rastreio humano) |
| error_message | TEXT | Último erro Meta |
| auto_reply_enabled | INTEGER | 0/1 |
| reply_mode | TEXT | `inherit`, `off`, `auto`, `draft` |
| agent_active_days | INTEGER | Nullable — dias após `published_at` em que o agente responde; null = sem limite |
| private_reply_mode | TEXT | `inherit`, `off`, `auto`, `draft` — DM via Meta private reply após comentário |
| reply_prompt | TEXT | Briefing de reply por post (nullable) |
| silence_soul | INTEGER | 0/1 — omite SOUL no harness deste post |
| silence_page | INTEGER | 0/1 — omite page no harness deste post |
| silence_knowledge | INTEGER | 0/1 — omite knowledge no harness deste post |
| silence_restrictions | INTEGER | 0/1 — omite restrições editoriais globais (guardrails hardcoded permanecem) |
| created_at | TEXT | |
| updated_at | TEXT | |

Sem `deck_ref`. Sem `media_urls` JSON — mídia em `post_assets` + disco.

### `post_assets`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| post_id | TEXT FK | |
| sort_order | INTEGER | Ordem carrossel |
| storage_path | TEXT | Relativo a `data/media/` ex. `{post_id}/01.jpg` |
| original_filename | TEXT | Nome no upload |
| mime | TEXT | `image/jpeg` após otimização |
| width | INTEGER | px após resize |
| height | INTEGER | px após resize |
| original_size_bytes | INTEGER | Upload bruto |
| optimized_size_bytes | INTEGER | Em disco |
| alt_text | TEXT | Texto alternativo (a11y) enviado à Meta no publish |
| user_tags | TEXT | JSON `[{username,x,y}]` — tags na imagem (≠ collaborators) |
| created_at | TEXT | |

### `comments`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| ig_comment_id | TEXT UNIQUE | |
| post_id | TEXT FK | |
| author_username | TEXT | |
| text | TEXT | |
| status | TEXT | `pending`, `replied`, `skipped`, `failed` |
| agent_reply_not_before | TEXT ISO | Nullable — fila durável; elegível quando `<= now` ou `NULL` |
| created_at | TEXT | |

### `comment_replies`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| comment_id | TEXT FK | |
| draft_text | TEXT | |
| sent_text | TEXT | |
| status | TEXT | `draft`, `sent`, `failed` |
| channel | TEXT | `public` (thread) ou `private` (DM via Meta private reply) |
| published_ig_message_id | TEXT | Nullable — ID Meta da DM quando `channel=private` |
| agent_run_id | TEXT FK | |

### `conversations`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| ig_conversation_id | TEXT UNIQUE | ID Meta ou `ig:{participant_ig_user_id}` até sync |
| participant_ig_user_id | TEXT UNIQUE | IGSID do contato |
| participant_username | TEXT | Nullable |
| last_message_at | TEXT ISO | Nullable |
| reply_mode | TEXT | `inherit`, `off`, `auto`, `draft` |
| reply_prompt | TEXT | Briefing opcional por conversa |
| created_at | TEXT | |
| updated_at | TEXT | |

### `messages`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| ig_message_id | TEXT UNIQUE | |
| conversation_id | TEXT FK | → `conversations` |
| direction | TEXT | `inbound`, `outbound` |
| text | TEXT | |
| ig_timestamp | TEXT ISO | Nullable |
| status | TEXT | `pending`, `replied`, `skipped`, `failed` |
| error_message | TEXT | Nullable |
| agent_reply_not_before | TEXT ISO | Fila DM — paridade com `comments` |
| created_at | TEXT | |

### `message_replies`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| message_id | TEXT FK | → `messages` |
| draft_text | TEXT | |
| sent_text | TEXT | |
| status | TEXT | `draft`, `sent`, `failed` |
| agent_run_id | TEXT FK | Nullable |
| source_ig_message_id | TEXT | ID da mensagem publicada na Meta |
| created_at | TEXT | |

### `products`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| slug | TEXT UNIQUE | kebab-case — usado na triagem `product_inquiry` |
| name | TEXT | |
| short_description | TEXT | Resumo para prompt |
| long_description | TEXT | Markdown |
| active | INTEGER | 1 = ativo |
| sort_order | INTEGER | Ordem na UI e no harness |
| created_at | TEXT | |
| updated_at | TEXT | |

### `store_connections` (v1.19)

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| provider_type | TEXT | `yampi`, `shopify`, `woocommerce` |
| label | TEXT | Nome na UI |
| status | TEXT | `active`, `error`, `disconnected` |
| settings_json | TEXT | Defaults de política / flags |
| encrypted_credentials | TEXT | Blob AES-256-GCM (User Token Yampi, etc.) |
| last_sync_at | TEXT | ISO |
| last_error | TEXT | Último erro test/sync |
| created_at | TEXT | |
| updated_at | TEXT | |

### `product_store_links` (v1.19)

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| product_id | TEXT FK | → `products` |
| store_connection_id | TEXT FK | → `store_connections` |
| external_product_id | TEXT | ID na plataforma |
| external_sku | TEXT | |
| provider_snapshot_json | TEXT | Último `ExternalProduct` |
| linked_at | TEXT | |
| updated_at | TEXT | |

### `product_field_policies` (v1.19)

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| scope | TEXT | `global` \| `product` |
| store_connection_id | TEXT FK | |
| product_id | TEXT FK nullable | NULL quando `global` |
| field_key | TEXT | `name`, `short_description`, … |
| source | TEXT | `iris` \| `store` \| `disabled` |
| created_at | TEXT | |
| updated_at | TEXT | |

### `app_settings`

Singleton operacional — timezone, modos de reply, auto-monitor.

| Column | Type | Notes |
| ------ | ---- | ----- |
| reply_mode | TEXT | Default global para posts com `inherit` |
| private_reply_mode | TEXT | Default global para `posts.private_reply_mode=inherit` — `off`, `auto`, `draft` |
| message_reply_mode | TEXT | Default DM inbox |
| reply_delay_seconds | INTEGER | Debounce agente comentário |
| auto_monitor_enabled | INTEGER | 0/1 |
| timezone | TEXT | IANA |

### `message_agent_content`

Singleton (id=1) — blocos editoriais do message-harness DM.

| Column | Type | Notes |
| ------ | ---- | ----- |
| dm_soul | TEXT | |
| dm_page | TEXT | |
| dm_knowledge | TEXT | |
| dm_restrictions | TEXT | |
| updated_at | TEXT | |

### `agent_runs`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| trigger | TEXT | `webhook`, `manual`, `worker` |
| input_summary | TEXT | |
| output_summary | TEXT | |
| status | TEXT | `ok`, `failed`, `skipped` |
| created_at | TEXT | |

### `agent_run_steps`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | UUID |
| agent_run_id | TEXT FK | → `agent_runs` |
| comment_id | TEXT FK | → `comments` (nullable) |
| message_id | TEXT FK | → `messages` (nullable) |
| stage | TEXT | `triage`, `draft`, `verify`, `message_triage`, `message_draft`, `message_verify` |
| verdict | TEXT | `pass`, `fail`, `skip` |
| reason | TEXT | Resumo curto para badge |
| reasoning | TEXT | Texto livre do LLM |
| created_at | TEXT | |

### `llm_calls`

Uma linha por request ao provedor, no SQLite da conta. Sem `source` a request não sai. O passo do agente continua sendo a decisão.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | UUID |
| model | TEXT | Modelo devolvido pelo provedor |
| source | TEXT | De onde veio: `draft`, `triage`, `carousel_slide`, `message_draft_turn`, … |
| status | TEXT | `ok`, `error` |
| prompt_tokens | INTEGER | Nulo se o provedor não devolveu uso |
| completion_tokens | INTEGER | |
| total_tokens | INTEGER | |
| latency_ms | INTEGER | |
| error_message | TEXT | Truncado. Sem o prompt |
| created_at | TEXT | |

### `api_keys`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| label | TEXT | |
| key_hash | TEXT | |
| scopes | TEXT | JSON |
| created_at | TEXT | |
| revoked_at | TEXT | |

### `meta_tokens`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| token_vault | TEXT | Criptografado |
| expires_at | TEXT | |
| updated_at | TEXT | |

### `simulator_scenarios`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | Slug estável (`jogo-grok`, …) |
| label | TEXT | Nome exibido no admin |
| description | TEXT | Resumo do cenário |
| caption | TEXT | Legenda simulada do post |
| carousel_summary | TEXT | Resumo do carrossel/reel |
| thread_json | TEXT | JSON — array de mensagens (`author`, `text`, `is_brand_reply`, `at?`) |
| target_author | TEXT | Autor do comentário alvo |
| target_text | TEXT | Texto do comentário alvo |
| created_at | TEXT | |
| updated_at | TEXT | |

Seed na migration `20260812110107_simulator_scenarios.sql` — paridade com `admin/src/lib/agent-simulator-scenarios.ts`.

## Banco de controle (v1.31)

Só existe quando o Turso está configurado. Não replica o schema editorial.

| Tabela | Papel |
| ------ | ----- |
| `accounts` | Email, slug estável, status (`pending`, `active`) |
| `account_databases` | Nome Turso, URL `libsql://`, token cifrado, migration aplicada |
| `login_challenges` | OTP do cadastro e do login, no controle, não no banco editorial |

O token da Platform API não entra nessas tabelas. Fica em `TURSO_PLATFORM_TOKEN`.

## Filesystem (não-SQL)

```txt
data/media/{post_id}/{filename}
data/tenants/{accountId}/media/{post_id}/{filename}
data/agent/{soul,page,knowledge,restrictions}.md
```

Índice em `post_assets.storage_path` (caminho relativo). Sem conta Turso, a raiz é `data/media/`. Com conta, a raiz é `data/tenants/{accountId}/media/`. Conteúdo editorial do agente (SOUL, página, KB, restrições) em `data/agent/` — override via `IRIS_AGENT_CONTENT_DIR`. Na v1.31 o conteúdo do agente que já está no SQLite da conta permanece nesse banco. O diretório `data/agent/` global vale para o modo de um arquivo.

## Indexes

- `posts(status, scheduled_at)`
- `post_assets(post_id, sort_order)`
- `comments(post_id)`
- `comments(ig_comment_id)`
- `agent_run_steps(comment_id, created_at)`
- `llm_calls(created_at)`

## Backup

SQLite + cópia de `data/media/` juntos.

## Retenção e auditoria

| Tabela | Política |
| ------ | -------- |
| `meta_webhook_events` | Worker periódico remove linhas com `received_at` anterior a `IRIS_RETENTION_DAYS` (default 90). Payload já truncado a 2048 bytes no insert. |
| `agent_runs` / `agent_run_steps` | **Sem delete automático** — trail de auditoria do harness preservado integralmente. Crescimento em disco é aceito; backup periódico recomendado. |
| `llm_calls` | **Sem delete automático** — cada chamada ao modelo, inclusive erro e resumo de carrossel. |
| `comment_replies` | Preservado enquanto o comentário existir — `agent_run_id` referencia runs históricos. |

Ver `IRIS_RETENTION_*` em `08_environments.md`. Delay antes de responder: **somente UI** (`reply_delay_seconds` em Configurações → Agente de comentários).
