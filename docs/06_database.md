---
title: Database
status: review
version: 1.2
updated: 2026-08-11
depends_on: [05_architecture.md]
blocks: [07_api_contracts.md]
---

# 06 — Database

## Engine

SQLite (`node:sqlite`). Path: `IRIS_DB_PATH` (default `./data/iris.db`). Migrations em `migrations/`.

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
| agent_run_id | TEXT FK | |

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
| comment_id | TEXT FK | → `comments` |
| stage | TEXT | `triage`, `draft`, `verify` |
| verdict | TEXT | `pass`, `fail`, `skip` |
| reason | TEXT | Resumo curto para badge |
| reasoning | TEXT | Texto livre do LLM |
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

## Filesystem (não-SQL)

```txt
data/media/{post_id}/{filename}
data/agent/{soul,page,knowledge,restrictions}.md
```

Índice em `post_assets.storage_path`. Worker e Meta leem mídia daqui. Conteúdo editorial do agente (SOUL, página, KB, restrições) em `data/agent/` — override via `IRIS_AGENT_CONTENT_DIR`.

## Indexes

- `posts(status, scheduled_at)`
- `post_assets(post_id, sort_order)`
- `comments(post_id)`
- `comments(ig_comment_id)`
- `agent_run_steps(comment_id, created_at)`

## Backup

SQLite + cópia de `data/media/` juntos.

## Retenção e auditoria

| Tabela | Política |
| ------ | -------- |
| `meta_webhook_events` | Worker periódico remove linhas com `received_at` anterior a `IRIS_RETENTION_DAYS` (default 90). Payload já truncado a 2048 bytes no insert. |
| `agent_runs` / `agent_run_steps` | **Sem delete automático** — trail de auditoria do harness preservado integralmente. Crescimento em disco é aceito; backup periódico recomendado. |
| `comment_replies` | Preservado enquanto o comentário existir — `agent_run_id` referencia runs históricos. |

Ver `IRIS_RETENTION_*` em `08_environments.md`. Delay antes de responder: **somente UI** (`reply_delay_seconds` em Configurações → Agente de comentários).
