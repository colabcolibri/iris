---
title: Admin demo mode
status: approved
version: 1.1
updated: 2026-08-12
depends_on: [02_security.md, 03_user_types.md, 05_architecture.md]
blocks: []
---

# Admin demo mode

## Objetivo

Oferecer uma **demonstração pública e interativa** do admin Iris em `/demo`, reutilizando as mesmas páginas e componentes do ambiente real, mas alimentadas por **fixtures locais no client**. O visitante explora calendário, comentários, webhooks, execuções do agente, settings e simulador **sem login**, **sem cookie de sessão admin** e **sem chamadas à API real**.

## Princípios

| Princípio | Regra |
| --------- | ----- |
| Isolamento | Demo e admin real são fluxos separados; `/demo` nunca autentica nem herda `iris_session` |
| Client-only (v1.17) | Fixtures e interceptação em `api.ts`; nenhum endpoint `/api/demo/*` no server nesta versão |
| Read-only efetivo | Mutações retornam sucesso simulado ou toast “modo demonstração”; nada persiste |
| Sem integrações externas | Sem Meta, LLM, MCP, SSE real ou upload para o server |
| Reuso máximo | Mesmas pages (`DashboardPage`, `CommentsPage`, …) sob `DemoModeProvider` + `DemoLocaleProvider` |
| Transparência | Banner fixo + (em EN) faixa de disclaimer sobre UI ainda em PT |
| i18n de conteúdo | Fixtures PT (default) e overlay EN no client; shell do admin permanece em PT |

## Arquitetura

Diagrama companion (Meridian viewer): `docs/architecture/diagrams/iris-admin-demo-mode.md`.

## Rotas

| Rota | Auth | Comportamento |
| ---- | ---- | ------------- |
| `/demo` | Nenhuma | Dashboard com fixtures |
| `/demo/comments` | Nenhuma | Inbox e threads fictícias |
| `/demo/webhooks` | Nenhuma | Lista de eventos fake |
| `/demo/agent-runs` | Nenhuma | Execuções fictícias |
| `/demo/agent-simulator` | Nenhuma | Respostas pré-gravadas (sem LLM) |
| `/demo/settings` | Nenhuma | Formulários preenchidos, read-only efetivo |
| `/demo/persona` | Nenhuma | Persona e conteúdo editorial fake |
| `/admin/*` | OTP + cookie | Inalterado |

`ROUTES.demo.*` espelha `ROUTES.admin.*` com prefixo `/demo`. Links internos no shell demo usam o prefixo demo (sidebar, navegação via `useAppRoutes()`).

## Componentes (admin)

```txt
iris-app/admin/src/
  demo/
    demo-mode-context.tsx       # isDemoMode, banner, showDemoToast
    demo-locale-context.tsx     # locale PT/EN, reset de estado ao trocar
    demo-language-switcher.tsx  # PT · EN no header (à esquerda do pill do agente)
    locale.ts                   # DemoLocale + localStorage iris-demo-locale
    demo-api.ts                 # roteamento path → fixture / noop
    demo-state.ts               # estado em memória por locale
    demo-routes.ts              # prefixo /demo, useAppRoutes
    domain/managed-posts.ts     # espelha isManagedCommentPost do server
    fixtures/
      build-demo-posts.ts
      build-demo-comments.ts
      demo-post-templates.ts
      demo-comment-threads.ts
      posts.ts, comments.ts, persona.ts, settings.ts, simulator.ts
      i18n/                     # overlays EN (posts, threads, persona, settings, UI)
  components/layout/
    demo-app-layout.tsx         # AppShell + Outlet key={locale} (remount ao trocar idioma)
```

### Providers

- **`DemoModeProvider`** — `isDemoMode = true`; banner; `getDemoMode()` síncrono (`isDemoPath()` + flag do provider).
- **`DemoLocaleProvider`** — locale `pt` | `en`; persiste em `localStorage`; `resetDemoState()` ao trocar idioma.
- **`DemoAppLayout`** — mesmo shell do admin, sem `ProtectedRoute`.

### Isolamento de sessão

Mesmo com cookie `iris_session` no navegador (operador logado em outra aba):

- `AuthSessionProvider` em `/demo` força estado **anonymous** (`isDemoPath()` no mount e no `refresh`).
- `fetchAuthMe()` retorna `null` quando `getDemoMode()`.
- Nenhuma mutação demo atinge SQLite, Meta ou LLM.

### Interceptação de API

