import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCommentThreadGroups,
  commentTimeMs,
  defaultCollapsedThreadIds,
  findThreadGroupContainingComment,
  shouldShowLinkedReply,
  sortCommentThreadGroups,
} from "../admin/src/lib/build-comment-tree.ts";
import type { Comment } from "../admin/src/lib/types.ts";

function comment(partial: Partial<Comment> & Pick<Comment, "id" | "text" | "status">): Comment {
  return {
    created_at: "2026-08-10T10:00:00.000Z",
    ...partial,
  };
}

test("buildCommentThreadGroups groups reply-to-brand under the root comment", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "root",
      ig_comment_id: "ig-root",
      author_username: "sergiolucianojr",
      text: "Gostei demais!",
      status: "replied",
      created_at: "2026-08-10T10:00:00.000Z",
    }),
    comment({
      id: "brand",
      ig_comment_id: "ig-brand",
      parent_ig_comment_id: "ig-root",
      author_username: "colabcolibri",
      text: "Obrigado!",
      status: "replied",
      created_at: "2026-08-10T10:05:00.000Z",
    }),
    comment({
      id: "follow-up",
      ig_comment_id: "ig-follow-up",
      parent_ig_comment_id: "ig-brand",
      author_username: "sergiolucianojr",
      text: "@colabcolibri tu é uma IA?",
      status: "pending",
      created_at: "2026-08-10T10:10:00.000Z",
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.root.id, "root");
  assert.deepEqual(
    groups[0]?.replies.map((entry) => entry.id),
    ["brand", "follow-up"],
  );
});

test("thread replies stay chronological oldest to newest", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "root",
      ig_comment_id: "ig-root",
      text: "raiz",
      status: "replied",
      created_at: "2026-08-10T10:00:00.000Z",
    }),
    comment({
      id: "reply-b",
      ig_comment_id: "ig-b",
      parent_ig_comment_id: "ig-root",
      text: "resposta mais nova",
      status: "replied",
      created_at: "2026-08-10T11:00:00.000Z",
    }),
    comment({
      id: "reply-a",
      ig_comment_id: "ig-a",
      parent_ig_comment_id: "ig-root",
      text: "resposta mais antiga",
      status: "replied",
      created_at: "2026-08-10T10:30:00.000Z",
    }),
    comment({
      id: "nested",
      ig_comment_id: "ig-nested",
      parent_ig_comment_id: "ig-a",
      text: "reply de reply vira item plano",
      status: "replied",
      created_at: "2026-08-10T10:45:00.000Z",
    }),
  ]);

  assert.deepEqual(
    groups[0]?.replies.map((entry) => entry.text),
    ["resposta mais antiga", "reply de reply vira item plano", "resposta mais nova"],
  );
});

test("sortCommentThreadGroups can order roots by latest activity", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "old-root",
      ig_comment_id: "ig-old",
      text: "comentário antigo",
      status: "replied",
      created_at: "2026-08-10T10:00:00.000Z",
    }),
    comment({
      id: "hot-root",
      ig_comment_id: "ig-hot",
      text: "comentário com atividade recente",
      status: "replied",
      created_at: "2026-08-10T09:00:00.000Z",
    }),
    comment({
      id: "hot-reply",
      ig_comment_id: "ig-hot-reply",
      parent_ig_comment_id: "ig-hot",
      author_username: "fan",
      text: "resposta recente",
      status: "pending",
      created_at: "2026-08-10T12:00:00.000Z",
    }),
  ]);

  const sorted = sortCommentThreadGroups(groups, "activity_desc");
  assert.equal(sorted[0]?.root.id, "hot-root");
  assert.equal(sorted[1]?.root.id, "old-root");
  assert.ok(commentTimeMs(sorted[0]!.replies.at(-1)!) > commentTimeMs(sorted[1]!.root));
});

test("defaultCollapsedThreadIds collapses every thread with replies by default", () => {
  const groups = sortCommentThreadGroups(
    buildCommentThreadGroups([
      comment({
        id: "hot-root",
        ig_comment_id: "ig-hot",
        text: "thread ativa",
        status: "replied",
        created_at: "2026-08-10T12:00:00.000Z",
      }),
      comment({
        id: "hot-reply",
        ig_comment_id: "ig-hot-reply",
        parent_ig_comment_id: "ig-hot",
        text: "resposta",
        status: "replied",
        created_at: "2026-08-10T12:05:00.000Z",
      }),
      comment({
        id: "old-root",
        ig_comment_id: "ig-old",
        text: "thread antiga",
        status: "replied",
        created_at: "2026-08-10T09:00:00.000Z",
      }),
      comment({
        id: "old-reply",
        ig_comment_id: "ig-old-reply",
        parent_ig_comment_id: "ig-old",
        text: "resposta antiga",
        status: "replied",
        created_at: "2026-08-10T09:30:00.000Z",
      }),
    ]),
    "activity_desc",
  );

  const collapsed = defaultCollapsedThreadIds(groups);
  assert.equal(collapsed.has("hot-root"), true);
  assert.equal(collapsed.has("old-root"), true);
});

