# Iris docs site (Starlight)

Fonte dos guias públicos PT/EN. **Não é um site separado** — o build vai para `../public/docs/` e o Iris serve em **`/docs/`**.

## Build (obrigatório para ver no Iris)

```bash
cd iris-app
pnpm docs:build
# ou junto com o admin:
pnpm build:admin
```

Depois: `http://127.0.0.1:8792/docs/` (com `pnpm dev` ou `pnpm start`).

## Editar conteúdo

| Seção | Fonte PT (repo) |
| ----- | ---------------- |
| Início | `docs/inicio/README.md` |
| Guia de uso | `docs/uso/*.md` |
| Guia de configuração | `docs/meta/*.md` (sync → `configuracao/`) |
| Referência técnica | `docs/meta/referencia-tecnica.md` (sync → `dev/`) |
| EN | `scripts/build-en-content.mjs` |

O `pnpm docs:build` roda `sync-docs-content.mjs` + `build-en-content.mjs` automaticamente.

## Preview isolado (opcional)

```bash
pnpm docs:dev      # porta 4321, base /docs
pnpm docs:preview
```

## Config

`astro.config.mjs` — `base: "/docs"`, sidebar (uso + configuração), i18n, branding.
