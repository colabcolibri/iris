import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AssetRepository, CreateAssetInput } from "../../ports/asset-repository.ts";
import { mapAssetRow } from "./mappers.ts";

export function createSqliteAssetRepository(db: DatabaseSync): AssetRepository {
  const insert = db.prepare(`
    INSERT INTO post_assets (
      id, post_id, sort_order, storage_path, original_filename, mime,
      width, height, original_size_bytes, optimized_size_bytes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listByPostId = db.prepare(`
    SELECT * FROM post_assets WHERE post_id = ? ORDER BY sort_order ASC
  `);

  const findByFilename = db.prepare(`
    SELECT * FROM post_assets
    WHERE post_id = ? AND storage_path LIKE ?
  `);

  return {
    create(input: CreateAssetInput) {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      insert.run(
        id,
        input.postId,
        input.sortOrder,
        input.storagePath,
        input.originalFilename ?? null,
        input.mime,
        input.width ?? null,
        input.height ?? null,
        input.originalSizeBytes ?? null,
        input.optimizedSizeBytes ?? null,
        createdAt,
      );

      return mapAssetRow(
        db.prepare("SELECT * FROM post_assets WHERE id = ?").get(id) as never,
      );
    },

    listByPostId(postId) {
      return listByPostId.all(postId).map((row) => mapAssetRow(row as never));
    },

    findByPostIdAndFilename(postId, filename) {
      const row = findByFilename.get(postId, `%/${filename}`);
      return row ? mapAssetRow(row as never) : null;
    },
  };
}
