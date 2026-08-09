---
name: design-system
description: Maintains docs/09_design_system.md and stack-aware UI bootstrap — shadcn, MUI, Chakra, Ant Design, Streamlit, NiceGUI, Django HTMX, Go templ, Leptos; composed App* templates over read-only primitives. Use for /design-pass, /design-showcase, /design-review, 09_design_system, tokens, showcase catalog, or UI acceptance criteria.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Design system (Meridian)

> **Escopo:** `docs/09_design_system.md`. US com UI: `meridian_delivery.py show US-XXXX --full`.

> Authoring: `.agent/skills/doc.md` (selective reading + `references/`).

## Operator workflows

| Workflow | Purpose |
| -------- | ------- |
| `/design-pass` | Create/update `09` — full, `bootstrap`, or `US-XXXX` |
| `/design-showcase` | Plan catalog routes + showcase US (no code) |
| `/design-review` | Audit live UI vs `09` + showcase (no code) |

## Selective reading

| File | When to read |
| ---- | ------------ |
| `references/design-system-checklist.md` | **Mandatory** — any pass on `09` |
| `references/stack-bootstrap.md` | **Mandatory** — `/design-pass bootstrap` or empty `09` |
| `references/ui-stack-catalog.md` | **Mandatory** — pick stack id |
| `references/stacks/{id}.md` | **Mandatory** — implementation model for chosen stack |
| `references/showcase-us-slices.md` | **Mandatory** — `/design-showcase` US breakdown |
| `references/component-composition-pattern.md` | **Mandatory** — components, showcase, review |
| `references/showcase-catalog-pattern.md` | **Mandatory** — `/design-showcase` |
| `references/design-review-checklist.md` | **Mandatory** — `/design-review` |
| Target US (`show US-XXXX --full`) | `us-align` or `us-scope` modes |

## When to trigger

- `/design-pass`, `/design-showcase`, `/design-review`
- Create or deepen `09_design_system.md`
- Before `/refine-us` on Must US with visual Acceptance
- Stack change in `01_tech_stack.md`

## Procedure (design-pass)

```txt
Task progress:
- [ ] Read 00_scope, 01_tech_stack, 04_principles, 05_architecture
- [ ] ui-stack-catalog.md → stacks/{id}.md
- [ ] stack-bootstrap.md + component-composition-pattern.md
- [ ] design-system-checklist.md → update 09
- [ ] US Plan refs / showcase / review follow-ups
```

## Anti-patterns

- Product code (use `/design-showcase` → `/implement-us`)
- Edit installed primitives (`components/ui/*`, etc.)
- Bootstrap brand before stack id
- Approve `09` without human

## Output

```txt
Workflow:
Stack id:
Primitive path:
Composed path:
09 status:
Next:
```
