import type { DatabaseSync } from "node:sqlite";
import type {
  AgentContent,
  AgentContentInput,
  AgentContentStore,
} from "../../ports/agent-content-store.ts";

const PRIMARY_ID = "primary";

type AgentContentRow = {
  soul: string;
  page: string;
  knowledge: string;
  restrictions: string;
  updated_at: string;
};

function mapRow(row: AgentContentRow): AgentContent {
  return {
    soul: row.soul,
    page: row.page,
    knowledge: row.knowledge,
    restrictions: row.restrictions,
    updatedAt: row.updated_at,
  };
}

export function createSqliteAgentContentStore(db: DatabaseSync): AgentContentStore {
  const selectOne = db.prepare(`
    SELECT soul, page, knowledge, restrictions, updated_at
    FROM agent_content
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO agent_content (id, soul, page, knowledge, restrictions, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      soul = excluded.soul,
      page = excluded.page,
      knowledge = excluded.knowledge,
      restrictions = excluded.restrictions,
      updated_at = excluded.updated_at
  `);

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as AgentContentRow | undefined;
      return row ? mapRow(row) : null;
    },

    upsert(input: AgentContentInput) {
      const updatedAt = new Date().toISOString();
      upsertStmt.run(
        PRIMARY_ID,
        input.soul,
        input.page,
        input.knowledge,
        input.restrictions,
        updatedAt,
      );
      return mapRow(selectOne.get(PRIMARY_ID) as AgentContentRow);
    },
  };
}
