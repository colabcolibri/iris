import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreatePostInput,
  ListPostsFilter,
  PostRepository,
  UpdatePostInput,
} from "../../ports/post-repository.ts";
import { collaboratorsToDb } from "../../domain/posts/collaborators.ts";
import { mapPostRow } from "./mappers.ts";

export function createSqlitePostRepository(db: DatabaseSync): PostRepository {
  const insert = db.prepare(`
    INSERT INTO posts (
      id, status, channel, caption, collaborators, carousel_summary, scheduled_at, published_at, ig_media_id,
      source_note, error_message, auto_reply_enabled, reply_mode, agent_active_days, private_reply_mode,
      reply_prompt,
      silence_soul, silence_page, silence_knowledge, silence_restrictions,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        collaboratorsToDb(input.collaborators ?? []),
        input.carouselSummary ?? null,
        input.scheduledAt ?? null,
        input.publishedAt ?? null,
        input.igMediaId ?? null,
        input.sourceNote ?? null,
        input.replyMode === "auto" || input.replyMode === "draft" ? 1 : 0,
        input.replyMode ?? "inherit",
        input.agentActiveDays ?? null,
        input.privateReplyMode ?? "inherit",
        input.replyPrompt ?? null,
        input.silenceSoul ? 1 : 0,
        input.silencePage ? 1 : 0,
        input.silenceKnowledge ? 1 : 0,
        input.silenceRestrictions ? 1 : 0,
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
        collaborators:
          input.collaborators !== undefined
            ? input.collaborators
            : current.collaborators,
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
        igMediaStatus:
          input.igMediaStatus !== undefined
            ? input.igMediaStatus
            : current.igMediaStatus,
        igMediaStatusDetail:
          input.igMediaStatusDetail !== undefined
            ? input.igMediaStatusDetail
            : current.igMediaStatusDetail,
        igMediaStatusCheckedAt:
          input.igMediaStatusCheckedAt !== undefined
            ? input.igMediaStatusCheckedAt
            : current.igMediaStatusCheckedAt,
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
        agentActiveDays:
          input.agentActiveDays !== undefined
            ? input.agentActiveDays
            : current.agentActiveDays,
        privateReplyMode:
          input.privateReplyMode !== undefined
            ? input.privateReplyMode
            : current.privateReplyMode,
        replyPrompt:
          input.replyPrompt !== undefined ? input.replyPrompt : current.replyPrompt,
        silenceSoul:
          input.silenceSoul !== undefined ? input.silenceSoul : current.silenceSoul,
        silencePage:
          input.silencePage !== undefined ? input.silencePage : current.silencePage,
        silenceKnowledge:
          input.silenceKnowledge !== undefined
            ? input.silenceKnowledge
            : current.silenceKnowledge,
        silenceRestrictions:
          input.silenceRestrictions !== undefined
            ? input.silenceRestrictions
            : current.silenceRestrictions,
        likeCount:
          input.likeCount !== undefined ? input.likeCount : current.likeCount,
        reportedCommentsCount:
          input.reportedCommentsCount !== undefined
            ? input.reportedCommentsCount
            : current.reportedCommentsCount,
      };

      if (input.autoReplyEnabled !== undefined && input.replyMode === undefined) {
        next.replyMode = input.autoReplyEnabled ? "auto" : "off";
      }

      const updatedAt = new Date().toISOString();
      const autoReplyEnabled =
        next.replyMode === "auto" || next.replyMode === "draft"
          ? true
          : next.replyMode === "off"
            ? false
            : next.autoReplyEnabled;

      db.prepare(`
        UPDATE posts
        SET caption = ?, collaborators = ?, carousel_summary = ?, channel = ?, scheduled_at = ?, source_note = ?, status = ?,
            published_at = ?, ig_media_id = ?, ig_media_status = ?, ig_media_status_detail = ?,
            ig_media_status_checked_at = ?, error_message = ?, auto_reply_enabled = ?,
            reply_mode = ?, agent_active_days = ?, private_reply_mode = ?, reply_prompt = ?, silence_soul = ?, silence_page = ?,
            silence_knowledge = ?, silence_restrictions = ?, like_count = ?, reported_comments_count = ?, updated_at = ?
        WHERE id = ?
      `).run(
        next.caption,
        collaboratorsToDb(next.collaborators),
        next.carouselSummary,
        next.channel,
        next.scheduledAt,
        next.sourceNote,
        next.status,
        next.publishedAt,
        next.igMediaId,
        next.igMediaStatus,
        next.igMediaStatusDetail,
        next.igMediaStatusCheckedAt,
        next.errorMessage,
        autoReplyEnabled ? 1 : 0,
        next.replyMode,
        next.agentActiveDays,
        next.privateReplyMode,
        next.replyPrompt,
        next.silenceSoul ? 1 : 0,
        next.silencePage ? 1 : 0,
        next.silenceKnowledge ? 1 : 0,
        next.silenceRestrictions ? 1 : 0,
        next.likeCount,
        next.reportedCommentsCount,
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

    purgeCancelled(id) {
      const current = this.findById(id);
      if (!current || current.status !== "cancelled") {
        return false;
      }

      const nullSteps = db.prepare(`
        UPDATE agent_run_steps
        SET comment_id = NULL
        WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)
      `);
      const nullWebhookComments = db.prepare(`
        UPDATE meta_webhook_events
        SET comment_id = NULL
        WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)
      `);
      const nullWebhookPost = db.prepare(`
        UPDATE meta_webhook_events
        SET post_id = NULL
        WHERE post_id = ?
      `);
      const deleteReplies = db.prepare(`
        DELETE FROM comment_replies
        WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)
      `);
      const deleteComments = db.prepare(`
        DELETE FROM comments WHERE post_id = ?
      `);
      const deleteInsights = db.prepare(`
        DELETE FROM post_insights_snapshots WHERE post_id = ?
      `);
      const deleteAssets = db.prepare(`
        DELETE FROM post_assets WHERE post_id = ?
      `);
      const deletePost = db.prepare(`
        DELETE FROM posts WHERE id = ? AND status = 'cancelled'
      `);

      db.exec("BEGIN");
      try {
        nullSteps.run(id);
        nullWebhookComments.run(id);
        nullWebhookPost.run(id);
        deleteReplies.run(id);
        deleteComments.run(id);
        deleteInsights.run(id);
        deleteAssets.run(id);
        const result = deletePost.run(id);
        if (result.changes === 0) {
          db.exec("ROLLBACK");
          return false;
        }
        db.exec("COMMIT");
        return true;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
