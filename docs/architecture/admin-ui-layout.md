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
| `scroll` (padrão) | `overflow-auto`, padding responsivo | Settings, webhooks, persona |
| `fill` | `flex-1`, `overflow-hidden`, altura cheia | Dashboard, comments (split pane) |

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
  <div className="flex min-h-0 flex-1 …">{/* split pane */}</div>
</PageContainer>
```

Dashboard usa `variant="fill"` com `className="px-8 pb-8"` para manter o ritmo do calendário/kanban.

## Outros templates

| Componente | Uso |
| ---------- | --- |
| `PagePanel` | Painéis internos com borda (inbox, cards de detalhe) |
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

## Referências

- Design tokens e telas: `docs/design/stitch-iris-admin/`
- Mapa shadcn: `docs/design/stitch-iris-admin/shadcn-component-map.md`
- Guia rápido do pacote: `iris-app/admin/README.md`
