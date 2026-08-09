# Prompt para Google Stitch — Iris Admin (online)

**Projeto Stitch admin:** criar telas novas (não reutilizar layouts offline legados).
Stack real: **React + shadcn/ui (style base-nova) + Tailwind v4 + lucide-react**.

---

## Prompt principal (copiar e colar no Stitch)

```
Design a desktop-first editorial admin for "Iris" — Instagram content scheduling for professional editors.

PRODUCT
- Web admin at 1280–1920px width (primary artboard 1440×900)
- Portuguese UI (pt-BR)
- Views: Kanban (default), Calendar, Post Dialog (modal), Login
- NO dedicated mobile layouts (no bottom sheets, no hamburger nav). Fluid desktop only.

DESIGN SYSTEM — shadcn/ui aligned
- Style: shadcn "base-nova", CSS variables, rounded-xl (12px), soft shadows
- Fonts: Hanken Grotesk (UI), Playfair Display (titles only)
- Colors:
  - Background cream: oklch(0.97 0.01 85)
  - Primary purple: oklch(0.48 0.22 295)
  - Sidebar/header black: oklch(0.16 0 0)
  - Card white, border subtle warm gray
- Icons: lucide-react style (outline, 16–20px) — NOT Material Symbols
- Aesthetic: editorial modernism, calm, premium, generous whitespace, magazine-like grid

COMPONENTS (map to shadcn)
- Button, Badge, Card, Tabs, ScrollArea, Dialog (with header/body/footer), DropdownMenu, Input, Textarea, Label, Separator
- Status badges: draft (stone), scheduled (violet), published (emerald), failed (red), cancelled (muted)

SCREEN 1 — App shell + Kanban (hero screen)
- Top bar (full width, dark): logo "Iris" (Playfair), Instagram connection pill "@iris.studio · Conectado", links "Reconectar" "Testar conexão", actions "Sair" (secondary) + "Nova postagem" (primary purple)
- Below: Tabs "Calendário" | "Kanban" (Kanban active)
- Main panel title: "Pipeline editorial" + subtitle
- Kanban fills remaining viewport height:
  - 5 equal columns with horizontal scroll if needed: Rascunho, Agendado, Publicado, Falhou, Cancelado
  - Each column: colored top accent, title + count badge, scrollable card list
  - Cards: status badge, 2-line caption, datetime, optional image count icon, subtle hover lift
  - Card footer: "⋯" menu for "Mover para…"
  - Empty column: dashed placeholder "Nenhuma postagem"
- Sample cards use realistic Portuguese captions (see sample data below)

SCREEN 2 — Calendar view (same shell, Calendar tab active)
- Month header with prev/next chevrons, centered "Agosto 2026"
- 7-column grid, cells min-height ~100px
- Today highlighted with primary ring
- Post chips inside cells: time + truncated caption, left color bar by status
- "+N mais" overflow indicator

SCREEN 3 — Post Dialog (opened from kanban or calendar click)
- Large dialog (max-w-4xl), NOT a side panel
- Header: title "Editar postagem", description, status badge, close X
- Body (scrollable): failed error alert (if failed), caption textarea, datetime-local, auto-reply checkbox, image upload, 3-image preview grid, comments section with reply form
- Footer (muted bar): Fechar (outline) | Agendar (secondary) | Salvar rascunho (primary)

SCREEN 4 — Login
- Centered card on cream background
- "Iris" + "Entrar com seu email"
- Email input + Continuar button
- Minimal, same tokens

INTERACTION NOTES
- Clicking kanban card opens dialog (show Screen 3 as overlay on Screen 1)
- Kanban columns stretch to bottom of viewport
- Professional density: not cramped, not oversized — think Linear/Notion editorial quality

DELIVER
- High-fidelity desktop mockups for all 4 screens
- HTML/CSS reference using shadcn-like structure (optional)
- Use attached sample data for realistic content
```

---

## Dados de exemplo (usar nos mockups)

### Meta / header
- Instagram: **@iris.studio** — Conectado
- Botões: Sair, Nova postagem

### Colunas kanban
| Coluna | Qtd |
|--------|-----|
| Rascunho | 3 |
| Agendado | 4 |
| Publicado | 12 |
| Falhou | 1 |
| Cancelado | 2 |

### Cards (exemplos)
1. **Agendado** — "Lançamento da coleção outono — peças em linho e tons terrosos." — 15 ago, 18:30 — 5 imagens  
2. **Rascunho** — "Bastidores do shooting. Legenda curta com CTA para newsletter." — 2 imagens  
3. **Publicado** — "Reel: 3 dicas de styling para o escritório em casa." — 10 ago, 14:00  
4. **Falhou** — "Post de parceria — verificar permissões da marca." — erro: "invalid aspect ratio"  
5. **Agendado** — "Quote card — tipografia Playfair sobre fundo creme." — 18 ago, 12:00  

### Dialog (post aberto)
- Legenda: "Lançamento da coleção outono — peças em linho e tons terrosos."
- Agendar: 15/08/2026 15:30
- Auto-reply: ligado
- Comentário pendente: **marina.costa** — "Amei o tom da terceira foto! Qual filtro vocês usaram?"

### Calendário
- Mês: **Agosto 2026**
- Hoje: **9**
- Chips nos dias 10, 12, 15, 18

---

## Arquivos de apoio neste repo

| Arquivo | Conteúdo |
|---------|----------|
| `design-tokens.json` | Tokens exatos (cores, fontes, viewport) |
| `sample-data.json` | JSON com posts, meta, comentários |
| `shadcn-component-map.md` | Mapeamento componente → tela |

## Código atual (referência de estrutura)

```
iris-app/admin/src/
  pages/dashboard-page.tsx      # shell + tabs + kanban/calendar
  components/kanban/            # board, column, card
  components/calendar/          # calendar-view
  components/posts/post-dialog.tsx
  components/templates/         # AppDialog, PagePanel, KanbanColumnShell
  components/ui/                # shadcn primitives (não alterar)
```

## O que está ruim hoje (corrigir no design)

1. **Kanban** — colunas sem hierarquia visual forte; cards genéricos; falta densidade editorial  
2. **Calendário** — grid pequeno, chips sem personalidade, toolbar fraca  
3. **Shell** — header e painel principal sem ritmo vertical; título/subtítulo perdidos  
4. **Dialog** — funcional mas sem polish (espaçamento, seções, preview de mídia)

## Restrições técnicas para o dev depois

- Manter padrão de **composição**: templates em `components/templates/`, shadcn em `ui/` intocado  
- Dialog = `AppDialog` (Header/Body/Footer), não side panel  
- Desktop only no design; implementação pode usar `min-width` mas sem layout mobile dedicado  
