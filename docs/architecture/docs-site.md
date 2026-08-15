---
title: Docs site (Starlight)
status: approved
version: 1.1
updated: 2026-08-15
depends_on: [05_architecture.md, 08_environments.md]
blocks: []
---

# Docs site — Starlight PT/EN em `/docs`

## Objective

Documentação pública para operadores e deployers, **no mesmo host do Iris** em `/docs/` — sem subdomínio, sem porta extra, sem deploy separado.

## Package e saída

| Item | Path |
| ---- | ---- |
| Fonte (Starlight) | `iris-app/docs-site/` |
| Build output | `iris-app/public/docs/` |
| URL pública | `{IRIS_PUBLIC_BASE_URL}/docs/` |
| Config Astro | `base: "/docs"`, `outDir: "../public/docs"` |

## HTTP

O `http-server` serve arquivos de `public/docs/` para paths `/docs/*`, com redirect `GET /docs` → `/docs/`. Em dev, o Vite do admin **não** intercepta `/docs` — cai direto no static.

## Locales

| Locale | URL prefix | Content path |
| ------ | ---------- | -------------- |
| Português (default) | `/docs/` | `src/content/docs/` |
| English | `/docs/en/` | `src/content/docs/en/` |

## Content sources

```mermaid
flowchart LR
  MetaMd["docs/meta/*.md"]
  Sync["sync-meta-content.mjs"]
  EnBuild["build-en-content.mjs"]
  Starlight["docs-site"]
  Public["public/docs/"]
  HTTP["GET /docs/*"]

  MetaMd --> Sync --> Starlight
  EnBuild --> Starlight
  Starlight --> Public --> HTTP
```

## Commands

From `iris-app/`:

```bash
pnpm docs:build    # → public/docs/
pnpm build:admin   # admin + docs
```

Dev: após `pnpm docs:build`, acesse `http://127.0.0.1:8792/docs/` com `pnpm dev`.

## Related

- `docs/meta/README.md` — fonte PT
- `docs/08_environments.md` — § Site de documentação
- EPIC-20 / v1.30
