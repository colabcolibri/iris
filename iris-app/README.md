# Iris app

Mini-server Node do produto Iris. O workspace Meridian (docs, backlog) fica na raiz do repositório.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

UI: http://127.0.0.1:8792/ — faça login em `/login.html` com o email configurado em `IRIS_ADMIN_EMAIL`.

**Dev (email):** suba o Mailpit (`mailpit` — SMTP `:1025`, UI `:8025`) e rode `pnpm dev`. Em dev o provider default é `smtp`; os OTP aparecem no Mailpit.

Ver `../docs/` para arquitetura, API e backlog.
