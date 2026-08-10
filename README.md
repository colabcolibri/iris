<p align="center">
  <img src="iris-app/admin/public/assets/iris-logo.png" alt="Iris" width="96" height="96" />
</p>

<h1 align="center">Iris</h1>

<p align="center">
  <strong>O gestor editorial do Instagram feito para humanos e agentes de IA.</strong><br />
  Calendário, agendamento, publicação automática e inbox de comentários — com API REST e MCP nativos.
</p>

<p align="center">
  <a href="#o-problema">O problema</a> ·
  <a href="#por-que-iris">Por que Iris</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="#agentes-de-ia">Agentes de IA</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#documentação">Documentação</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node 22+" />
  <img src="https://img.shields.io/badge/typescript-5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/sqlite-embedded-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/MCP-native-8B5CF6?logo=openai&logoColor=white" alt="MCP" />
  <img src="https://img.shields.io/badge/instagram-graph_API-E4405F?logo=instagram&logoColor=white" alt="Instagram Graph API" />
</p>

---

## O problema

Gerenciar Instagram hoje costuma ser um Frankenstein:

| Sem Iris | Com Iris |
| -------- | -------- |
| Planilhas, notas e lembretes no celular | Calendário editorial centralizado |
| Agendar post = abrir app manualmente | Worker publica no horário via Graph API |
| Imagens espalhadas em pastas locais | Mídia no servidor, otimizada e pronta para publicar |
| Comentários perdidos na notificação do IG | Inbox sincronizada com hierarquia e auto-reply |
| Agentes de IA sem API segura para postar | REST + MCP — Cursor, Claude e ChatGPT operam o calendário |

**Iris** é um mini-server Node com interface web que resolve isso de ponta a ponta. E o melhor: é **agnóstico de ferramenta de criação**. Não importa se o conteúdo veio do Canva, de um export manual ou de outro agente — você monta `post.md` + imagens e o Iris cuida do resto.

---

## Por que Iris

### Feito para agentes de IA, não adaptado depois

A maioria das ferramentas de social media foi pensada para cliques humanos. Iris nasceu com dois operadores em mente: **você no navegador** e **seu agente no Cursor**.

- **Servidor MCP** com tools editoriais (`iris_create_post`, `iris_list_posts`, `iris_upload_post_asset`, …)
- **API REST** com Bearer token para automação em lote
- **Skill `push-publication`** — o agente lê `publications/`, valida e envia tudo via API
- **SSE em tempo real** — a UI atualiza quando o agente ou o worker faz algo

### Um servidor, responsabilidade clara

```txt
Agente local  →  monta conteúdo (qualquer fonte)
Iris server   →  armazena, agenda, publica, sincroniza comentários
Instagram     →  destino final via Graph API oficial
```

Sem acoplamento a Casper, Canva ou qualquer criador. O Iris não precisa saber de onde veio o conteúdo — só precisa da legenda, das imagens e do horário.

### Self-hosted e sob seu controle

- SQLite + arquivos em disco — sem vendor lock-in de banco ou object storage
- Tokens Meta criptografados no vault do servidor
- Login OTP por email, sessão HttpOnly
- Deploy em Docker/Railway com volume persistente em `/app/data`

### Stack enxuta, sem magia

Node 22 nativo (`node:http`, `node:sqlite`), TypeScript, React 19, sharp para otimização de imagem. Sem Express, sem ORM, sem over-engineering.

---

## Como funciona

```mermaid
flowchart TB
  subgraph local ["Sua máquina"]
    Agent["Agente / Cursor / MCP client"]
    Pub["publications/<br/>post.md + imagens"]
    Browser["Navegador — admin React"]
  end

  subgraph iris ["Iris server"]
    API["API REST"]
    MCP["Servidor MCP"]
    UI["Admin UI"]
    Workers["Workers"]
    DB[("SQLite")]
    Media[("Mídia em disco")]
  end

  Meta["Instagram Graph API"]

  Agent --> Pub
  Pub -->|"push (REST)"| API
  Agent -->|"tools (MCP)"| MCP
  MCP --> API
  Browser --> UI
  UI --> API
  API --> DB
  API --> Media
  Workers --> Media
  Workers --> Meta
  Meta -->|"webhooks"| API
  API -->|"SSE"| Browser
```

