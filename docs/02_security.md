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
| Local operator | Navegador com sessão OTP (cookie HttpOnly) | Semi-trusted — sem segredo no JS |
| Agents | Cursor / workers com agent token | Semi-trusted — escopo limitado |

## Authentication

| Actor | Mechanism | Storage |
| ----- | --------- | ------- |
| Operador (UI) | OTP por email + cookie `iris_session` HttpOnly | `IRIS_SESSION_SECRET`, `IRIS_OTP_PEPPER`, `RESEND_API_KEY` no server |
| Agente IA | `Authorization: Bearer` agent token | `iris-agent/iris.credentials.json` (kit portável) |
| Admin (legacy/CLI) | `Authorization: Bearer` admin token | `IRIS_ADMIN_TOKEN` no server — não usar na UI |
| Meta webhook | `X-Hub-Signature-256` HMAC | `META_APP_SECRET` |

Comparação de tokens com `timingSafeEqual`; OTP armazenado como hash SHA256 + pepper; sessão assinada com HMAC.

## Secrets

- Nunca expor `META_ACCESS_TOKEN`, `META_APP_SECRET`, `RESEND_API_KEY`, `IRIS_SESSION_SECRET` ao cliente HTML
- UI **não** armazena tokens em `sessionStorage` — autenticação via cookie HttpOnly após OTP
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

## Agente local (credenciais)

| Regra | Detalhe |
| ----- | ------- |
| Arquivo | `iris-agent/iris.credentials.json` — **gitignored** |
| Pacote | `iris-agent/` — kit `.agent/` Meridian + `publications/` (portável; sem Node) |
| Conteúdo | Apenas `apiUrl` + `agentToken` (+ `insecureAllowHttp` em dev) — **sem** tokens Meta |
| Espelhamento | `agentToken` deve ser idêntico a `IRIS_AGENT_TOKEN` no `iris-app/.env` do server |
| Geração | `openssl rand -hex 32` — rotacionar se vazamento suspeito |
| HTTP | Bloqueado em `NODE_ENV=production`; em dev, HTTP só para localhost com `insecureAllowHttp: true` |
| Diagnóstico | `curl` com Bearer — ver skill `push-publication` / `credentials-contract.md` |

## Data sensitivity

- Comentários IG podem conter PII (username, texto) — não logar corpo completo em produção
- Backup do SQLite contém dados editoriais — proteger volume de disco

## Compliance notes

- Respostas automáticas devem respeitar políticas Meta e tom de voz da marca (configurável)
- v1: uma conta; sem GDPR multi-tenant complexo
