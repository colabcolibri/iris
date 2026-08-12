# Admin UI — layout e composição

**Stack:** React 19 + Vite + React Router + shadcn/ui (`base-nova`) + Tailwind v4  
**Código:** `iris-app/admin/src/`  
**Build:** `pnpm build:admin` → bundle em `iris-app/public/`

## Princípio

O admin segue **uma shell persistente** e **páginas que só renderizam conteúdo**. Evita remontar sidebar/header a cada navegação e centraliza sessão Meta.

| Camada | Responsabilidade | Onde |
| ------ | ---------------- | ---- |
| Roteamento + providers | Auth, Meta, settings globais | `App.tsx`, `contexts/` |
| Chrome da app | Header, sidebar, inset | `components/layout/` |
| Template de página | Padding, scroll, título | `components/templates/page-container.tsx` |
| Página | Dados e UI da rota | `pages/*` |
| Primitivos | shadcn — não editar sem motivo | `components/ui/` |

## Árvore de layout

```txt
App.tsx
  AuthSessionProvider
    ConfirmDialogProvider
      AppSettingsProvider
        BrowserRouter
          ProtectedRoute + MetaSessionProvider
            AppLayout                    ← shell persiste entre rotas
              AppShell
                IrisSidebarProvider
                  AppHeader              ← lê useMetaSession()
                  AppSidebar
                    AppNavigation
                  IrisSidebarInset
                    <Outlet />           ← só o conteúdo troca
                      DashboardPage | CommentsPage | …
```

**Regra:** páginas **não** importam `AppShell`. O layout é responsabilidade de `AppLayout`.

## Sessão Meta

`MetaSessionProvider` (`contexts/meta-session-context.tsx`) carrega `GET /api/meta/status` uma vez por sessão autenticada.

- `AppHeader` consome `useMetaSession()` diretamente (sem prop drilling).
- Páginas que precisam de `meta` (ex.: `PostDialog`, banners de conexão) também usam o hook.

## Navegação e views do dashboard

Rotas principais usam `NavLink` em `app-navigation.tsx`.

Calendário e Kanban compartilham `/` e diferenciam por query `?view=kanban`. A fonte de verdade é `useDashboardView()` — usada por `AppLayout` (sidebar ativa) e `DashboardPage` (conteúdo).

## PageContainer

Template composto para páginas autenticadas. Exportado em `components/templates/`.

### Variantes

| `variant` | Comportamento | Uso |
| --------- | ------------- | --- |
| `scroll` (padrão) | `overflow-auto`, padding responsivo | Settings, persona |
| `fill` | `flex-1`, `overflow-hidden`, altura cheia | Dashboard; comments; webhooks; agent-runs; agent-simulator |

### Subcomponentes

| Peça | Props | Uso |
| ---- | ----- | --- |
| `PageContainer.Content` | `width="narrow" \| "full"` | `narrow`: `max-w-2xl` centralizado; `full`: flex column para inbox/kanban |
| `PageContainer.Header` | `eyebrow`, `title`, `description?`, `actions?` | Cabeçalho editorial padronizado |

### Exemplo — página de preferências

```tsx
import { PageContainer } from "@/components/templates/page-container";

export function SettingsPage() {
  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Preferências"
          title="Configurações"
          description="Fuso horário, MCP, LLM e revisão Meta."
        />
        {/* cards e formulários */}
      </PageContainer.Content>
    </PageContainer>
  );
}
```

### Exemplo — layout full-height

```tsx
<PageContainer variant="fill">
  {/* banners opcionais */}
  <div className="flex min-h-0 flex-1 …">{/* conteúdo full-height */}</div>
</PageContainer>
```

Dashboard usa `variant="fill"` com padding lateral para o ritmo do calendário/kanban (mural editorial — ver `09` § Composição).

## Hub de comentários — stage focus (v1.15)

Contrato visual: [`docs/09_design_system.md`](../09_design_system.md) § **Composição / foco**.

### Fluxo

```txt
/admin/comments
  browse (sem post_id) — feed browse (v1.16)
    PageContainer variant="fill" + inset parchment
      [Header edge-to-edge: título + abas Publicações|Atividade + busca + CTAs]
      grade full-bleed (2 / 3 / 4 / 5 colunas) de cards media-forward
        aspect-square + caption + engajamento + StatusBadge
        → clique no card seta ?post_id=
  stage (com post_id) — stage focus (v1.15, inalterado)
    [rail/drawer lista — colapsável]  +  STAGE (≥60% inset)
         PostDetailPanel: mídia em destaque + abas (Desempenho | Comentários | Legenda | Resumo | Prompt | Config)
```

**Feed browse:** grade edge-to-edge — **não** coluna `max-w-2xl` centralizada, nem lista flat `border-l`. Cards: utility card (hairline + `radius-lg`, sem shadow) — ver `09` § **Feed browse**.

- Entrar em stage ao setar `?post_id=` (e opcional `comment_id` para deep link / highlight).
- Voltar ao browse ou reabrir lista via CTA / rail — **sem** manter lista + preview + painel como três colunas fixas.
- Deep link e SSE existentes permanecem; muda só a composição.

