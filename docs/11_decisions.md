---
title: Decisions log
status: approved
version: 1.0
updated: 2026-08-09
depends_on: []
blocks: []
---

# 11 — Decisions log

> **Source of truth:** `.meridian/meridian.db` (`decisions` table).  
> Prepend via `python3 .agent/scripts/meridian_delivery.py prepend-decision`.

This file is a stub pointer. Do not duplicate decision narratives here.

## How to log

```bash
date +"%Y-%m-%d"
date +"%H:%M"
python3 .agent/scripts/meridian_delivery.py prepend-decision <<'EOF'
---
date: YYYY-MM-DD
time: HH:MM
title: Short title
---
Decision body.
EOF
```

## Recent decisions

See SQLite: `python3 .agent/scripts/meridian_delivery.py list decisions`
