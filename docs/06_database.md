---
title: Database
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [05_architecture.md]
blocks: [07_api_contracts.md]
---

# 06 — Database

## Engine

SQLite via `node:sqlite` (`DatabaseSync`). Path: `IRIS_DB_PATH` (default `./data/iris.db`).

Migrations em `migrations/` com prefixo `YYYYMMDDHHMMSS_description.sql`. Aplicadas no boot.

## Tables (v1)

### `posts`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | UUID |
| status | TEXT | `draft`, `scheduled`, `published`, `cancelled`, `failed` |
| caption | TEXT | Legenda IG |
| scheduled_at | TEXT ISO | Nullable |
| published_at | TEXT ISO | Nullable |
| ig_media_id | TEXT | Preenchido após publish |
| deck_ref | TEXT | Referência Casper (slide id) |
| media_urls | TEXT | JSON array de URLs |
| error_message | TEXT | Último erro Meta |
| auto_reply_enabled | INTEGER | 0/1 |
| created_at | TEXT | |
| updated_at | TEXT | |

### `post_assets`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| post_id | TEXT FK | |
| sort_order | INTEGER | Ordem do carrossel |
| url | TEXT | URL da imagem |

### `comments`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | UUID interno |
| ig_comment_id | TEXT UNIQUE | ID Meta |
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
| draft_text | TEXT | Gerado pelo agente |
| sent_text | TEXT | Enviado à Meta |
| status | TEXT | `draft`, `sent`, `failed` |
| agent_run_id | TEXT FK | |

### `agent_runs`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| trigger | TEXT | `webhook`, `manual`, `worker` |
| input_summary | TEXT | Sem PII completo |
| output_summary | TEXT | |
| status | TEXT | `ok`, `failed` |
| created_at | TEXT | |

### `api_keys`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| label | TEXT | ex. `cursor-agent` |
| key_hash | TEXT | SHA-256 |
| scopes | TEXT | JSON array |
| created_at | TEXT | |
| revoked_at | TEXT | Nullable |

### `meta_tokens`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | TEXT PK | |
| token_vault | TEXT | Criptografado |
| expires_at | TEXT | |
| updated_at | TEXT | |

## Indexes

- `posts(status, scheduled_at)` — worker publish
- `comments(post_id)` — UI list
- `comments(ig_comment_id)` — webhook dedup

## Backup

Copiar `data/iris.db` periodicamente em produção. Sem `db reset` em dev com dados reais.
