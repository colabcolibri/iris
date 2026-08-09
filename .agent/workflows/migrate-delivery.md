---
description: One-shot import of legacy delivery Markdown (docs/us, epics, …) into SQLite.
---

# /migrate-delivery — v1 Markdown → SQLite

$ARGUMENTS

---

## Critical rules

1. **Read-only on phase docs** — only imports `docs/us/`, `docs/epics/`, `docs/versions/`, `docs/sprints/`, optional `docs/kanban/board.json`, `docs/decisions/*.json`
2. Route to **`scrum-master`** (process) — no product code
3. Run **`verify_md_sqlite_parity.py`** before any purge
4. Agents use **`meridian_delivery.py`** after migration — not `docs/us/*.md` as write path

---

## When to use

| Situation | Action |
| --------- | ------ |
| Fresh project (`/init-meridian`) | **Skip** — use `meridian_delivery.py bootstrap` only |
| Legacy v1 tree on disk | This workflow |
| Branch `meridian-v1-old` | Checkout delivery folders, then run scripts below |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Package root: active Meridian product (folder with docs/)

PROCEDURE:
1. Confirm delivery .md folders exist under docs/ (or instruct checkout from meridian-v1-old)
2. python3 .agent/scripts/bootstrap_meridian_db.py <packageRoot>
3. python3 .agent/scripts/migrate_md_to_sqlite.py <packageRoot>
4. python3 .agent/scripts/verify_md_sqlite_parity.py <packageRoot>   # exit 0 required
5. python3 .agent/scripts/validate_meridian.py <packageRoot> --sqlite-only
6. Optional (human): purge_delivery_md.py . --require-verify
7. Ensure .meridian/delivery.json exists (bootstrap writes default connector: sqlite)
8. REPORT counts via meridian_delivery.py counts
```

---

## Scripts reference

| Script | Purpose |
| ------ | ------- |
| `migrate_md_to_sqlite.py` | Import epics, versions, sprints, US, decisions, board snapshot |
| `verify_md_sqlite_parity.py` | Gate — row/field parity before purge |
| `purge_delivery_md.py` | Remove delivery `.md` after verify (`--require-verify`) |
| `meridian_delivery.py bootstrap` | Empty DB + `delivery.json` (new projects) |

Full detail: `docs/06_database.md` § Migration, `MERIDIAN_V2_CUTOVER.md`.

---

## Expected output

```txt
Migrate delivery complete:
Package: <path>
Imported: versions N, epics N, sprints N, user_stories N
Verify: exit 0
SQLite saved: yes
delivery.json: connector sqlite
Next: /status — do not Write docs/us/ when meridian.db exists
```
