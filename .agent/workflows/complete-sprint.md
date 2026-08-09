---
description: Close a Meridian sprint in SQLite — sprint review, retrospective, status complete.
---

# /complete-sprint — close sprint

$ARGUMENTS

---

## Critical rules

1. Use `sprint-planner` + `@[skills/complete-sprint]`
2. Export sprint: `meridian_db_export.py . --entity sprints --id vX-SY`
3. **Gate:** manager confirms increment vs sprint `goal`
4. Fill `## Retrospective`; `update-sprint` (stdin heredoc)
5. `prepend-decision` if retrospective lists cross-cutting decisions

---

## Output

```txt
Sprint completed:
ID: vX-SY
Status: complete
US summary: (✅ / 🔶 / ❌ counts)
Retrospective filled: yes | no
Next: /plan-sprint
```
