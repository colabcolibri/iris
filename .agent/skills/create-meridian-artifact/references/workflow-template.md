# Workflow template — copy to `.agent/workflows/{command}.md`

Filename = slash without slash: `/investigate` → `investigate.md`

```markdown
---
description: One line — what the command does and deliverable type (report, doc, US).
---

# /{command} — {short title}

$ARGUMENTS

---

## Critical rules

1. Use `{agent-name}` + `@[skills/{skill-name}]`
2. **Mandatory read:** `references/{checklist}.md` before reporting
3. **No product code** — report only (or state exception)
4. …

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **default** | … |
| `US-XXXX` | **us-scope** | … |
| `thorough` | **deep** | … |

---

## Task

\`\`\`txt
CONTEXT:
- User Request: $ARGUMENTS
- Mode: {MODE}

RULES:
1. …
2. …
\`\`\`

---

## Output

\`\`\`txt
Field:
Confidence:
Handoff:
Next: /… | human
\`\`\`

---

## When to run

- …
```

## After creating the workflow

1. Add row to `.agent/rules/meridian.mdc` slash table.
2. Add row to `.agent/references/agents-help.md` (correct group).
3. Add row to `meridian-routing` matrix.
4. Run `./.agent/scripts/sync_cursor_kit.sh`.
