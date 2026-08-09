# Mapa shadcn → telas Iris Admin

Use **apenas** componentes equivalentes ao shadcn/ui. Ícones: **lucide-react**.

| Área | shadcn / padrão |
|------|------------------|
| Header ações | `Button` (default, secondary, outline, ghost) |
| Tabs Calendário/Kanban | `Tabs`, `TabsList`, `TabsTrigger` |
| Kanban colunas | `Card` + `ScrollArea` + `Badge` |
| Kanban cards | `Card`, `Badge`, `DropdownMenu` (mover status) |
| Calendário células | grid custom + chips como `Button` ghost ou badges |
| Post dialog | `Dialog`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` |
| Form post | `Label`, `Input`, `Textarea`, checkbox nativo estilizado |
| Comentários | `Separator`, `Textarea`, `Button` size sm |
| Login | `Card`, `CardHeader`, `CardTitle`, `Input`, `Button` |
| Toasts (não desenhar) | `Sonner` — só mencionar |
| Status | `Badge` variant secondary com cores por status |

## Arquitetura de implementação (não desenhar diferente)

- `components/ui/*` = primitivos shadcn (intocados)
- `components/templates/*` = shells (AppDialog, PagePanel, KanbanColumnShell)
- Features em `components/kanban`, `components/calendar`, `components/posts`

O dialog de postagem usa template **AppDialog** com Header / Body / Footer — reproduza essa estrutura visual.
