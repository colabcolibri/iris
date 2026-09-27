---
title: Scope
status: review
version: 1.2
updated: 2026-09-27
depends_on: []
blocks: [01_tech_stack.md, 04_principles.md, 05_architecture.md]
---

# 00 — Scope

## Name and description

**Iris** é um serviço online que agenda, publica e acompanha postagens no Instagram. Roda como mini-server Node com SQLite, expõe API REST para agentes de IA e serve uma interface HTML simples no navegador. É um **gestor de postagens genérico** — não depende de Casper, Canva ou qualquer ferramenta de criação. Texto e imagens chegam ao server via API (upload); o agente local monta pacotes em `publications/` e faz o push.

## Problem it solves

**Before:** postagens no IG são gerenciadas em planilhas, notas ou na cabeça. Agendar exige app manual; comentários ficam espalhados; agentes de IA não têm API segura para criar ou reprogramar posts; mídia fica em pastas locais sem fluxo claro até o servidor.

**After:** calendário editorial centralizado, mídia armazenada no server, publicação programada via API oficial da Meta, comentários sincronizados na UI, e agente local que empacota `post.md` + imagens e envia via API — sem acoplamento a outro produto.

**Why now:** precisamos de um serviço dedicado (Iris) com SRP claro: server = agenda + armazena + publica; agente local = monta conteúdo de qualquer fonte.

## Who it is for

| Audience | Role | Context | Technical level | Primary need |
| -------- | ---- | ------- | --------------- | ------------ |
| **Operador editorial** | Dono da conta IG / marketing | Agenda posts, revisa legendas, responde comentários | Médio | Ver calendário, editar, publicar |
| **Agente local / client MCP** | Cursor, ChatGPT, Claude no workspace Iris | Push `publications/`, tools editoriais ad hoc | Alto (via API/MCP) | REST estável, MCP tools, skill push-publication |
| **Worker no server** | Processo Iris | Publica no horário, responde comentários | — | Tokens Meta só no server |

## In initial scope (v1)

- CRUD de postagens com status (`draft`, `scheduled`, `published`, `cancelled`, `failed`)
- **Upload de mídia** multipart; **otimização automática no server** (resize + JPEG) antes de persistir
- Agendamento com `scheduled_at` e worker que publica via Graph API a partir do disco
- Pasta local `publications/` + `post.md` + skill agente `push-publication`
- Interface HTML (lista + edição + preview de mídia)
- SSE (sem polling)
- Autenticação Bearer (admin + agent) e MCP (connection code)
- Webhook Meta + comentários na UI
- Servidor MCP com tools editoriais (posts, assets, comentários) para clients de IA
- Worker + agente para resposta automática a comentários

## Out of initial scope

- Integração embutida com Casper, Canva ou outros criadores (agente local resolve)
- LinkedIn, TikTok (arquitetura `channel` preparada, não implementado)
- App mobile nativo
- Várias contas Instagram dentro da mesma pessoa (cada SQLite continua com uma conexão Meta)
- Cobrança, planos e bloqueio por assinatura (v1.31 abre a conta; não cobra)
- Multi-tenant no v1: a instalação única com um `iris.db` permanece o modo da suíte. A partir de v1.31 o processo do produto dá a cada pessoa o próprio arquivo SQLite e login único (decisão 2026-09-27, ajustada no mesmo dia para arquivo local, sem Turso Cloud)
- UI React/SPA
- Object storage S3 (v1 = disco local no server)

## Known constraints

| Constraint | Detail |
| ---------- | ------ |
| Stack | Node 22+, TypeScript, SQLite, HTTP nativo |
| Meta API | IG Business/Creator + Página Facebook + app Meta |
| Deploy | Server online 24/7 |
| Mídia | Deve estar no server antes do publish |
| Segurança | Tokens Meta e LLM apenas no servidor |

## Assumptions

| Assumption | Confidence | Validation |
| ---------- | ---------- | ---------- |
| Uma conta IG na v1 | high | Operador |
| Agente local é quem busca imagens (pasta, export, API externa) | high | Skill push-publication |
| Graph API suporta carrossel a partir de upload | medium | Spike EPIC-4 |
| SSE suficiente para sync UI | high | v1-S3 |

## Open questions

| Question | Owner | Target date |
| -------- | ----- | ----------- |
| Host de produção? | Operador | Antes v1-S4 |
| LLM para respostas automáticas? | Operador | Antes v1-S6 |
| `publications/` no git ou só local? | Operador | Antes v1-S6 |
