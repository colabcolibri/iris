---
description: Close a Meridian epic in SQLite after Must US are terminal — outcome confirmation.
---

# /complete-epic — close epic

$ARGUMENTS

---

## Critical rules

1. Use `sprint-planner` + `@[skills/complete-epic]`
2. **Hard block:** any Must US with status not in ✅ / 🚫 / 🧊
3. Prefer **new epic** for large follow-ups — do not reopen `complete`
4. Persist only via `update-epic` stdin heredoc
5. Happy path after last US: invited from `/complete-us` cascade (US-0168) — this slash is also for recovery/late close

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: COMPLETE EPIC

RULES:
1. Resolve EPIC-XX from $ARGUMENTS
2. Export epic + list Must US statuses
3. If open Must remain → stop and list blockers
4. Confirm outcome; update status complete via update-epic heredoc
5. Suggest version close if lifecycle-eligible shows version
```

---

## Output

```txt
Epic completed:
ID: EPIC-XX
Status: complete
Next: version eligibility | /create-epic | /status
```
