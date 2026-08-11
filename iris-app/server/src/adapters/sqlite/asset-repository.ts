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

  const findByIdStmt = db.prepare(`SELECT * FROM post_assets WHERE id = ?`);
  const deleteByIdStmt = db.prepare(`DELETE FROM post_assets WHERE id = ?`);
  const updateSortOrderStmt = db.prepare(`
    UPDATE post_assets SET sort_order = ? WHERE id = ? AND post_id = ?
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

    findById(id) {
      const row = findByIdStmt.get(id);
      return row ? mapAssetRow(row as never) : null;
    },

    deleteById(id) {
      const result = deleteByIdStmt.run(id);
      return result.changes > 0;
    },

    reorder(postId, orderedAssetIds) {
      db.exec("BEGIN");
      try {
        orderedAssetIds.forEach((assetId, index) => {
          const result = updateSortOrderStmt.run(index + 1, assetId, postId);
          if (result.changes === 0) {
            throw new Error(`asset not found: ${assetId}`);
          }
        });
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      return listByPostId.all(postId).map((row) => mapAssetRow(row as never));
    },
  };
}
