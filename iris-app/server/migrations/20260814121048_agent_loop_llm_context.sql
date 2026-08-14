-- Harness v1.25: contexto LLM completo por turno do loop agentic (auditoria ReAct).

ALTER TABLE agent_run_steps ADD COLUMN llm_context_json TEXT;
