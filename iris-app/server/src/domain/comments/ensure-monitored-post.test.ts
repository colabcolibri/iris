import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import type { MetaCommentReader, RemoteMediaMetadata } from "../../ports/meta-comment-reader.ts";
import { ensureMonitoredPost } from "./ensure-monitored-post.ts";

function stubReader(
  byId: Record<string, RemoteMediaMetadata>,
): MetaCommentReader {
  return {
    async listRecentMediaWithComments() {
      return [];
    },
    async fetchMediaMetadata(igMediaId: string) {
      const found = byId[igMediaId];
      if (!found) {
        throw new Error(`media not found: ${igMediaId}`);
      }
      return found;
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
      return { items: [], nextCursor: null };
    },
    async findMediaByPermalink() {
      return null;
    },
    async fetchCommentTimestamp() {
      return null;
    },
  };
}

test("ensureMonitoredPost creates monitored on first call and reuses on second", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const deps = {
      posts,
      metaCommentReader: stubReader({
        "17986333005010731": {
          igMediaId: "17986333005010731",
          caption: "olá",
          timestamp: "2026-08-11T10:00:00.000Z",
        },
      }),
    };

    const first = await ensureMonitoredPost("17986333005010731", deps);
    assert.equal(first.ok, true);
    if (!first.ok) {
      return;
    }
    assert.equal(first.created, true);
    assert.equal(first.post.status, "monitored");
    assert.equal(first.post.igMediaId, "17986333005010731");
    assert.equal(first.post.caption, "olá");

    const second = await ensureMonitoredPost("17986333005010731", deps);
    assert.equal(second.ok, true);
    if (!second.ok) {
      return;
    }
    assert.equal(second.created, false);
    assert.equal(second.post.id, first.post.id);
  } finally {
    db.close();
  }
});

test("ensureMonitoredPost returns ok false when Graph cannot resolve media", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const result = await ensureMonitoredPost("17999999999999999", {
      posts,
      metaCommentReader: stubReader({}),
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.match(result.error, /media not found|17999999999999999/i);
    assert.equal(posts.findByIgMediaId("17999999999999999"), null);
  } finally {
    db.close();
  }
});

test("ensureMonitoredPost returns existing published without Graph create", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const published = posts.create({
      channel: "instagram",
      status: "published",
      caption: "já publicado",
    });
    posts.update(published.id, { igMediaId: "17841409220682758" });

    let fetchCalls = 0;
    const reader = stubReader({});
    const originalFetch = reader.fetchMediaMetadata.bind(reader);
    reader.fetchMediaMetadata = async (id) => {
      fetchCalls += 1;
      return originalFetch(id);
    };

    const result = await ensureMonitoredPost("17841409220682758", {
      posts,
      metaCommentReader: reader,
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.created, false);
    assert.equal(result.post.id, published.id);
    assert.equal(fetchCalls, 0);
  } finally {
    db.close();
  }
});
