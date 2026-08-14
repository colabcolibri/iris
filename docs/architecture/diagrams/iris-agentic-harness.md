---
title: Iris — loop agentic DM (ReAct)
subtitle: transcript entre turnos, tools e status terminais v1.25
updated: 2026-08-14
source_doc: docs/architecture/agentic-harness.md
kind: flow
---

# Harness agentic — loop ReAct

```mermaid
flowchart TB
  T[message_triage] -->|should_reply + hints| L[AgentLoopOrchestrator]

  subgraph loop["Loop (budget: 5 turns / 8 tools / 45s)"]
    P[buildAgentLoopPrompt + transcript] --> LLM[llm.complete]
    LLM -->|action: tool_call| TC[tool_call step]
    TC --> TR[tool_result / observation]
    TR -->|append to transcript| P
    LLM -->|action: finish| FD[finish_draft]
    LLM -->|duplicate tool blocked| P
  end

  L --> loop
  FD --> V[message_verify]
  V -->|pass| A[approved]
  V -->|fail| RV[rejected_verify]
  L -->|no final text| DF[draft_failed]
  L -->|budget exhausted| BE[budget_exceeded]
  T -->|harmful| BH[blocked_harmful]

  loop -.->|persist per turn| S[(agent_run_steps.llm_context_json)]
```

## Observações entre turnos

| Etapa | Persistência | Conteúdo |
| ----- | ------------ | -------- |
| Turno LLM | `message_draft_turn` + `llm_context_json` | prompt base + transcript ReAct enviado ao modelo |
| Tool | `tool_call` / `tool_result` | nome, args, output sanitizado |
| Sessão | `session_summary_json` | tokens, duração, contagens |

## Status terminais DM

| Status | Quando |
| ------ | ------ |
| `approved` | verify passou com texto final |
| `draft_failed` | loop não produziu texto (sem verify) |
| `budget_exceeded` | turnos/tools/timeout esgotados |
| `rejected_verify` | verify rodou e barrou |
| `blocked_harmful` | triagem bloqueou |
