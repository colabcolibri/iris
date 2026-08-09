---
description: Plan visual component catalog pages — routes, composed templates, and gated US for developer.
---

# /design-showcase — design catalog planning

$ARGUMENTS

---

## Critical rules

1. Use `design-system-owner` + `@[skills/design-system]`
2. Read `showcase-catalog-pattern.md` and **`stacks/{id}.md` § Showcase** before output
3. Read `showcase-us-slices.md` for default US breakdown (DS-S1…S5)
4. Requires `09_design_system.md` with stack id (run `/design-pass bootstrap` first if missing)
5. **No product code** — draft or update **user stories** citing `stacks/{id}.md` in Plan Architecture refs
6. Showcase pages import **composed** templates only (`App*`), never raw primitives

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: DESIGN SHOWCASE

RULES:
1. Read 09 § Components + § Showcase catalog
2. Propose route map: /design, /design/tokens, /design/components, /design/patterns (adjust to product)
3. List minimum composed templates with all states (see showcase-catalog-pattern.md)
4. create-us per `showcase-us-slices.md` — each US Plan cites `stacks/{id}.md` sections
5. Update 09 § Showcase catalog table with planned routes and US ids
6. Cross-link /design-pass if 09 gaps found
```

---

## Output

```txt
09 showcase section updated: yes | no
Routes planned:
Composed templates:
US created or recommended:
Next: /refine-us US-XXXX | /implement-us US-XXXX | /design-pass
```
