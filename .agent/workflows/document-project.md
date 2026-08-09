---
description: Document an existing codebase in phase docs and as-is inventory — no epics or user stories.
---

# /document-project — document existing codebase

$ARGUMENTS

---

## Critical rules

1. Use `technical-writer` + `@[skills/document-existing-project]`
2. **Mandatory read:** `init-interview-guide.md` + `doc-templates.md` + `as-is-inventory-template.md` + relevant `phase-docs/*.md`
3. **No delivery rows** — no epics, versions, sprints, US
4. All docs stay `draft` unless manager explicitly approves later
5. If `docs/` missing → `/init-meridian` first, then re-run this command

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: DOCUMENT AS-IS (governance only)

RULES:
1. Read codebase (manifests, structure, README, auth, DB, CI)
2. Interview Mode B — inferences first, then gaps only
3. Create or update docs/inventory/as-is.md
4. Populate docs/00–08 per phase-docs templates (depth bar)
5. Cross-check high-confidence inventory rows in scope/architecture
6. validate_meridian.py --sqlite-only
7. Report assumptions — never mark approved
```

---

## Output

```txt
Document project complete:
Inventory: …
Phase docs updated: …
Assumptions:
Next: /audit-docs | approve 00→04 | /architecture
```

---

## vs `/init-meridian` Mode B

| Step | Command |
| ---- | ------- |
| 1 | `/init-meridian` — creates `docs/` tree + bootstrap |
| 2 | `/document-project` — fills inventory + phase doc bodies |

Mode B init **ends** pointing here; heavy documentation runs in this workflow.
