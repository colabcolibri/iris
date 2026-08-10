import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteAssetRepository } from "../../adapters/sqlite/asset-repository.ts";
import { createFsMediaStorage } from "../../adapters/media-storage/fs-media-storage.ts";
import { generateCarouselSummaryForPost } from "./generate-carousel-summary.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";

test("generateCarouselSummaryForPost reads local files and writes summary in persona language", async () => {
  const db = openDatabase(":memory:");
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-carousel-"));

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const mediaStorage = createFsMediaStorage(mediaRoot);
    const post = posts.create({ channel: "instagram", caption: "Carrossel" });

    await mkdir(join(mediaRoot, post.id), { recursive: true });
    await writeFile(join(mediaRoot, post.id, "01.jpg"), Buffer.from("fake-image"));

    assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    const calls: string[] = [];
    const summary = await generateCarouselSummaryForPost(post.id, {
      posts,
      assets,
      mediaStorage,
      llm: {
        async complete(prompt, options) {
          calls.push(prompt);
          assert.ok(options?.images?.[0]?.base64);
          return createTestLlmCompletion("Capa do livro Arte da Escuta.");
        },
      },
      responseLanguage: "pt-BR",
      visionEnabled: true,
    });

    assert.equal(summary, "Capa do livro Arte da Escuta.");
    assert.match(calls[0] ?? "", /Brazilian Portuguese \(pt-BR\)/);
    assert.match(calls[0] ?? "", /Do NOT use, assume, or infer any Instagram caption/i);
    assert.equal(posts.findById(post.id)?.carouselSummary, summary);
  } finally {
    db.close();
  }
});

test("generateCarouselSummaryForPost fails when vision is disabled", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const post = posts.create({ channel: "instagram", caption: "Carrossel" });

    assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    await assert.rejects(
      () =>
        generateCarouselSummaryForPost(post.id, {
          posts,
          assets,
          llm: { async complete() { return createTestLlmCompletion("x"); } },
          visionEnabled: false,
        }),
      /vision is not enabled/i,
    );
  } finally {
    db.close();
  }
});
