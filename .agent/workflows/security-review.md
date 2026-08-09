---
description: Audit implemented code against 02_security.md and US acceptance — gaps, US follow-ups, doc updates.
---

# /security-review — security compliance audit

$ARGUMENTS

---

## Critical rules

1. Use `security-champion` + `@[skills/security-review]`
2. Read `implementation-security-checklist.md` before reporting
3. Requires `02_security.md` at least `draft`; prefer `approved` for strict pass
4. **No product code** — report only; fixes via `/security-pass`, `/refine-us`, or `/implement-us`
5. Offensive mode = STRIDE/OWASP checklist posture — not automated exploitation

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | Audit codebase surfaces vs `02` + open Must US |
| `US-XXXX` | **us-scope** | Audit code and acceptance for that US only |
| `offensive` | **offensive** | Threat-model walk + abuse scenarios (checklist-only) |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: SECURITY REVIEW

RULES:
1. Read 02_security.md + implementation-security-checklist.md
2. Check: secrets, authz, input validation, logging, dependencies cited in Plan
3. Compare US Acceptance security criteria vs code paths (grep/read)
4. Classify gaps: doc fix (/security-pass) | code fix (US) | both
5. Never mark 02 approved — human only
```

---

## Output

```txt
Mode: full | us-scope | offensive
Surfaces checked:
Compliant:
Gaps (doc):
Gaps (code):
02 updates suggested:
US follow-ups:
Next: /security-pass | /dependency-audit | /refine-us US-XXXX | /implement-us US-XXXX
```
