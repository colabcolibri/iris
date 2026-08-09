---
description: Gate and implement a user story — only after ready true and Plan filled.
---

# /implement-us — implement user story

$ARGUMENTS

---

## Critical rules

1. Use `developer` + `@[skills/implement-user-story]`
2. **Mandatory read:** `implement-gate-checklist.md` + `code-quality-at-us-time.md` + target US **before** product code
3. **Mandatory read:** `docs/04_principles.md` (DRY, SRP) before Write on code
4. **Hard block:** `ready: true` required — if false → stop; recommend `/refine-us`
5. Read every **Architecture refs** section before Write on code
6. Implement with DRY + SRP — reuse modules per Approach; no scope creep across layers
7. One US per session — cite `US-XXXX` and load with `show --full`
8. Do **not** mark `✅` or run `/complete-us` in the same turn unless manager only asked to close
9. Partial delivery → `🔶` + `Missing:` in Acceptance; no forced close
10. **HAR:** if Acceptance needs external accounts, OAuth, billing, or production credentials → emit `⛔ Ação humana necessária` per `rules/MERIDIAN.md`; do not fake completion

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: IMPLEMENT US

RULES:
1. Resolve US id from $ARGUMENTS or ask
2. Run implement gate checklist (architecture, ready, Plan, depends_on, status)
3. If blocked → output blocker; NO product code
4. If passed → read Architecture refs + 04_principles → implement Acceptance + Planned (DRY + SRP)
5. validate_meridian.py optional after US edits (not before gate)
6. Remind manager: review diff → /complete-us → commit (human)
```

---

## Output

```txt
Implement gate: passed | blocked
US:
Blockers:
Architecture refs read:
DRY / SRP applied:
Files touched:
Tests run:
Next: /complete-us US-XXXX (after manager review)
```

---

## vs `/refine-us`

| `/refine-us` | `/implement-us` |
| --- | --- |
| Docs only; sets `ready: true` | Gate + product code |
| Deepens Plan | Requires Plan already concrete |
| Never writes app code | Writes code after gate passes |

Typical flow: `/create-us` → `/refine-us` → **`/implement-us`** → `/complete-us`.
