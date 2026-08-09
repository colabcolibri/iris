---
title: Principles
status: approved
version: 1.1
updated: 2026-08-09
depends_on: [00_scope.md, 01_tech_stack.md]
blocks: [05_architecture.md]
---

# 04 — Principles

## Single responsibility (SRP)

| Módulo | Responsabilidade única |
| ------ | ---------------------- |
| `domain/` | Regras de negócio (status, agenda, validação de mídia mínima) |
| `ports/` | Contratos — sem I/O |
| `adapters/sqlite/` | Persistência |
| `adapters/media-storage/` | Gravar/servir `data/media/` |
| `adapters/image-optimizer/` | sharp: resize, JPEG, strip EXIF |
| `adapters/meta/` | Graph API Instagram |
| `adapters/sse/` | Broadcast de eventos |
| `api/` | HTTP: parse, auth, delegação |
| `workers/` | Publish e reply no tempo certo |
| `agents/` (server) | LLM para respostas a comentários |
| Agente local (`.agent/`) | Montar pacote `publications/` e push — **fora** do runtime server |

## Dependency rule

`api` → use cases → `ports` ← `adapters`. `domain` não importa adapters.

## Iris não conhece ferramentas de criação

- Sem `deck_ref`, sem imports de Casper, sem endpoints Casper→Iris
- Campo opcional `source_note` (texto livre) só para rastreabilidade humana
- Se o agente usar Casper, isso acontece **antes** do push, na máquina local

## Simplicity

- Mídia no disco do server na v1 (sem S3)
- HTML estático; worker in-process

## Real-time without polling

SSE após mutações; fetch no load.

## Fail visibly

`failed` + `error_message` em posts; auditoria em `agent_runs`.

## Security by default

Tokens Meta/LLM só no server; agente local só Bearer na API.
