import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { createFsAgentContentStore } from "../fs/agent-content-store.ts";
import type {
  AgentContent,
  AgentContentInput,
  AgentContentStore,
} from "../../ports/agent-content-store.ts";
import { defaultAgentContent } from "../../domain/agent-content-defaults.ts";

const PRIMARY_ID = "primary";

type AgentContentRow = {
  soul: string;
  page: string;
  knowledge: string;
  restrictions: string;
  updated_at: string;
};

export type SqliteAgentContentStoreOptions = {
  /** Importa arquivos legados de data/agent/*.md na primeira leitura. */
  fsImportDir?: string | null;
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

export function importAgentContentFromFilesystem(
  db: DatabaseSync,
  fsRoot: string,
): boolean {
  const soulPath = join(fsRoot, "soul.md");
  if (!existsSync(soulPath)) {
    return false;
  }

  const legacy = createFsAgentContentStore({ rootDir: fsRoot }).get();
  const store = createSqliteAgentContentStore(db);
  store.upsert(legacy);
  return true;
}

export function createSqliteAgentContentStore(
  db: DatabaseSync,
  options: SqliteAgentContentStoreOptions = {},
): AgentContentStore {
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

  let seeded = false;

  function seedIfEmpty(): void {
    if (seeded) {
      return;
    }
    seeded = true;

    const existing = selectOne.get(PRIMARY_ID) as AgentContentRow | undefined;
    if (existing) {
      return;
    }

    if (options.fsImportDir && importAgentContentFromFilesystem(db, options.fsImportDir)) {
      return;
    }

    const defaults = defaultAgentContent();
    upsertStmt.run(
      PRIMARY_ID,
      defaults.soul,
      defaults.page,
      defaults.knowledge,
      defaults.restrictions,
      defaults.updatedAt,
    );
  }

  return {
    get() {
      seedIfEmpty();
      const row = selectOne.get(PRIMARY_ID) as AgentContentRow | undefined;
      return row ? mapRow(row) : defaultAgentContent();
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
      seeded = true;
      return mapRow(selectOne.get(PRIMARY_ID) as AgentContentRow);
    },
  };
}
