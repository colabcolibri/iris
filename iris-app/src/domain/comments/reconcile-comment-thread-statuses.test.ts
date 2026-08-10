import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planCommentThreadReconciliation,
  reconcileCommentThreadStatuses,
} from "./reconcile-comment-thread-statuses.ts";
import type { Comment } from "../comment.ts";

function makeComment(
  partial: Partial<Comment> & Pick<Comment, "id" | "igCommentId" | "postId">,
): Comment {
  return {
    parentIgCommentId: null,
    authorUsername: "fan",
    text: "oi",
    status: "pending",
    errorMessage: null,
    createdAt: "2026-08-10T10:00:00.000Z",
    igTimestamp: partial.createdAt ?? "2026-08-10T10:00:00.000Z",
    ...partial,
  };
}

test("reconcile vincula comentário do usuário à resposta real da marca no IG", () => {
  const postId = "post-1";
  const comments: Comment[] = [
    makeComment({
      id: "u1",
      igCommentId: "ig-u1",
      postId,
      authorUsername: "fan",
      createdAt: "2026-08-10T10:00:00.000Z",
      igTimestamp: "2026-08-10T10:00:00.000Z",
    }),
    makeComment({
      id: "b1",
      igCommentId: "ig-b1",
      postId,
      parentIgCommentId: "ig-u1",
      authorUsername: "colabcolibri",
      text: "obrigado!",
      createdAt: "2026-08-10T11:00:00.000Z",
      igTimestamp: "2026-08-10T11:00:00.000Z",
    }),
  ];

  const store = new Map(comments.map((comment) => [comment.id, { ...comment }]));
  const links: Array<{ userCommentId: string; brandIgCommentId: string; sentText: string | null }> =
    [];

  const result = reconcileCommentThreadStatuses(postId, "colabcolibri", {
    listByPostId: () => [...store.values()],
    hasReplyRecord: (commentId) =>
      links.some((link) => link.userCommentId === commentId),
    linkInstagramReply: (input) => {
      links.push(input);
      const row = store.get(input.userCommentId);
      if (!row) return false;
      row.status = "replied";
      return true;
    },
    markSkipped: (id) => {
      const row = store.get(id);
      if (!row) return null;
      row.status = "skipped";
      return row;
    },
  });

  assert.equal(result.linkedCount, 1);
  assert.equal(store.get("u1")?.status, "replied");
  assert.equal(store.get("b1")?.status, "skipped");
  assert.deepEqual(links, [
    {
      userCommentId: "u1",
      brandIgCommentId: "ig-b1",
      sentText: "obrigado!",
    },
  ]);
});

test("reconcile mantém pendente quando o usuário comentou depois da marca", () => {
  const postId = "post-1";
  const comments: Comment[] = [
    makeComment({
      id: "u1",
      igCommentId: "ig-u1",
      postId,
      authorUsername: "fan",
      igTimestamp: "2026-08-10T10:00:00.000Z",
      createdAt: "2026-08-10T10:00:00.000Z",
    }),
    makeComment({
      id: "b1",
      igCommentId: "ig-b1",
      postId,
      parentIgCommentId: "ig-u1",
      authorUsername: "colabcolibri",
      text: "obrigado!",
      igTimestamp: "2026-08-10T11:00:00.000Z",
      createdAt: "2026-08-10T11:00:00.000Z",
    }),
    makeComment({
      id: "u2",
      igCommentId: "ig-u2",
      postId,
      parentIgCommentId: "ig-b1",
      authorUsername: "fan",
      igTimestamp: "2026-08-10T12:00:00.000Z",
      createdAt: "2026-08-10T12:00:00.000Z",
    }),
  ];

  const store = new Map(comments.map((comment) => [comment.id, { ...comment }]));

  reconcileCommentThreadStatuses(postId, "colabcolibri", {
    listByPostId: () => [...store.values()],
    hasReplyRecord: () => false,
    linkInstagramReply: (input) => {
      const row = store.get(input.userCommentId);
      if (!row) return false;
      row.status = "replied";
      return true;
    },
    markSkipped: (id) => {
      const row = store.get(id);
      if (!row) return null;
      row.status = "skipped";
      return row;
    },
  });

  assert.equal(store.get("u1")?.status, "replied");
  assert.equal(store.get("b1")?.status, "skipped");
  assert.equal(store.get("u2")?.status, "pending");
});

test("planCommentThreadReconciliation não inclui comentários já vinculados", () => {
  const postId = "post-1";
  const comments: Comment[] = [
    makeComment({
      id: "u1",
      igCommentId: "ig-u1",
      postId,
      status: "replied",
      igTimestamp: "2026-08-10T10:00:00.000Z",
      createdAt: "2026-08-10T10:00:00.000Z",
    }),
    makeComment({
      id: "b1",
      igCommentId: "ig-b1",
      postId,
      parentIgCommentId: "ig-u1",
      authorUsername: "colabcolibri",
      igTimestamp: "2026-08-10T11:00:00.000Z",
      createdAt: "2026-08-10T11:00:00.000Z",
    }),
  ];

  const plan = planCommentThreadReconciliation(
    postId,
    "colabcolibri",
    () => comments,
    (commentId) => commentId === "u1",
  );

  assert.equal(plan.links.length, 0);
});