### Fluxo típico — do rascunho ao feed

1. **Criar** — na UI ou via agente (`iris_create_post`)
2. **Subir mídia** — upload multipart ou base64 via MCP; o server redimensiona e converte para JPEG
3. **Agendar** — define `scheduled_at`; o worker publica no horário
4. **Acompanhar** — calendário mensal ou kanban por status (`draft` → `scheduled` → `published`)
5. **Comentários** — webhook Meta sincroniza; inbox na UI com auto-reply contextual (LLM opcional)

### Pacote local do agente

```txt
iris-agent/publications/lancamento-produto-x/
  post.md          # frontmatter YAML + legenda
  01.png
  02.png
```

```yaml
---
title: Lançamento produto X
scheduled_at: 2026-08-12T18:00:00.000Z
channel: instagram
status: ready
---

Legenda da publicação.

#produto #lançamento
```

O agente faz push → Iris cria o post, sobe as imagens, agenda e atualiza o `post.md` com `iris_post_id`.

Detalhes: [`docs/architecture/local-publications.md`](docs/architecture/local-publications.md).

---

## Funcionalidades

| Área | O que você ganha |
| ---- | ---------------- |
| **Calendário & kanban** | Visão mensal e por status — encontre rascunhos, agendados e publicados num relance |
| **Mídia** | Upload multipart, otimização automática (resize + JPEG) no servidor |
| **Agendamento** | Worker publica no horário exato via Graph API |
| **Comentários** | Inbox com hierarquia, sync por webhook e auto-reply contextual |
| **Meta OAuth** | Conexão Instagram pelo admin; tokens criptografados |
| **Auth** | Login OTP por email, sessão HttpOnly, rotas protegidas |
| **Tempo real** | SSE — a UI reage sem polling |
| **MCP** | Tools editoriais para Cursor, Claude Desktop e ChatGPT |
| **Agente local** | Kit portável `iris-agent/` — push em lote de `publications/` |

---

## Agentes de IA

Iris expõe **duas portas** para automação:

| Porta | Token | Melhor para |
| ----- | ----- | ----------- |
| **REST** (`/api/*`) | `IRIS_AGENT_TOKEN` | Push em lote de `publications/`, scripts, CI |
| **MCP** (`POST /mcp`) | `IRIS_MCP_CONNECTION_CODE` | Criar/editar posts ad hoc no chat, perguntar sobre o calendário |

### Tools MCP disponíveis

| Tool | O que faz |
| ---- | --------- |
| `iris_list_posts` | Lista posts com filtros de status e período |
| `iris_get_post` | Detalhes de um post + metadados de assets |
| `iris_create_post` | Cria post com legenda e agendamento |
| `iris_update_post` | Atualiza legenda, status ou horário |
| `iris_upload_post_asset` | Sobe imagem (base64) para um post |
| `iris_list_post_comments` | Comentários sincronizados de um post |

Setup por client: [`docs/architecture/mcp-integration.md`](docs/architecture/mcp-integration.md).

### Kit agente local

O pacote [`iris-agent/`](iris-agent/) é portável — copie a pasta, configure credenciais e use:

```bash
cd iris-agent
cp iris.credentials.example.json iris.credentials.json
# apiUrl + agentToken (mesmo IRIS_AGENT_TOKEN do server)
```

No Cursor: invoque `@iris-local` ou a skill `push-publication` para enviar `publications/` ao servidor.

---

## Repositório

Monorepo em três áreas:

| Caminho | Descrição |
| ------- | --------- |
| [`iris-app/`](iris-app/) | Servidor Node, API, admin React (Vite), workers e migrations SQLite |
| [`iris-agent/`](iris-agent/) | Kit portável do agente local — `publications/` + credenciais + skills Meridian |
| [`docs/`](docs/) | Documentação de produto, arquitetura, API e design system |

---

## Quick start

