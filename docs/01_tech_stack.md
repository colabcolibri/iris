---
title: Tech stack
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [00_scope.md]
blocks: [02_security.md, 04_principles.md, 08_environments.md]
---

# 01 — Tech stack

## Runtime and language

| Layer | Choice | Rationale |
| ----- | ------ | --------- |
| Runtime | Node.js ≥ 22 | `node:sqlite`, `node:http`, alinhado ao license-server |
| Language | TypeScript (ESM) | Tipos nos ports/adapters |
| Image processing | sharp | Otimização no ingest (resize + JPEG) |
| Package manager | pnpm | Consistência com ecossistema Colibri |

## Data

| Layer | Choice | Rationale |
| ----- | ------ | --------- |
| Database | SQLite (`node:sqlite`) | Simples, um arquivo, adequado ao volume editorial |
| Migrations | SQL versionadas em `iris-app/migrations/` | Timestamp `YYYYMMDDHHMMSS` |

## HTTP and UI

| Layer | Choice | Rationale |
| ----- | ------ | --------- |
| Server | `node:http` (sem framework) | Mini-server, SRP, poucas deps |
| UI | HTML + CSS + JS vanilla em `iris-app/public/` | Abre no navegador, zero build de frontend |
| Real-time | SSE (`EventSource`) | Push sob demanda, sem polling |
| Media storage | Filesystem `iris-app/data/media/` | Upload multipart; sem S3 na v1 |

## External integrations

| System | SDK / protocol | Notes |
| ------ | -------------- | ----- |
| Instagram Graph API | REST HTTPS | Publicação, comentários, webhooks Meta |
| LLM (agente) | API via env | Apenas no worker `comment-responder` |

## Tooling

| Tool | Use |
| ---- | --- |
| Biome (futuro) | lint/format |
| `node --test` | testes unitários |
| Meridian | `docs/`, `.meridian/meridian.db` |

## Explicitly not in stack

- Next.js, React admin, Vite SPA
- PostgreSQL (v1)
- Redis / fila externa (fila in-process ou SQLite job table na v1)
- Dependência de `@open-slide/core` ou qualquer ferramenta de criação
