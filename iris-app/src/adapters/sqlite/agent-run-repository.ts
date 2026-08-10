import type { AgentRunRepository, CreateAgentRunInput } from "../../ports/agent-run-repository.ts";
import type { AgentRun } from "../../ports/agent-run-repository.ts";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

type AgentRunRow = {
  id: string;
  trigger: string;
  input_summary: string | null;
  output_summary: string | null;
  status: string;
  created_at: string;
};

function mapRow(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    trigger: row.trigger,
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    status: row.status as AgentRun["status"],
    createdAt: row.created_at,
  };
}

export function createSqliteAgentRunRepository(db: DatabaseSync): AgentRunRepository {
  const insert = db.prepare(`
    INSERT INTO agent_runs (id, trigger, input_summary, output_summary, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const findByIdStmt = db.prepare("SELECT * FROM agent_runs WHERE id = ?");

  return {
    create(input: CreateAgentRunInput) {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      insert.run(
        id,
        input.trigger,
        input.inputSummary ?? null,
        input.outputSummary ?? null,
        input.status,
        createdAt,
      );

      return mapRow(
        db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id) as AgentRunRow,
      );
    },

    findById(id) {
      const row = findByIdStmt.get(id) as AgentRunRow | undefined;
      return row ? mapRow(row) : null;
    },
  };
}
