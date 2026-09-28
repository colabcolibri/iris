---
title: Security
status: review
version: 1.2
updated: 2026-09-27
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
| Agents | Clients IA (REST agent token ou MCP connection code) + workers | Semi-trusted — escopo limitado |

## Authentication

| Actor | Mechanism | Storage |
| ----- | --------- | ------- |
| Operador (UI) | OTP por email + cookie `iris_session` HttpOnly | `IRIS_SESSION_SECRET`, `IRIS_OTP_PEPPER`, `RESEND_API_KEY` no server |
| Agente IA (REST) | `Authorization: Bearer` agent token | `iris-agent/iris.credentials.json` (`agentToken`) |
| Cliente MCP | `Authorization: Bearer` connection code | `iris-app/.env` (`IRIS_MCP_CONNECTION_CODE`); espelhar em `iris.credentials.json` (`mcpConnectionCode`) |
| Admin (legacy/CLI) | `Authorization: Bearer` admin token | `IRIS_ADMIN_TOKEN` no server — não usar na UI |
| Meta webhook | `X-Hub-Signature-256` HMAC | `META_APP_SECRET` |

Comparação de tokens com `timingSafeEqual`; OTP armazenado como hash SHA256 + pepper; sessão assinada com HMAC.

## Secrets

- Nunca expor `META_ACCESS_TOKEN`, `META_APP_SECRET`, `RESEND_API_KEY`, `IRIS_SESSION_SECRET` ao cliente HTML
- UI **não** armazena tokens em `sessionStorage` — autenticação via cookie HttpOnly após OTP
- Tokens Meta criptografados em repouso na tabela `meta_tokens` (v1-S4)

## Contas (v1.31)

- A sessão carrega o id da conta. O cliente não escolhe o arquivo por parâmetro. Sessão sem esse id não abre o SQLite editorial.
- Quem recebe OTP e abre conta segue `IRIS_TENANT_SIGNUP`. `allowlist` aceita `IRIS_ADMIN_EMAIL` e `IRIS_ALLOWED_EMAILS`. `closed` não abre conta nova. Fora de produção, omitir a variável abre conta para qualquer email confirmado. Em produção a variável é obrigatória e `allowlist` sem nenhum email impede o boot. O modelo de produção (`.env.docker.example`) define `allowlist`, no Compose ou no painel.
- App id, app secret e verify token da Meta ficam no servidor da Iris. O HMAC do webhook e o OAuth usam esse secret. O evento chega em `/webhooks/meta` e a Iris abre o SQLite da conta cujo Instagram conectado é o `entry.id`. Id desconhecido não grava em banco nenhum.
- O `state` do OAuth é assinado e tem prazo.
- O isolamento é de arquivo entre contas. O processo da Iris lê o arquivo da conta para publicar.

## API hardening

- JSON body size limit (16 KB default)
- Rate limit básico em rotas públicas (webhook)
- CORS restrito em produção (mesma origem para UI)
- Validação de entrada em todas as mutações

## Agent safety

- Agentes **não** recebem credenciais Meta nem path do SQLite
- Apenas endpoints documentados em `07_api_contracts` e tools MCP listadas no mesmo doc
- `agent_runs` audita cada execução de resposta automática

## Lojas virtuais (v1.19)

| Regra | Detalhe |
| ----- | ------- |
| Credenciais | User Token / Secret Yampi em `store_connections.encrypted_credentials` — mesma chave `IRIS_TOKEN_ENCRYPTION_KEY` que Meta/LLM |
| API admin | Secrets nunca retornados após create; resposta expõe apenas `hasCredentials: true` |
| Logs | Proibido logar headers Yampi ou credenciais decifradas |
| Escopo | Conectar/sync exige sessão admin; tools MCP de loja (v1.19-S3) seguirão escopo agent |

## MCP

| Regra | Detalhe |
| ----- | ------- |
| Segredo | `IRIS_MCP_CONNECTION_CODE` — mesmo nível de sigilo que `IRIS_AGENT_TOKEN` |
| Distinção | Tokens REST e MCP são independentes; revogar um não invalida o outro |
| Comparação | `timingSafeEqual` via `src/domain/secret-compare.ts` (validate + transport) |
| Boot guard | Em `NODE_ENV=production`, server não sobe sem código MCP configurado |
| Escopo | Tools MCP = escopo agent (posts, assets, comments) — sem admin nem Meta; **policy configurável** em Preferências → Permissões MCP (preset + domínio × leitura/edição/deleção) |
| Transporte | `POST /mcp` exige Bearer no header — não expor código em query string em produção |
| HTTPS | Clientes remotos (ChatGPT, Claude cloud) exigem URL pública HTTPS |

Setup e troubleshooting: `docs/architecture/mcp-integration.md`.

## Agente local (credenciais)

| Regra | Detalhe |
| ----- | ------- |
| Arquivo | `iris-agent/iris.credentials.json` — **gitignored** |
| Pacote | `iris-agent/` — kit `.agent/` Meridian + `publications/` (portável; sem Node) |
| Conteúdo | `apiUrl` + `agentToken`; opcionalmente `mcpUrl` + `mcpConnectionCode` — **sem** tokens Meta |
| Espelhamento | `agentToken` deve ser idêntico a `IRIS_AGENT_TOKEN` no `iris-app/.env` do server |
| Geração | `openssl rand -hex 32` — rotacionar se vazamento suspeito |
| HTTP | Bloqueado em `NODE_ENV=production`; em dev, HTTP só para localhost com `insecureAllowHttp: true` |
| Diagnóstico | `curl` com Bearer — ver skill `push-publication` / `credentials-contract.md` |

## Data sensitivity

- Comentários IG podem conter PII (username, texto) — não logar corpo completo em produção
- Backup do SQLite contém dados editoriais — proteger volume de disco

## Compliance notes

- Compliance: respostas automáticas devem respeitar políticas Meta; barreiras `crisis` / `hate_violence` usam texto canned (CVV 188 em pt-BR) sem persona de marca
- v1: uma conta; sem GDPR multi-tenant complexo
