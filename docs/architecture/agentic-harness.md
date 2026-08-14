# Harness agentic — loop, tools e telemetria

Evolução do message-harness de pipeline linear para **loop limitado** com **tools de domínio** e auditoria de custo por sessão.

## Estado atual (v1.27)

- **Memória ReAct:** cada turno do `AgentLoopOrchestrator` recebe transcript acumulado (ação + observação de tools)
- **Detecção de dificuldade:** triagem produz `supportIntent` / `supportUrgency`; loop entra em modo suporte e evita FAQ repetido
- **Escalação operador:** tool `notify_operator` + status `escalated_operator` + notificação interna (email)
- **Auditoria por turno:** `agent_run_steps.llm_context_json` guarda prompt + transcript enviado ao LLM em `message_draft_turn`
- **Guardrails:** bloqueio de tool duplicada (mesmos args); hints da triagem no prompt do loop
- **Status terminais DM:** `draft_failed`, `budget_exceeded`, `escalated_operator`, `rejected_verify` (só após verify), `approved`, `blocked_harmful`
- **Busca:** `searchProductCatalog` com token scoring, acentos e `suggestions` quando vazio
- Budget: 5 turns, 8 tool calls, 45s timeout

Código: `iris-app/server/src/domain/harness/`, `domain/products/product-catalog-search.ts`, `message-harness/orchestrator.ts`.

## Modelo sessão / run / step

| Conceito | ID | Notas |
| -------- | -- | ----- |
| Sessão | `flow_id` | 1 tentativa completa de resposta DM |
| Run | `agent_runs.id` | 1:1 com sessão |
| Step | `agent_run_steps` | triage, `message_draft_turn` (+ `llm_context_json`), `tool_call`, `tool_result`, verify |

## Tools (runtime DM)

| Tool | Função |
| ---- | ------ |
| `search_products` | Busca catálogo — retorna `items`, `totalMatched`, `suggestions` |
| `get_resolved_product` | Produto por id/slug |
| `refresh_store_snapshot` | Live Yampi (rate limit 2/sessão) |
| `finish_draft` | Encerra loop |
| `notify_operator` | Escala para operador + email interno (quando configurado) |

## Telemetria

`summarizeHarnessSession(steps)` → `session_summary_json`: `stepCount`, `llmCallCount`, `toolCallCount`, tokens, `durationMs`, `models[]`.

## Referências

- `docs/architecture/ecommerce-stores.md`
- `docs/architecture/operator-notifications.md`
- `docs/architecture/diagrams/iris-agentic-harness.md`
- `docs/07_api_contracts.md` — § Agent
