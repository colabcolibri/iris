import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { MediaInsightMetric } from "../../ports/meta-insights-reader.ts";
import type {
  InsertPostInsightsSnapshotInput,
  PostInsightsSnapshot,
  PostInsightsStore,
} from "../../ports/post-insights-store.ts";
import type { SerializedPostMedia } from "../../domain/post-media/serialize-post-media.ts";

function mapRow(row: {
  id: string;
  post_id: string;
  ig_media_id: string;
  metrics_json: string;
  media_json: string | null;
  fetched_at: string;
}): PostInsightsSnapshot {
  return {
    id: row.id,
    postId: row.post_id,
    igMediaId: row.ig_media_id,
    metrics: JSON.parse(row.metrics_json) as MediaInsightMetric[],
    media: row.media_json ? (JSON.parse(row.media_json) as SerializedPostMedia) : null,
    fetchedAt: row.fetched_at,
  };
}

export function createSqlitePostInsightsStore(db: DatabaseSync): PostInsightsStore {
  const insertStmt = db.prepare(`
    INSERT INTO post_insights_snapshots (id, post_id, ig_media_id, metrics_json, media_json, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const findLatestStmt = db.prepare(`
    SELECT * FROM post_insights_snapshots
    WHERE post_id = ?
    ORDER BY datetime(fetched_at) DESC
    LIMIT 1
  `);

  const listByPostIdStmt = db.prepare(`
    SELECT * FROM post_insights_snapshots
    WHERE post_id = ?
    ORDER BY datetime(fetched_at) DESC
    LIMIT ?
  `);

  return {
    insert(input: InsertPostInsightsSnapshotInput) {
      const id = randomUUID();
      insertStmt.run(
        id,
        input.postId,
        input.igMediaId,
        JSON.stringify(input.metrics),
        input.media ? JSON.stringify(input.media) : null,
        input.fetchedAt,
      );

      return mapRow(
        db.prepare("SELECT * FROM post_insights_snapshots WHERE id = ?").get(id) as never,
      );
    },

    findLatestByPostId(postId) {
      const row = findLatestStmt.get(postId);
      return row ? mapRow(row as never) : null;
    },

    listByPostId(postId, limit) {
      return listByPostIdStmt.all(postId, limit).map((row) => mapRow(row as never));
    },
  };
}
