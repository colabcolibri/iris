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
