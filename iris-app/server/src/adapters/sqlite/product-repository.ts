import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from "../../ports/product-repository.ts";
import { mapProductRow } from "./message-mappers.ts";

export function createSqliteProductRepository(db: DatabaseSync): ProductRepository {
  const selectById = db.prepare("SELECT * FROM products WHERE id = ?");
  const selectBySlug = db.prepare("SELECT * FROM products WHERE slug = ?");
  const listAll = db.prepare(`
    SELECT * FROM products ORDER BY sort_order ASC, name ASC
  `);
  const listActive = db.prepare(`
    SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, name ASC
  `);

  const insert = db.prepare(`
    INSERT INTO products (
      id, slug, name, short_description, long_description, active, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE products
    SET slug = COALESCE(?, slug),
        name = COALESCE(?, name),
        short_description = COALESCE(?, short_description),
        long_description = COALESCE(?, long_description),
        active = COALESCE(?, active),
        sort_order = COALESCE(?, sort_order),
        updated_at = ?
    WHERE id = ?
  `);

  const deactivateStmt = db.prepare(`
    UPDATE products SET active = 0, updated_at = ? WHERE id = ?
  `);

  const removeStmt = db.prepare(`DELETE FROM products WHERE id = ?`);

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    list(activeOnly = false) {
      const rows = (activeOnly ? listActive : listAll).all() as never[];
      return rows.map(mapProductRow);
    },

    findById(id: string) {
      const row = selectById.get(id);
      return row ? mapProductRow(row as never) : null;
    },

    findBySlug(slug: string) {
      const row = selectBySlug.get(slug);
      return row ? mapProductRow(row as never) : null;
    },

    create(input: CreateProductInput) {
      const id = randomUUID();
      const ts = nowIso();
      insert.run(
        id,
        input.slug,
        input.name,
        input.shortDescription ?? "",
        input.longDescription ?? "",
        input.active === false ? 0 : 1,
        input.sortOrder ?? 0,
        ts,
        ts,
      );
      const row = selectById.get(id);
      return mapProductRow(row as never);
    },

    update(id: string, input: UpdateProductInput) {
      updateStmt.run(
        input.slug ?? null,
        input.name ?? null,
        input.shortDescription ?? null,
        input.longDescription ?? null,
        input.active === undefined ? null : input.active ? 1 : 0,
        input.sortOrder ?? null,
        nowIso(),
        id,
      );
      const row = selectById.get(id);
      return row ? mapProductRow(row as never) : null;
    },

    deactivate(id: string) {
      const result = deactivateStmt.run(nowIso(), id);
      return result.changes > 0;
    },

    remove(id: string) {
      const result = removeStmt.run(id);
      return result.changes > 0;
    },
  };
}
