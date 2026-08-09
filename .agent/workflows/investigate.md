---
description: Read-only codebase investigation — trace flows, explain behavior, map dependencies. Report only; no product code.
---

# /investigate — codebase investigation

$ARGUMENTS

---

## Critical rules

1. Use `code-investigator` + `@[skills/investigate-codebase]`
2. **Mandatory read:** `references/investigation-checklist.md` before reporting
3. **No product code** — report only; fixes via `/refine-us` + `/implement-us`
4. **No delivery rows** — no US/epic/version unless manager explicitly asks
5. Default depth `medium`; honor `quick` or `thorough` in `$ARGUMENTS`

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **default** | Investigate question from user message |
| `US-XXXX` | **us-scope** | Limit to US Plan + cited architecture refs |
| `path:src/foo/` | **path-scope** | Limit search to directory prefix |
| `quick` | **quick** | Minimal files — locate or one-hop answer |
| `thorough` | **thorough** | Multi-path trace, tests, config |
| `US-XXXX thorough` | **combined** | US scope + deep trace |

---

## Task

```txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: INVESTIGATE (read-only)

RULES:
1. Frame question + depth (investigation-checklist.md)
2. Orient: manifests, layout, grep entry points
3. Trace flow with path evidence
4. Report: answer, evidence, flow, confidence, gaps, handoff
5. Material product truth change → update-decisions-log (date first)
6. Never implement — delegate to developer after refine
```

---

## Output

```txt
Pergunta:
Resposta:
Evidência:
Fluxo:
Confiança: high | medium | low
Lacunas:
Handoff: nenhum | /refine-us | /architecture | spike US | /update-decisions-log
Next:
```

---

## When to run

- "How does X work?" / "Where is Y handled?" / "Trace this request"
- Before `/refine-us` when Plan needs code facts
- Spike preparation (optional US for timebox — see scrum-meridian-map)
- After `/document-project` for deep dives on one capability

---

## vs neighbors

| Command | When |
| ------- | ---- |
| `/document-project` | Baseline entire codebase in `docs/` |
| `/audit-docs` | Phase docs vs code consistency |
| `/security-review` | Security compliance |
| `/discover` | Product discovery — not code archaeology |
