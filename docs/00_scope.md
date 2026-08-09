---
title: Scope
status: approved
version: 1.0
updated: 2026-08-09
depends_on: []
blocks: [01_tech_stack.md, 04_principles.md, 05_architecture.md]
---

# 00 — Scope

## Name and description

**Iris** é um serviço online que agenda, publica e acompanha postagens no Instagram. Roda como mini-server Node com SQLite, expõe API REST para agentes de IA e serve uma interface HTML simples no navegador. Opera de forma independente do Casper (criação de slides); integração com Casper é por referência (`deck_id`, URLs de mídia exportada), sem acoplamento de código.

## Problem it solves

**Before:** postagens no IG são gerenciadas em planilhas, notas ou na cabeça. Agendar exige app manual; comentários ficam espalhados; agentes de IA não têm API segura para criar ou reprogramar posts. Casper exporta carrosséis, mas não publica nem responde comentários.

**After:** um calendário editorial centralizado com status de cada postagem, publicação programada via API oficial da Meta, comentários sincronizados na mesma UI, e agentes que operam só via API autenticada (sem acesso a tokens ou banco).

**Why now:** o fluxo Casper → export → IG precisa de um “mensageiro” dedicado (Iris) com SRP claro, pronto para automação de comentários no servidor.

## Who it is for

| Audience | Role | Context | Technical level | Primary need |
| -------- | ---- | ------- | --------------- | ------------ |
| **Operador editorial** | Dono da conta IG / marketing | Agenda posts, revisa legendas, responde comentários | Médio | Ver calendário, editar, publicar |
| **Agente de IA** | Cursor / worker no server | Cria posts, reprograma, gera rascunhos de resposta | Alto (via API) | Endpoints estáveis, tokens com escopo |
| **Integrador Casper** | Fluxo humano ou agente Casper | Envia deck exportado para Iris | Médio | Referência de deck + URLs de mídia |

## In initial scope (v1)

- CRUD de postagens com status (`draft`, `scheduled`, `published`, `cancelled`, `failed`)
- Agendamento com `scheduled_at` e worker que publica via Graph API
- Interface HTML servida pelo mesmo processo (lista + edição básica)
- Atualização em tempo real via SSE (sem polling)
- Autenticação Bearer (admin + agent)
- Webhook Meta para ingestão de comentários
- Exibição de comentários por postagem na UI
- Kit `.agent/` com skills para agentes operarem a API
- Worker + agente para resposta automática a comentários (fase final da v1)

## Out of initial scope

- LinkedIn, TikTok ou outros canais (arquitetura preparada, não implementado)
- App mobile nativo
- Multi-tenant / múltiplas contas IG por instância (v1 = uma conta)
- UI React/SPA elaborada (HTML + JS vanilla)
- Código dentro do monorepo open-slide / Casper
- Aprovação humana obrigatória antes de cada resposta automática (pode entrar em v2)

## Known constraints

| Constraint | Detail |
| ---------- | ------ |
| Stack | Node 22+, TypeScript, SQLite (`node:sqlite`), HTTP nativo |
| Meta API | Conta IG Business/Creator + Página Facebook + app Meta Developers |
| Deploy | Servidor online 24/7 (webhooks + scheduler) |
| Repo | Projeto separado em `/Code/iris`, não dentro de open-slide |
| Segurança | Tokens Meta e LLM apenas no servidor |

## Assumptions

| Assumption | Confidence | Validation |
| ---------- | ---------- | ---------- |
| Uma conta IG Colibri na v1 | high | Confirmar com operador |
| Graph API suporta agendamento de carrossel | medium | Spike em EPIC-4 |
| SSE suficiente para sync UI (sem WebSocket) | high | Implementação v1-S3 |
| Casper envia URLs públicas ou paths acordados | medium | Definir contrato em `07_api_contracts` |

## Open questions

| Question | Owner | Target date |
| -------- | ----- | ----------- |
| Host de produção (Railway, Fly, VPS)? | Operador | Antes de v1-S4 |
| Modelo LLM para respostas automáticas? | Operador | Antes de v1-S6 |
| Aprovação humana em respostas automáticas na v1? | Operador | Antes de v1-S6 |
