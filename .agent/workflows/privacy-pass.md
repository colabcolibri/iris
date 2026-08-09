---
description: Create or update privacy sections in docs/02_security.md — LGPD (Brazil) and GDPR (EU/EEA).
---

# /privacy-pass — privacy compliance contract

$ARGUMENTS

---

## Critical rules

1. Use `security-champion` + `@[skills/security-review]`
2. Read `privacy-compliance-checklist.md` before Write on `02_security.md`
3. **LGPD and GDPR are separate** — fill both, mark N/A per jurisdiction with manager rationale
4. Use **official references only** in tables (ANPD, Planalto, EUR-Lex, EDPB, European Commission)
5. **Doc only** — product endpoints for export/delete → `/implement-us`
6. **HAR** for regulator portals or cloud consoles requiring human login
7. Human sets `status: approved` on `02_security.md`

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | Walk full `privacy-compliance-checklist.md` (LGPD + GDPR) |
| `bootstrap` | **bootstrap** | Read `00` + `01` → `privacy-bootstrap.md` → draft privacy § in `02` |
| `US-XXXX` | **us-align** | Load US `--full`; map PII acceptance → privacy sections |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: PRIVACY PASS

RULES:
1. security-champion Phase 0
2. Determine jurisdictions (BR, EU, both, neither)
3. Run checklist per active jurisdiction
4. Update § Privacy — LGPD and § Privacy — GDPR in 02_security.md
5. Log material scope changes via prepend-decision
6. Report gaps — never claim legal compliance
```

---

## Output

```txt
Mode: full | bootstrap | us-align
Jurisdictions: LGPD | GDPR | both | neither
02_security privacy sections:
LGPD gaps:
GDPR gaps:
Official refs cited:
HAR stops (if any):
Next: human review → /security-pass full | /refine-us US-XXXX
```

---

## After

```txt
Next: manager approves 02_security → continue architecture gate when security + privacy gaps resolved or accepted
```
