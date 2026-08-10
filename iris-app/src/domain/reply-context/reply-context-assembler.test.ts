import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { createSqliteReplyPersonaStore } from "../../adapters/sqlite/reply-persona-repository.ts";
import { createSqliteAssetRepository } from "../../adapters/sqlite/asset-repository.ts";
import { assembleReplyContext } from "./reply-context-assembler.ts";

test("assembleReplyContext builds full context", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);
    const assets = createSqliteAssetRepository(db);
    const personaStore = createSqliteReplyPersonaStore(db);

    personaStore.upsert({
      brandName: "Iris",
      signatureInstruction: "",
      responseLanguage: "pt-BR",
      maxChars: 300,
    });

    const post = posts.create({ channel: "instagram", caption: "Legenda" });
    const comment = comments.upsertFromWebhook({
      igCommentId: "ig-c1",
      postId: post.id,
      authorUsername: "fan",
      text: "Quero saber mais",
    }).comment;

    const context = await assembleReplyContext(comment.id, {
      posts,
      assets,
      comments,
      personaStore,
      imageContextProvider: {
        async build() {
          return { summaries: [], visionEnabled: false };
        },
      },
      publicBaseUrl: null,
      publishUrlSecret: null,
    });

    assert.ok(context);
    assert.equal(context!.persona.brandName, "Iris");
    assert.equal(context!.post?.caption, "Legenda");
    assert.equal(context!.targetComment.text, "Quero saber mais");
  } finally {
    db.close();
  }
});
