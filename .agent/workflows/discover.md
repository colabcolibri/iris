---
description: Product discovery — clarify problem, users, and value before scope and backlog (PO lane).
---

# /discover — product discovery

$ARGUMENTS

---

## Critical rules

1. Use `product-owner` + `@[skills/discover-product]`
2. **Mandatory read:** `discovery-folder-guide.md` + `product-brief-template.md` before Write
3. **NO product code** — no US, epics, versions, or implementation
4. Writes **`docs/discovery/product-brief.md`** — not a substitute for approved `00_scope.md`
5. Mode B: read `docs/inventory/as-is.md` and codebase before inferring intent
6. Promote to `00_scope` / `03_user_types` only when manager asks or `$ARGUMENTS` includes `promote`
7. Material direction change → `@[skills/update-decisions-log]` (run `date` before Write)

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: PRODUCT DISCOVERY (PO)

RULES:
1. product-owner Phase 0 gate
2. Detect mode: greenfield | existing codebase | deepen brief
3. Ask up to 5 Socratic questions — skip if already answered
4. Write or update docs/discovery/product-brief.md from template
5. List epic candidates as names only — no EPIC files
6. If docs/ missing — may create docs/discovery/ only; recommend /init-meridian next
7. Output handoff: init | scope review | discover again
```

---

## Output

```txt
Discovery status:
Mode:
Product brief:
Open questions:
Epic candidates:
Ready for scope promotion: yes | no
Next: /init-meridian | review 00_scope | /discover promote
```

---

## vs `/init-meridian`

| `/discover` | `/init-meridian` |
| ----------- | ---------------- |
| PO — what & why | `scrum-master` — docs/ structure & governance |
| product-brief.md | phase docs, decisions, board |
| May run with no full docs/ | Creates full docs/ tree |
| No decision log required first | First decision log entry |

Typical greenfield: **`/discover` → `/init-meridian` → approve `00_scope` → Phase 2…**