### Deprecated

**Layout de três colunas permanentes** (aside lista ~340px + preview + painel lateral) no hub de comentários está **deprecated** a partir de v1.15 / US-0105. Não reintroduzir.

**Lista flat / inbox `border-l`** e **coluna estreita centralizada** no browse de publicações estão **deprecated** — usar grade feed edge-to-edge (2–5 cols).
## Ops — webhooks e execuções (v1.16)

Contrato: [`docs/09_design_system.md`](../09_design_system.md) § **Composição / foco** (stage focus + observabilidade).

### Webhooks

```txt
/admin/webhooks
  browse (sem event_id) — ops list/table (v1.16)
    PageContainer variant="fill" + inset parchment
      [Header: filtros + export no topo]
      lista/tabela densa edge-to-edge (full width do inset)
        linhas clicáveis: timestamp, tipo, status, post/comentário, resumo
        → clique na linha seta ?event_id=
  stage (?event_id=) — stage focus (v1.16, inalterado)
    [voltar | Lista Sheet] + STAGE (status, links, payload)
```

**Ops list/table:** densidade alta, hairlines, sem coluna centralizada estreita; filtros permanecem acima da lista, não em painel lateral.

**Deprecated:** feed browse com cards centralizados em webhooks (US-0122/0124 — revertido US-0127/0128); tabela wide com payload expandido na célula; split permanente lista + detalhe.

### Execuções do agente

```txt
/admin/agent-runs
  browse (sem run_id) — ops list/table (v1.16)
    PageContainer variant="fill" + inset parchment
      [Header: filtros + Atualizar no topo]
      lista densa edge-to-edge (status, tier, modelos, duração, tokens)
        → clique na linha seta ?run_id=
  stage (?run_id=) — stage focus (v1.16, inalterado)
    [voltar | Lista Sheet] + STAGE (sumário + timeline de stages)
```

Hierarquia: `agent_run` (execução) → `agent_run_steps[]` (stages/chamadas). Listagem expõe `models: string[]` agregados dos steps.

**Deprecated:** split permanente lista ~520px + detalhe (master-detail 50/50).

## Simulador — lab / workshop (v1.16)

```txt
/admin/agent-simulator
  setup (cenário, contexto, thread conversacional, alvo, CTA Simular)
  stage de resultado (após run): resposta proposta + mesmo painel de stages das execuções
```

Não é browse de itens históricos. Empty state do palco até a primeira simulação.

## Outros templates

| Componente | Uso |
| ---------- | --- |
| `PagePanel` | Painéis internos com borda (inbox, cards de detalhe) |
| `PageScrollArea` | Scroll padrão (shadcn ScrollArea) — listas fill, dialogs, kanban |
| `AppDialog` | Modais editoriais (criar/editar post) |
| `KanbanColumnShell` | Colunas do pipeline |

**Regra de composição:** primitivos em `ui/`; padrões reutilizáveis em `templates/`; features em `components/{feature}/`.

## Checklist — nova página autenticada

1. Criar `pages/foo-page.tsx` **sem** `AppShell`.
2. Registrar rota como filha de `AppLayout` em `App.tsx`.
3. Envolver conteúdo em `PageContainer` (`scroll` ou `fill`).
4. Usar `PageContainer.Header` quando houver título de página.
5. Consumir `useMetaSession()` só se a página precisar de estado Meta.

## Anti-padrões

- Montar `AppShell` ou `IrisSidebarProvider` dentro de uma página.
- Duplicar padding/scroll com `div` manual quando `PageContainer` cobre o caso.
- Estado local de calendário/kanban fora da URL em `/` (quebra highlight da sidebar).
- Chamar `fetchMetaStatus` direto na página (usar `MetaSessionProvider`).
- Três colunas permanentes no hub de comentários (lista + mídia + threads lado a lado).
- Lista flat ou inbox `border-l` / coluna `max-w-2xl` centralizada no browse de **publicações** (usar grade feed 2–5 cols edge-to-edge).
- Coluna estreita centralizada (`max-w-2xl mx-auto`) em webhooks ou execuções (usar ops list/table edge-to-edge).
- Feed browse (cards centralizados) em webhooks — deprecated (US-0127/0128).
- Grid de calendário onde células vazias dominam o viewport (usar mural editorial).
- Split 50/50 permanente em `/admin/webhooks` e `/admin/agent-runs` (usar stage focus).
- Esconder modelo LLM das stages em tipografia secundária minúscula.
- `overflow-y-auto` + scrollbar nativa em regiões de página (usar `PageScrollArea`).
- Tipografia de lista ops abaixo de 14px (caption) / 17px (body).

## Referências

- Design system (tokens + composição): `docs/09_design_system.md`
- Gramática de marca: `docs/design/DESIGN-rules.md`
- Design tokens e telas legadas: `docs/design/stitch-iris-admin/`
- Mapa shadcn: `docs/design/stitch-iris-admin/shadcn-component-map.md`
- Guia rápido do pacote: `iris-app/admin/README.md`
