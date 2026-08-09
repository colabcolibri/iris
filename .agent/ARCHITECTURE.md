# Meridian agent architecture

> Structure of agents, skills, workflows, rules and scripts — Antigravity pattern adapted to the Meridian protocol.

---

## Purpose

| Layer | File | Audience |
| ------ | ------- | ------- |
| Kit monorepo | `README.md` | Humans (GitHub, onboarding) |
| Portable kit | `.agent/` | Copy to client projects; Antigravity, ag-kit, Cursor, Claude Code |
| IDE adapters | `.cursor/`, `.claude/`, `.agents/skills/`, `.codex/` (local, gitignored) | Cursor, Claude Code, Codex (symlinks + generated TOMLs → `.agent/`) — see [IDE_ADAPTERS.md](./IDE_ADAPTERS.md) |
| Always-on rules | `.agent/rules/meridian.mdc` + `.agent/rules/MERIDIAN.md` | Agents |
| Master protocol | `.agent/MERIDIAN.md` | Full governance |
| Operations | `.agent/agents`, `skills`, `workflows` | Personas and procedures |
| Human references | `.agent/references/` | `start-here`, `usage-guide`, `agents-help`, `instruction-surfaces`, `scrum-meridian-map`, optional `scrum-guide-complete` |

The VS Code extension (`app-visual-studio/`) is the optional monitor for Meridian folders; it is not the source of truth. Help panels read `.agent/references/*.md` at runtime — see [instruction-surfaces.md](./references/instruction-surfaces.md) when the protocol changes.

### Why `.agent` and `.cursor`?

- **`.agent/`** — Antigravity convention; copyable to projects and other tools.
- **`.cursor/`** — **local** adapter (generated symlinks; **do not commit**).

**Edit in `.agent/`** and run `./.agent/scripts/sync_cursor_kit.sh` to recreate adapters in `.cursor/`, `.claude/`, and Codex paths (required after clone).

---

## Directory structure

```txt
.agent/                    # canonical source (Antigravity / distribution)
  MERIDIAN.md
  rules/MERIDIAN.md
  agents/
  skills/
  workflows/
  scripts/
    validate_meridian.py
    migrate_us_v2_structure.py
    sync_cursor_kit.sh
  references/templates/      # delivery templates (INDEX, writing-guide, section-contracts, …)

.cursor/                   # Cursor adapter (local, gitignored — sync_cursor_kit.sh)
  rules/meridian.mdc       # alwaysApply
  skills/
  agents/
  commands/                # workflows as slash commands
```

---

## Rule priority

```txt
P0  .agent/rules/MERIDIAN.md
P1  .agent/MERIDIAN.md + .agent/agents/{agent}.md
P2  .agent/skills/{skill}/SKILL.md (+ references on demand)
```

Workflows orchestrate agents; they do not replace the master protocol.

---

## Agents

| Agent | Purpose | Skills |
| ----- | ------- | ------ |
| `product-owner` | `00_scope`, discovery, epics | discover-product, create-epic, update-decisions-log, meridian-routing |
| `technical-writer` | Phase docs `01`–`08`, `11` | init-project, update-decisions-log, meridian-routing |
| `security-champion` | `02_security`, security operator | security-review, update-decisions-log, meridian-routing |
| `technical-architect` | `05_architecture.md` | generate-architecture-diagram, security-review, update-decisions-log, meridian-routing |
| `design-system-owner` | `09_design_system.md` | design-system, update-decisions-log, meridian-routing |
| `quality-owner` | `10_test_strategy.md`, test operator | test-strategy, update-decisions-log, meridian-routing |
| `sprint-planner` | SQLite `versions`, `sprints`, epic close | create-version, create-sprint, complete-sprint, complete-epic, meridian-routing |
| `backlog-refiner` | US in SQLite | create-user-story, review-user-story, refine-user-story, complete-user-story, update-decisions-log, meridian-routing |
| `developer` | `/implement-us` increment | implement-user-story, update-decisions-log, meridian-routing |
| `scrum-master` | Governance, status, init, daily | init-project, update-decisions-log, meridian-routing |
| `code-investigator` | `/investigate` read-only traces | investigate-codebase, update-decisions-log, meridian-routing |

Each agent includes: phases 0/-1, mission, prohibitions, output format, delegation.

---

## Skills

