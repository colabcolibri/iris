import type { DatabaseSync } from "node:sqlite";
import type {
  MessageAgentContent,
  MessageAgentContentStore,
} from "../../ports/message-agent-content-store.ts";

const PRIMARY_ID = "primary";

export function createSqliteMessageAgentContentStore(
  db: DatabaseSync,
): MessageAgentContentStore {
  const selectOne = db.prepare(`
    SELECT dm_soul, dm_page, dm_knowledge, dm_restrictions, updated_at
    FROM message_agent_content WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO message_agent_content (id, dm_soul, dm_page, dm_knowledge, dm_restrictions, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      dm_soul = excluded.dm_soul,
      dm_page = excluded.dm_page,
      dm_knowledge = excluded.dm_knowledge,
      dm_restrictions = excluded.dm_restrictions,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: {
    dm_soul: string;
    dm_page: string;
    dm_knowledge: string;
    dm_restrictions: string;
    updated_at: string;
  }): MessageAgentContent {
    return {
      dmSoul: row.dm_soul,
      dmPage: row.dm_page,
      dmKnowledge: row.dm_knowledge,
      dmRestrictions: row.dm_restrictions,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            dm_soul: string;
            dm_page: string;
            dm_knowledge: string;
            dm_restrictions: string;
            updated_at: string;
          }
        | undefined;
      return row ? mapRow(row) : null;
    },

    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();
      upsertStmt.run(
        PRIMARY_ID,
        input.dmSoul,
        input.dmPage,
        input.dmKnowledge,
        input.dmRestrictions,
        updatedAt,
      );
      const row = selectOne.get(PRIMARY_ID) as never;
      return mapRow(row);
    },
  };
}
