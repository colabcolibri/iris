import type { Asset, Comment, Post } from "@/lib/types";
import {
  getDemoAssets,
  getDemoPostInsights,
  getDemoPosts,
} from "@/demo/fixtures/posts";
import {
  buildDemoComments,
  buildDemoCommentsInbox,
} from "@/demo/fixtures/build-demo-comments";
import {
  DEMO_AGENT_CONTENT,
  DEMO_AGENT_RUN_DETAILS,
  DEMO_AGENT_RUNS,
  DEMO_APP_SETTINGS,
  DEMO_LLM_SETTINGS,
  DEMO_MCP_SETTINGS,
  DEMO_META_STATUS,
  DEMO_REPLY_PERSONA,
  DEMO_WEBHOOK_EVENTS,
} from "@/demo/fixtures/settings";
import {
  listDemoCommentPosts,
} from "@/demo/domain/managed-posts";
import type { CommentPostSummary } from "@/lib/types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

type DemoState = {
  posts: Post[];
  assets: Record<string, Asset[]>;
  comments: Record<string, Comment[]>;
  appSettings: typeof DEMO_APP_SETTINGS;
  replyPersona: typeof DEMO_REPLY_PERSONA;
  agentContent: typeof DEMO_AGENT_CONTENT;
  llmSettings: typeof DEMO_LLM_SETTINGS;
  mcpSettings: typeof DEMO_MCP_SETTINGS;
  metaStatus: typeof DEMO_META_STATUS;
  webhooks: typeof DEMO_WEBHOOK_EVENTS;
  agentRuns: typeof DEMO_AGENT_RUNS;
  agentRunDetails: typeof DEMO_AGENT_RUN_DETAILS;
  postInsights: ReturnType<typeof getDemoPostInsights>;
};

let state: DemoState | null = null;

function createInitialState(): DemoState {
  const referenceDate = new Date();
  const posts = getDemoPosts(referenceDate);
  const comments = buildDemoComments(posts, referenceDate);
  return {
    posts: clone(posts),
    assets: clone(getDemoAssets(referenceDate)),
    comments: clone(comments),
    appSettings: clone(DEMO_APP_SETTINGS),
    replyPersona: clone(DEMO_REPLY_PERSONA),
    agentContent: clone(DEMO_AGENT_CONTENT),
    llmSettings: clone(DEMO_LLM_SETTINGS),
    mcpSettings: clone(DEMO_MCP_SETTINGS),
    metaStatus: clone(DEMO_META_STATUS),
    webhooks: clone(DEMO_WEBHOOK_EVENTS),
    agentRuns: clone(DEMO_AGENT_RUNS),
    agentRunDetails: clone(DEMO_AGENT_RUN_DETAILS),
    postInsights: clone(getDemoPostInsights(referenceDate)),
  };
}

export function getDemoState(): DemoState {
  if (!state) {
    state = createInitialState();
  }
  return state;
}

export function getDemoCommentPosts(): CommentPostSummary[] {
  const current = getDemoState();
  return listDemoCommentPosts(current.posts, current.comments, current.assets);
}

export function getDemoCommentsInbox() {
  const current = getDemoState();
  return buildDemoCommentsInbox(
    current.comments,
    current.posts,
    new Date(),
  );
}

export function findDemoPost(postId: string): Post | undefined {
  return getDemoState().posts.find((post) => post.id === postId);
}

export function findDemoComment(commentId: string): Comment | undefined {
  for (const comments of Object.values(getDemoState().comments)) {
    const found = comments.find((comment) => comment.id === commentId);
    if (found) return found;
  }
  return undefined;
}
