import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { listCommentPosts } from "./list-comment-posts.ts";
import { syncPostComments } from "./sync-post-comments.ts";

test("listCommentPosts returns published iris posts with local counts", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);

    const published = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post A",
    });
    posts.update(published.id, {
      igMediaId: "media-a",
      publishedAt: new Date().toISOString(),
    });

    const draft = posts.create({
      channel: "instagram",
      status: "draft",
      caption: "Rascunho",
    });
    posts.update(draft.id, { igMediaId: "media-draft" });

    comments.upsertFromWebhook({
      igCommentId: "ig-1",
      postId: published.id,
      text: "oi",
    });
    comments.upsertFromWebhook({
      igCommentId: "ig-2",
      postId: published.id,
      text: "legal",
    });

    const result = listCommentPosts({
      listManagedPosts: () =>
        posts
          .list()
          .filter(
            (post) =>
              Boolean(post.igMediaId) &&
              (post.status === "published" || post.status === "monitored"),
          )
          .map((post) => ({
            id: post.id,
            caption: post.caption,
            carouselSummary: post.carouselSummary,
            publishedAt: post.publishedAt,
            igMediaId: post.igMediaId,
            status: post.status,
            replyMode: post.replyMode,
            autoReplyEnabled: post.autoReplyEnabled,
            igMediaStatus: post.igMediaStatus,
            igMediaStatusDetail: post.igMediaStatusDetail,
            igMediaStatusCheckedAt: post.igMediaStatusCheckedAt,
          })),
      countCommentsByPostId: (postId) => comments.countByPostId(postId),
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.postId, published.id);
    assert.equal(result[0]?.commentsCount, 2);
    assert.equal(result[0]?.pendingCount, 2);
  } finally {
    db.close();
  }
});

test("syncPostComments upserts remote comments for one post", async () => {
  const result = await syncPostComments(
    { postId: "post-1", igMediaId: "media-1" },
    {
      metaCommentReader: {
        async listRecentMediaWithComments() {
          return [
            {
              igMediaId: "media-1",
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
          ];
        },
        async fetchMediaMetadata(igMediaId: string) {
          return {
            igMediaId,
            caption: "Legenda",
            timestamp: new Date().toISOString(),
          };
        },
        async findMediaByPermalink() {
          return null;
        },
      },
      upsertFromWebhook: (input) => ({
        comment: {
          id: "comment-1",
          igCommentId: input.igCommentId,
          postId: input.postId,
          parentIgCommentId: input.parentIgCommentId ?? null,
          authorUsername: input.authorUsername ?? null,
          text: input.text ?? null,
          status: "pending",
          errorMessage: null,
          createdAt: new Date().toISOString(),
          igTimestamp: null,
          deletedAt: null,
        },
        created: true,
      }),
      listByPostId: () => [],
      markDeletedFromInstagram: () => false,
      restoreFromInstagram: () => false,
    },
  );

  assert.equal(result.commentsFetched, 1);
  assert.equal(result.accessLimited, false);
});

test("syncPostComments marks comments removed from instagram when remote list is complete", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
    });
    posts.update(post.id, { igMediaId: "media-1" });

    comments.upsertFromWebhook({
      igCommentId: "ig-stays",
      postId: post.id,
      text: "permanece",
    });
    comments.upsertFromWebhook({
      igCommentId: "ig-removed",
      postId: post.id,
      text: "sumiu",
    });

    const result = await syncPostComments(
      { postId: post.id, igMediaId: "media-1" },
      {
        metaCommentReader: {
          async listRecentMediaWithComments() {
            return [
              {
                igMediaId: "media-1",
                caption: "Legenda",
                timestamp: new Date().toISOString(),
                reportedCommentsCount: 1,
                comments: [
                  {
                    igCommentId: "ig-stays",
                    parentIgCommentId: null,
                    authorUsername: "fan",
                    text: "permanece",
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            ];
          },
          async fetchMediaMetadata(igMediaId: string) {
            return {
              igMediaId,
              caption: "Legenda",
              timestamp: new Date().toISOString(),
            };
          },
          async findMediaByPermalink() {
            return null;
          },
        },
        upsertFromWebhook: (input) => comments.upsertFromWebhook(input),
        listByPostId: (postId) => comments.listByPostId(postId),
        markDeletedFromInstagram: (id) => comments.markDeletedFromInstagram(id),
        restoreFromInstagram: (id) => comments.restoreFromInstagram(id),
      },
    );

    assert.equal(result.markedDeleted, 1);
    assert.equal(result.restored, 0);

    const removed = comments.findByIgCommentId("ig-removed");
    const stays = comments.findByIgCommentId("ig-stays");
    assert.ok(removed?.deletedAt);
    assert.equal(stays?.deletedAt, null);
    assert.equal(comments.countByPostId(post.id).total, 1);
  } finally {
    db.close();
  }
});
