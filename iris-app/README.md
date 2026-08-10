# Iris app

Mini-server Node do produto Iris. O workspace Meridian (docs, backlog) fica na raiz do repositório.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Abra **http://127.0.0.1:8792** — um único servidor com API, UI e hot reload (Vite embutido em dev).

**Produção local:** `pnpm build:admin` e `NODE_ENV=production pnpm start`.

**Railway (monorepo):** deploy na **raiz do repositório** — `Dockerfile` + `railway.toml` na raiz constroem `iris-app/`. Monte volume em `/app/data`. Variáveis: ver `.env.railway.example` (somente placeholders; valores reais só no painel Railway).

O diretório `public/` contém só o output do Vite + assets estáticos (`admin/public/`). O desk vanilla foi removido.

Login em `/login` com o email configurado em `IRIS_ADMIN_EMAIL`.

**Dev (email):** suba o Mailpit (`mailpit` — SMTP `:1025`, UI `:8025`) e rode `pnpm dev`. Em dev o provider default é `smtp`; os OTP aparecem no Mailpit.

## Agente local

O agente **não** fica neste pacote. Use o workspace portável **`../iris-agent/`** (kit Meridian + `publications/` + credenciais). Ver `../iris-agent/README.md`.

Ver `../docs/` para arquitetura, API e backlog.
