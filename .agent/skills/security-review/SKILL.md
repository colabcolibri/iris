---
name: security-review
description: Reviews Meridian security posture, including secrets, threat model, CI gates bootstrap, AI-agent safety, OWASP, dependencies and Git hygiene. Use for 02_security.md or security hardening.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Security review (Meridian)

> Security before architecture and before agents execute sensitive work.

## Operator workflows

| Workflow | Purpose |
| -------- | ------- |
| `/security-pass` | Create/update `02` — Phase 2 doc pass |
| `/privacy-pass` | LGPD + GDPR sections in `02` |
| `/security-review` | Audit code vs `02` + US (no code) |
| `/dependency-audit` | Lockfiles and supply chain report |

## Selective reading

| File | When to read |
| ------- | ---------- |
| `.agent/references/templates/phase-docs/02-security.md` | **Init** — § Document stub to create `docs/02_security.md` |
| `references/security-doc-checklist.md` | **Mandatory** — structure of `02` at init and pass |
| `references/security-bootstrap.md` | **Mandatory** — `/security-pass bootstrap` (`02`) |
| `references/ci-gates-bootstrap.md` | **Mandatory** — `/security-pass bootstrap` (`08` CI rows) |
| `references/privacy-compliance-checklist.md` | **Mandatory** — `/privacy-pass` (LGPD + GDPR) |
| `references/privacy-bootstrap.md` | **Mandatory** — `/privacy-pass bootstrap` |
| `references/checklists.md` | `/security-pass full` or deep `02` review |
| `references/implementation-security-checklist.md` | **Mandatory** — `/security-review` |
| `references/supply-chain-checklist.md` | **Mandatory** — `/dependency-audit` |

## When to trigger

- `/security-pass`, `/privacy-pass`, `/security-review`, `/dependency-audit`
- Create or review `02_security.md`
- Threat model, secrets, OWASP, supply chain request
- Before `05_architecture.md` goes to `approved`
- Suspected agent violation (destructive command, leak)
- Before `/complete-us` on Must US with security acceptance

## Procedure

1. Read `00_scope.md`, `01_tech_stack.md`, `03_user_types.md` (context).
2. **security-pass:** go through **all** sections of `references/checklists.md`; update `02_security.md`.
3. **security-review:** read `implementation-security-checklist.md`; report gaps only.
4. **dependency-audit:** read `supply-chain-checklist.md`; report gaps only.
5. Register relevant decisions via `update-decisions-log`.
6. Do not weaken auth/validation/logging without explicit decision.

## Result in `02_security.md`

- Prioritized risks
- Security decisions
- Mitigations and open items
- Impact on architecture, database, API, environments
- AI agent posture for the project

## Output

```txt
Security review:
02_security status:
Critical gaps:
Decisions logged:
Blocked until:
```
