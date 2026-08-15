import { test } from "node:test";
import assert from "node:assert/strict";
import type { Post } from "./post.ts";
import {
  isPostWithinAgentActiveWindow,
  resolveAgentActiveDaysRemaining,
  resolvePostAgentActiveUntil,
} from "./post-agent-active.ts";

function basePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "p1",
    status: "published",
    channel: "instagram",
    caption: null,
    collaborators: [],
    carouselSummary: null,
    scheduledAt: null,
    publishedAt: "2026-08-01T12:00:00.000Z",
    igMediaId: "m1",
    igMediaStatus: null,
    igMediaStatusDetail: null,
    igMediaStatusCheckedAt: null,
    sourceNote: null,
    errorMessage: null,
    autoReplyEnabled: true,
    replyMode: "auto",
    agentActiveDays: 7,
    privateReplyMode: "inherit",
    replyPrompt: null,
    silenceSoul: false,
    silencePage: false,
    silenceKnowledge: false,
    silenceRestrictions: false,
    likeCount: null,
    reportedCommentsCount: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

test("resolvePostAgentActiveUntil returns null when agent_active_days unset", () => {
  assert.equal(resolvePostAgentActiveUntil(basePost({ agentActiveDays: null })), null);
});

test("isPostWithinAgentActiveWindow respects published_at plus days", () => {
  const post = basePost({ agentActiveDays: 7 });
  assert.equal(
    isPostWithinAgentActiveWindow(post, new Date("2026-08-05T12:00:00.000Z")),
    true,
  );
  assert.equal(
    isPostWithinAgentActiveWindow(post, new Date("2026-08-10T12:00:00.000Z")),
    false,
  );
});

test("resolveAgentActiveDaysRemaining counts days until campaign end", () => {
  const post = basePost({ agentActiveDays: 7 });
  assert.equal(
    resolveAgentActiveDaysRemaining(post, new Date("2026-08-05T12:00:00.000Z")),
    3,
  );
  assert.equal(
    resolveAgentActiveDaysRemaining(post, new Date("2026-08-10T12:00:00.000Z")),
    0,
  );
});
