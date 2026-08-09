---
title: Principles
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [00_scope.md, 01_tech_stack.md]
blocks: [05_architecture.md]
---

# 04 — Principles

## Single responsibility (SRP)

Cada módulo tem uma razão para mudar:

| Módulo | Responsabilidade única |
| ------ | ---------------------- |
| `domain/` | Regras de negócio puras (status, validação de agenda) |
| `ports/` | Contratos (interfaces) — sem I/O |
| `adapters/sqlite/` | Persistência |
| `adapters/meta/` | Graph API Instagram |
| `adapters/sse/` | Broadcast de eventos |
| `api/` | HTTP: parse, auth, delegação |
| `workers/` | Jobs temporais (publish, reply) |
| `agents/` | Orquestração LLM — não publica diretamente |

## Dependency rule

Dependências apontam **para dentro**: `api` → use cases → `ports` ← `adapters`. `domain` não importa nada externo.

## Simplicity

- Sem framework web até provar necessidade
- Sem fila externa na v1 — worker in-process com tick de 60s
- HTML estático; sem build de frontend na v1

## Documentation precedes code

Meridian: US `ready: true` antes de implementar. Phase docs guiam decisões.

## Loose coupling with Casper

Iris referencia `deck_ref` e `media_urls` — nunca importa código Casper.

## Real-time without polling

UI atualiza via SSE após mutações; fetch inicial no load.

## Fail visibly

Posts `failed` guardam erro da Meta; comentários `reply_failed` auditados em `agent_runs`.

## Security by default

Tokens no servidor; agentes só via API autenticada.
