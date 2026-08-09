---
title: Design system
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [05_architecture.md]
blocks: []
---

# 09 — Design system

## Scope

UI admin em HTML estático (`public/`). Sem component library. Objetivo: legível, funcional, responsivo.

## Brand identity

### Logo

O símbolo do Iris representa o fluxo editorial do produto: conteúdo, organização e publicação girando em torno de um centro de controle. É formado por três segmentos arredondados em movimento circular e um núcleo central quadrado.

- Asset de referência: `iris-app/public/assets/iris-logo-concept.png`
- O símbolo deve ser usado sem efeitos, sombras, contornos adicionais ou deformação.
- O wordmark é escrito como `iris`, em minúsculas, usando a mesma família sans-serif da interface.
- O símbolo pode aparecer sozinho como ícone de app, favicon, avatar e marca compacta.
- Para tamanhos pequenos, usar apenas o símbolo e preservar o núcleo central visível.

### Logo colors

| Token | Value | Use |
| --- | --- | --- |
| `--brand-indigo` | `#6366f1` | Segmento principal, ações e identidade |
| `--brand-charcoal` | `#1a1a1a` | Segmento de contraste e wordmark |
| `--brand-coral` | `#f97316` | Segmento de ação/publicação; usar com moderação |

The primary logo lockup uses indigo, charcoal, and coral on a white or `--bg` background. A one-color version uses `--text` or white when placed on a dark surface.

### Clear space and sizing

- Área de proteção mínima: metade da largura do núcleo central em todos os lados.
- Tamanho recomendado do símbolo em navegação: `32px`.
- Tamanho mínimo digital: `16px`, somente com a versão simplificada/monocromática quando necessário.
- Tamanho recomendado do wordmark: símbolo de `28–32px` com espaçamento de `8px` até `iris`.
- Nunca esticar, inclinar, rotacionar ou aplicar gradiente ao logo.

### Logo usage

Do:

- manter o símbolo centralizado e com proporção original;
- usar `--brand-indigo` como cor de reconhecimento principal;
- garantir contraste AA quando o logo acompanhar texto ou controles;
- usar o arquivo vetorial equivalente quando ele estiver disponível.

Do not:

- recolorir segmentos individualmente fora da paleta definida;
- adicionar o ícone do Instagram, calendário literal ou elementos decorativos;
- colocar o logo sobre imagens complexas sem uma área de respiro;
- usar o logo como indicador de status de post — status continuam usando as cores próprias da tabela abaixo.

### Product meaning

A identidade deve comunicar um centro de comando editorial simples e confiável. A marca não representa uma ferramenta de criação específica: o Iris recebe conteúdo de várias fontes, organiza o calendário, publica via Meta e acompanha comentários.

## Layout

- Max width container `1200px`, padding `16px` mobile / `24px` desktop
- Single column mobile; sidebar + main em `≥768px`
- Sem overflow horizontal (`overflow-x: hidden` no body)

## Typography

- System stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Base `16px`, line-height `1.5`
- Títulos: `font-weight: 600`, sentence case

## Color (light mode v1)

| Token | Value | Use |
| ----- | ----- | --- |
| `--bg` | `#f8f9fa` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--text` | `#1a1a1a` | Body |
| `--muted` | `#6b7280` | Secondary |
| `--accent` | `#6366f1` | Links, primary button |
| `--danger` | `#dc2626` | Failed status |
| `--success` | `#16a34a` | Published |

## Status badges

| Status | Color |
| ------ | ----- |
| draft | gray |
| scheduled | blue |
| published | green |
| cancelled | muted |
| failed | red |

## Components (HTML)

- `.post-card` — item na lista
- `.status-badge` — pill de status
- `.btn-primary`, `.btn-ghost`
- `.form-field` — label + input/textarea
- `.comments-panel` — thread abaixo do post selecionado

## Responsive breakpoints

| Breakpoint | Layout |
| ---------- | ------ |
| `< 768px` | Stack vertical, full-width buttons |
| `≥ 768px` | Lista + detalhe lado a lado |

## Accessibility

- Focus visible em inputs e botões
- Labels associados a inputs (`for`/`id`)
- Contraste mínimo WCAG AA para texto

## Dark mode

Out of scope v1.
