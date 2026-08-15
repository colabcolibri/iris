<p align="center">
  <img src="iris-app/admin/public/assets/iris-logo.png" alt="Íris" width="96" height="96" />
</p>

<h1 align="center">Íris</h1>

<p align="center">
  <strong>Sua agente editorial e gestora de mídias sociais.</strong><br />
  A Íris publica no seu Instagram e responde quem comenta, sempre na voz da sua marca — com o nível de autonomia que você escolher.
</p>

<p align="center">
  <a href="README.en.md">English</a> ·
  <a href="#o-que-é">O que é</a> ·
  <a href="#o-que-ela-faz">O que ela faz</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="#respostas-a-comentários">Respostas a comentários</a> ·
  <a href="#agentes-externos-mcp--rest">Agentes externos</a> ·
  <a href="#interface">Interface</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#documentação">Documentação</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node 22+" />
  <img src="https://img.shields.io/badge/typescript-5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/sqlite-embedded-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/MCP-native-8B5CF6?logo=openai&logoColor=white" alt="MCP" />
  <img src="https://img.shields.io/badge/instagram-graph_API-E4405F?logo=instagram&logoColor=white" alt="Instagram Graph API" />
  <img src="https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue" alt="PolyForm Noncommercial 1.0.0" />
</p>

<p align="center">
  <img src="docs/readme/calendar.webp" alt="Calendário editorial da Íris com post agendado" width="900" />
</p>

---

## O que é

A **Íris** é um servidor self-hosted com painel web que cuida do Instagram da marca: agenda, publica no horário e **responde comentários na voz da marca**.

Três papéis, sem misturar:

| Quem | O que faz |
| ---- | --------- |
| **Você no painel** | Planeja, revisa no calendário/kanban, configura persona e autonomia |
| **A própria Íris** | Publica no horário e opera o pipeline de respostas a comentários |
| **Agentes externos** (Cursor, Claude, ChatGPT) | Criam/editam/agendam posts via MCP ou REST — **não** publicam sozinhos |

---

## O que ela faz

- **Calendário e kanban** — rascunhos, agendados e publicados num só lugar
- **Publicação no horário** — worker envia para o Instagram via Graph API oficial
- **Respostas a comentários** — lê o comentário e o contexto do post; responde com critério, persona e limites que você define
- **MCP / REST opcional** — seu assistente de IA cria e agenda posts sem abrir o painel
- **Self-hosted** — SQLite + mídia em disco; tokens Meta criptografados; app Meta próprio por deploy

---

## Como funciona

Quatro passos, do planejamento à conversa:

1. **Planejar** — você (ou um agente externo) cria a legenda e sobe as imagens
2. **Revisar** — calendário ou kanban; nada sai sem passar por aí
3. **Publicar** — no `scheduled_at`, o worker da Íris publica no Instagram
4. **Responder** — quando alguém comenta, a Íris decide, rascunha e (se permitido) responde na voz da marca

```txt
Painel / MCP / REST  →  cria, edita, agenda, sobe mídia
Íris (server+worker) →  publica no horário, sincroniza e responde comentários
Instagram (Graph API)→  destino final
```

Pacote local opcional (`publications/…/post.md` + imagens): [`docs/architecture/local-publications.md`](docs/architecture/local-publications.md).

---

## Respostas a comentários

Feature central: a Íris não só publica — ela **conversa** com quem comenta, com guardrails.

### O que acontece

1. Chega um comentário (webhook Meta ou sync)
2. A Íris monta o contexto (texto do comentário + post / carrossel)
3. Pipeline multi-etapa: **decidir se responde** → **rascunho** → **revisão do próprio texto**
4. Resultado: rascunho para aprovação, envio automático dentro dos limites, ou skip (não vale responder / conteúdo bloqueado)

### Persona e limites

No admin você define tom, idioma, assinatura e limites (ex.: tamanho máximo). A resposta segue a persona da marca — não um tom genérico de chatbot.

### Autonomia configurável

| Modo | Comportamento |
| ---- | ------------- |
| **Aprovar antes** | Rascunho fica no painel; você libera o envio |
| **Auto dentro dos limites** | Envia sozinha quando passa na triagem e na verificação |
| **Delay** | Espera configurável antes do envio — última chance de revisar |
| **Por post ou global** | Liga/desliga auto-reply em tudo ou só em posts específicos |

### Simulação e histórico

- **Simulador** — testa persona e regras sem publicar de verdade
- **Audit trail** — cada resposta automática registra os passos (triagem → rascunho → verificação) para inspeção no painel

### Anti prompt-injection

Comentários às vezes tentam “hackear” o assistente com instruções escondidas. A Íris trata o texto do comentário como **entrada não confiável**: não deixa um comentário mudar tom, idioma ou regras da marca.

---

## Agentes externos (MCP / REST)

Outro tipo de IA — **não** é o pipeline de comentários acima.

Cursor, Claude ou ChatGPT podem criar e agendar posts. Eles **não** publicam no Instagram: a publicação fica com o worker da Íris no horário agendado.

| Porta | Credencial | Uso típico |
| ----- | ---------- | ---------- |
| **REST** (`/api/*`) | `IRIS_AGENT_TOKEN` | Scripts, CI, push de `publications/` |
| **MCP** (`POST /mcp`) | código de conexão (UI ou `IRIS_MCP_CONNECTION_CODE`) | Chat: criar/editar posts, mídia, calendário, comentários |

