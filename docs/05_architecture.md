---
title: Architecture
status: approved
version: 1.2
updated: 2026-08-10
depends_on: [00_scope.md, 01_tech_stack.md, 02_security.md, 03_user_types.md, 04_principles.md]
blocks: [06_database.md, 07_api_contracts.md, 08_environments.md, 09_design_system.md]
---

# 05 — Architecture

## Objective

Forma do Iris: mini-server com camadas SRP, mídia em disco, SQLite, UI HTML, Meta API. Pacote local do agente em `iris-agent/publications/` — ver `docs/architecture/local-publications.md`.

## System context

```mermaid
flowchart TB
  subgraph local ["Máquina local"]
    Browser["Navegador"]
    Agent["Agente / client MCP"]
    PubFolder["publications/ post.md + imagens"]
  end

  subgraph iris ["Iris server"]
    API["api/"]
    MCP["mcp/"]
    Media["data/media/"]
    Workers["workers/"]
    DB[("SQLite")]
    SSE["SSE"]
  end

  subgraph external ["Externos"]
    Meta["Instagram Graph API"]
    Ext["Ferramentas externas opcionais"]
  end

  Agent --> PubFolder
  Ext -.->|agente se vira| Agent
  Agent -->|multipart upload REST| API
  Agent -->|MCP tools Bearer| MCP
  MCP --> API
  Browser --> API
  API --> DB
  API --> Media
  SSE --> Browser
  Workers --> Media
  Workers --> Meta
  Meta -->|webhook| API
```

**Repository layout:**

```txt
iris/                     # workspace Meridian
  docs/                   # phase docs do produto
  .meridian/              # backlog SQLite
  iris-app/               # aplicação Node (server + UI)
    src/
      domain/
      ports/
      adapters/sqlite/
      adapters/media-storage/
      adapters/meta/
      adapters/sse/
      api/
      mcp/                # servidor MCP (Streamable HTTP)
      workers/
      agents/             # LLM reply no server
      server.ts
    public/               # UI HTML
    migrations/
    data/
      iris.db
      media/{post_id}/
  iris-agent/             # kit agente local (portável, sem Node)
    .agent/               # skills + agents Meridian
    publications/         # post.md + imagens
    iris.credentials.json
  .agent/                 # kit Meridian do produto (symlink push-publication → iris-agent)
```

## Layers and boundaries

| Layer | Responsibility | Paths |
| ----- | -------------- | ----- |
| Domain | Post, asset, status, schedule rules | `src/domain/` |
| Ports | Repositories, MediaStorage, MetaPublisher | `src/ports/` |
| Adapters | SQLite, filesystem media, Meta, SSE | `src/adapters/` |
| API | REST + multipart + MCP transport | `src/api/`, `src/mcp/` |
| Workers | publish-scheduler, comment-responder | `src/workers/` |

## Major components

| Component | Purpose | Path |
| --------- | ------- | ---- |
| MCP gateway | Streamable HTTP + tools editoriais | `src/mcp/` |
| Post API | CRUD + schedule | `src/api/routes/posts.ts` |
| Assets API | Multipart upload + serve | `src/api/routes/assets.ts` |
| Comments API | List + manual reply | `src/api/routes/comments.ts` |
| Events API | SSE | `src/api/routes/events.ts` |
| Media storage | `data/media/{post_id}/` | `src/adapters/media-storage/` |
| Image optimizer | Resize + JPEG no ingest | `src/adapters/image-optimizer/` |
| Publish worker | Lê disco → Meta | `src/workers/publish-scheduler.ts` |
| Admin UI | Lista, preview, upload | `public/` |

## Integration points

| System | Direction | Notes |
| ------ | --------- | ----- |
| Instagram Graph API | Outbound publish/reply | Token no server |
| Meta webhooks | Inbound comments | HMAC |
| Ferramentas externas / clients MCP | Inbound tools ou REST | Cursor, ChatGPT, Claude — ver `mcp-integration.md` |

## Key flows

### 1 — Agente local faz push

1. Lê `publications/{slug}/post.md` (`status: ready`)
2. `POST /api/posts` → `post_id`
3. `POST /api/posts/:id/assets` para cada imagem (multipart)
4. `PATCH` → `scheduled` se `scheduled_at` definido
5. Atualiza `post.md` com `iris_post_id`, `pushed_at`

### 2 — Operador pela UI

1. Cria post, faz upload de imagens na UI (mesmos endpoints)
2. Agenda horário → SSE atualiza lista

### 3 — Publicação programada

1. Worker: posts `scheduled` due + assets no disco
2. MetaPublisher upload + publish
3. `published` + `ig_media_id` ou `failed`

### 4 — Comentários

Webhook → `comments` → SSE → UI; worker auto-reply se habilitado.

### 5 — Cliente MCP (ad hoc)

1. Client envia `POST /mcp` com `Authorization: Bearer <IRIS_MCP_CONNECTION_CODE>`
2. Handshake MCP → `tools/list` expõe operações editoriais
3. Tool invoca use-cases equivalentes ao REST agent (posts, assets, comments)

Ver `docs/architecture/mcp-integration.md` para setup por client.

## Architecture detail files

| File | Topic |
| ---- | ----- |
| `docs/architecture/mcp-integration.md` | MCP — Cursor, ChatGPT, Claude, validate, tools |
| `docs/architecture/image-optimization.md` | Pipeline sharp, limites, env |
| `docs/architecture/meta-integration.md` | Graph API, webhooks |
| `docs/architecture/meta-app-review.md` | Checklist revisão app Meta (IGIris) |
| `docs/architecture/srp-modules.md` | Módulos e dependências |

## Gaps

| Gap | Blocks |
| --- | ------ |
| Host produção | deploy v1-S4 |
| App Meta | EPIC-4 |
