---
name: create-user-story
description: Creates a Meridian user story in SQLite after epics and versions exist. Use when adding work to the backlog with concrete acceptance criteria.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Create user story (Meridian)

> **v11:** delivery lives in `.meridian/meridian.db` — never create `docs/us/*.md`.  
> **Forbidden:** `.meridian/drafts/`, `us-*-refine.md`, `us-*-complete.md`, `docs/us/*.md`. “Draft” = `ready: false` in SQLite. **Persist:** `update-us US-XXXX` with markdown on **stdin** (heredoc) only — no scratch files, no `--from-file`, **no helper `.py`**.

## Selective reading

| File | When to read |
| ------- | ---------- |
| `.agent/references/templates/writing-guide.md` | **Mandatory** — explanatory US prose |
| `.agent/references/templates/code-quality-at-us-time.md` | **Mandatory** — DRY, SRP |
| `.agent/references/templates/INDEX.md` | Agent protocol |
| `references/us-template.md` | **Mandatory** — full `body_markdown` shape |

## Delivery commands

```bash
python3 .agent/scripts/meridian_delivery.py list epics
python3 .agent/scripts/meridian_delivery.py list versions
python3 .agent/scripts/meridian_delivery.py show US-0115 --full   # dependency context
python3 .agent/scripts/meridian_delivery.py create-us --title "..." --epic EPIC-15 --version v10
python3 .agent/scripts/meridian_delivery.py update-us US-0116 <<'EOF'
---
id: US-0116
title: ...
epic: EPIC-15
version: v10
status: ❌
ready: false
---
# US-0116 — ...
(body per us-template.md)
EOF
```

Never Write `docs/us/` or `docs/kanban/board.json`. Upsert records `board_snapshots` automatically.

After create, the US appears in **📋 Backlog** on the extension board (`ready: false`, `status: ❌`). Do not write board column names in the US body — only `status` and `ready`.

## Preconditions (hard gate)

| Doc | Required status |
| --- | -------------- |
| `05_architecture.md` | `approved` |
| epic / version rows | exist in SQLite (`list epics`, `list versions`) |
| Profile in `03_user_types.md` | exists |

Frontmatter links `epic:` — **do not paste epic text** into the body.

## Phase 0 — clarify before writing

If vague, ask: user type, single slice, before/after, `depends_on`, `done_when` + acceptance.

## Writing rules (mandatory)

| Section | Rule |
| ------- | ---- |
| **Why** | 2–4 sentences: problem, before/after for this slice |
| **Where** | 2–4 sentences: version, deps, next US |
| **Approach** | optional at create; refine adds bullets |
| **Acceptance** | 2–4 observable checklist items |
| **Out of scope** | Prevents SRP violations |

## Procedure

1. Read `writing-guide.md`, `code-quality-at-us-time.md`, `us-template.md`.
2. Read epic/version/dependency US via `show --full` or `meridian_db_export.py --entity epics --id EPIC-XX`.
3. `create-us` for id + stub, or draft full markdown with next id from `list user_stories`.
4. Write full US markdown (Why / Where / Approach with real sentences).
5. `update-us US-XXXX` with full markdown on stdin (heredoc); `ready: false` in frontmatter.
6. `prepend-decision` if acceptance model changes.

## Output

```txt
US created:
ID: US-XXXX
Epic:
Version:
Depends on:
Narrative complete: yes | needs refine
Next: /refine-us US-XXXX
```