Tools MCP (resumo): posts, mídia, comentários, DMs (`iris_list_conversations`, `iris_get_message_reply_context`), catálogo de produtos (`iris_list_products`, …), lojas Yampi (`iris_list_store_connections`, `iris_sync_store_catalog`, …), persona/conteúdo do agente, simulador e insights — ver tabela completa em `docs/07_api_contracts.md` (45 tools).

Setup por client: [`docs/architecture/mcp-integration.md`](docs/architecture/mcp-integration.md).

---

## Interface

Calendário, kanban, inbox de comentários, persona e conexão MCP — no mesmo admin.

<p align="center">
  <strong>Pipeline kanban</strong><br />
  <img src="docs/readme/kanban.webp" alt="Kanban por status" width="880" />
</p>

<table>
  <tr>
    <td align="center" width="50%">
      <strong>Inbox de comentários</strong><br />
      <img src="docs/readme/comments.webp" alt="Inbox de comentários" width="420" />
    </td>
    <td align="center" width="50%">
      <strong>Persona da marca</strong><br />
      <img src="docs/readme/persona.webp" alt="Persona da marca para respostas" width="420" />
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <strong>Conexão MCP</strong> — Cursor, ChatGPT, Claude<br />
      <img src="docs/readme/mcp-settings.webp" alt="Configuração MCP" width="420" />
    </td>
  </tr>
</table>

---

## Quick start

**Requisitos:** Node.js ≥ 22, [pnpm](https://pnpm.io/). Para publicar no Instagram: conta Business/Creator + [app Meta no seu deploy](docs/meta/README.md).

```bash
git clone https://github.com/colabcolibri/iris.git
cd iris/iris-app
cp .env.example .env
pnpm install
pnpm dev
```

Abra **http://127.0.0.1:8792** — um processo serve API, UI e HMR.

**Email em dev:** [Mailpit](https://github.com/axllent/mailpit) (SMTP `:1025`, UI `:8025`) para ver os códigos OTP.

```bash
# Produção local (bundle estático)
pnpm build:admin
NODE_ENV=production pnpm start
```

```bash
cd iris-app && pnpm test
```

Detalhes do workspace: [`iris-app/README.md`](iris-app/README.md).

---

## Repositório

| Caminho | Descrição |
| ------- | --------- |
| [`iris-app/server/`](iris-app/server/) | API HTTP, workers, MCP, migrations SQLite |
| [`iris-app/admin/`](iris-app/admin/) | SPA React (Vite) |
| [`iris-app/public/`](iris-app/public/) | Bundle estático do admin (output do Vite) |
| [`docs/`](docs/) | Escopo, arquitetura, API, design system |
| [`iris-agent/`](iris-agent/) | Kit local opcional (`publications/`, scripts MCP) |

> `publications/` e credenciais ficam na sua máquina — não entram no git.

---

## Deploy

`Dockerfile` e `railway.toml` na **raiz** (build → `iris-app/`). Volume em `/app/data`. Healthcheck: `GET /health`.

Checklist resumido: `IRIS_PUBLIC_BASE_URL`, app Meta do **operador do deploy**, webhook `{base}/webhooks/meta`, Resend em produção, `IRIS_TOKEN_ENCRYPTION_KEY`. Secrets só no painel do provedor.

Guia: [`docs/08_environments.md`](docs/08_environments.md) · variáveis: [`iris-app/.env.railway.example`](iris-app/.env.railway.example).

---

## Stack

Node 22 + TypeScript · `node:http` · SQLite (`node:sqlite`) · React 19 / Vite / Tailwind · `sharp` · MCP SDK · SMTP/Resend · Instagram Graph API + webhooks.

---

## Documentação

| Doc | Conteúdo |
| --- | -------- |
| [`docs/00_scope.md`](docs/00_scope.md) | Escopo e problema |
| [`docs/05_architecture.md`](docs/05_architecture.md) | Arquitetura e fluxos (incl. agente de replies) |
| [`docs/07_api_contracts.md`](docs/07_api_contracts.md) | Contratos REST |
| [`docs/08_environments.md`](docs/08_environments.md) | Variáveis e ambientes |
| [`docs/meta/README.md`](docs/meta/README.md) | Instagram / Meta — guias passo a passo (01–08) |
| [`iris-app/docs-site/`](iris-app/docs-site/) | Fonte Starlight — build → **`/docs/`** no Iris (`pnpm docs:build`) |
| [`docs/architecture/docs-site.md`](docs/architecture/docs-site.md) | Arquitetura do site de documentação |
| [`docs/architecture/mcp-integration.md`](docs/architecture/mcp-integration.md) | MCP — Cursor, ChatGPT, Claude |
| [`docs/architecture/diagrams/iris-reply-agent-flow.md`](docs/architecture/diagrams/iris-reply-agent-flow.md) | Fluxo do agente de comentários |

Backlog Meridian (opcional, não faz parte do runtime): [`AGENTS.md`](AGENTS.md).

---

## Segurança

- Tokens Meta, LLM e sessão **só no servidor**
- Admin: OTP por email + cookie HttpOnly + gate nas rotas SPA
- REST e MCP usam credenciais distintas, escopo limitado
- Comentários tratados como entrada não confiável no pipeline de reply

Reporte vulnerabilidades pelo canal privado do mantenedor — não abra issue pública com detalhes de exploit.

---

## Licença

[PolyForm Noncommercial License 1.0.0](LICENSE) — **Colab Colibri**.

Uso, modificação e distribuição gratuitos para fins **não comerciais**. Uso comercial requer autorização explícita do mantenedor.

---

<p align="center">
  <img src="iris-app/admin/public/assets/iris-logo-32.png" alt="" width="20" height="20" />
  <sub>Íris — publica no horário e responde quem comenta, na voz da sua marca</sub>
</p>
