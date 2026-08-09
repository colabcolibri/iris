---
title: User types
status: approved
version: 1.1
updated: 2026-08-09
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

### Agente local

**Who:** Agente Cursor no workspace Iris com skills do kit.

**Goals:**
- Escanear `publications/*/post.md` com `status: ready`
- Obter imagens de qualquer fonte (pasta local, export manual, API externa como Casper) e salvar na pasta
- Push: criar post + upload multipart + agendar
- Reprogramar `scheduled_at`, consultar status

**Permissions:** token agent — `posts:read`, `posts:write`, `posts:schedule`, `assets:write`, `comments:read`. Sem tokens Meta.

**Surfaces:** REST `/api/*`; pasta `publications/` no disco local.

---

### Worker no server

**Who:** Processos `publish-scheduler` e `comment-responder` dentro do Iris.

**Goals:** Publicar posts no horário; responder comentários quando habilitado.

**Permissions:** interno — acesso a `meta_tokens` e `data/media/`.

---

### Sistema Meta (webhook)

**Who:** Instagram Graph API.

**Goals:** Notificar novos comentários.

**Permissions:** `POST /webhooks/meta` com HMAC.

## Profile matrix

| Action | Operador | Agente local | Worker | Meta |
| ------ | -------- | ------------ | ------ | ---- |
| CRUD posts | yes | yes | no | no |
| Upload mídia | yes | yes | no | no |
| Schedule | yes | yes | no | no |
| Publish IG | no | no | yes | no |
| List comments | yes | yes | no | no |
| Ingest comment | no | no | no | yes |
| Auto-reply | no | no | yes | no |
