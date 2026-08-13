import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  ConversationRepository,
  UpsertConversationInput,
} from "../../ports/conversation-repository.ts";
import type { Conversation, ConversationReplyMode } from "../../domain/messages/conversation.ts";
import { mapConversationRow } from "./message-mappers.ts";

export function createSqliteConversationRepository(
  db: DatabaseSync,
): ConversationRepository {
  const selectById = db.prepare("SELECT * FROM conversations WHERE id = ?");
  const selectByIgConversationId = db.prepare(
    "SELECT * FROM conversations WHERE ig_conversation_id = ?",
  );
  const selectByParticipant = db.prepare(
    "SELECT * FROM conversations WHERE participant_ig_user_id = ?",
  );

  const insert = db.prepare(`
    INSERT INTO conversations (
      id, ig_conversation_id, participant_ig_user_id, participant_username,
      last_message_at, reply_mode, reply_prompt, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'inherit', NULL, ?, ?)
  `);

  const updateParticipant = db.prepare(`
    UPDATE conversations
    SET participant_username = COALESCE(?, participant_username),
        last_message_at = COALESCE(?, last_message_at),
        updated_at = ?
    WHERE id = ?
  `);

  const updateLastMessage = db.prepare(`
    UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?
  `);

  const updateReplyModeStmt = db.prepare(`
    UPDATE conversations SET reply_mode = ?, updated_at = ? WHERE id = ?
  `);

  const updateReplyPromptStmt = db.prepare(`
    UPDATE conversations SET reply_prompt = ?, updated_at = ? WHERE id = ?
  `);

  const listRecentStmt = db.prepare(`
    SELECT * FROM conversations
    ORDER BY datetime(COALESCE(last_message_at, updated_at)) DESC
    LIMIT ?
  `);

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    findById(id: string) {
      const row = selectById.get(id);
      return row ? mapConversationRow(row as never) : null;
    },

    findByIgConversationId(igConversationId: string) {
      const row = selectByIgConversationId.get(igConversationId);
      return row ? mapConversationRow(row as never) : null;
    },

    findByParticipantIgUserId(participantIgUserId: string) {
      const row = selectByParticipant.get(participantIgUserId);
      return row ? mapConversationRow(row as never) : null;
    },

    upsert(input: UpsertConversationInput) {
      const existing =
        selectByIgConversationId.get(input.igConversationId) ??
        selectByParticipant.get(input.participantIgUserId);

      const ts = nowIso();

      if (existing) {
        updateParticipant.run(
          input.participantUsername ?? null,
          input.lastMessageAt ?? null,
          ts,
          (existing as { id: string }).id,
        );
        const row = selectById.get((existing as { id: string }).id);
        return {
          conversation: mapConversationRow(row as never),
          created: false,
        };
      }

      const id = randomUUID();
      insert.run(
        id,
        input.igConversationId,
        input.participantIgUserId,
        input.participantUsername ?? null,
        input.lastMessageAt ?? null,
        ts,
        ts,
      );
      const row = selectById.get(id);
      return {
        conversation: mapConversationRow(row as never),
        created: true,
      };
    },

    updateLastMessageAt(conversationId: string, iso: string) {
      updateLastMessage.run(iso, nowIso(), conversationId);
    },

    updateReplyMode(conversationId: string, replyMode: ConversationReplyMode) {
      updateReplyModeStmt.run(replyMode, nowIso(), conversationId);
      const row = selectById.get(conversationId);
      return row ? mapConversationRow(row as never) : null;
    },

    updateReplyPrompt(conversationId: string, replyPrompt: string | null) {
      updateReplyPromptStmt.run(replyPrompt, nowIso(), conversationId);
      const row = selectById.get(conversationId);
      return row ? mapConversationRow(row as never) : null;
    },

    listRecent(limit: number) {
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const rows = listRecentStmt.all(safeLimit) as never[];
      return rows.map(mapConversationRow);
    },
  };
}
