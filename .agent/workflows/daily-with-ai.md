---
description: Daily workflow for managers using AI agents with Meridian — orient, implement, close US.
---

# /daily-with-ai — daily AI workflow

$ARGUMENTS

---

## Critical rules

1. Human manager approves; agents execute within `docs/` + SQLite delivery.
2. One US per implementation cycle when possible.
3. Code only with: `05_architecture` approved; epic/version in SQLite; US `ready: true`.
4. **Refine before implement** — `/refine-us` after `/create-us`.
5. **Implement only via gate** — `/implement-us US-XXXX`.
6. Close with `/complete-us` — never ✅ in chat only.
7. **Commit after close** — human step after `/complete-us`. See `commit-after-us-close.md`.

---

## Daily loop

### 1. Orient — `/status` + Board tab (extension reads SQLite)

### 2. Contextualize — cite `US-XXXX`; block if `ready: false`

### 3. Refine — `/refine-us US-XXXX` when needed

### 4. Implement — `/implement-us US-XXXX`

### 5. Close — `/complete-us US-XXXX` (upsert SQLite; `board_snapshots` auto)

### 6. Commit (human) — one US per commit per `commit-after-us-close.md`

---

## Day-to-day commands

| Command | Use |
| ------- | --- |
| `/status` | Session start |
| `/create-us` | New task |
| `/refine-us` | Set `ready: true` |
| `/implement-us` | Gate + code |
| `/complete-us` | Close US |
| `/complete-sprint` | Close sprint |
| `/update-decisions-log` | `prepend-decision` |
| `/plan-sprint` | Plan version/sprint |

---

## Anti-patterns

- Code without `ready: true` or `/implement-us`
- ✅ in chat without `/complete-us` + SQLite upsert
- Hand-editing delivery markdown/json when `meridian.db` exists
- Agent auto-commit without explicit request