`getDemoMode()` é **síncrono**: considera a rota `/demo` (via `isDemoPath()`) antes do primeiro paint — evita race com `useEffect` do provider. `apiFetch` em `lib/api.ts` verifica `getDemoMode()` **antes** de `fetch`:

1. **GET** — `demoApiFetch` resolve fixture por path + query.
2. **POST/PATCH/DELETE** — retorna payload de sucesso mínimo ou toast; **nunca** chama o server.
3. **Upload (`FormData`)** — retorna asset fake com `URL.createObjectURL(file)` para preview local.
4. **Blob de mídia** — placeholders via `demo-images.ts`.
5. **SSE** — `subscribeRealtimeEvents` noop no demo.

Registry em `demo-api.ts` mapeia padrões de path (`/api/posts`, `/api/comments/inbox`, …) para handlers. Handlers retornam tipos de `@/lib/types`.

### Publicações (comentários)

Lista de posts em **Publicações** deriva de `isManagedCommentPost` (domínio compartilhado com o server): post com `ig_media_id`, status `published` ou `monitored`, e `published_at <= agora`. Não usa lista fixa de IDs.

## i18n do demo

| Camada | PT | EN |
| ------ | -- | -- |
| Shell (menus, labels, settings UI) | PT | PT (inalterado) |
| Fixtures (legendas, comentários, persona, simulador, webhooks) | default | overlay em `fixtures/i18n/*.en.ts` |
| Banner / toasts / pill do agente | `fixtures/i18n/ui.ts` | idem |

Em **EN**, faixa extra no topo explica que a interface segue em português e o conteúdo editorial está em inglês para demonstração.

Seletor **PT · EN** no header do demo (esquerda do pill do agente).

## Segurança

| Risco | Mitigação |
| ----- | --------- |
| Vazamento de sessão admin | `/demo` fora de `ProtectedRoute`; `apiFetch` não chama server; auth anônima em `isDemoPath()` |
| Bypass do mock via DevTools | Aceitável para v1.17 — demo não expõe dados reais; quem tem sessão admin já tem acesso |
| Chamada acidental à API real | Branch no início de `apiFetch`; testes manuais com Network tab vazio em `/demo` |
| LLM / Meta no simulador | `simulateAgentReply` retorna fixture com delay simulado; sem `POST /api/agent/simulate` real |
| Tokens no bundle | Proibido — fixtures são dados estáticos, sem secrets |
| Server SPA gate | `spa-route-policy.ts` trata `/demo` como rota pública (sem redirect para login) |

### O que o demo **não** faz

- Login OTP ou emissão de cookie
- CRUD real em SQLite
- Publicação ou resposta na Meta
- Geração ou revogação de connection code MCP
- Consumo de LLM (custo)
- SSE com eventos reais

## Fixtures — diretrizes de conteúdo

- Marca fictícia **Estúdio Nômade** (`estudio.nomade`).
- PT-BR por default; EN com threads, legendas e persona traduzidos.
- ~40 posts dinâmicos (10 mês anterior, 15 atual, 15 seguinte).
- Comentários realistas: usuário até ~140 chars; respostas da marca 200–300 chars.
- Posts em múltiplos status: `draft`, `scheduled`, `published`, `monitored`.
- Carrosséis com `user_tags` / `alt_text` de exemplo.
- Inbox com threads abertas, rascunho pendente e comentário já respondido.
- Meta status: conectado (demonstração) — handle fake, sem disconnect real.

## Landing

- Botão **Ver demo** / **View demo** no header da landing (`landing-nav.tsx`).
- CTA secundário **Ver demonstração** / **View demo** no hero.
- Ambos abrem `/demo` em **nova aba** (`target="_blank"`).
- Textos i18n em `landing/pt.ts` e `landing/en.ts` (`nav.demo`, `hero.demoCta`).

## Testes

| Tipo | Escopo |
| ---- | ------ |
| Manual | Navegar todas as rotas `/demo/*`; Network sem `/api/*` (exceto assets estáticos) |
| Manual | Trocar PT ↔ EN; conteúdo editorial muda; shell permanece PT |
| Build | `pnpm build` no admin exit 0 |
| Opcional (futuro) | Unit test em `demo-api.ts` para path matching |

## Evolução futura (fora v1.17)

- API read-only `/api/demo/*` no server com rate limit (defesa em profundidade).
- Analytics de uso do demo.
- Tour guiado (shepherd.js ou similar).
- i18n completa do shell do admin (menus e labels em EN).

## Referências

- `docs/02_security.md` — sessão e tokens
- `docs/architecture/admin-ui-layout.md` — shell e `PageContainer`
- `docs/03_user_types.md` — perfil Visitante demo
