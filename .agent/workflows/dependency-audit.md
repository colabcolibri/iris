---
description: Review lockfiles and supply-chain posture — report only; complements security-pass and security-review.
---

# /dependency-audit — supply chain hygiene

$ARGUMENTS

---

## Critical rules

1. Use `security-champion` + `@[skills/security-review]`
2. Read `supply-chain-checklist.md` before reporting
3. **Report only** — run audit tools when manager approves; document findings
4. Distinguish from `/security-pass` (Phase 2 doc) and `/security-review` (code vs contract)

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | Inventory lockfiles + manifest hygiene for active stack |
| `US-XXXX` | **us-scope** | Dependencies introduced or touched by that US |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: DEPENDENCY AUDIT

RULES:
1. Read 01_tech_stack.md, 02_security.md § dependencies, 08_environments.md
2. Locate lockfiles (package-lock, pnpm-lock, poetry.lock, Cargo.lock, go.sum, etc.)
3. Note: direct vs transitive risk, unpinned deps, known audit command for stack
4. Suggest 02/08 updates or US follow-ups — no silent approve
```

---

## Output

```txt
Mode: full | us-scope
Lockfiles found:
Audit commands suggested:
Findings:
Gaps (doc):
Gaps (code/deps):
Next: /security-pass | /security-review | /refine-us US-XXXX
```
