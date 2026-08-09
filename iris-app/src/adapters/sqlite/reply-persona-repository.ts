import type { DatabaseSync } from "node:sqlite";
import type { ReplyPersona, ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { defaultReplyPersona } from "../../domain/reply-persona-defaults.ts";

const PRIMARY_ID = "primary";

export function createSqliteReplyPersonaStore(db: DatabaseSync): ReplyPersonaStore {
  const selectOne = db.prepare(`
    SELECT system_prompt, tone, brand_name, max_chars, updated_at
    FROM reply_persona
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO reply_persona (id, system_prompt, tone, brand_name, max_chars, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      system_prompt = excluded.system_prompt,
      tone = excluded.tone,
      brand_name = excluded.brand_name,
      max_chars = excluded.max_chars,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: {
    system_prompt: string;
    tone: string;
    brand_name: string | null;
    max_chars: number;
    updated_at: string;
  }): ReplyPersona {
    return {
      systemPrompt: row.system_prompt,
      tone: row.tone,
      brandName: row.brand_name,
      maxChars: row.max_chars,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            system_prompt: string;
            tone: string;
            brand_name: string | null;
            max_chars: number;
            updated_at: string;
          }
        | undefined;

      if (!row) {
        return null;
      }

      return mapRow(row);
    },

    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();

      upsertStmt.run(
        PRIMARY_ID,
        input.systemPrompt,
        input.tone,
        input.brandName,
        input.maxChars,
        updatedAt,
      );

      return mapRow(
        selectOne.get(PRIMARY_ID) as {
          system_prompt: string;
          tone: string;
          brand_name: string | null;
          max_chars: number;
          updated_at: string;
        },
      );
    },
  };
}

export function getReplyPersonaOrDefault(store: ReplyPersonaStore): ReplyPersona {
  return store.get() ?? defaultReplyPersona();
}
