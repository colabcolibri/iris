---
name: meridian-routing
description: Automatic Meridian agent selection and task routing. Analyzes requests and picks v11 agents (scrum-master, product-owner, technical-writer, security-champion, technical-architect, design-system-owner, quality-owner, sprint-planner, backlog-refiner, developer, code-investigator) without explicit user mentions.
allowed-tools: Read, Glob, Grep
version: 1.1.0
---

# Meridian intelligent routing

> The agent acts as **Meridian facilitator**, not a generic implementer.

## Principle

Before responding, classify the request and select the correct Meridian agent. State which expertise is active.

## Selection matrix

| Intent | Keywords | Agent(s) | Auto? |
| -------- | -------------- | -------- | ----- |
| Start / structure | "start", "setup", "create docs", "init meridian" | `scrum-master` | yes |
| Status / governance | "status", "phase", "blocker", "can advance" | `scrum-master` | yes |
| Daily AI workflow | "how to use AI", "day to day", "cursor routine", `/daily-with-ai` | `scrum-master` | yes |
| Scope / discovery | "scope", "in scope", "out of scope", `00_scope`, `/discover` | `product-owner` | yes |
| Phase documents | "tech stack", "principle", "environment", `01_`–`08`, `11` | `technical-writer` | yes |
| Epic (capability) | "create epic", "new epic", `/create-epic`, `EPIC-` | `product-owner` + `create-epic` | yes |
| Security doc | "security pass", `02_security`, threat model draft | `security-champion` + `security-review` | yes |
| Security audit | `/security-review`, code security, offensive checklist | `security-champion` + `security-review` | yes |
| Dependency audit | `/dependency-audit`, lockfile, supply chain, CVE | `security-champion` + `security-review` | yes |
| Privacy doc | LGPD, GDPR, `/privacy-pass`, titular, data subject, encarregado, DPO, consentimento | `security-champion` + `security-review` | yes |
| Human-only action | create account, OAuth, PAT, API key, billing, payment, Stripe dashboard, production deploy, accept terms | **HAR stop** — no agent continues until manager acts | yes |
| SEO (public web) | SEO, sitemap, meta tags, robots, Core Web Vitals, schema.org | `seo-strategy` skill + `technical-writer` / `developer` | yes |
| Deploy / CI doc | deploy, rollback, CI pipeline, production release | `technical-writer` + `08_environments` | yes |
| Architecture | "architecture", `05_architecture`, `/architecture`, diagram, system map, ER map, architecture diagrams | `technical-architect` + `generate-architecture-diagram` | yes |
| Design system | `09_design`, `/design-pass`, `/design-showcase`, `/design-review`, tokens, UI | `design-system-owner` + `design-system` | yes |
| Test strategy | `10_test`, `/test-pass`, pyramid, coverage, runners, `qualitySiege` | `quality-owner` + `test-strategy` | yes |
| Test audit | `/test-review`, tests evidence, before complete-us | `quality-owner` + `test-strategy` | yes |
| Version / sprint | "version", "sprint", `/create-version`, `/plan-sprint` | `sprint-planner` | yes |
| Close sprint | `/complete-sprint`, retrospective | `sprint-planner` + `complete-sprint` | yes |
| Close epic | `/complete-epic`, epic outcome | `sprint-planner` + `complete-epic` | yes |
| Decisions / log | "decision", `/update-decisions-log` | `update-decisions-log` skill + `date` | yes |
| User story / board | "user story", "US-", "kanban", `board_snapshots` | `backlog-refiner` | yes |
| Implement US / code | "implement", "build", `/implement-us` | `developer` + `implement-user-story` | **block** if `ready` not true |
| Refine US | `/refine-us`, "ready for implement" | `backlog-refiner` + `refine-user-story` | yes |
| Review US | `/review-us`, "audit US" | `backlog-refiner` + `review-user-story` | yes |
| Close US | `/complete-us`, "close story" | `backlog-refiner` + `complete-user-story` | yes |
| US + planning | "plan sprint" + "create US" | `sprint-planner` + `backlog-refiner` | yes |
| Code investigation | "how does", "where is", "trace", "explain flow", `/investigate`, spike prep | `code-investigator` + `investigate-codebase` | yes |
| Brownfield docs | `/document-project`, "document as-is", inventory | `technical-writer` + `document-existing-project` | yes |
| Phase doc audit | `/audit-docs`, docs stale vs code | `technical-writer` + `audit-phase-docs` | yes |
| Extend Meridian kit | new skill, new agent, new workflow, register slash | `create-meridian-artifact` | yes |

## Decision flow

```txt
1. Conceptual question? → Answer without changing files
2. Slash command? → Open .agent/workflows/{cmd}.md → read template before Write
3. Code? → `developer` + `/implement-us` gate (`ready: true` + Plan) → then implement
4. Create/close epic, version, sprint, US? → INDEX.md + template + section-contracts.md mandatory
5. Otherwise → one row from matrix above
```

## Response format (required)

```markdown
🤖 **Applying knowledge from `@[agent-name]`...**

[response]
```

## Rules

1. **Silent analysis** — do not narrate "I am analyzing" for paragraphs.
2. **User override** — `@agent` wins over automatic routing.
3. **Code without docs** — `scrum-master` reports blocker; do not invent MVP in code.
4. **Decisions** — run `date +"%Y-%m-%d"` and `date +"%H:%M"` before `prepend-decision`.
5. **Scrum concepts** — read `.agent/references/scrum-meridian-map.md` only unless manager asks otherwise.

## Gate questions (when vague)

1. What problem and for whom?
2. What is mandatory now vs later?
3. Which version/epic is the target?

Then proceed with the selected agent.
