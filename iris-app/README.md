# Iris app

Mini-server Node do produto Iris. O workspace Meridian (docs, backlog) fica na raiz do repositório.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

UI: http://127.0.0.1:8792/ — faça login em `/login.html` com o email configurado em `IRIS_ADMIN_EMAIL`. Em dev, com `IRIS_EMAIL_PROVIDER=logging`, o código OTP aparece no terminal do servidor.

Ver `../docs/` para arquitetura, API e backlog.
