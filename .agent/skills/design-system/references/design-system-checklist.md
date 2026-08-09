# Design system checklist

> **v11:** UI stories live in SQLite (`meridian_delivery.py show US-XXXX --full`). Cite `09_design_system.md` sections in Plan Architecture refs — not separate US files.

Use when creating or reviewing `docs/09_design_system.md`.

## Document structure

- [ ] Frontmatter: `status`, `depends_on`, `blocks`
- [ ] Purpose and scope (what UI surfaces this covers)
- [ ] Link to `05_architecture` frontend boundaries

## Tokens

- [ ] Color palette (semantic names, not only hex)
- [ ] Typography scale
- [ ] Spacing scale
- [ ] Border radius / elevation if used

## Stack and composition

- [ ] Primary UI stack id from `ui-stack-catalog.md`
- [ ] Plan Architecture refs include `stacks/{id}.md` for UI implement US
- [ ] Primitive path documented (read-only — shadcn `components/ui/`, etc.)
- [ ] Composed template path documented (`components/app/`, `ui/composed/`, …)
- [ ] Composition pattern: config-driven props (`title`, `description`, `body`, `variant`, `size`) — see `component-composition-pattern.md`

## Components

- [ ] Inventory of **composed** templates (`AppDialog`, …) — not raw primitives
- [ ] When to use / avoid each
- [ ] States: default, hover, focus, disabled, error, loading
- [ ] Showcase route link per template (when catalog exists)

## Layout

- [ ] Breakpoints: mobile, tablet, desktop
- [ ] Container max-widths
- [ ] No horizontal overflow rule for content areas

## Accessibility

- [ ] Focus visible
- [ ] Contrast baseline
- [ ] Touch targets (mobile)
- [ ] Form labels and errors

## Agent rules

- [ ] US with UI Must cite relevant `09` sections in Plan Architecture refs
- [ ] Responsive required for new frontend code
