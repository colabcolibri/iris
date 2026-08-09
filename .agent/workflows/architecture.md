---
description: Create or review 05_architecture.md, docs/architecture/ detail files, and IDE diagram maps after required Meridian documents are drafted.
---

# /architecture — architecture

$ARGUMENTS

---

## Routing (Meridian chain)

```txt
/architecture $ARGUMENTS
  → agent: technical-architect
  → skills (load from agent frontmatter):
      - generate-architecture-diagram  (when diagrams / visuals / ER maps)
      - security-review                (when auth, data, agent boundaries change)
      - update-decisions-log           (material change on approved 05)
      - meridian-routing               (if intent ambiguous)
```

Announce `🤖 Applying knowledge from @technical-architect...` before work.

---

## Critical rules

1. **Mandatory read:** `architecture-folder-guide.md` before splitting or indexing detail files
2. Prerequisites: scope, stack, security, users (draft minimum) — agent Phase 0 gate
3. Align with `02_security` — load `security-review` when auth, data, or agent boundaries change
4. Material change → `update-decisions-log` (run `date` before Write)
5. Gate stays on `05_architecture.md` frontmatter — not on each file in `architecture/`
6. **Diagrams:** load `generate-architecture-diagram` for any visual map work — never skip inventory when `diagrams/` exists
7. No product code in this workflow (unless explicit request in $ARGUMENTS)

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: ARCHITECTURE DOC

RULES:
1. technical-architect Phase 0 gate
2. Read 00, 01, 02, 03, 04 before editing 05
3. Cross-check 06/07/08 if they exist — no contradictions
4. Keep 05 as overview + index; move deep specs to docs/architecture/*.md when warranted
5. Diagrams (skill generate-architecture-diagram):
   - Phase 0: glob docs/architecture/diagrams/*.{md,mmd} vs 05 § Architecture diagrams
   - Create/update runtime, database ER (from 06), integrations, flows — one file per view
   - Reconcile index: every on-disk file has a row; remove stale rows
   - Multi-file projects: refresh only files in scope of $ARGUMENTS, or all if "diagrams" / "visual" / "maps"
6. Maintain ## Architecture detail files table when architecture/*.md used
7. Set status draft or review — not approved without human
```

---

## Output

```txt
05_architecture status:
Detail files (if any):
Architecture diagrams:
  inventory: …
  created/updated: …
Aligned with: [docs]
Drift detected:
Proposed changes:
Security follow-ups:
Ready for review: yes | no
```
