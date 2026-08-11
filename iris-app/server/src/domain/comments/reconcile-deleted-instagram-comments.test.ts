import { test } from "node:test";
import assert from "node:assert/strict";
import type { Comment } from "./comment.ts";
import { reconcileDeletedInstagramComments } from "./reconcile-deleted-instagram-comments.ts";

function comment(overrides: Partial<Comment> & Pick<Comment, "id" | "igCommentId">): Comment {
  return {
    postId: "post-1",
    parentIgCommentId: null,
    authorUsername: "fan",
    text: "oi",
    status: "pending",
    errorMessage: null,
    createdAt: "2026-08-10T10:00:00.000Z",
    igTimestamp: "2026-08-10T10:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

test("reconcileDeletedInstagramComments marks local comments missing from remote", () => {
  const marked: string[] = [];
  const restored: string[] = [];

  const result = reconcileDeletedInstagramComments(
    "post-1",
    new Set(["ig-still-there"]),
    {
      listByPostId: () => [
        comment({ id: "c1", igCommentId: "ig-still-there" }),
        comment({ id: "c2", igCommentId: "ig-gone" }),
      ],
      markDeletedFromInstagram: (id) => {
        marked.push(id);
        return true;
      },
      restoreFromInstagram: (id) => {
        restored.push(id);
        return true;
      },
    },
    { accessLimited: false },
  );

  assert.deepEqual(marked, ["c2"]);
  assert.deepEqual(restored, []);
  assert.equal(result.markedDeleted, 1);
  assert.equal(result.restored, 0);
});

test("reconcileDeletedInstagramComments restores comments that return on instagram", () => {
  const marked: string[] = [];
  const restored: string[] = [];

  const result = reconcileDeletedInstagramComments(
    "post-1",
    new Set(["ig-back"]),
    {
      listByPostId: () => [
        comment({
          id: "c1",
          igCommentId: "ig-back",
          deletedAt: "2026-08-10T12:00:00.000Z",
        }),
      ],
      markDeletedFromInstagram: (id) => {
        marked.push(id);
        return true;
      },
      restoreFromInstagram: (id) => {
        restored.push(id);
        return true;
      },
    },
    { accessLimited: false },
  );

  assert.deepEqual(marked, []);
  assert.deepEqual(restored, ["c1"]);
  assert.equal(result.markedDeleted, 0);
  assert.equal(result.restored, 1);
});

test("reconcileDeletedInstagramComments skips when access is limited", () => {
  const result = reconcileDeletedInstagramComments(
    "post-1",
    new Set(),
    {
      listByPostId: () => [comment({ id: "c1", igCommentId: "ig-gone" })],
      markDeletedFromInstagram: () => {
        throw new Error("should not mark deleted");
      },
      restoreFromInstagram: () => {
        throw new Error("should not restore");
      },
    },
    { accessLimited: true },
  );

  assert.equal(result.markedDeleted, 0);
  assert.equal(result.restored, 0);
});
