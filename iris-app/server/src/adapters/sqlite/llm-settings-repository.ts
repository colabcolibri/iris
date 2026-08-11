import type { DatabaseSync } from "node:sqlite";
import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../crypto/token-vault.ts";
import type {
  LlmSettings,
  LlmSettingsStore,
  UpsertLlmSettingsInput,
} from "../../ports/llm-settings-store.ts";

const PRIMARY_ID = "default";

const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export type LlmSettingsRepositoryOptions = {
  encryptionKey?: string;
};

export function createSqliteLlmSettingsStore(
  db: DatabaseSync,
  options: LlmSettingsRepositoryOptions = {},
): LlmSettingsStore {
  const key = resolveEncryptionKey(options.encryptionKey);

  const selectOne = db.prepare(`
    SELECT api_key_vault, api_url, model, supports_vision, updated_at
    FROM llm_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO llm_settings (id, api_key_vault, api_url, model, supports_vision, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      api_key_vault = COALESCE(excluded.api_key_vault, llm_settings.api_key_vault),
      api_url = excluded.api_url,
      model = excluded.model,
      supports_vision = excluded.supports_vision,
      updated_at = excluded.updated_at
  `);

  const deleteStmt = db.prepare(`DELETE FROM llm_settings WHERE id = ?`);

  function mapRow(row: {
    api_key_vault: string | null;
    api_url: string;
    model: string;
    supports_vision: number;
    updated_at: string;
  }): LlmSettings {
    return {
      apiKey: row.api_key_vault ? decryptToken(row.api_key_vault, key) : null,
      apiUrl: row.api_url,
      model: row.model,
      supportsVision: row.supports_vision === 1,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            api_key_vault: string | null;
            api_url: string;
            model: string;
            supports_vision: number;
            updated_at: string;
          }
        | undefined;

      return row ? mapRow(row) : null;
    },

    upsert(input: UpsertLlmSettingsInput) {
      const existing = this.get();
      const updatedAt = new Date().toISOString();
      const apiKeyVault =
        input.apiKey === undefined
          ? existing?.apiKey
            ? encryptToken(existing.apiKey, key)
            : null
          : input.apiKey
            ? encryptToken(input.apiKey, key)
            : null;

      upsertStmt.run(
        PRIMARY_ID,
        apiKeyVault,
        input.apiUrl,
        input.model,
        input.supportsVision ? 1 : 0,
        updatedAt,
      );

      return mapRow(selectOne.get(PRIMARY_ID) as never);
    },

    clear() {
      deleteStmt.run(PRIMARY_ID);
    },
  };
}

export { DEFAULT_API_URL, DEFAULT_MODEL };