| Skill | References |
| ----- | ---------- |
| `init-project` | `doc-templates.md`, `gitignore-baseline.md` |
| `create-epic` | `epic-template.md`, `writing-guide.md` |
| `create-version` | `version-template.md`, `writing-guide.md` |
| `create-sprint` | `sprint-template.md` |
| `complete-sprint` | `sprint-template.md` |
| `complete-epic` | `epic-template.md` |
| `create-user-story` | `us-template.md`, `writing-guide.md` |
| `review-user-story` | `review-checklist.md`, `writing-guide.md` |
| `refine-user-story` | `refine-checklist.md`, `writing-guide.md` |
| `implement-user-story` | `implement-gate-checklist.md` |
| `complete-user-story` | `close-us-contract.md`, `implementation-template.md` (Record shape only) |
| `update-decisions-log` | `decision-template.md`, `decision-schema.md` |
| `security-review` | `checklists.md`, implementation + supply-chain checklists |
| `test-strategy` | test-strategy + test-review checklists, test stacks |
| `design-system` | design-system checklists, UI stacks |
| `meridian-routing` | — (inline matrix) |
| `investigate-codebase` | investigation checklist, report template |
| `create-meridian-artifact` | registry-checklist, skill/agent/workflow templates |

**Agent mirror:** all delivery templates are symlinked under `.agent/references/templates/` with registry `INDEX.md`. Agents must read INDEX + full template before Write — see each agent's **Template protocol** section.

See `.agent/skills/doc.md` to create new skills — full procedure: `create-meridian-artifact`.

---

## Workflows

| Workflow | Agent | Mode |
| -------- | ----- | ---- |
| `init-meridian` | scrum-master | init, no code |
| `status` | scrum-master | read-only |
| `plan-sprint` | sprint-planner | planning |
| `create-version` | sprint-planner | create release in SQLite |
| `create-us` | backlog-refiner | create US |
| `review-us` | backlog-refiner | audit US — report only |
| `refine-us` | backlog-refiner | refine US before implement |
| `implement-us` | developer | gate + implement when `ready: true` |
| `complete-us` | backlog-refiner | close US after implementation (+ lifecycle cascade invite) |
| `complete-sprint` | sprint-planner | close sprint + retrospective |
| `complete-epic` | sprint-planner | close epic + outcome |
| `create-epic` | product-owner | create epic in SQLite |
| `architecture` | technical-architect | doc 05 |
| `security-pass` | security-champion | doc 02 |
| `privacy-pass` | security-champion | LGPD + GDPR in 02 |
| `security-review` | security-champion | code vs 02 — report only |
| `dependency-audit` | security-champion | supply chain — report only |
| `design-pass` | design-system-owner | doc 09 |
| `design-showcase` | design-system-owner | showcase plan |
| `design-review` | design-system-owner | UI audit — report only |
| `test-pass` | quality-owner | doc 10 |
| `test-review` | quality-owner | tests audit — report only |
| `seo-pass` | seo-strategy | doc 12 (public web) |
| `investigate` | code-investigator | read-only code trace — report only |
| `discover` | product-owner | product brief — no code |
| `document-project` | technical-writer | brownfield phase docs — no US |
| `audit-docs` | technical-writer | phase doc audit — report only |
| `daily-with-ai` | scrum-master | daily manager + AI routine |

All support `$ARGUMENTS` and a critical rules section.

---

## Scripts

```bash
# Structure + semantic validation (US Plan/Record, epic prose, board sync hints)
python3 .agent/scripts/validate_meridian.py <project-root>
python3 .agent/scripts/validate_meridian.py <project-root> --json   # CI

# One-time US schema migration (flat sections → Intent/Plan/Record/Boundaries)
python3 .agent/scripts/migrate_us_v2_structure.py <project-root>
python3 .agent/scripts/migrate_us_v2_structure.py <project-root> --restore-preamble

# IDE adapters (after clone or kit changes)
./.agent/scripts/sync_cursor_kit.sh
```

---

## Authority

1. User instruction
2. `.agent/MERIDIAN.md`
3. `.agent/rules/MERIDIAN.md`
4. Workflows
5. Agents
6. Skills

---

## Difference vs Antigravity kit

| Antigravity | Meridian |
| ----------- | -------- |
| `README.md` + `rules/GEMINI.md` | `README.md` (kit repo) + `.agent/` + `rules/MERIDIAN.md` |
| 37 code/stack skills | 10 document governance skills |
| `intelligent-routing` (technical domains) | `meridian-routing` (docs/US phases) |
| Plan files `{task-slug}.md` | `docs/` phases `00`–`11` + US |
| Long agents for implementation | Agents for documentation and gates before code |
