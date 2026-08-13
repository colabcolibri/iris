import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteProductRepository } from "./product-repository.ts";

test("product repository creates, updates and deactivates", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const products = createSqliteProductRepository(db);

    const created = products.create({
      slug: "curso-nomade",
      name: "Curso Nômade",
      shortDescription: "Formação completa",
    });
    assert.equal(created.slug, "curso-nomade");
    assert.equal(created.active, true);

    const updated = products.update(created.id, {
      shortDescription: "Formação completa atualizada",
    });
    assert.equal(updated?.shortDescription, "Formação completa atualizada");

    assert.ok(products.deactivate(created.id));
    assert.equal(products.list(true).length, 0);
    assert.equal(products.list(false).length, 1);
  } finally {
    db.close();
  }
});
