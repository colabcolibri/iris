import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  ConversationRepository,
  UpsertConversationInput,
} from "../../ports/conversation-repository.ts";
import type { Conversation, ConversationReplyMode } from "../../domain/messages/conversation.ts";
import { mapConversationRow } from "./message-mappers.ts";

function isPlaceholderParticipantId(value: string): boolean {
  return value.startsWith("unknown:");
}

function isSyntheticConversationId(value: string): boolean {
  return value.startsWith("ig:") || value.startsWith("unknown:");
}

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
      participant_display_name, participant_avatar_url,
      last_message_at, reply_mode, reply_prompt, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'inherit', NULL, ?, ?)
  `);

  const updateParticipant = db.prepare(`
    UPDATE conversations
    SET participant_ig_user_id = COALESCE(?, participant_ig_user_id),
        participant_username = COALESCE(?, participant_username),
        participant_display_name = COALESCE(?, participant_display_name),
        participant_avatar_url = COALESCE(?, participant_avatar_url),
        last_message_at = COALESCE(?, last_message_at),
        updated_at = ?
    WHERE id = ?
  `);

  const updateIgConversationId = db.prepare(`
    UPDATE conversations SET ig_conversation_id = ?, updated_at = ? WHERE id = ?
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

  const updateOperatorReadAtStmt = db.prepare(`
    UPDATE conversations SET operator_read_at = ?, updated_at = ? WHERE id = ?
  `);

  const updateParticipantIgUserIdStmt = db.prepare(`
    UPDATE conversations SET participant_ig_user_id = ?, updated_at = ? WHERE id = ?
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
      const existingByConversation = selectByIgConversationId.get(input.igConversationId) as
        | { id: string; participant_ig_user_id: string; ig_conversation_id: string }
        | undefined;

      const existingByParticipant = selectByParticipant.get(input.participantIgUserId) as
        | { id: string; participant_ig_user_id: string; ig_conversation_id: string }
        | undefined;

      const existing = existingByConversation ?? existingByParticipant;

      const ts = nowIso();

      if (existing) {
        const currentParticipantId = existing.participant_ig_user_id;
        const nextParticipantId =
          isPlaceholderParticipantId(currentParticipantId) &&
          !isPlaceholderParticipantId(input.participantIgUserId)
            ? input.participantIgUserId
            : null;

        if (
          isSyntheticConversationId(existing.ig_conversation_id) &&
          !isSyntheticConversationId(input.igConversationId)
        ) {
          updateIgConversationId.run(input.igConversationId, ts, existing.id);
        }

        updateParticipant.run(
          nextParticipantId,
          input.participantUsername ?? null,
          input.participantDisplayName ?? null,
          input.participantAvatarUrl ?? null,
          input.lastMessageAt ?? null,
          ts,
          existing.id,
        );
        const row = selectById.get(existing.id);
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
        input.participantDisplayName ?? null,
        input.participantAvatarUrl ?? null,
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

    updateOperatorReadAt(conversationId: string, iso: string) {
      updateOperatorReadAtStmt.run(iso, nowIso(), conversationId);
      const row = selectById.get(conversationId);
      return row ? mapConversationRow(row as never) : null;
    },

    updateParticipantIgUserId(conversationId: string, participantIgUserId: string) {
      updateParticipantIgUserIdStmt.run(participantIgUserId, nowIso(), conversationId);
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
