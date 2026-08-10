import type { DatabaseSync } from "node:sqlite";
import type { ReplyPersona, ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { defaultReplyPersona } from "../../domain/reply-persona-defaults.ts";
import { DEFAULT_RESPONSE_LANGUAGE } from "../../domain/reply-language/response-languages.ts";

const PRIMARY_ID = "primary";

type ReplyPersonaRow = {
  brand_name: string | null;
  response_language: string | null;
  max_chars: number;
  updated_at: string;
};

export function createSqliteReplyPersonaStore(db: DatabaseSync): ReplyPersonaStore {
  const selectOne = db.prepare(`
    SELECT brand_name, response_language, max_chars, updated_at
    FROM reply_persona
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO reply_persona (id, brand_name, response_language, max_chars, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      brand_name = excluded.brand_name,
      response_language = excluded.response_language,
      max_chars = excluded.max_chars,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: ReplyPersonaRow): ReplyPersona {
    return {
      brandName: row.brand_name,
      responseLanguage: row.response_language ?? DEFAULT_RESPONSE_LANGUAGE,
      maxChars: row.max_chars,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as ReplyPersonaRow | undefined;
      if (!row) {
        return null;
      }
      return mapRow(row);
    },

    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();

      upsertStmt.run(
        PRIMARY_ID,
        input.brandName,
        input.responseLanguage,
        input.maxChars,
        updatedAt,
      );

      return mapRow(selectOne.get(PRIMARY_ID) as ReplyPersonaRow);
    },
  };
}

export function getReplyPersonaOrDefault(store: ReplyPersonaStore): ReplyPersona {
  return store.get() ?? defaultReplyPersona();
}