test("defaultCollapsedThreadIds ignores single-comment threads", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "solo-root",
      ig_comment_id: "ig-solo",
      text: "sozinho",
      status: "pending",
      created_at: "2026-08-10T12:00:00.000Z",
    }),
  ]);

  const collapsed = defaultCollapsedThreadIds(groups);
  assert.equal(collapsed.size, 0);
});

test("defaultCollapsedThreadIds collapses threads with pending comments too", () => {
  const groups = sortCommentThreadGroups(
    buildCommentThreadGroups([
      comment({
        id: "hot-root",
        ig_comment_id: "ig-hot",
        text: "thread ativa",
        status: "replied",
        created_at: "2026-08-10T12:00:00.000Z",
      }),
      comment({
        id: "pending-root",
        ig_comment_id: "ig-pending",
        text: "thread com pendência",
        status: "replied",
        created_at: "2026-08-10T11:00:00.000Z",
      }),
      comment({
        id: "pending-reply",
        ig_comment_id: "ig-pending-reply",
        parent_ig_comment_id: "ig-pending",
        text: "pendente",
        status: "pending",
        created_at: "2026-08-10T11:30:00.000Z",
      }),
    ]),
    "activity_desc",
  );

  const collapsed = defaultCollapsedThreadIds(groups);
  assert.equal(collapsed.has("pending-root"), true);
});

test("buildCommentThreadGroups deduplicates comments by id and ig_comment_id", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "root",
      ig_comment_id: "ig-root",
      text: "raiz",
      status: "replied",
      created_at: "2026-08-10T10:00:00.000Z",
    }),
    comment({
      id: "reply",
      ig_comment_id: "ig-reply",
      parent_ig_comment_id: "ig-root",
      text: "resposta",
      status: "replied",
      created_at: "2026-08-10T10:30:00.000Z",
    }),
    comment({
      id: "reply",
      ig_comment_id: "ig-reply",
      parent_ig_comment_id: "ig-root",
      text: "resposta duplicada",
      status: "replied",
      created_at: "2026-08-10T10:30:00.000Z",
    }),
  ]);

  assert.equal(groups[0]?.replies.length, 1);
});

test("shouldShowLinkedReply hides inline reply when brand comment is already synced", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "user",
      ig_comment_id: "ig-user",
      author_username: "fan",
      text: "pergunta",
      status: "replied",
      created_at: "2026-08-10T10:00:00.000Z",
      linked_reply_text: "resposta da marca",
      linked_reply_ig_comment_id: null,
    }),
    comment({
      id: "brand",
      ig_comment_id: "ig-brand",
      parent_ig_comment_id: "ig-user",
      author_username: "colabcolibri",
      text: "resposta da marca",
      status: "replied",
      created_at: "2026-08-10T10:05:00.000Z",
    }),
  ]);

  const group = groups[0]!;
  assert.equal(shouldShowLinkedReply(group.root, group, "colabcolibri"), false);
});

test("findThreadGroupContainingComment locates root and reply comments", () => {
  const groups = buildCommentThreadGroups([
    comment({
      id: "root",
      ig_comment_id: "ig-root",
      text: "raiz",
      status: "pending",
    }),
    comment({
      id: "reply",
      ig_comment_id: "ig-reply",
      parent_ig_comment_id: "ig-root",
      text: "resposta",
      status: "pending",
    }),
  ]);

  assert.equal(findThreadGroupContainingComment(groups, "root")?.root.id, "root");
  assert.equal(findThreadGroupContainingComment(groups, "reply")?.root.id, "root");
  assert.equal(findThreadGroupContainingComment(groups, "missing"), null);
});

test("commentTimeMs prefers ig_timestamp over created_at for ordering", () => {
  const olderCreated = comment({
    id: "a",
    text: "a",
    status: "replied",
    created_at: "2026-08-10T12:00:00.000Z",
    ig_timestamp: "2026-08-10T09:00:00+0000",
  });
  const newerCreated = comment({
    id: "b",
    text: "b",
    status: "replied",
    created_at: "2026-08-10T08:00:00.000Z",
    ig_timestamp: "2026-08-10T11:00:00+0000",
  });

  assert.ok(commentTimeMs(olderCreated) < commentTimeMs(newerCreated));
});
