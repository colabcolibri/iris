# Audit skills + references v11 — inventário honesto

> **Última revisão G7:** jul/2026  
> **Regra:** `references/*.md` de **delivery** = forma de `body_markdown` no SQLite — persistir com `meridian_delivery.py update-*` (stdin heredoc).  
> **Phase docs** (`docs/discovery/`, `docs/09_design_system.md`, `docs/11_decisions.md` index) stay Markdown on disk. **Delivery decisions** live in SQLite (`decisions` table) — never `docs/decisions/*.json`.

**Legenda «G7»:** `✅` lido + alterado ou grep v1 limpo · `👁` só grep (sem edição) · `⏳` pendente · `—` fora do escopo delivery

**Skill morta:** `generate-board-json/` — **deletada** (não está no git).

---

## 1. Skills — SKILL.md (15 pastas ativas)

| # | Skill | G7 | v11 banner | `## Delivery commands` | sqlite-ops | Alterações G7 |
| - | ----- | -- | ---------- | -------------- | ---------- | ------------- |
| 1 | `create-user-story` | ✅ | ✅ | ✅ | ✅ | CLI §; output `ID:` |
| 2 | `review-user-story` | ✅ | ✅ | ✅ read-only | ✅ | CLI §; paths corrigidos |
| 3 | `refine-user-story` | ✅ | ✅ | ✅ | ✅ | CLI §; `set-ready` |
| 4 | `implement-user-story` | ✅ | ✅ | ✅ | ✅ | CLI gate + banner |
| 5 | `complete-user-story` | ✅ | ✅ | ✅ | ✅ | reescrita completa |
| 6 | `create-epic` | ✅ | ✅ | ✅ | ✅ | CLI § |
| 7 | `create-version` | ✅ | ✅ | ✅ | ✅ | CLI § |
| 8 | `create-sprint` | ✅ | ✅ | ✅ | ✅ | CLI § |
| 9 | `complete-sprint` | ✅ | ✅ | ✅ | 👁 | CLI § |
| 10 | `init-project` | ✅ | 👁 | ✅ bootstrap | 👁 | checkpoints v11 |
| 11 | `discover-product` | ✅ | — | — | — | phase doc; grep OK |
| 12 | `update-decisions-log` | ✅ | — | — | — | JSON; grep OK |
| 13 | `security-review` | ✅ | ✅ escopo | — | — | banner phase + checklist header |
| 14 | `design-system` | ✅ | ✅ escopo | — | — | banner + checklist v11 |
| 15 | `meridian-routing` | ✅ | — | — | — | nota H2 ✅ |
| — | `doc.md` | ✅ | — | — | ✅ | § References vs SQLite |

---

## 2. Skills — references/

| Arquivo | G7 | v11 header | Alterações |
| ------- | -- | ---------- | ---------- |
| `create-user-story/references/us-template.md` | ✅ | ✅ | delivery SQLite |
| `complete-user-story/references/implementation-template.md` | ✅ | ✅ | extension examples + persist |
| `create-epic/references/epic-template.md` | ✅ | ✅ | |
| `create-version/references/version-template.md` | ✅ | ✅ | |
| `create-sprint/references/sprint-template.md` | ✅ | ✅ | |
| `refine-user-story/references/refine-checklist.md` | ✅ | ✅ | |
| `review-user-story/references/review-checklist.md` | ✅ | ✅ | |
| `implement-user-story/references/implement-gate-checklist.md` | ✅ | ✅ | |
| `init-project/references/doc-templates.md` | ✅ | 👁 | bootstrap OK |
| `init-project/references/gitignore-baseline.md` | ✅ | — | grep OK |
| `discover-product/references/product-brief-template.md` | ✅ | — | phase OK |
| `update-decisions-log/references/decision-template.md` | ✅ | — | JSON OK |
| `update-decisions-log/references/decision-schema.md` | ✅ | — | filename = JSON |
| `security-review/references/checklists.md` | ✅ | ✅ | escopo v11 header |
| `design-system/references/design-system-checklist.md` | ✅ | ✅ | US via SQLite |

---

## 3. Workflows (19)

| Workflow | G7 | Alterações G7 |
| -------- | -- | ------------- |
| `create-us.md` | ✅ | `ID:` output |
| `review-us.md` | ✅ | `ID:` output |
| `refine-us.md` | ✅ | `SQLite saved` |
| `implement-us.md` | ✅ | já tinha SQLite load |
| `complete-us.md` | ✅ | reescrito + CLI |
| `create-epic.md` | ✅ | `Id:` + create-epic CLI |
| `create-version.md` | ✅ | `Id:` + CLI |
| `complete-sprint.md` | ✅ | `Id:` + SQLite |
| `plan-sprint.md` | ✅ | `SQLite saved` output |
| `migrate-delivery.md` | ✅ | v1 import scripts |
| `discover.md` | ✅ | phase — grep OK |
| `init-meridian.md` | ✅ | grep OK |
| `status.md` | ✅ | `meridian_delivery.py counts` |
| `architecture.md` | ✅ | phase only — grep OK |
| `security-pass.md` | ✅ | phase only — grep OK |
| `design-pass.md` | ✅ | já tinha `show --full` |
| `daily-with-ai.md` | ✅ | folders→SQLite; sem monitor |
| `agents-help.md` | ✅ | H1 — grep OK |
| `update-decisions-log.md` | ✅ | `File:` = JSON OK |

---

## 4. Agents (9)

| Agente | G7 | Alterações G7 |
| ------ | -- | ------------- |
| `scrum-master` | ✅ | `meridian_delivery.py counts` na Phase 0 |
| `product-owner` | ✅ | grep OK; epics SQLite já citado |
| `technical-writer` | ✅ | grep OK; anti duplicar SQLite |
| `technical-architect` | ✅ | epics/versions **in SQLite** |
| `security-champion` | ✅ | grep OK |
| `design-system-owner` | ✅ | grep OK |
| `backlog-refiner` | ✅ | anti `docs/us` (já H1) |
| `developer` | ✅ | SQLite read (já H1) |
| `sprint-planner` | ✅ | CLI linha + output |

---

## 5. Critério de fechamento G7

- [x] 9 skills delivery: `## Delivery commands` + templates references
- [x] 18 workflows grep + delivery alinhados
- [x] 9 agents grep + ajustes onde necessário
- [x] security + design refs com cabeçalho escopo v11
- [x] `generate-board-json` ausente
- [x] `validate_meridian.py . --strict-kit-md`

**G7 ✅** — manutenção: novo skill delivery deve copiar padrão §1 + `sqlite-delivery-operations.md`.

---

## 6. Canon CLI (delivery)

Fonte: `.agent/references/templates/delivery-connector-schema.md` + `sqlite-delivery-operations.md`.

| Ação | Comando |
| ---- | ------- |
| Config | `.meridian/delivery.json` (`connector: sqlite` default) |
| Facade | `python3 .agent/scripts/meridian_delivery.py <verb> …` |
| Read US | `meridian_delivery.py show US-XXXX --full` |
| Create US | `meridian_delivery.py create-us …` |
| Refine / close | `update-us` (stdin heredoc) + `set-ready` / `set-summary` |
| Ready | `meridian_delivery.py set-ready US-XXXX --ready true` |
| Implement gate | `meridian_delivery.py implement-gate US-XXXX` |
| Epic / version / sprint | `create-epic` / `create-version` / `create-sprint` |
| Counts / status | `meridian_delivery.py counts` |
| Validate | `validate_meridian.py . --sqlite-only` |

`meridian_db_cli.py` remains the sqlite implementation — agents use the facade only.
