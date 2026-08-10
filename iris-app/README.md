# Iris app

Pacote principal do **Iris** — API HTTP, admin React, workers e persistência SQLite.

Documentação de produto e arquitetura: [`../docs/`](../docs/).  
README do repositório: [`../README.md`](../README.md).

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `pnpm dev` | Servidor único em `http://127.0.0.1:8792` (API + UI + HMR) |
| `pnpm build:admin` | Build do admin → `public/` |
| `pnpm start` | Produção (`NODE_ENV=production`) |
| `pnpm test` | Testes Node (`src/` + `test/`) |
| `pnpm typecheck` | TypeScript |

## Configuração

```bash
cp .env.example .env
pnpm install
pnpm dev
```

- **Dev:** email via SMTP/Mailpit (default quando `NODE_ENV !== production`)
- **Prod:** `IRIS_EMAIL_PROVIDER=resend` — ver [`.env.railway.example`](.env.railway.example) para lista de variáveis (somente placeholders)
- **Instagram:** cada deploy usa app Meta próprio — guia em [`../docs/architecture/meta-integration.md`](../docs/architecture/meta-integration.md)

Login em `/login` com o email em `IRIS_ADMIN_EMAIL`.

## Estrutura

```txt
src/
  api/           # HTTP server, rotas, auth
  domain/        # regras de negócio
  adapters/      # SQLite, Meta, email, …
  workers/       # publish scheduler, comment responder
admin/           # UI React (Vite)
migrations/      # SQL versionado
public/          # bundle estático (output do Vite)
```

## Deploy (Railway)

Deploy na **raiz do monorepo** — `../Dockerfile` + `../railway.toml`. Volume em `/app/data`.

## Agente local

O agente não vive neste pacote. Use [`../iris-agent/`](../iris-agent/) para `publications/` e push via API.
