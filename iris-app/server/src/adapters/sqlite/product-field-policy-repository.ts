import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  ProductFieldPolicyRepository,
  UpsertFieldPolicyInput,
} from "../../ports/product-field-policy-repository.ts";
import { mapProductFieldPolicyRow } from "./store-mappers.ts";

export function createSqliteProductFieldPolicyRepository(
  db: DatabaseSync,
): ProductFieldPolicyRepository {
  const listGlobalStmt = db.prepare(`
    SELECT * FROM product_field_policies
    WHERE store_connection_id = ? AND scope = 'global'
    ORDER BY field_key ASC
  `);

  const listForProductStmt = db.prepare(`
    SELECT * FROM product_field_policies
    WHERE store_connection_id = ? AND scope = 'product' AND product_id = ?
    ORDER BY field_key ASC
  `);

  const selectExisting = db.prepare(`
    SELECT id FROM product_field_policies
    WHERE store_connection_id = ?
      AND scope = ?
      AND field_key = ?
      AND (
        (scope = 'global' AND product_id IS NULL)
        OR (scope = 'product' AND product_id = ?)
      )
  `);

  const selectById = db.prepare(`SELECT * FROM product_field_policies WHERE id = ?`);

  const insert = db.prepare(`
    INSERT INTO product_field_policies (
      id, scope, store_connection_id, product_id, field_key, source, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const update = db.prepare(`
    UPDATE product_field_policies
    SET source = ?, updated_at = ?
    WHERE id = ?
  `);

  const removeStmt = db.prepare(`DELETE FROM product_field_policies WHERE id = ?`);

  function nowIso(): string {
    return new Date().toISOString();
  }

  function readRow(id: string) {
    const row = selectById.get(id);
    return row ? mapProductFieldPolicyRow(row as never) : null;
  }

  return {
    listGlobal(storeConnectionId) {
      const rows = listGlobalStmt.all(storeConnectionId) as never[];
      return rows.map((row) => mapProductFieldPolicyRow(row));
    },

    listForProduct(storeConnectionId, productId) {
      const rows = listForProductStmt.all(storeConnectionId, productId) as never[];
      return rows.map((row) => mapProductFieldPolicyRow(row));
    },

    upsert(input: UpsertFieldPolicyInput) {
      const productId = input.scope === "product" ? (input.productId ?? null) : null;
      if (input.scope === "product" && !productId) {
        throw new Error("productId is required for product-scoped field policies");
      }

      const existing = selectExisting.get(
        input.storeConnectionId,
        input.scope,
        input.fieldKey,
        productId,
      ) as { id: string } | undefined;

      const ts = nowIso();

      if (existing) {
        update.run(input.source, ts, existing.id);
        return readRow(existing.id)!;
      }

      const id = randomUUID();
      insert.run(
        id,
        input.scope,
        input.storeConnectionId,
        productId,
        input.fieldKey,
        input.source,
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
