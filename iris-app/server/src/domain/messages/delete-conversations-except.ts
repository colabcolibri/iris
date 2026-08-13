import type { DatabaseSync } from "node:sqlite";

export type DeleteConversationsExceptResult = {
  conversationsDeleted: number;
  messagesDeleted: number;
};

function normalizeUsername(value: string | null | undefined): string {
  return value?.trim().replace(/^@+/, "").toLowerCase() ?? "";
}

export function deleteConversationsExceptUsernames(
  db: DatabaseSync,
  allowedUsernames: string[],
): DeleteConversationsExceptResult {
  const allowed = new Set(
    allowedUsernames.map((username) => normalizeUsername(username)).filter(Boolean),
  );

  const rows = db
    .prepare(`SELECT id, participant_username FROM conversations`)
    .all() as Array<{ id: string; participant_username: string | null }>;

  const toDelete = rows
    .filter((row) => !allowed.has(normalizeUsername(row.participant_username)))
    .map((row) => row.id);

  if (toDelete.length === 0) {
    return { conversationsDeleted: 0, messagesDeleted: 0 };
  }

  const placeholders = toDelete.map(() => "?").join(", ");

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`
      UPDATE agent_run_steps
      SET message_id = NULL
      WHERE message_id IN (
        SELECT id FROM messages WHERE conversation_id IN (${placeholders})
      )
    `).run(...toDelete);

    db.prepare(`
      UPDATE meta_webhook_events
      SET message_id = NULL, conversation_id = NULL
      WHERE conversation_id IN (${placeholders})
         OR message_id IN (
           SELECT id FROM messages WHERE conversation_id IN (${placeholders})
         )
    `).run(...toDelete, ...toDelete);

    db.prepare(`
      DELETE FROM message_replies
      WHERE message_id IN (
        SELECT id FROM messages WHERE conversation_id IN (${placeholders})
      )
    `).run(...toDelete);

    const messagesDeleted = db
      .prepare(`DELETE FROM messages WHERE conversation_id IN (${placeholders})`)
      .run(...toDelete).changes;

    const conversationsDeleted = db
      .prepare(`DELETE FROM conversations WHERE id IN (${placeholders})`)
      .run(...toDelete).changes;

    db.exec("COMMIT");
    return { conversationsDeleted, messagesDeleted };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
