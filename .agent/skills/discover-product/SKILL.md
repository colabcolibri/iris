---
name: discover-product
description: Runs Meridian product discovery — interviews, codebase context, and docs/discovery/product-brief.md before scope is locked. Use with /discover before or alongside init.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Discover product (Meridian PO)

## Selective reading

| File | When to read |
| ------- | ---------- |
| `.agent/references/templates/discovery-folder-guide.md` | **Mandatory** before Write |
| `.agent/references/templates/init-interview-guide.md` | When context thin — interview gate |
| `references/product-brief-template.md` | **Mandatory** before Write |
| `docs/discovery/product-brief.md` | Existing brief |
| `docs/inventory/as-is.md` | Mode B — existing codebase |
| `docs/00_scope.md`, `docs/03_user_types.md` | Avoid contradicting approved content |

## When to trigger

- Vague product idea — "I want to build X"
- Before `/init-meridian` on greenfield (recommended)
- After Mode B inventory — reconcile **product intent** with **as-is**
- `/discover` workflow
- Manager says discovery, product brief, PO, personas, jobs-to-be-done

**Do not** use for implementation, US, or architecture — route to correct workflow.

---

## Modes

| Mode | Situation | Procedure |
| ---- | --------- | --------- |
| **A — Greenfield** | Idea, no or thin `docs/` | Interview → write/update `product-brief.md` |
| **B — Existing code** | Code + optional inventory | Read repo + inventory → brief explains intent vs reality |
| **C — Deepen** | Brief or scope thin | Expand sections; resolve open questions |

If `docs/` missing → create only `docs/discovery/` + `product-brief.md` (minimal tree). Recommend `/init-meridian` next for full governance.

---

## Procedure

1. Read guides + template + existing artifacts.
2. Detect mode A | B | C from repo and `$ARGUMENTS`.
3. Run Socratic questions (max 5) — skip answered items.
4. Write or update `docs/discovery/product-brief.md` from template.
5. Mode B: fill **Evidence** with inventory/code pointers; mark assumptions.
6. If `$ARGUMENTS` contains `promote` and manager confirmed → draft updates to `00_scope.md` / `03_user_types.md` (stay `draft`; never `approved`).
7. `update-decisions-log` when product direction materially changes.

---

## Promotion (optional)

When brief status is `ready for scope` and manager asks:

- Copy Problem, in/out, assumptions, risks → `00_scope.md` sections (merge, do not duplicate epic bodies).
- Copy user table → `03_user_types.md` profiles.
- Leave `product-brief.md` as history — do not delete unless manager archives.

---

## Validations before saving

- Problem and Users sections have real sentences
- Out of scope (candidates) non-empty
- Assumptions labeled where evidence weak
- No `EPIC-XX` files created in this skill

---

## Output

```txt
Discovery complete:
Mode: greenfield | existing | deepen
File: docs/discovery/product-brief.md
Status: draft | ready for scope
Open questions:
Epic candidates:
Next: /init-meridian | promote to 00_scope | /discover again | product-owner review
```
