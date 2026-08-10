import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { buildCommentsInbox, buildLocalCommentsInbox } from "./build-comments-inbox.ts";

function createDeps(
  db: ReturnType<typeof openDatabase>,
  metaCommentReader: Parameters<typeof buildCommentsInbox>[1]["metaCommentReader"],
) {
  const posts = createSqlitePostRepository(db);
  const comments = createSqliteCommentRepository(db);

  return {
    posts,
    comments,
    deps: {
      metaCommentReader,
      findPostIdByIgMediaId: (igMediaId: string) => posts.findByIgMediaId(igMediaId)?.id ?? null,
      listIrisPostsSince: (since: Date) =>
        posts
          .list({ from: since.toISOString(), calendarOnly: true })
          .filter((post) => post.igMediaId && post.status === "published")
          .map((post) => ({
            id: post.id,
            igMediaId: post.igMediaId!,
            caption: post.caption,
            publishedAt: post.publishedAt,
            scheduledAt: post.scheduledAt,
          })),
      listCommentsByPostId: (postId: string) =>
        comments.listByPostId(postId).map((comment) => ({
          id: comment.id,
          igCommentId: comment.igCommentId,
          parentIgCommentId: comment.parentIgCommentId,
          authorUsername: comment.authorUsername,
          text: comment.text,
          status: comment.status,
          createdAt: comment.createdAt,
        })),
      upsertFromWebhook: (input: Parameters<typeof comments.upsertFromWebhook>[0]) =>
        comments.upsertFromWebhook(input),
      findByIgCommentId: (igCommentId: string) => comments.findByIgCommentId(igCommentId),
    },
  };
}

test("buildCommentsInbox syncs comments for iris posts", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const { posts, deps } = createDeps(db, {
      async listRecentMediaWithComments() {
        return [
          {
            igMediaId: "media-sync",
            caption: "Legenda",
            timestamp: new Date().toISOString(),
            reportedCommentsCount: 1,
            comments: [
              {
                igCommentId: "ig-sync-1",
                parentIgCommentId: null,
                authorUsername: "fan",
                text: "sync",
                timestamp: new Date().toISOString(),
              },
            ],
          },
          {
            igMediaId: "media-external",
            caption: null,
            timestamp: new Date().toISOString(),
            reportedCommentsCount: 3,
            comments: [],
          },
        ];
      },
    });

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Legenda",
    });
    posts.update(post.id, {
      igMediaId: "media-sync",
      publishedAt: new Date().toISOString(),
    });

    const inbox = await buildCommentsInbox(30, deps, { scope: "all" });

    assert.equal(inbox.source, "meta");
    assert.equal(inbox.media.length, 2);
    assert.equal(inbox.media[0]?.postId, post.id);
    assert.ok(inbox.media[0]?.comments[0]?.irisCommentId);
    assert.equal(inbox.media[1]?.postId, null);
    assert.equal(inbox.media[1]?.comments.length, 0);
    assert.equal(inbox.media[1]?.reportedCommentsCount, 3);
    assert.equal(inbox.summary.comments_reported, 4);
    assert.equal(inbox.summary.access_limited, false);
  } finally {
    db.close();
  }
});

test("buildCommentsInbox with iris scope requests only iris media ids", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    let requestedMediaIds: string[] | undefined;

    const { posts, deps } = createDeps(db, {
      async listRecentMediaWithComments(_since, options) {
        requestedMediaIds = options?.igMediaIds;
        return [
          {
            igMediaId: "media-sync",
            caption: "Legenda",
            timestamp: new Date().toISOString(),
            reportedCommentsCount: 1,
            comments: [],
          },
        ];
      },
    });

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Legenda",
    });
    posts.update(post.id, {
      igMediaId: "media-sync",
      publishedAt: new Date().toISOString(),
    });

    await buildCommentsInbox(30, deps, { scope: "iris" });

    assert.deepEqual(requestedMediaIds, ["media-sync"]);
  } finally {
    db.close();
  }
});

test("buildLocalCommentsInbox returns comments stored locally", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const { posts, comments, deps } = createDeps(db, {
      async listRecentMediaWithComments() {
        return [];
      },
    });

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Legenda local",
    });
    posts.update(post.id, { igMediaId: "media-local", publishedAt: new Date().toISOString() });
    comments.upsertFromWebhook({
      igCommentId: "ig-local-1",
      postId: post.id,
      authorUsername: "fan",
      text: "local",
    });

    const inbox = buildLocalCommentsInbox(30, deps);

    assert.equal(inbox.source, "local");
    assert.equal(inbox.media.length, 1);
    assert.equal(inbox.media[0]?.comments[0]?.text, "local");
    assert.equal(inbox.media[0]?.comments[0]?.irisCommentId, inbox.media[0]?.comments[0]?.irisCommentId);
  } finally {
    db.close();
  }
});

test("buildCommentsInbox flags meta access limitation when counts exist but list is empty", async () => {
  const inbox = await buildCommentsInbox(30, {
    metaCommentReader: {
      async listRecentMediaWithComments() {
        return [
          {
            igMediaId: "media-blocked",
            caption: "Post com comentários",
            timestamp: new Date().toISOString(),
            reportedCommentsCount: 2,
            comments: [],
          },
        ];
      },
    },
    findPostIdByIgMediaId: () => null,
    listIrisPostsSince: () => [],
    listCommentsByPostId: () => [],
    upsertFromWebhook: () => {
      throw new Error("should not upsert");
    },
    findByIgCommentId: () => null,
  }, { scope: "all" });

  assert.equal(inbox.media.length, 1);
  assert.equal(inbox.summary.comments_reported, 2);
  assert.equal(inbox.summary.comments_fetched, 0);
  assert.equal(inbox.summary.access_limited, true);
  assert.ok(inbox.summary.warning);
});
