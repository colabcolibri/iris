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
      source_note, error_message, auto_reply_enabled, reply_mode, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
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
        input.publishedAt ?? null,
        input.igMediaId ?? null,
        input.sourceNote ?? null,
        input.replyMode === "auto" ? 1 : 0,
        input.replyMode ?? "off",
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

    findCommentableByIgMediaId(igMediaId) {
      const row = db
        .prepare(
          "SELECT * FROM posts WHERE ig_media_id = ? AND status IN ('published', 'monitored') LIMIT 1",
        )
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

      const editorialDate = filter.calendarOnly
        ? "COALESCE(published_at, scheduled_at)"
        : "COALESCE(scheduled_at, created_at)";

      if (filter.calendarOnly) {
        clauses.push(`${editorialDate} IS NOT NULL`);
        clauses.push("status NOT IN ('draft', 'cancelled')");
      }

      if (filter.from) {
        clauses.push(`datetime(${editorialDate}) >= datetime(?)`);
        params.push(filter.from);
      }

      if (filter.to) {
        clauses.push(`datetime(${editorialDate}) <= datetime(?)`);
        params.push(filter.to);
      }

      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows = db
        .prepare(
          `SELECT posts.*,
            (SELECT COUNT(*) FROM post_assets WHERE post_assets.post_id = posts.id) AS assets_count
           FROM posts ${where}
           ORDER BY datetime(COALESCE(posts.scheduled_at, posts.created_at)) DESC`,
        )
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
        carouselSummary:
          input.carouselSummary !== undefined ? input.carouselSummary : current.carouselSummary,
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
        replyMode:
          input.replyMode !== undefined ? input.replyMode : current.replyMode,
      };

      if (input.autoReplyEnabled !== undefined && input.replyMode === undefined) {
        next.replyMode = input.autoReplyEnabled ? "auto" : "off";
      }

      const updatedAt = new Date().toISOString();
      const autoReplyEnabled =
        next.replyMode === "auto"
          ? true
          : next.replyMode === "off"
            ? false
            : next.autoReplyEnabled;

      db.prepare(`
        UPDATE posts
        SET caption = ?, carousel_summary = ?, channel = ?, scheduled_at = ?, source_note = ?, status = ?,
            published_at = ?, ig_media_id = ?, error_message = ?, auto_reply_enabled = ?,
            reply_mode = ?, updated_at = ?
        WHERE id = ?
      `).run(
        next.caption,
        next.carouselSummary,
        next.channel,
        next.scheduledAt,
        next.sourceNote,
        next.status,
        next.publishedAt,
        next.igMediaId,
        next.errorMessage,
        autoReplyEnabled ? 1 : 0,
        next.replyMode,
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
