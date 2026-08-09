---
description: Audit phase docs for depth, consistency, and drift vs codebase; optional draft fixes.
---

# /audit-docs — audit phase documentation

$ARGUMENTS

---

## Critical rules

1. Use `technical-writer` (+ `product-owner` for `00_scope` contradictions only)
2. **Mandatory read:** `@[skills/audit-phase-docs]` + `phase-docs/*.md` + all `docs/0X_*.md`
3. Default: **report only** — apply edits only if user asks or `$ARGUMENTS` contains `apply`
4. Never set `status: approved`; never create US/epics
5. Works for Meridian-started projects and brownfield alike

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: AUDIT PHASE DOCS

RULES:
1. Scan all phase docs — depth bar, frontmatter, cross-links
2. Spot-check codebase for stale claims
3. Score each doc; list contradictions and priority fixes
4. If apply requested: draft-only edits; log decision if scope changes
5. Suggest /document-project if docs are mostly empty
```

---

## Output

```txt
Phase docs audit:
Summary table per doc
Priority fixes
Applied: yes | no
Next: /document-project apply | /architecture | human approve
```

---

## When to run

- After `/init-meridian` or `/document-project` before approving docs
- When docs feel outdated vs code
- Periodic hygiene on long-running Meridian projects
