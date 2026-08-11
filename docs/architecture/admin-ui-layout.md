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
  browse (sem post_id)
    lista Publicações | Atividade  →  empty state “selecione uma publicação”
  stage (com post_id)
    [rail/drawer lista — colapsável]  +  STAGE (≥60% inset)
         PostDetailPanel: mídia em destaque + abas (Desempenho | Comentários | Legenda | Config)
```

- Entrar em stage ao setar `?post_id=` (e opcional `comment_id` para deep link / highlight).
- Voltar ao browse ou reabrir lista via CTA / rail — **sem** manter lista + preview + painel como três colunas fixas.
- Deep link e SSE existentes permanecem; muda só a composição.

### Deprecated

**Layout de três colunas permanentes** (aside lista ~340px + preview + painel lateral) no hub de comentários está **deprecated** a partir de v1.15 / US-0105. Não reintroduzir.

## Ops — webhooks e execuções (v1.16)

Contrato: [`docs/09_design_system.md`](../09_design_system.md) § **Composição / foco** (stage focus + observabilidade).

### Webhooks

```txt
/admin/webhooks
  browse (sem event_id)  →  lista editorial + filtros/export
  stage (?event_id=)     →  [voltar | Lista Sheet] + STAGE (status, links, payload)
```

**Deprecated:** tabela wide (`min-w-[960px]`) com payload expandido na célula.

### Execuções do agente

```txt
/admin/agent-runs
  browse (sem run_id)  →  lista com status, tier, N stages, models[], duração
  stage (?run_id=)     →  sumário da execução + cards de stages (modelo em destaque)
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
- Grid de calendário onde células vazias dominam o viewport (usar mural editorial).
- Tabela wide ou split 50/50 permanente em `/admin/webhooks` e `/admin/agent-runs`.
- Esconder modelo LLM das stages em tipografia secundária minúscula.
- `overflow-y-auto` + scrollbar nativa em regiões de página (usar `PageScrollArea`).
- Tipografia de lista ops abaixo de 14px (caption) / 17px (body).

## Referências

- Design system (tokens + composição): `docs/09_design_system.md`
- Gramática de marca: `docs/design/DESIGN-rules.md`
- Design tokens e telas legadas: `docs/design/stitch-iris-admin/`
- Mapa shadcn: `docs/design/stitch-iris-admin/shadcn-component-map.md`
- Guia rápido do pacote: `iris-app/admin/README.md`
