# Skill template — copy to `.agent/skills/{name}/SKILL.md`

```markdown
---
name: {skill-name}
description: One line with outcome and triggers. Use when user asks for …
allowed-tools: Read, Glob, Grep   # add Edit, Write, Bash only if needed
---

# {Title}

> One-sentence purpose.

## Selective reading

| File | When to read |
| ---- | ------------ |
| `references/{checklist}.md` | **Mandatory** — … |

## When to trigger

- `/workflow-name` or keywords …
- …

## Procedure

### Phase 0 — context
1. …

### Phase 1 — …
1. …

## Forbidden

| Forbidden | Why |
| --------- | --- |
| … | … |

## Output

\`\`\`txt
Field:
Next:
\`\`\`
```

## Rules

- `name` = folder name (kebab-case).
- `description` is the primary discovery trigger for agents.
- Keep `SKILL.md` under ~120 lines; move checklists to `references/`.
- Long templates live in `references/`, not in `.agent/references/templates/` unless shared across agents (see `TEMPLATE_SOURCES.md`).
