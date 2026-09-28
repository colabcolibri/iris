# 03 — Variáveis de ambiente

**Tempo:** ~10 min · **Quem:** quem faz deploy

## O que você vai fazer neste guia

Vai colocar no servidor (ou no `.env` local) **todas** as credenciais Meta que você copiou no passo **02**. Nada disso vai para o git.

Ao terminar, o Iris sobe sem erro de configuração Meta e está pronto para webhooks (passo **04**) e OAuth (passo **05**).

## Antes de começar

- Ter concluído o [02 — Criar app na Meta](02-criar-app-meta.md).
- Saber seu domínio público (ex.: `https://iris.seudominio.com`).

Arquivos de referência no repositório:

| Arquivo | Uso |
| ------- | --- |
| `iris-app/.env.example` | Nomes do processo. Copie para `iris-app/.env`. |
| `.env.docker.example` | Os mesmos nomes, com os valores do container. Copie para `.env.docker` na raiz. |
| `iris-app/.env` | Local — **gitignored** |

## Passo 1 — Produção (Railway, VPS, etc.)

1. Abra o painel do host (ex.: Railway → serviço **iris** → **Variables**).
2. Para **cada** variável da tabela abaixo, crie uma linha com o valor do passo 02.
3. **Salve** e aguarde o redeploy (ou reinicie o processo manualmente).

**Como saber que deu certo:** logs do servidor sem mensagem de “Meta config missing” / variável obrigatória ausente.

## Passo 2 — Desenvolvimento local

1. Na pasta `iris-app/`, copie `.env.example` → `.env` (se ainda não existir).
2. Preencha o bloco Meta abaixo com seus valores.
3. Rode `pnpm dev` e confira que o servidor inicia em `http://127.0.0.1:8792`.

## Passo 3 — Preencher variáveis obrigatórias

Substitua `SEU-DOMINIO` pelo host real (sem barra no final):

```env
# URL que a Meta e o MCP conseguem acessar (HTTPS em produção)
IRIS_PUBLIC_BASE_URL=https://SEU-DOMINIO

# Instagram Login — Business login settings (NÃO use o App ID de "Básico")
META_INSTAGRAM_APP_ID=cole_aqui
META_INSTAGRAM_APP_SECRET=cole_aqui

# Deve bater com IRIS_PUBLIC_BASE_URL
META_OAUTH_REDIRECT_URI=https://SEU-DOMINIO/auth/meta/callback

# Mesmo valor que você vai cadastrar no painel Meta (passo 04)
META_WEBHOOK_VERIFY_TOKEN=cole_o_openssl_rand_aqui

# Mesma versão do painel Webhooks (ex.: v21.0)
META_GRAPH_API_VERSION=v21.0

# Configurações → Básico do app Meta (para HMAC do webhook)
META_APP_ID=cole_aqui
META_APP_SECRET=cole_aqui

# Gere com: openssl rand -hex 32
IRIS_TOKEN_ENCRYPTION_KEY=cole_64_caracteres_hex
```

### O que cada uma faz (resumo)

| Variável | Para quê |
| -------- | -------- |
| `IRIS_PUBLIC_BASE_URL` | URLs de mídia, OAuth, webhooks |
| `META_INSTAGRAM_*` | Login Instagram no admin |
| `META_OAUTH_REDIRECT_URI` | Meta redireciona após autorizar |
| `META_WEBHOOK_VERIFY_TOKEN` | Meta valida seu endpoint na 1ª vez |
| `META_APP_ID` / `META_APP_SECRET` | Assinatura HMAC dos webhooks |
| `IRIS_TOKEN_ENCRYPTION_KEY` | Criptografa tokens no SQLite |

## Passo 4 — Variáveis de DMs (só depois dos guias 06 e 07)

Não preencha agora se ainda não configurou Handover:

```env
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
```

## O que NÃO colocar no `.env`

| Credencial | Onde fica |
| ---------- | --------- |
| Access token Instagram (long-lived) | Gerado no OAuth → banco SQLite (`meta_tokens`) ao conectar no admin |
| `META_ACCESS_TOKEN` legado | **Não usar** — fluxo é OAuth pelo admin |

## Checklist final

- [ ] `IRIS_PUBLIC_BASE_URL` é **HTTPS** em produção
- [ ] `META_OAUTH_REDIRECT_URI` = `{IRIS_PUBLIC_BASE_URL}/auth/meta/callback`
- [ ] Instagram App ID ≠ App ID de Básico
- [ ] Secrets só no painel / `.env` local (nunca no git)
- [ ] Servidor reiniciado após salvar variáveis

## Próximo passo

→ [04 — Webhooks](04-webhooks.md)
