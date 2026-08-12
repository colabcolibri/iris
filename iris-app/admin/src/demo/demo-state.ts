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
  getDemoAgentContent,
  getDemoReplyPersona,
} from "@/demo/fixtures/persona";
import {
  DEMO_APP_SETTINGS,
  DEMO_LLM_SETTINGS,
  DEMO_MCP_SETTINGS,
  DEMO_META_STATUS,
  getDemoAgentRunDetails,
  getDemoAgentRuns,
  getDemoWebhookEvents,
} from "@/demo/fixtures/settings";
import { listDemoCommentPosts } from "@/demo/domain/managed-posts";
import type { CommentPostSummary } from "@/lib/types";
import {
  DEFAULT_DEMO_LOCALE,
  readStoredDemoLocale,
  type DemoLocale,
} from "@/demo/locale";

function clone<T>(value: T): T {
  return structuredClone(value);
}

type DemoState = {
  locale: DemoLocale;
  posts: Post[];
  assets: Record<string, Asset[]>;
  comments: Record<string, Comment[]>;
  appSettings: typeof DEMO_APP_SETTINGS;
  replyPersona: ReturnType<typeof getDemoReplyPersona>;
  agentContent: ReturnType<typeof getDemoAgentContent>;
  llmSettings: typeof DEMO_LLM_SETTINGS;
  mcpSettings: typeof DEMO_MCP_SETTINGS;
  metaStatus: typeof DEMO_META_STATUS;
  webhooks: ReturnType<typeof getDemoWebhookEvents>;
  agentRuns: ReturnType<typeof getDemoAgentRuns>;
  agentRunDetails: ReturnType<typeof getDemoAgentRunDetails>;
  postInsights: ReturnType<typeof getDemoPostInsights>;
};

let activeLocale: DemoLocale =
  typeof window !== "undefined"
    ? readStoredDemoLocale()
    : DEFAULT_DEMO_LOCALE;

let state: DemoState | null = null;

export function getActiveDemoLocale(): DemoLocale {
  return activeLocale;
}

export function setActiveDemoLocale(locale: DemoLocale) {
  activeLocale = locale;
}

export function resetDemoState() {
  state = null;
}

function createInitialState(locale: DemoLocale): DemoState {
  const referenceDate = new Date();
  const posts = getDemoPosts(referenceDate, locale);
  const comments = buildDemoComments(posts, referenceDate, locale);
  return {
    locale,
    posts: clone(posts),
    assets: clone(getDemoAssets(referenceDate, locale)),
    comments: clone(comments),
    appSettings: clone(DEMO_APP_SETTINGS),
    replyPersona: clone(getDemoReplyPersona(locale)),
    agentContent: clone(getDemoAgentContent(locale)),
    llmSettings: clone(DEMO_LLM_SETTINGS),
    mcpSettings: clone(DEMO_MCP_SETTINGS),
    metaStatus: clone(DEMO_META_STATUS),
    webhooks: clone(getDemoWebhookEvents(locale)),
    agentRuns: clone(getDemoAgentRuns(locale)),
    agentRunDetails: clone(getDemoAgentRunDetails(locale)),
    postInsights: clone(getDemoPostInsights(referenceDate, locale)),
  };
}

export function getDemoState(): DemoState {
  if (!state || state.locale !== activeLocale) {
    state = createInitialState(activeLocale);
  }
  return state;
}

export function getDemoCommentPosts(): CommentPostSummary[] {
  const current = getDemoState();
  return listDemoCommentPosts(current.posts, current.comments, current.assets);
}

export function getDemoCommentsInbox() {
  const current = getDemoState();
  return buildDemoCommentsInbox(current.comments, current.posts, new Date());
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
