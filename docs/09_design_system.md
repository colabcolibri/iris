---
title: Design system
status: approved
version: 2.1
updated: 2026-08-11
depends_on: [05_architecture.md]
blocks: []
---

# 09 — Design system

## Scope

Contrato visual do **Iris admin** (React em `iris-app/admin/`) e ponte para a gramática de marca.

- **Fonte canônica de marca:** [`docs/design/DESIGN-rules.md`](design/DESIGN-rules.md) (YAML + regras marketing).
- **Layout do app autenticado:** [`docs/architecture/admin-ui-layout.md`](architecture/admin-ui-layout.md).
- **Este doc (`09`):** modo **produto / admin** — densidade operacional, forms, nav, listas e utility cards. Não copia tiles full-bleed de marketing como padrão das páginas autenticadas.

Objetivo: um accent (Iris Purple), tipografia Source Serif 4 + Hanken Grotesk, chrome quieto, responsivo, sem overflow horizontal.

## Brand identity

### Logo

O símbolo do Iris representa o fluxo editorial: conteúdo, organização e publicação em torno de um centro de controle (três segmentos + núcleo).

- Asset de referência: `iris-app/public/assets/iris-logo-concept.png`
- Usar sem efeitos, sombras, contornos extras ou deformação.
- Wordmark: `iris` em minúsculas, família UI (**Hanken Grotesk**).
- Em tamanhos pequenos: só o símbolo, núcleo legível.

### Logo colors (atual)

| Token | Value | Use |
| --- | --- | --- |
| `--iris-primary` / Iris Purple | `#522587` | Accent de marca e ações |
| `--iris-ink` / Ink | `#1a1814` | Contraste, wordmark em superfície clara |
| `--iris-on-dark` | `#f5f2ec` | Wordmark / ícone em sidebar escura |

Lockup monocromático usa ink ou on-dark conforme a superfície.

### Deprecated — brand indigo / coral

| Token legado | Value | Status |
| --- | --- | --- |
| `--brand-indigo` | `#6366f1` | **Deprecated** — não usar como accent de UI |
| `--brand-coral` | `#f97316` | **Deprecated** — não usar como accent de UI |
| `--brand-charcoal` | `#1a1a1a` | Substituído por `--iris-ink` (`#1a1814`) |

Assets antigos com segmentos indigo/coral podem permanecer no arquivo de logo até redesenho do símbolo; **nenhuma superfície de UI** deve usar indigo ou coral como cor interativa. Ponte: tokens Iris em `DESIGN-rules.md` e tabela **Colors** abaixo.

### Clear space and sizing

- Área de proteção: metade da largura do núcleo em todos os lados.
- Nav: símbolo ~28–32px; mínimo digital 16px (versão simples).
- Wordmark: gap ~8px entre símbolo e `iris`.
- Nunca esticar, inclinar, rotacionar ou aplicar gradiente ao logo.

### Product meaning

Centro de comando editorial simples e confiável. O Iris organiza calendário, publica via Meta e acompanha comentários — não é uma ferramenta de criação de arte.

## Colors

Alinhado a `DESIGN-rules.md`. Em código: `--iris-*` em `iris-design-tokens.css` + mapeamento shadcn em `index.css`.

### Brand & accent

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#522587` | Único accent interativo — links, CTAs, focus |
| `primary-focus` | `#6b4a96` | Outline de foco |
| `primary-on-dark` | `#c9a8f0` | Links / ativo em superfícies escuras (sidebar) |
| `on-primary` | `#ffffff` | Texto em botão primary |

### Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#ffffff` | Cards, painéis claros |
| `canvas-parchment` | `#f4f2ee` | Fundo de página / inset |
| `surface-pearl` | `#ebe8e2` | Botões secundários ghost |
| `surface-tile-1` … `3` | `#1f1d1b` … `#1a1814` | Tiles escuros (marketing; raro no admin) |
| `surface-black` / sidebar | `#1a1814` / `#1f1d1b` | Nav global / sidebar admin |

### Text & hairlines

| Token | Value | Use |
| --- | --- | --- |
| `ink` / `body` | `#1a1814` | Texto principal |
| `body-on-dark` | `#f5f2ec` | Texto em sidebar / tiles escuros |
| `ink-muted-80` | `#4a443c` | Secundário em pearl |
| `ink-muted-48` | `#6f6860` | Disabled / fine print |
| `body-muted` | `#b8b0a6` | Secundário on-dark |
| `hairline` | `#d8d2c8` | Borda 1px utility |
| `divider-soft` | `#eceae4` | Ring suave |

**Sem gradientes decorativos.** Sem segundo accent de marca.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Source Serif 4, Georgia, serif | Títulos de página (≥ ~21px); weight 600; tracking levemente negativo |
| Body / UI | Hanken Grotesk, ui-sans-serif, system-ui | Body **17px** / 400 / line-height ~1.47; captions 14px; nav ~12px |

Ladder de weight: **300 / 400 / 600 / 700** — **500 deliberadamente ausente**. Strong inline = 600.

Em CSS: `--font-sans` / `--font-display` e utilitário `.font-display`.

## Radius & spacing

| Token | Value | Use admin |
| --- | --- | --- |
| `rounded.sm` | 8px | Utility buttons compactos |
| `rounded.md` | 11px | Pearl capsules |
| `rounded.lg` | 18px | Utility cards |
| `rounded.pill` | 9999px | CTA primary, chips, search |

Spacing estrutural: 8 / 12 / 16 / 24 / 32. Padding de página autenticada: ~16–24px mobile, ~24–40px desktop (ver `PageContainer`).

## Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | Sem sombra | Shell, cards chrome, botões, texto |
| Soft hairline | 1px hairline | Utility cards, inputs |
| Product shadow | `rgba(26,24,20,0.22) 3px 5px 30px` | **Só** preview de mídia/produto |

