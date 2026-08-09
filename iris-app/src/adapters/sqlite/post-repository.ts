import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreatePostInput,
  ListPostsFilter,
  PostRepository,
  UpdatePostInput,
} from "../../ports/post-repository.ts";
import { mapPostRow } from "./mappers.ts";

export function createSqlitePostRepository(db: DatabaseSync): PostRepository {
  const insert = db.prepare(`
    INSERT INTO posts (
      id, status, channel, caption, scheduled_at, published_at, ig_media_id,
      source_note, error_message, auto_reply_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, 0, ?, ?)
  `);

  const selectById = db.prepare("SELECT * FROM posts WHERE id = ?");

  const cancelStmt = db.prepare(`
    UPDATE posts
    SET status = 'cancelled', updated_at = ?
    WHERE id = ?
  `);

  return {
    create(input) {
      const now = new Date().toISOString();
      const id = randomUUID();

      insert.run(
        id,
        input.status ?? "draft",
        input.channel,
        input.caption ?? null,
        input.scheduledAt ?? null,
        input.sourceNote ?? null,
        now,
        now,
      );

      return mapPostRow(selectById.get(id) as never);
    },

    findById(id) {
      const row = selectById.get(id);
      return row ? mapPostRow(row as never) : null;
    },

    findByIgMediaId(igMediaId) {
      const row = db
        .prepare("SELECT * FROM posts WHERE ig_media_id = ? LIMIT 1")
        .get(igMediaId);
      return row ? mapPostRow(row as never) : null;
    },

    list(filter = {}) {
      const clauses: string[] = [];
      const params: unknown[] = [];

      if (filter.status) {
        clauses.push("status = ?");
        params.push(filter.status);
      }

      if (filter.from) {
        clauses.push("datetime(COALESCE(scheduled_at, created_at)) >= datetime(?)");
        params.push(filter.from);
      }

      if (filter.to) {
        clauses.push("datetime(COALESCE(scheduled_at, created_at)) <= datetime(?)");
        params.push(filter.to);
      }

      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows = db
        .prepare(`SELECT * FROM posts ${where} ORDER BY created_at DESC`)
        .all(...(params as (string | number)[]));

      return rows.map((row) => mapPostRow(row as never));
    },

    update(id, input) {
      const current = this.findById(id);
      if (!current) {
        return null;
      }

      const next = {
        caption: input.caption !== undefined ? input.caption : current.caption,
        channel: input.channel !== undefined ? input.channel : current.channel,
        scheduledAt:
          input.scheduledAt !== undefined ? input.scheduledAt : current.scheduledAt,
        sourceNote:
          input.sourceNote !== undefined ? input.sourceNote : current.sourceNote,
        status: input.status !== undefined ? input.status : current.status,
        publishedAt:
          input.publishedAt !== undefined ? input.publishedAt : current.publishedAt,
        igMediaId:
          input.igMediaId !== undefined ? input.igMediaId : current.igMediaId,
        errorMessage:
          input.errorMessage !== undefined
            ? input.errorMessage
            : current.errorMessage,
        autoReplyEnabled:
          input.autoReplyEnabled !== undefined
            ? input.autoReplyEnabled
            : current.autoReplyEnabled,
      };

      const updatedAt = new Date().toISOString();

      db.prepare(`
        UPDATE posts
        SET caption = ?, channel = ?, scheduled_at = ?, source_note = ?, status = ?,
            published_at = ?, ig_media_id = ?, error_message = ?, auto_reply_enabled = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        next.caption,
        next.channel,
        next.scheduledAt,
        next.sourceNote,
        next.status,
        next.publishedAt,
        next.igMediaId,
        next.errorMessage,
        next.autoReplyEnabled ? 1 : 0,
        updatedAt,
        id,
      );

      return this.findById(id);
    },

    cancel(id) {
      const current = this.findById(id);
      if (!current) {
        return null;
      }

      const updatedAt = new Date().toISOString();
      cancelStmt.run(updatedAt, id);
      return this.findById(id);
    },
  };
}
