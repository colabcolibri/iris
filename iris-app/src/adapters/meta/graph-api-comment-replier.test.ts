import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiCommentReplier } from "./graph-api-comment-replier.ts";
import { openDatabase } from "../sqlite/connection.ts";
import { runMigrations } from "../sqlite/migrate.ts";
import { createSqliteMetaTokenStore } from "../sqlite/meta-token-repository.ts";

const TEST_KEY = "e".repeat(64);

test("graph api comment replier posts reply endpoint", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const metaTokenStore = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });
    metaTokenStore.upsertToken("meta-token");

    let calledPath = "";

    const replier = createGraphApiCommentReplier({
      metaTokenStore,
      config: {
        fetchImpl: async (input) => {
          calledPath = typeof input === "string" ? input : input.toString();
          return new Response(JSON.stringify({ id: "reply-1" }), { status: 200 });
        },
      },
    });

    await replier.reply("comment-123", "obrigado");

    assert.match(calledPath, /comment-123\/replies/);
    assert.match(calledPath, /message=obrigado/);
  } finally {
    db.close();
  }
});
