---
description: Audit US tests field and executed evidence against 10_test_strategy.md — gaps before complete-us.
---

# /test-review — test compliance audit

$ARGUMENTS

---

## Critical rules

1. Use `quality-owner` + `@[skills/test-strategy]`
2. Read `test-review-checklist.md` before reporting
3. Requires `10_test_strategy.md` when product uses automated tests; else audit US tests field only
4. **No product code** — report only; fixes via `/test-pass`, `/refine-us`, or `/implement-us`

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| `US-XXXX` | **us-scope** | Compare US Planned/Executed vs strategy (default) |
| `sprint` | **sprint** | All open Must US in active sprint with `tests: required` |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: TEST REVIEW

RULES:
1. Read 10_test_strategy.md (if exists) + test-review-checklist.md
2. Load US from SQLite — check tests, tests_status, Planned vs Executed
3. Verify pyramid level matches strategy (unit vs e2e)
4. Classify gaps: doc (/test-pass) | US (/refine-us) | code (/implement-us)
```

---

## Output

```txt
Mode: us-scope | sprint
US checked:
Compliant:
Gaps (doc):
Gaps (US Plan/Executed):
Gaps (code):
10 updates suggested:
Next: /test-pass | /refine-us US-XXXX | /implement-us US-XXXX | /complete-us
```
