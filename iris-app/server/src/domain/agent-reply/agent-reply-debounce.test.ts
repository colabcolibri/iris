import { test } from "node:test";
import assert from "node:assert/strict";
import type { Comment } from "../comments/comment.ts";
import type { Message } from "../messages/message.ts";
import {
  AGENT_REPLY_DEBOUNCE_MIN_SECONDS,
  computeAgentReplyDebounceNotBefore,
  isOlderMessage,
  normalizeAgentReplyDebounceSeconds,
  pickLatestPendingCommentPerAuthorOnPost,
  pickLatestPendingMessagePerConversation,
} from "./agent-reply-debounce.ts";

test("normalizeAgentReplyDebounceSeconds enforces 1 min floor and 60 min ceiling", () => {
  assert.equal(normalizeAgentReplyDebounceSeconds(0), 60);
  assert.equal(normalizeAgentReplyDebounceSeconds(30), 60);
  assert.equal(normalizeAgentReplyDebounceSeconds(90), 90);
  assert.equal(normalizeAgentReplyDebounceSeconds(5000), 3600);
});

test("computeAgentReplyDebounceNotBefore waits debounce window in seconds", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");
  const notBefore = computeAgentReplyDebounceNotBefore(now, 120);
  assert.equal(notBefore, "2026-08-14T12:02:00.000Z");
});

test("pickLatestPendingMessagePerConversation keeps newest inbound per conversation", () => {
  const older: Message = {
    id: "m1",
    conversationId: "c1",
    direction: "inbound",
    status: "pending",
    igTimestamp: "2026-08-14T10:00:00.000Z",
    createdAt: "2026-08-14T10:00:00.000Z",
  } as Message;
  const newer: Message = {
    id: "m2",
    conversationId: "c1",
    direction: "inbound",
    status: "pending",
    igTimestamp: "2026-08-14T10:01:00.000Z",
    createdAt: "2026-08-14T10:01:00.000Z",
  } as Message;

  assert.equal(isOlderMessage(older, newer), true);
  assert.deepEqual(
    pickLatestPendingMessagePerConversation([older, newer]).map((item) => item.id),
    ["m2"],
  );
});

test("pickLatestPendingCommentPerAuthorOnPost groups by author on same post", () => {
  const older: Comment = {
    id: "c1",
    postId: "p1",
    authorUsername: "ana",
    status: "pending",
    igTimestamp: "2026-08-14T10:00:00.000Z",
    createdAt: "2026-08-14T10:00:00.000Z",
  } as Comment;
  const newer: Comment = {
    id: "c2",
    postId: "p1",
    authorUsername: "ana",
    status: "pending",
    igTimestamp: "2026-08-14T10:01:00.000Z",
    createdAt: "2026-08-14T10:01:00.000Z",
  } as Comment;
  const otherAuthor: Comment = {
    id: "c3",
    postId: "p1",
    authorUsername: "bob",
    status: "pending",
    igTimestamp: "2026-08-14T10:00:30.000Z",
    createdAt: "2026-08-14T10:00:30.000Z",
  } as Comment;

  const picked = pickLatestPendingCommentPerAuthorOnPost([older, newer, otherAuthor]);
  assert.deepEqual(
    picked.map((item) => item.id).sort(),
    ["c2", "c3"],
  );
});
