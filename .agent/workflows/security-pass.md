---
description: Create or update docs/02_security.md — bootstrap, full pass, or US alignment.
---

# /security-pass — security contract

$ARGUMENTS

---

## Critical rules

1. Use `security-champion` + `@[skills/security-review]`
2. If creating `02` from scratch → copy § Document stub from `.agent/references/templates/phase-docs/02-security.md`
3. Read checklist for active mode before Write on `02_security.md`
4. Relevant decisions → `prepend-decision` (read `update-decisions-log` skill)
5. Do not silently approve architecture `approved` if critical gaps remain open
6. **HAR:** console signup, OAuth app registration, or regulator portals → stop with HAR block; read-only official docs (ANPD, EUR-Lex) need no account

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | `checklists.md` + `security-doc-checklist.md` on entire `02` |
| `bootstrap` | **bootstrap** | Run `quality-profile` → read `01_tech_stack.md` → `security-bootstrap.md` + `ci-gates-bootstrap.md` → fill `02` and CI rows in `08` **up to** profile tier |
| `US-XXXX` | **us-align** | Load US `--full`; map security Acceptance → `02` sections |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: SECURITY PASS

RULES:
0. Resolve profile: `python3 .agent/scripts/meridian_delivery.py quality-profile` — audit/CodeQL only when `full` unless human raised profile
1. security-champion Phase 0
2. Run mode procedure (full | bootstrap | us-align)
3. Document risks, mitigations, AI-agent rules for project
4. No weakening controls without logged decision
5. Report blockers to scrum-master if needed
```

---

## Output

```txt
Mode: full | bootstrap | us-align
qualitySiege (profile):
Profile source:
02_security status:
08 CI rows updated: yes | no | n/a
Sections updated:
Critical findings:
Mitigations proposed:
Blocked docs/phases:
Decisions logged:
Next: human review → approved | /security-review | /refine-us US-XXXX
```

---

## After

```txt
Next: manager approves 02_security → /architecture when stable
```
