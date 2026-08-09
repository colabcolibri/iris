---
description: Close a Meridian user story after implementation — add Record and status without deleting refined content.
---

# /complete-us — close user story

$ARGUMENTS

---

## P0 — read first

**`/complete-us` is additive.** You **add** what is missing (Record, `[x]` acceptance, status). You **never** delete or replace Intent, Plan, Approach, Why, Where, or Boundaries.

**Never** copy `us-template.md` or `implementation-template.md` into `update-us` / `patch-record`. Those are not the US body.

1. `show US-XXXX --full` — mandatory
2. `@[skills/complete-user-story/references/close-us-contract.md]` — mandatory
3. `patch-record` — default persist path

---

## Critical rules

1. Use `backlog-refiner` + `@[skills/complete-user-story]`
2. **Gate:** implementation delivered; tests passed; `depends_on` at `✅`
3. **Do not** mark `✅` with placeholder Record; CLI rejects boilerplate
4. **Forbidden:** helper `.py`; rebuilding US from template; `update-us` with partial body
5. `prepend-decision` when protocol/architecture changed
6. suggested commit in `### Executed`

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: COMPLETE US (ADDITIVE — never wipe existing US text)

RULES:
1. backlog-refiner Phase 0 — US id + dependencies
2. Read close-us-contract.md
3. show US-XXXX --full — copy of record in SQLite; extend this, do not replace
4. Add ## Record (real paths) + flip Acceptance [x] + Planned [x] where done
5. status ✅; tests_status done (or n/a if tests: none)
6. patch-record (preferred) — OR update-us with ENTIRE body from step 3 + edits only
7. Self-check: Why/Where/Approach text identical to step 3 unless manager changed scope
8. prepend-decision if needed; lifecycle-eligible; ask manager for sprint/epic close
```

---

## Output

```txt
US completed:
ID: US-XXXX
Preserved Intent/Plan: yes | NO
Persist: patch-record | update-us
Files touched:
Tests run:
Decisions logged:
Suggested commit:
Lifecycle cascade:
Next (human): commit per commit-after-us-close.md
```

---

## Examples

| Request | Result |
| ------ | --------- |
| `/complete-us US-0034` | US-0034 keeps refined text; Record + ✅ added |
| `/complete-us` without id | Ask which US or infer from session |
| Partial implementation | Status 🔶 + Missing:; do not force ✅ |