Press em botões: `transform: scale(0.95)` — não troca de hex.

## Modo produto / admin

A landing usa tiles full-bleed (~1 viewport, padding 80px). O **admin autenticado não**.

| Marketing (`DESIGN-rules`) | Admin (este doc) |
| --- | --- |
| `product-tile-*` full-bleed | Fundo parchment + conteúdo em `PageContainer` |
| `store-utility-card` | Cards de settings, listas, painéis |
| `global-nav` 44px black | Header fino + **sidebar escura** (`admin-ui-layout`) |
| `sub-nav-frosted` | Opcional; no admin a IA vive na sidebar + título de página |
| `button-primary` pill | CTA primário em todo o app |
| `button-dark-utility` / pearl | Ações secundárias / ghost |
| `search-input` pill | Campos de busca / filtros |

### Shell

- Sidebar: superfície near-black (`surface-tile-1` / `--sidebar`), texto on-dark, item ativo com `primary-on-dark` ou ring primary — **nunca indigo**.
- Inset / main: `canvas-parchment`.
- Header: quieto; logo + utilitários; sem sombra decorativa.
- Touch targets de navegação ≥ 44px no mobile (Sheet / trigger).

### Forms & lists

- Inputs: fundo canvas, hairline, tipografia body 17px; radius pill ou sm conforme o controle.
- Labels associados (`for`/`id`); focus ring `primary-focus`.
- Listas densas: caption/body, `min-w-0` + `truncate`, sem overflow-x.

### Utility cards

- Fundo `canvas`, borda `hairline`, radius `lg` (18px), padding ~24px.
- Sem `box-shadow` no card.

### Status badges

Indicam estado de domínio — **não** usam o accent de marca como única cor de status.

| Status | Tratamento |
| ------ | ---------- |
| draft | muted / gray |
| scheduled | info (azul funcional, não accent de marca) |
| published | success green |
| cancelled | muted |
| failed | danger red |

Badges: pill ou radius sm; tipografia caption; sem sombra.

### Painéis operacionais

- Inbox / threads / comments: densidade alta, hairlines, accent só em links e CTAs.
- Não aplicar padding de product-tile (80px) em listas.

### Composição / foco

A pele Iris (tokens) não basta: o admin precisa de **um palco dominante** por tarefa. Contrato de implementação em [`docs/architecture/admin-ui-layout.md`](architecture/admin-ui-layout.md).

| Padrão | Quando usar | Regra |
| --- | --- | --- |
| **Stage focus** (padrão v1.15) | Hub de comentários e fluxos “selecionar item → trabalhar” | Lista é entrada (rail/drawer/voltar). Com item selecionado, o **stage** ocupa ≥ ~60% do inset (mídia + threads/ações). **Proibido:** três colunas permanentes (lista + preview + painel) no hub de comentários. |
| **Master-detail curto** | Só quando os dois painéis são igualmente leves (ex.: preferências raras) | Dois painéis no máximo; nenhum pode ser “terceira fatia” espremendo o trabalho. |
| **Mural editorial** | Calendário mensal | Dias **com** post = tiles densos (thumb/status/trecho). Dias **vazios** são secundários (não dominam o viewport). Empty state do mês = mensagem curta + CTA, não mar de células hero. |

**Decisão v1.15:** modelo padrão = **stage focus**. **Thread-first** (conversa como coluna principal permanente, post só no header) foi avaliado e **rejeitado** nesta versão — a mídia editorial continua no palco junto com as threads.

## Components (implementação)

| Conceito | Onde no admin |
| --- | --- |
| Tokens | `iris-app/admin/src/iris-design-tokens.css` + `index.css` |
| Button / input / badge | `components/ui/*` (shadcn remapeado) |
| Shell | `components/layout/*` |
| Page chrome | `components/templates/page-container.tsx` |
| Status | `components/posts/status-badge.tsx` |

Nomes legados HTML (`.btn-primary`, `.comments-panel`) mapeiam para os equivalentes React acima.

## Do's and don'ts

### Do

- Um accent: Iris Purple `#522587` para tudo que for “clicável” de marca.
- Body 17px Hanken; display Source Serif 4 com tracking negativo em títulos.
- Utility cards com hairline + radius lg; CTAs primary em pill.
- Press com `scale(0.95)`.
- Sidebar escura + inset parchment.

### Don't

- Segundo accent de marca (indigo, coral, azul “brand”).
- Sombra em cards, botões ou texto.
- Gradientes decorativos de fundo.
- Weight 500; body 16px como padrão.
- Product tiles full-bleed / padding 80px como layout default do admin.
- `primary-on-dark` em superfícies claras.

## Responsive

| Breakpoint | Layout |
| --- | --- |
| `< 768px` | Stack; sidebar em Sheet; full-width CTAs quando fizer sentido |
| `≥ 768px` | Sidebar + main; splits lista/detalhe onde a página exigir |

Breakpoints estruturais da marca (marketing): ver `DESIGN-rules.md` § Responsive. Admin prioriza 375 / 768 / 1280 para QA.

## Accessibility

- Focus visible (ring `primary-focus`).
- Labels em inputs.
- Contraste AA texto/fundo nas superfícies parchment e sidebar.
- Touch target mínimo 44×44px em controles principais.

## Dark mode

Out of scope como tema separado. A sidebar escura é chrome fixo, não “dark mode” de produto.

## Referências

- [`docs/design/DESIGN-rules.md`](design/DESIGN-rules.md) — gramática Iris completa
- [`docs/architecture/admin-ui-layout.md`](architecture/admin-ui-layout.md) — árvore de layout + stage focus
- [`docs/05_architecture.md`](05_architecture.md) — § Major components
