# Iris docs site (Starlight)

Fonte dos guias públicos PT/EN. Build → `../public/docs/`, servido em **`/docs/`**.

## Build

```bash
cd iris-app
pnpm docs:build
```

## Fontes de conteúdo

| Seção | Repo | Starlight |
| ----- | ---- | --------- |
| Rotas (redirects) | `docs-site/docs-routes.json` | runtime + static stubs |
| Início | `docs/inicio/` | `inicio/` |
| Uso | `docs/uso/` | `uso/` |
| Configuração | `docs/configuracao/` | `configuracao/` |
| Referência dev | `docs/configuracao/referencia-tecnica.md` | `dev/` |
| EN | `scripts/build-en-content.mjs` | `en/` |

`pnpm docs:build` roda sync + EN + Astro + `fix-docs-routes.mjs`.

## Config

`astro.config.mjs` — sidebar, i18n, `base: "/docs"`.
