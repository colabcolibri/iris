---
description: Prepend a decision entry to SQLite (.meridian/meridian.db) with real date and clock time.
---

# /update-decisions-log — log a decision

$ARGUMENTS

---

## Critical rules

1. **Mandatory read:** `@[skills/update-decisions-log]` + `references/decision-template.md`
2. **Before CLI:** run at project root:
   - `date +"%Y-%m-%d"` → `--date`
   - `date +"%H:%M"` → `--time` (24h local; never invent or round)
3. Use `meridian_delivery.py prepend-decision` — **never** `Write` on `docs/decisions/*.json`
4. **NO product code** — decision log only unless manager also asked for implementation

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: LOG DECISION

RULES:
1. Capture what changed, why, impact, affected_document, responsible
2. Run prepend-decision with real date/time from shell date commands
3. If an approved phase doc changed → set that doc status: review + mention in --impact
4. validate_meridian.py on project folder when available
```

---

## Output

```txt
Decision logged:
Store: .meridian/meridian.db (decisions)
Date: YYYY-MM-DD
Clock used: HH:MM (from date command)
Affected document:
Docs moved to review:
Follow-up:
```
