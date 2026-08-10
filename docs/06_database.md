---
title: Database
status: approved
version: 1.1
updated: 2026-08-09
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
| scheduled_at | TEXT ISO | Nullable |
| published_at | TEXT ISO | Nullable |
| ig_media_id | TEXT | Após publish Meta |
| source_note | TEXT | Opcional — texto livre (rastreio humano) |
| error_message | TEXT | Último erro Meta |
| auto_reply_enabled | INTEGER | 0/1 |
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
