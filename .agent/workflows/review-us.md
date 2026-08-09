---
description: Audit a user story against templates and checklists — read-only report, no ready flag.
---

# /review-us — review user story

$ARGUMENTS

---

## Critical rules

1. Use `backlog-refiner` + `@[skills/review-user-story]`
2. **Read-only** — do not upsert US unless manager explicitly asks to fix in the same turn
3. **Never** set `ready: true` — only `/refine-us` does that
4. **NO product code**
5. **Mandatory read:** `TEMPLATE_SOURCES.md` (if path confusion) + `writing-guide.md` + `review-checklist.md` + target US
6. Run `validate_meridian.py` when available

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: REVIEW US (audit)

RULES:
1. Resolve US id from $ARGUMENTS or ask
2. Read US, depends_on US, cited architecture sections (for R6 only)
3. Run validate_meridian.py on project folder
4. Score review-checklist R1–R13 — pass | fail | warn per row
5. Output gap table + single recommendation
6. Do NOT edit US or ready flag unless explicit fix request
```

---

## Output

```txt
US review:
File:
Validator:
Checklist: X/13 pass

Failures:
Warnings:
ready in file: true | false | unset
Recommendation: /refine-us | /complete-us | implement | human
```

---

## vs `/refine-us`

| `/review-us` | `/refine-us` |
| --- | --- |
| Report gaps | Fix gaps in file |
| Never sets ready | Sets ready: true when checklist passes |

Typical flow: `/create-us` → `/review-us` (optional) → `/refine-us` → implement.
