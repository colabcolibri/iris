---
description: Audit live UI against 09_design_system.md and showcase — gaps, US follow-ups, doc updates.
---

# /design-review — design compliance audit

$ARGUMENTS

---

## Critical rules

1. Use `design-system-owner` + `@[skills/design-system]`
2. Read `design-review-checklist.md` before reporting
3. Requires `09_design_system.md` at least `draft`; prefer `approved` for strict pass
4. **No product code** — report only; fixes via `/design-pass`, `/refine-us`, or `/implement-us`
5. For web/extension: inspect running UI (browser, webview URL) when available

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **platform** | Audit main surfaces vs `09` + showcase |
| `US-XXXX` | **us-scope** | Audit screens delivered by that US only |
| `routes` | **catalog-only** | Verify showcase pages exist and match inventory |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: DESIGN REVIEW

RULES:
1. Read 09 + component-composition-pattern.md
2. Check: tokens, composed vs edited primitives, responsive, a11y baseline
3. Compare showcase routes (if any) to 09 § Showcase catalog
4. Classify gaps: doc fix (/design-pass) | code fix (US) | both
5. Never mark 09 approved — human only
```

---

## Output

```txt
Mode: platform | us-scope | catalog-only
Screens checked:
Compliant:
Gaps (doc):
Gaps (code):
09 updates suggested:
US follow-ups:
Next: /design-pass | /design-showcase | /refine-us US-XXXX | /implement-us US-XXXX
```
