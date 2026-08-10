# Iris admin (React)

SPA do operador editorial. Build Vite → `iris-app/public/`. Documentação de arquitetura de layout: [`docs/architecture/admin-ui-layout.md`](../../docs/architecture/admin-ui-layout.md).

## Comandos

```bash
# na raiz iris-app/
pnpm dev:admin      # HMR em modo dev
pnpm build:admin    # produção → public/
```

## Estrutura

```txt
src/
  App.tsx                 # rotas + providers globais
  components/
    layout/               # AppLayout, AppShell, sidebar, header, nav
    templates/            # PageContainer, PagePanel, AppDialog
    ui/                   # shadcn primitives (evitar editar)
    {feature}/            # kanban, calendar, comments, settings…
  contexts/               # auth, meta, settings, confirm dialog
  hooks/                  # use-dashboard-view, use-mobile…
  pages/                  # uma rota por arquivo — só conteúdo
  lib/                    # api client, types, utils
```

## Layout — regra de ouro

**Shell persiste; página só renderiza conteúdo.**

```
AppLayout (Outlet)
  └── AppShell (header + sidebar)
        └── SuaPage
              └── PageContainer
```

Não use `AppShell` nas páginas. Rotas autenticadas são filhas de `AppLayout` em `App.tsx`.

## PageContainer

Template padrão para padding, scroll e cabeçalho.

```tsx
import { PageContainer } from "@/components/templates/page-container";

export function MinhaPage() {
  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Seção"
          title="Título"
          description="Opcional."
        />
        {/* conteúdo */}
      </PageContainer.Content>
    </PageContainer>
  );
}
```

| Caso | `variant` |
| ---- | --------- |
| Formulários, settings, listas com scroll | `scroll` (padrão) |
| Dashboard, inbox split (altura fixa) | `fill` |

## Meta e dashboard

- **Meta:** `useMetaSession()` de `@/contexts/meta-session-context` (provider no `AppLayout`).
- **Calendário / Kanban:** `useDashboardView()` — URL `/?view=kanban` ou `/`.

## Nova página

1. `pages/nova-page.tsx` com `PageContainer`.
2. Rota em `App.tsx` dentro do grupo `AppLayout`.
3. Item em `app-navigation.tsx` se for menu principal.

Detalhes: [`docs/architecture/admin-ui-layout.md`](../../docs/architecture/admin-ui-layout.md).
