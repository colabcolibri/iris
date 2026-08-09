---
title: User types
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [00_scope.md, 02_security.md]
blocks: [05_architecture.md, 06_database.md]
---

# 03 — User types

## Profiles

### Operador editorial

**Who:** Pessoa responsável pela presença no Instagram da marca (ex.: Sergio / equipe Colibri).

**Goals:**
- Ver calendário de postagens e status
- Criar, editar legendas, reprogramar horários
- Acompanhar comentários e respostas (manuais ou automáticas)

**Permissions:** token admin — CRUD completo em posts, leitura de comentários, configuração de auto-resposta.

**Surfaces:** UI HTML (`/`), mesma origem do server.

---

### Agente de IA

**Who:** Agente Cursor ou worker no servidor com skill Iris.

**Goals:**
- Inserir postagens a partir de conteúdo Casper exportado
- Reprogramar `scheduled_at`
- Consultar status e comentários pendentes
- (Server worker) Gerar e enviar respostas a comentários

**Permissions:** token agent — `posts:read`, `posts:write`, `posts:schedule`, `comments:read`; mutações de publicação Meta apenas via workers internos, não via token agent externo.

**Surfaces:** REST API `/api/*`; sem acesso direto ao banco.

---

### Sistema Meta (webhook)

**Who:** Instagram Graph API enviando eventos de comentário.

**Goals:** Notificar Iris sobre novos comentários em mídias publicadas.

**Permissions:** endpoint `POST /webhooks/meta` com verificação de assinatura.

**Surfaces:** Webhook HTTP apenas.

## Profile matrix

| Action | Operador | Agente | Meta webhook |
| ------ | -------- | ------ | ------------ |
| List/create/edit posts | yes | yes | no |
| Schedule post | yes | yes | no |
| Trigger publish | worker only | no | no |
| List comments | yes | yes | no |
| Ingest comment | no | no | yes (create) |
| Auto-reply | worker | no | no |
