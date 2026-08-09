---
description: Create or update docs/09_design_system.md — stack bootstrap, tokens, components, US alignment.
---

# /design-pass — design system contract

$ARGUMENTS

---

## Critical rules

1. Use `design-system-owner` + `@[skills/design-system]`
2. Read `design-system-checklist.md` before Write on `09_design_system.md`
3. **Doc only** — no product code (showcase code → `/design-showcase` → `/implement-us`)
4. Human sets `status: approved` on `09_design_system.md`
5. Block if `05_architecture.md` is not at least `review` → report to `scrum-master`

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | Checklist pass on entire `09` |
| `bootstrap` | **bootstrap** | Read `01_tech_stack.md` → pick stack id → `stack-bootstrap.md` → fill tokens + paths |
| `US-XXXX` | **us-align** | Load US `--full`; map Acceptance UI → `09` sections; suggest Plan refs |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: DESIGN PASS

RULES:
1. If no 09_design_system.md → copy § Document stub from `.agent/references/templates/phase-docs/09-design-system.md`
2. Run mode procedure (full | bootstrap | us-align)
3. Walk design-system-checklist.md
4. Recommend /refine-us if Must UI US Plan missing 09 refs
5. Recommend /design-showcase when Components or Showcase sections empty
6. prepend-decision on material stack or token changes
```

---

## Output

```txt
Mode: full | bootstrap | us-align
Stack id:
Primitive path:
Composed path:
09_design_system status:
Sections updated:
US follow-ups:
Next: human review → approved | /design-showcase | /refine-us US-XXXX | /design-review
```
