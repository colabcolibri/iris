# 03 — Variáveis de ambiente

**Tempo:** ~10 min · **Quem:** quem faz deploy

## Objetivo

Colocar todas as credenciais Meta no servidor — **nunca** no git.

## Arquivos de referência no repo

| Arquivo | Uso |
| ------- | --- |
| `iris-app/.env.example` | Lista completa com comentários |
| `iris-app/.env.railway.example` | Nomes para Railway / produção |
| `iris-app/.env` | Local (gitignored) |

## Passo a passo — produção

1. Abra o painel do host (ex.: Railway → serviço **iris** → **Variables**).
2. Defina cada variável abaixo (valores do [passo 02](02-criar-app-meta.md)).
3. Salve e aguarde redeploy (ou reinicie o processo).

## Passo a passo — desenvolvimento local

1. Copie `iris-app/.env.example` → `iris-app/.env` (se ainda não existir).
2. Preencha o bloco Meta abaixo.
3. Suba o server: `pnpm dev` (ou comando do projeto).

## Variáveis obrigatórias (Meta)

```env
# URL pública — Meta e MCP precisam alcançar
IRIS_PUBLIC_BASE_URL=https://SEU-DOMINIO

# Instagram Login (Business login settings — NÃO o App ID de Básico)
META_INSTAGRAM_APP_ID=
META_INSTAGRAM_APP_SECRET=

# OAuth callback (mesmo domínio de IRIS_PUBLIC_BASE_URL)
META_OAUTH_REDIRECT_URI=https://SEU-DOMINIO/auth/meta/callback

# Webhook — mesmo valor cadastrado no painel Meta (passo 04)
META_WEBHOOK_VERIFY_TOKEN=

# Versão Graph API — use a mesma nos Webhooks do painel (v21.0+)
META_GRAPH_API_VERSION=v21.0

# HMAC dos webhooks (App ID/Secret de Configurações → Básico)
META_APP_ID=
META_APP_SECRET=

# Criptografia do vault de tokens no SQLite
IRIS_TOKEN_ENCRYPTION_KEY=<64 hex — openssl rand -hex 32>
```

## Variáveis opcionais — DMs avançado

Só depois dos guias **06** e **07**:

```env
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
```

## Variáveis que NÃO vão no .env

| Credencial | Onde fica |
| ---------- | --------- |
| Access token Instagram (long-lived) | Gerado no OAuth → tabela `meta_tokens` no SQLite (conexão no admin) |
| `META_ACCESS_TOKEN` legado | Não usar — fluxo é OAuth pelo admin |

## Checklist

- [ ] `IRIS_PUBLIC_BASE_URL` é HTTPS em produção
- [ ] `META_OAUTH_REDIRECT_URI` = `{IRIS_PUBLIC_BASE_URL}/auth/meta/callback`
- [ ] Instagram App ID ≠ App ID de Básico (são campos diferentes)
- [ ] Secrets só no painel / `.env` local gitignored
- [ ] Servidor reiniciado após mudanças

## Próximo passo

→ [04 — Webhooks](04-webhooks.md)
