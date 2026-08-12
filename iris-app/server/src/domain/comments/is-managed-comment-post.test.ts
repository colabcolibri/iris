import { test } from "node:test";
import assert from "node:assert/strict";
import { isManagedCommentPost } from "./is-managed-comment-post.ts";

const now = new Date("2026-08-12T18:00:00.000Z");

test("isManagedCommentPost accepts published posts already on air", () => {
  assert.equal(
    isManagedCommentPost(
      {
        igMediaId: "17890001",
        status: "published",
        publishedAt: "2026-08-10T12:00:00.000Z",
      },
      now,
    ),
    true,
  );
});

test("isManagedCommentPost accepts monitored imports already on air", () => {
  assert.equal(
    isManagedCommentPost(
      {
        ig_media_id: "17890002",
        status: "monitored",
        published_at: "2026-08-12T08:00:00.000Z",
      },
      now,
    ),
    true,
  );
});

test("isManagedCommentPost rejects scheduled and draft posts", () => {
  assert.equal(
    isManagedCommentPost(
      {
        igMediaId: "17890003",
        status: "scheduled",
        publishedAt: "2026-08-01T12:00:00.000Z",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isManagedCommentPost(
      {
        igMediaId: "17890004",
        status: "draft",
        publishedAt: null,
      },
      now,
    ),
    false,
  );
});

test("isManagedCommentPost rejects posts with future published_at", () => {
  assert.equal(
    isManagedCommentPost(
      {
        igMediaId: "17890005",
        status: "published",
        publishedAt: "2026-08-20T12:00:00.000Z",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isManagedCommentPost(
      {
        igMediaId: "17890006",
        status: "monitored",
        publishedAt: "2026-09-01T12:00:00.000Z",
      },
      now,
    ),
    false,
  );
});
