---
description: Create a Meridian user story after checking epics, versions and dependencies.
---

# /create-us — create user story

$ARGUMENTS

---

## Critical rules

1. Use `backlog-refiner` + `@[skills/create-user-story]`
2. **Mandatory read:** `writing-guide.md` + `code-quality-at-us-time.md` + `us-template.md` **before** Write
3. **Gate:** `05_architecture` = `approved`; epic + version exist
4. Write **Intent** (Why, Where, Acceptance) + **Plan** draft (refs, Planned) — see writing-guide
5. **One slice (SRP)** — split or narrow if request bundles unrelated layers; fill **Out of scope**
6. `ready: false` — never implement in same turn
7. **Forbidden:** do not `Write` `.meridian/drafts/`, `us-*-refine.md`, `us-*-complete.md`, delivery `.md` under `.meridian/` or `docs/`, or **helper `.py`** for US generation. “Narrative draft” = `ready: false` in SQLite after `update-us` (markdown on **stdin** — heredoc only; no `--from-file`, no temp files).
8. Next step always: `/refine-us US-XXXX` (optional: `/review-us US-XXXX` first for audit)

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: CREATE US (narrative draft)

RULES:
1. Phase 0 — clarify slice if request bundles multiple features
2. Read epic, version, depends_on US for understanding — write in own words (no epic paste)
3. Assign next US-XXXX
4. Write:
   - As / I want / so that — concrete user benefit
   - Intent / Acceptance — 2–4 observable criteria
   - Intent / Why — 2–4 sentences (before/after this slice)
   - Intent / Where — 2–4 sentences (version, deps, unblocks)
   - Plan / Approach — optional at create; refine may add bullets
   - Plan / Architecture refs — ok with § TBD until refine
   - Plan / Planned — draft test steps
5. ready: false
6. `update-us US-XXXX` — pipe full markdown on stdin (heredoc)
7. Tell user: run /refine-us before implement
```

---

## Output

```txt
US created:
ID: US-XXXX
Summary (one line):
Why written: yes | thin — needs refine
Next: /review-us US-XXXX (optional) | /refine-us US-XXXX
```

---

## Examples

| Request | Result |
| ------ | --------- |
| `/create-us filter board by version` | US with Why/Where/Approach prose + acceptance; ready false |
| `/create-us` vague | Ask: which slice, which version, who is the user |
