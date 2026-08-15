import { test } from "node:test";
import assert from "node:assert/strict";
import type { Comment } from "./comment.ts";
import {
  isCommentWithinPrivateReplyWindow,
  META_PRIVATE_REPLY_WINDOW_DAYS,
} from "./comment-private-reply-window.ts";

function baseComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    igCommentId: "ig-c1",
    postId: "p1",
    parentIgCommentId: null,
    authorUsername: "fan",
    text: "quero",
    status: "pending",
    errorMessage: null,
    agentReplyNotBefore: null,
    createdAt: "2026-08-01T12:00:00.000Z",
    igTimestamp: "2026-08-01T12:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

test("private reply window is seven days from comment timestamp", () => {
  const comment = baseComment();
  const inside = new Date("2026-08-05T12:00:00.000Z");
  const outside = new Date(
    inside.getTime() + META_PRIVATE_REPLY_WINDOW_DAYS * 24 * 60 * 60 * 1000 + 1,
  );
  assert.equal(isCommentWithinPrivateReplyWindow(comment, inside), true);
  assert.equal(isCommentWithinPrivateReplyWindow(comment, outside), false);
});
