---
title: Security
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [00_scope.md, 01_tech_stack.md]
blocks: [03_user_types.md, 05_architecture.md]
---

# 02 — Security

## Trust zones

| Zone | Components | Trust level |
| ---- | ---------- | ----------- |
| Public internet | Meta webhooks (assinados), UI HTML | Untrusted input — validar sempre |
| Server | API, workers, SQLite, tokens Meta/LLM | Trusted boundary |
| Local operator | Navegador com admin token | Semi-trusted — token em env local |
| Agents | Cursor / workers com agent token | Semi-trusted — escopo limitado |

## Authentication

| Actor | Mechanism | Storage |
| ----- | --------- | ------- |
| Operador (UI) | `Authorization: Bearer` admin token | `IRIS_ADMIN_TOKEN` em `.env` |
| Agente IA | `Authorization: Bearer` agent token | `IRIS_AGENT_TOKEN` ou row em `api_keys` (hash) |
| Meta webhook | `X-Hub-Signature-256` HMAC | `META_APP_SECRET` |

Comparação de tokens com `timingSafeEqual` (padrão license-server).

## Secrets

- Nunca expor `META_ACCESS_TOKEN`, `META_APP_SECRET`, `IRIS_ADMIN_TOKEN` ao cliente HTML
- UI armazena admin token em `sessionStorage` apenas se login manual; preferir proxy same-origin sem expor token ao JS quando possível
- Tokens Meta criptografados em repouso na tabela `meta_tokens` (v1-S4)

## API hardening

- JSON body size limit (16 KB default)
- Rate limit básico em rotas públicas (webhook)
- CORS restrito em produção (mesma origem para UI)
- Validação de entrada em todas as mutações

## Agent safety

- Agentes **não** recebem credenciais Meta nem path do SQLite
- Apenas endpoints documentados em `07_api_contracts`
- `agent_runs` audita cada execução de resposta automática

## Data sensitivity

- Comentários IG podem conter PII (username, texto) — não logar corpo completo em produção
- Backup do SQLite contém dados editoriais — proteger volume de disco

## Compliance notes

- Respostas automáticas devem respeitar políticas Meta e tom de voz da marca (configurável)
- v1: uma conta; sem GDPR multi-tenant complexo
