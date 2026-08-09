---
name: review-user-story
description: Audits a Meridian user story in SQLite against writing quality and section contracts — report only. Use for /review-us US-XXXX before refine or implement.
allowed-tools: Read, Glob, Grep, Bash
---

# Review user story (Meridian)

> **Read-only audit.** Load US from SQLite (`show --full`). Do **not** set `ready: true` or edit unless manager explicitly asks.

## Selective reading

| File | When to read |
| ------- | ---------- |
| `references/review-checklist.md` | **Mandatory** |
| `references/us-template.md` | Expected shape |
| Target US | `meridian_delivery.py show US-XXXX --full` |

## Delivery commands

```bash
python3 .agent/scripts/meridian_delivery.py show US-0115 --full
python3 .agent/scripts/validate_meridian.py .
```

## Procedure

1. Read checklist + US `--full` (+ dependency US if cited).
2. Run validator; walk checklist — pass | fail | warn.
3. **Do not** upsert unless manager asks to fix in same turn.
4. Recommend `/refine-us`, `/implement-us`, or `/complete-us`.

## Output

```txt
US review:
ID: US-XXXX
Validator: pass | N errors
Checklist: X/Y pass
Recommendation: /refine-us | /implement-us | /complete-us
```
