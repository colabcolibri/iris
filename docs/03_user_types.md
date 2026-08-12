---
title: User types
status: approved
version: 1.2
updated: 2026-08-10
depends_on: [00_scope.md, 02_security.md]
blocks: [05_architecture.md, 06_database.md]
---

# 03 — User types

## Profiles

### Operador editorial

**Who:** Pessoa responsável pela presença no Instagram da marca.

**Goals:**
- Ver calendário de postagens e status
- Criar, editar legendas, reprogramar horários
- Fazer upload de imagens pela UI (alternativa ao agente)
- Acompanhar comentários e respostas

**Permissions:** token admin — CRUD posts, upload mídia, comentários, auto-reply.

**Surfaces:** UI HTML (`/`).

---

### Agente local / client MCP

**Who:** Agente no workspace Iris (Cursor, Claude) ou outro client MCP (ChatGPT connector) com skills do kit.

**Goals:**
- Escanear `publications/*/post.md` com `status: ready` e fazer push em lote (REST)
- Criar, editar e consultar posts ad hoc via MCP tools
- Obter imagens de qualquer fonte (pasta local, export manual, API externa como Casper) e salvar na pasta
- Reprogramar `scheduled_at`, consultar status

**Permissions:** token agent (REST) ou connection code (MCP) — `posts:read`, `posts:write`, `posts:schedule`, `assets:write`, `comments:read`. Sem tokens Meta.

**Surfaces:** REST `/api/*`; MCP `POST /mcp`; pasta `publications/` no disco local.

---

### Worker no server

**Who:** Processos `publish-scheduler` e `comment-responder` dentro do Iris.

**Goals:** Publicar posts no horário; responder comentários quando habilitado.

**Permissions:** interno — acesso a `meta_tokens` e `data/media/`.

---

### Visitante demo

**Who:** Prospect ou curioso que chega pela landing e quer ver o produto antes de pedir acesso.

**Goals:**
- Explorar o admin Iris com dados fictícios
- Entender calendário editorial, comentários e fluxo do agente
- Avaliar UX sem credenciais nem risco ao ambiente real

**Permissions:** nenhuma — rota pública `/demo`, fixtures no client, sem sessão admin.

**Surfaces:** `/demo/*` (mesmo deploy, shell visual do admin).

---

### Sistema Meta (webhook)

**Who:** Instagram Graph API.

**Goals:** Notificar novos comentários.

**Permissions:** `POST /webhooks/meta` com HMAC.

## Profile matrix

| Action | Operador | Agente / MCP | Worker | Meta | Visitante demo |
| ------ | -------- | ------------ | ------ | ---- | -------------- |
| CRUD posts | yes | yes | no | no | fake only |
| Upload mídia | yes | yes | no | no | preview local |
| Schedule | yes | yes | no | no | fake only |
| Publish IG | no | no | yes | no | no |
| List comments | yes | yes | no | no | fixtures |
| Ingest comment | no | no | no | yes | no |
| Auto-reply | no | no | yes | no | no |
| Ver admin UI | yes | no | no | no | yes (`/demo`) |
