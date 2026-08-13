import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreateProductStoreLinkInput,
  ProductStoreLinkRepository,
} from "../../ports/product-store-link-repository.ts";
import {
  mapProductStoreLinkRow,
  serializeExternalProduct,
} from "./store-mappers.ts";

export function createSqliteProductStoreLinkRepository(
  db: DatabaseSync,
): ProductStoreLinkRepository {
  const listByProductStmt = db.prepare(`
    SELECT * FROM product_store_links WHERE product_id = ? ORDER BY linked_at DESC
  `);

  const listByStoreStmt = db.prepare(`
    SELECT * FROM product_store_links WHERE store_connection_id = ? ORDER BY linked_at DESC
  `);

  const selectById = db.prepare(`SELECT * FROM product_store_links WHERE id = ?`);

  const selectByExternal = db.prepare(`
    SELECT * FROM product_store_links
    WHERE store_connection_id = ? AND external_product_id = ?
  `);

  const insert = db.prepare(`
    INSERT INTO product_store_links (
      id, product_id, store_connection_id, external_product_id, external_sku,
      provider_snapshot_json, linked_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const update = db.prepare(`
    UPDATE product_store_links
    SET external_sku = ?,
        provider_snapshot_json = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const removeStmt = db.prepare(`DELETE FROM product_store_links WHERE id = ?`);

  function nowIso(): string {
    return new Date().toISOString();
  }

  function readRow(id: string) {
    const row = selectById.get(id);
    return row ? mapProductStoreLinkRow(row as never) : null;
  }

  return {
    listByProduct(productId) {
      const rows = listByProductStmt.all(productId) as never[];
      return rows.map((row) => mapProductStoreLinkRow(row));
    },

    listByStoreConnection(storeConnectionId) {
      const rows = listByStoreStmt.all(storeConnectionId) as never[];
      return rows.map((row) => mapProductStoreLinkRow(row));
    },

    findById(id) {
      return readRow(id);
    },

    findByExternalId(storeConnectionId, externalProductId) {
      const row = selectByExternal.get(storeConnectionId, externalProductId);
      return row ? mapProductStoreLinkRow(row as never) : null;
    },

    upsert(input: CreateProductStoreLinkInput) {
      const existing = selectByExternal.get(
        input.storeConnectionId,
        input.externalProductId,
      ) as { id: string } | undefined;

      const ts = nowIso();
      const snapshotJson = serializeExternalProduct(input.snapshot);

      if (existing) {
        update.run(input.externalSku ?? null, snapshotJson, ts, existing.id);
        return readRow(existing.id)!;
      }

      const id = randomUUID();
      insert.run(
        id,
        input.productId,
        input.storeConnectionId,
        input.externalProductId,
        input.externalSku ?? null,
        snapshotJson,
        ts,
        ts,
      );

      return readRow(id)!;
    },

    remove(id) {
      const result = removeStmt.run(id);
      return result.changes > 0;
    },
  };
}