**Requisitos:** Node.js ≥ 22, [pnpm](https://pnpm.io/), conta Instagram Business/Creator + app Meta (para produção).

```bash
git clone https://github.com/colabcolibri/iris.git
cd iris/iris-app
cp .env.example .env
pnpm install
pnpm dev
```

Abra **http://127.0.0.1:8792** — um único processo serve API, UI e HMR em desenvolvimento.

**Email em dev:** suba o [Mailpit](https://github.com/axllent/mailpit) (SMTP `:1025`, UI `:8025`). Os códigos OTP aparecem na interface do Mailpit.

```bash
# Produção local (bundle estático)
pnpm build:admin
NODE_ENV=production pnpm start
```

**Testes:**

```bash
cd iris-app
pnpm test
```

---

## Deploy

O repositório inclui `Dockerfile` e `railway.toml` na **raiz** (build do monorepo → `iris-app/`).

| Item | Valor sugerido |
| ---- | -------------- |
| Volume | Monte em `/app/data` (SQLite + mídia) |
| Healthcheck | `GET /health` |
| Variáveis | Ver [`iris-app/.env.railway.example`](iris-app/.env.railway.example) |

**Checklist de produção:**

- `IRIS_PUBLIC_BASE_URL` — URL HTTPS pública
- `META_OAUTH_REDIRECT_URI` — `{base}/auth/meta/callback`
- Webhook Meta — `{base}/webhooks/meta`
- `IRIS_EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + remetente verificado
- `IRIS_TOKEN_ENCRYPTION_KEY` — chave forte (64 hex ou passphrase longa)

Configure secrets **apenas no painel do provedor**. Nunca commite `.env` com valores reais.

Guia completo: [`docs/08_environments.md`](docs/08_environments.md).

---

## Stack

| Camada | Tecnologia |
| ------ | ---------- |
| Runtime | Node 22+, TypeScript (strip types) |
| HTTP | `node:http` nativo |
| Dados | SQLite (`node:sqlite`) + migrations |
| UI | React 19, Vite, Tailwind, shadcn/ui |
| Mídia | `sharp` |
| IA | MCP SDK + tools editoriais |
| Email | SMTP (dev) / Resend (prod) |
| Meta | Instagram Graph API + webhooks |

---

## Documentação

| Doc | Conteúdo |
| --- | -------- |
| [`docs/00_scope.md`](docs/00_scope.md) | Escopo, personas e problema que resolve |
| [`docs/05_architecture.md`](docs/05_architecture.md) | Arquitetura, camadas e fluxos |
| [`docs/07_api_contracts.md`](docs/07_api_contracts.md) | Contratos REST |
| [`docs/08_environments.md`](docs/08_environments.md) | Variáveis e ambientes |
| [`docs/architecture/mcp-integration.md`](docs/architecture/mcp-integration.md) | MCP — Cursor, ChatGPT, Claude |
| [`iris-app/README.md`](iris-app/README.md) | Detalhes do pacote da aplicação |
| [`iris-agent/README.md`](iris-agent/README.md) | Kit agente local |

---

## Desenvolvimento com Meridian

Este repositório usa o protocolo [Meridian](https://github.com/colabcolibri/meridian) para backlog, user stories e phase docs. O kit vive em `.agent/`; o backlog em `.meridian/` (SQLite, gitignored).

```bash
python3 .agent/scripts/validate_meridian.py .
```

---

## Segurança

- Tokens Meta, LLM e chaves de sessão **somente no servidor**
- `.env`, `iris.credentials.json` e `data/` estão no `.gitignore`
- Admin protegido por OTP + cookie HttpOnly + gate server-side nas rotas SPA
- Agente REST e MCP usam tokens distintos com escopo limitado

Reporte vulnerabilidades pelo canal privado do mantenedor — não abra issue pública com detalhes de exploit.

---

## Licença

Código proprietário — **Colab Colibri**. Uso, cópia e distribuição apenas com autorização explícita. Ver [`iris-app/package.json`](iris-app/package.json) (`UNLICENSED`).

---

<p align="center">
  <img src="iris-app/admin/public/assets/iris-logo-32.png" alt="" width="20" height="20" />
  <sub>Iris — gestor editorial para Instagram, nativo para agentes de IA</sub>
</p>
