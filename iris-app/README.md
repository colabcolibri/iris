# Iris app

Workspace pnpm: **server** (API, workers, MCP, SQLite) + **admin** (React/Vite).

Produto e arquitetura: [`../docs/`](../docs/) · README do repositório: [`../README.md`](../README.md).

## Layout

```txt
iris-app/
  server/    # API HTTP, workers, MCP, migrations, testes
  admin/     # SPA React (Vite)
  public/    # bundle estático (output do Vite)
  scripts/   # utilitários do workspace (ex.: clean-vite-assets)
```

| Pasta | Conteúdo |
| ----- | -------- |
| `server/src/` | API, domain, adapters, workers, MCP |
| `server/migrations/` | SQL versionado |
| `server/test/` | Testes do server (+ smoke da UI) |
| `admin/` | UI React — ver [`admin/README.md`](admin/README.md) |
| `public/` | Assets servidos em produção após `pnpm build:admin` |

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `pnpm dev` | Servidor único em `http://127.0.0.1:8792` (API + UI + HMR) |
| `pnpm build:admin` | Build do admin → `public/` |
| `pnpm start` | Produção (`NODE_ENV=production`) |
| `pnpm test` | Testes Node (`@iris/server`) |
| `pnpm typecheck` | TypeScript do server |

## Configuração

```bash
cp .env.example .env
pnpm install
pnpm dev
```

- **Dev:** email via SMTP/Mailpit (default quando `NODE_ENV !== production`)
- **Prod:** `IRIS_EMAIL_PROVIDER=resend` — ver [`.env.railway.example`](.env.railway.example)
- **Instagram:** app Meta próprio por deploy — [`../docs/architecture/meta-integration.md`](../docs/architecture/meta-integration.md)

Login em `/login` com o email em `IRIS_ADMIN_EMAIL`.

## Deploy

Na **raiz do monorepo** — `../Dockerfile` + `../railway.toml`. Volume em `/app/data`.

## Kit local (opcional)

Pacotes `publications/` e scripts MCP ficam em [`../iris-agent/`](../iris-agent/) — não fazem parte deste workspace de runtime.
