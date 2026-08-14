# Harness agentic — loop, tools e telemetria (v1.23)

Evolução do message-harness de pipeline linear para **loop limitado** com **tools de domínio** e auditoria de custo por sessão.

## Estado atual (v1.23 — implementado)

- `AgentLoopOrchestrator` — budget: 5 turns, 8 tool calls, 45s timeout
- Tools runtime: `search_products`, `get_resolved_product`, `refresh_store_snapshot`, `finish_draft`
- Message-harness DM: triage → loop draft → verify com `product_facts`
- SQLite: `step_kind`, tool trace, `session_summary_json` em `agent_runs`
- API/UI execuções: rollup (`llm_call_count`, `tool_call_count`, tokens, duração)

Código: `iris-app/server/src/domain/harness/`, `message-harness/orchestrator.ts`.

## Modelo sessão / run / step

| Conceito | ID | v1.23 |
| -------- | -- | ----- |
| Sessão | `flow_id` | 1 tentativa completa de resposta DM |
| Run | `agent_runs.id` | 1:1 com sessão |
| Step | `agent_run_steps` | triage, `message_draft_turn`, `tool_call`, `tool_result`, verify |

## Tools (runtime DM)

Reutilizam `ProductFieldResolver` + `StoreProvider` — DRY com lojas/MCP admin.

| Tool | Função |
| ---- | ------ |
| `search_products` | Busca catálogo resolvido |
| `get_resolved_product` | Produto por id/slug |
| `refresh_store_snapshot` | Live Yampi (rate limit 2/sessão) |
| `finish_draft` | Encerra loop |

MCP admin permanece separado do runtime.

## Telemetria

`summarizeHarnessSession(steps)` → `session_summary_json`:

`stepCount`, `llmCallCount`, `toolCallCount`, tokens, `durationMs`, `models[]`.

## Referências

- `docs/architecture/ecommerce-stores.md`
- `docs/architecture/diagrams/iris-agentic-harness.md`
- `docs/07_api_contracts.md` — § Agent
