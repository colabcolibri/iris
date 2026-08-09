# Iris agent — workspace local

Pacote **portável** do agente editorial Iris. Não é aplicativo Node — é um **kit Meridian** (`.agent/`) + credenciais + rascunhos.

Copie a pasta `iris-agent/` inteira para outro lugar; ajuste `iris.credentials.json` e continue.

## Estrutura

```txt
iris-agent/
  .agent/                    # kit Meridian (skills, agents) — fonte canônica
  iris.credentials.json      # gitignored — sua config local
  iris.credentials.example.json
  publications/              # post.md + imagens por slug
  site/                      # desk estático (HTML/CSS/JS) — calendário + kanban
  README.md
```

## Setup

```bash
cd iris-agent
cp iris.credentials.example.json iris.credentials.json
```

1. `agentToken` = mesmo valor de `IRIS_AGENT_TOKEN` no `iris-app/.env` do server
2. `apiUrl` = URL do Iris (ex. `http://127.0.0.1:8792` em dev)
3. Em dev HTTP local: `"insecureAllowHttp": true`

## Adapters (Cursor / Claude / Codex)

```bash
./.agent/scripts/sync_cursor_kit.sh
```

Isso cria symlinks em `.cursor/skills/`, `.cursor/agents/`, etc. — padrão Meridian. **Não commitar** adapters.

## Uso

1. Abra a pasta `iris-agent` no Cursor (ou o monorepo `iris/` inteiro)
2. Invoque `@iris-local` ou a skill `push-publication`
3. O agente lê `iris.credentials.json`, valida `publications/*/post.md` e chama a API Iris com `curl`

Não há `pnpm`, `node` nem processo rodando neste pacote.

## Desk estático (`site/`)

Mini site **offline-first** com calendário e kanban das postagens. HTML, CSS e JS puros — sem build.

No monorepo, o `iris-app` serve o desk em **`/desk/`** — um único endereço:

```bash
cd iris-app && pnpm dev
# admin:  http://127.0.0.1:8792/
# desk:   http://127.0.0.1:8792/desk/
```

- Lê `iris.credentials.json` na raiz de `iris-agent/` (exposto em `/desk/iris.credentials.json`)
- Sincroniza com `GET /api/posts` no mesmo host (Bearer agent) — sem CORS em dev
- Cache em `localStorage` + service worker para uso offline após primeiro load
- Responsivo (mobile / tablet / desktop)

**Pacote portável** (cópia só de `iris-agent/`): sirva `site/` com qualquer host estático local se não tiver o `iris-app` por perto — o fluxo principal no monorepo é `/desk/` no server Iris.

O agente editorial continua via API/curl; o desk é a visão humana do mesmo calendário.

## Server

O Iris HTTP server fica em `iris-app/` (`pnpm dev`). Este pacote é só o **cliente agente**.
