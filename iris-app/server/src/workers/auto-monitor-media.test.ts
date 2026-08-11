import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import { defaultAppSettings } from "../domain/settings/app-settings-defaults.ts";
import type { MetaCommentReader } from "../ports/meta-comment-reader.ts";
import { runAutoMonitorMedia, startAutoMonitorMedia } from "./auto-monitor-media.ts";

function stubBrowseReader(
  items: Array<{ igMediaId: string; caption?: string }>,
): MetaCommentReader {
  return {
    async listRecentMediaWithComments() {
      return [];
    },
    async fetchMediaMetadata(igMediaId: string) {
      const found = items.find((item) => item.igMediaId === igMediaId);
      if (!found) {
        throw new Error(`media not found: ${igMediaId}`);
      }
      return {
        igMediaId: found.igMediaId,
        caption: found.caption ?? null,
        timestamp: "2026-08-11T10:00:00.000Z",
      };
    },
    async fetchMediaPreview() {
      return { permalink: null, mediaType: null, slides: [] };
    },
    async isMediaOnUserFeed() {
      return true;
    },
    async canAccessMediaComments() {
      return true;
    },
    async listBrowsableMedia() {
      return {
        items: items.map((item) => ({
          igMediaId: item.igMediaId,
          caption: item.caption ?? null,
          timestamp: "2026-08-11T10:00:00.000Z",
          permalink: null,
          mediaType: "IMAGE",
          thumbnailUrl: null,
          likeCount: null,
          commentsCount: null,
        })),
        nextCursor: null,
      };
    },
    async findMediaByPermalink() {
      return null;
    },
    async fetchCommentTimestamp() {
      return null;
    },
  };
}

test("runAutoMonitorMedia skips when disabled in app settings", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });
    const current = ctx.appSettingsStore.get() ?? defaultAppSettings();
    ctx.appSettingsStore.upsert({
      ...current,
      autoMonitorEnabled: false,
    });
    ctx.metaCommentReader = stubBrowseReader([{ igMediaId: "17986333005010731" }]);

    const result = await runAutoMonitorMedia(ctx);
    assert.equal(result.skipped, true);
    assert.equal(result.imported, 0);
    assert.equal(ctx.posts.findByIgMediaId("17986333005010731"), null);
  } finally {
    db.close();
  }
});

test("runAutoMonitorMedia imports only unmanaged media when enabled", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });

    const existing = ctx.posts.create({
      channel: "instagram",
      status: "monitored",
      caption: "já",
    });
    ctx.posts.update(existing.id, { igMediaId: "17986333005010730" });

    ctx.metaCommentReader = stubBrowseReader([
      { igMediaId: "17986333005010730", caption: "já" },
      { igMediaId: "17986333005010731", caption: "nova" },
    ]);

    const result = await runAutoMonitorMedia(ctx, { enabled: true, limit: 10 });
    assert.equal(result.skipped, false);
    assert.equal(result.listed, 2);
    assert.equal(result.imported, 1);
    assert.equal(result.alreadyManaged, 1);

    const created = ctx.posts.findByIgMediaId("17986333005010731");
    assert.ok(created);
    assert.equal(created?.status, "monitored");
    assert.equal(created?.caption, "nova");
  } finally {
    db.close();
  }
});

test("startAutoMonitorMedia running guard avoids overlapping ticks", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });
    const current = ctx.appSettingsStore.get() ?? defaultAppSettings();
    ctx.appSettingsStore.upsert({
      ...current,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 60,
    });

    let calls = 0;
    ctx.metaCommentReader = {
      ...stubBrowseReader([{ igMediaId: "17986333005010732" }]),
      async listBrowsableMedia() {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 80));
        return {
          items: [
            {
              igMediaId: "17986333005010732",
              caption: "slow",
              timestamp: "2026-08-11T10:00:00.000Z",
              permalink: null,
              mediaType: "IMAGE",
              thumbnailUrl: null,
              likeCount: null,
              commentsCount: null,
            },
          ],
          nextCursor: null,
        };
      },
    };

    const stop = startAutoMonitorMedia(ctx, {
      intervalMs: 20,
      limit: 5,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    stop();

    assert.ok(calls >= 1);
    assert.ok(calls <= 2);
  } finally {
    db.close();
  }
});
