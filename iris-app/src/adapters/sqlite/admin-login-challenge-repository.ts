import type { DatabaseSync } from "node:sqlite";
import type { OtpChallengeRecord } from "../../domain/admin-otp-code.ts";

export type AdminLoginChallengeRepository = {
  find(email: string): OtpChallengeRecord | null;
  upsert(record: OtpChallengeRecord): void;
  incrementAttempts(email: string): OtpChallengeRecord | null;
  delete(email: string): void;
};

type Row = {
  email: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  last_request_at: string;
};

function mapRow(row: Row): OtpChallengeRecord {
  return {
    email: row.email,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    attempts: row.attempts,
    lastRequestAt: row.last_request_at,
  };
}

export function createSqliteAdminLoginChallengeRepository(
  db: DatabaseSync,
): AdminLoginChallengeRepository {
  const select = db.prepare(
    "SELECT * FROM admin_login_challenges WHERE email = ? LIMIT 1",
  );
  const upsert = db.prepare(`
    INSERT INTO admin_login_challenges (email, code_hash, expires_at, attempts, last_request_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      code_hash = excluded.code_hash,
      expires_at = excluded.expires_at,
      attempts = excluded.attempts,
      last_request_at = excluded.last_request_at
  `);
  const increment = db.prepare(`
    UPDATE admin_login_challenges
    SET attempts = attempts + 1
    WHERE email = ?
  `);
  const remove = db.prepare("DELETE FROM admin_login_challenges WHERE email = ?");

  return {
    find(email) {
      const row = select.get(email) as Row | undefined;
      return row ? mapRow(row) : null;
    },

    upsert(record) {
      upsert.run(
        record.email,
        record.codeHash,
        record.expiresAt,
        record.attempts,
        record.lastRequestAt,
      );
    },

    incrementAttempts(email) {
      increment.run(email);
      const row = select.get(email) as Row | undefined;
      return row ? mapRow(row) : null;
    },

    delete(email) {
      remove.run(email);
    },
  };
}
