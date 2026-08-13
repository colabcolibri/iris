import { showDemoToast } from "@/demo/demo-mode-context";
import {
  findDemoComment,
  findDemoConversation,
  findDemoMessage,
  findDemoPost,
  getDemoCommentPosts,
  getDemoCommentsInbox,
  getDemoState,
} from "@/demo/demo-state";
import { buildDemoMessageActivity, DEMO_MESSAGE_REPLY_AUDIT } from "@/demo/fixtures/messages";
import { demoSimulateWithDelay } from "@/demo/fixtures/simulator";
import type { SimulateRequestBody } from "@/demo/fixtures/simulator";
import { demoAssetImageUrl } from "@/demo/demo-images";
import { buildDemoCommentActivity } from "@/demo/fixtures/build-demo-comments";
import type { Asset, Post, UpdatePostBody } from "@/lib/types";

const LATENCY_MS = 120;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS);
  });
}

function splitPath(path: string) {
  const [pathname, query = ""] = path.split("?");
  return { pathname, searchParams: new URLSearchParams(query) };
}

function matchPath(pathname: string, pattern: string): string[] | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: string[] = [];
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i]!;
    const value = pathParts[i]!;
    if (part.startsWith(":")) {
      params.push(value);
    } else if (part !== value) {
      return null;
    }
  }
  return params;
}

function postEditorialDate(post: Post, calendarOnly: boolean): string | null {
  if (calendarOnly) {
    return post.published_at ?? post.scheduled_at ?? null;
  }
  return post.scheduled_at ?? post.created_at ?? null;
}

function filterPosts(searchParams: URLSearchParams) {
  const state = getDemoState();
  let posts = [...state.posts];
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const calendarOnly = searchParams.get("calendar_only") === "1";

  if (status) {
    posts = posts.filter((post) => post.status === status);
  }

  if (calendarOnly) {
    posts = posts.filter((post) => {
      if (post.status === "draft" || post.status === "cancelled") return false;
      return postEditorialDate(post, true) != null;
    });
  }

  if (from) {
    posts = posts.filter((post) => {
      const editorialDate = postEditorialDate(post, calendarOnly);
      return editorialDate != null && editorialDate >= from;
    });
  }

  if (to) {
    posts = posts.filter((post) => {
      const editorialDate = postEditorialDate(post, calendarOnly);
      return editorialDate != null && editorialDate <= to;
    });
  }

  return posts;
}

function parseJsonBody(options: RequestInit): unknown {
  if (!options.body || options.body instanceof FormData) {
    return {};
  }
  try {
    return JSON.parse(String(options.body));
  } catch {
    return {};
  }
}

function noopMutation<T>(value: T): Promise<T> {
  showDemoToast();
  return delay(value);
}

async function handleGet(pathname: string, searchParams: URLSearchParams) {
  const state = getDemoState();

  if (pathname === "/api/posts") {
    return { posts: filterPosts(searchParams) };
  }

  const postMatch = matchPath(pathname, "/api/posts/:id");
  if (postMatch) {
    const post = findDemoPost(postMatch[0]!);
    if (!post) throw new Error("Post não encontrado (demo)");
    return post;
  }

  const assetsMatch = matchPath(pathname, "/api/posts/:id/assets");
  if (assetsMatch) {
    return { assets: state.assets[assetsMatch[0]!] ?? [] };
  }

  const insightsMatch = matchPath(pathname, "/api/posts/:id/insights");
  if (insightsMatch) {
    const postId = insightsMatch[0]!;
    const cached =
      state.postInsights[postId as keyof typeof state.postInsights];
    if (cached) return cached;
    return {
      ok: false,
      code: "no_insights",
      message: "Sem insights nesta demonstração.",
    };
  }

  const commentsMatch = matchPath(pathname, "/api/posts/:id/comments");
  if (commentsMatch) {
    return { comments: state.comments[commentsMatch[0]!] ?? [] };
  }

  if (pathname === "/api/comments/posts") {
    return { posts: getDemoCommentPosts() };
  }

  if (pathname === "/api/comments/inbox") {
    return getDemoCommentsInbox();
  }

  if (pathname.startsWith("/api/comments/activity")) {
    const kind = searchParams.get("kind") ?? "pending_approval";
    const items = buildDemoCommentActivity(state.comments, state.posts);
    return {
      kind,
      items: kind === "pending_approval" ? items : items.slice(0, 1),
    };
  }

  const replyAuditMatch = matchPath(pathname, "/api/comments/:id/reply-audit");
  if (replyAuditMatch) {
    const detail = state.agentRunDetails["demo-run-1"];
    return detail?.audit ?? null;
  }

  if (pathname === "/api/meta/status") {
    return state.metaStatus;
  }

  if (pathname === "/api/meta/health") {
    return { ok: true, message: "Conexão demo OK." };
  }

  if (pathname === "/api/settings/app") {
    return state.appSettings;
  }

  if (pathname === "/api/settings/reply-persona") {
    return state.replyPersona;
  }

  if (pathname === "/api/settings/agent-content") {
    return state.agentContent;
  }

  if (pathname === "/api/settings/message-agent-content") {
    return state.messageAgentContent;
  }

  if (pathname === "/api/conversations") {
    return { conversations: state.conversations };
  }

  const conversationMessagesMatch = matchPath(
    pathname,
    "/api/conversations/:id/messages",
  );
  if (conversationMessagesMatch) {
    const conversation = findDemoConversation(conversationMessagesMatch[0]!);
    if (!conversation) throw new Error("Conversa não encontrada (demo)");
    return {
      conversation,
      messages: state.messages[conversation.id] ?? [],
    };
  }

  if (pathname === "/api/conversations/activity") {
    const kind = searchParams.get("kind") ?? "pending_approval";
    const items = buildDemoMessageActivity();
    return {
      kind,
      items: kind === "pending_approval" ? items : items.slice(0, 1),
    };
  }

  const conversationPatchMatch = matchPath(pathname, "/api/conversations/:id");
  if (conversationPatchMatch && !pathname.endsWith("/messages") && !pathname.endsWith("/sync")) {
    const conversation = findDemoConversation(conversationPatchMatch[0]!);
    if (!conversation) throw new Error("Conversa não encontrada (demo)");
    return conversation;
  }

  if (pathname === "/api/products") {
    return { products: state.products };
  }

  const messageReplyAuditMatch = matchPath(
    pathname,
    "/api/messages/:id/reply-audit",
  );
  if (messageReplyAuditMatch) {
    return DEMO_MESSAGE_REPLY_AUDIT;
  }

  const messageReplyContextMatch = matchPath(
    pathname,
    "/api/messages/:id/reply-context",
  );
  if (messageReplyContextMatch) {
    const message = findDemoMessage(messageReplyContextMatch[0]!);
    const conversation = message
      ? findDemoConversation(message.conversation_id)
      : undefined;
    return {
      message,
      conversation,
      products: state.products.filter((product) => product.active),
    };
  }

  if (pathname === "/api/settings/llm") {
    return state.llmSettings;
  }

  if (pathname === "/api/settings/mcp") {
    return state.mcpSettings;
  }

  if (pathname === "/api/settings/webhook-events") {
    return { events: state.webhooks };
  }

  if (pathname === "/api/agent-runs") {
    return { items: state.agentRuns, next_cursor: null };
  }

  const historyMatch = matchPath(pathname, "/api/posts/:id/insights/history");
  if (historyMatch) {
    return {
      post_id: historyMatch[0]!,
      ig_media_id: "17890005556667788",
      snapshots: [],
    };
  }

  const inspectionMatch = matchPath(pathname, "/api/posts/:id/reply-inspection");
  if (inspectionMatch) {
    return {
      post_context: {
        caption_truncated: "Carrossel · lookbook verão nômade",
        assets: [],
      },
      comments: [],
      auto_reply_enabled: true,
    };
  }

  const runMatch = matchPath(pathname, "/api/agent-runs/:id");
  if (runMatch) {
    const detail = state.agentRunDetails[runMatch[0]!];
    if (!detail) throw new Error("Execução não encontrada (demo)");
    return detail;
  }

  throw new Error(`Demo: rota GET não mockada (${pathname})`);
}

async function handleMutation(
  method: string,
  pathname: string,
  options: RequestInit,
) {
  const state = getDemoState();
  const body = parseJsonBody(options) as Record<string, unknown>;

  if (method === "POST" && pathname === "/api/agent/simulate") {
    return demoSimulateWithDelay(body as SimulateRequestBody);
  }

  const postPublishMatch = matchPath(pathname, "/api/posts/:id/publish");
  if (postPublishMatch && method === "POST") {
    const post = findDemoPost(postPublishMatch[0]!);
    if (post) {
      post.status = "published";
      post.published_at = new Date().toISOString();
    }
    return noopMutation(post ?? { ok: true });
  }

  const postMatch = matchPath(pathname, "/api/posts/:id");
  if (postMatch) {
    const post = findDemoPost(postMatch[0]!);
    if (!post) throw new Error("Post não encontrado (demo)");

    if (method === "PATCH") {
      Object.assign(post, body as UpdatePostBody);
      post.updated_at = new Date().toISOString();
      return noopMutation(post);
    }

    if (method === "DELETE") {
      post.status = "cancelled";
      return noopMutation(post);
    }
  }

  if (method === "POST" && pathname === "/api/posts") {
    const newPost: Post = {
      id: `demo-post-${Date.now()}`,
      caption: String(body.caption ?? ""),
      channel: "instagram",
      status: "draft",
      scheduled_at: null,
      published_at: null,
      created_at: new Date().toISOString(),
      assets_count: 0,
    };
    state.posts.unshift(newPost);
    return noopMutation(newPost);
  }

  if (method === "POST" && pathname.match(/^\/api\/posts\/[^/]+\/assets$/)) {
    const [, , , postId] = pathname.split("/");
    const form = options.body as FormData;
    const file = form?.get("file");
    const sortOrder = Number(form?.get("sort_order") ?? 1);
    const previewUrl =
      file instanceof File
        ? URL.createObjectURL(file)
        : demoAssetImageUrl(postId!, "upload.jpg", 1080, 1350);
    const asset: Asset = {
      id: `demo-asset-${Date.now()}`,
      post_id: postId!,
      sort_order: sortOrder,
      storage_path: `${postId}/upload.jpg`,
      original_filename: file instanceof File ? file.name : "upload.jpg",
      mime: file instanceof File ? file.type : "image/jpeg",
      width: 1080,
      height: 1350,
    };
    state.assets[postId!] = [...(state.assets[postId!] ?? []), asset];
    const post = findDemoPost(postId!);
    if (post) post.assets_count = (state.assets[postId!] ?? []).length;
    void previewUrl;
    return noopMutation(asset);
  }

  const commentAiMatch = matchPath(pathname, "/api/comments/:id/ai-reply");
  if (commentAiMatch && method === "POST") {
    const comment = findDemoComment(commentAiMatch[0]!);
    if (comment) {
      comment.draft_text =
        "Rascunho gerado na demonstração — personalize antes de publicar.";
      comment.draft_status = "draft";
      comment.status = "pending";
    }
    return noopMutation(comment ?? { ok: true });
  }

  const commentReplyMatch = matchPath(pathname, "/api/comments/:id/reply");
  if (commentReplyMatch && method === "POST") {
    const comment = findDemoComment(commentReplyMatch[0]!);
    if (comment) {
      comment.status = "replied";
      comment.linked_reply_text = String(body.message ?? comment.draft_text ?? "");
    }
    return noopMutation(comment ?? { ok: true });
  }

  if (method === "PUT" && pathname === "/api/settings/app") {
    state.appSettings = {
      ...state.appSettings,
      ...(body as Partial<typeof state.appSettings>),
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.appSettings });
  }

  if (method === "PUT" && pathname === "/api/settings/llm") {
    state.llmSettings = {
      ...state.llmSettings,
      ...(body as Partial<typeof state.llmSettings>),
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.llmSettings });
  }

  if (method === "PUT" && pathname === "/api/settings/reply-persona") {
    state.replyPersona = {
      ...state.replyPersona,
      ...(body as Partial<typeof state.replyPersona>),
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.replyPersona });
  }

  if (method === "PUT" && pathname === "/api/settings/agent-content") {
    state.agentContent = {
      ...state.agentContent,
      ...(body as Partial<typeof state.agentContent>),
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.agentContent });
  }

  if (method === "PUT" && pathname === "/api/settings/message-agent-content") {
    state.messageAgentContent = {
      ...state.messageAgentContent,
      ...(body as Partial<typeof state.messageAgentContent>),
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.messageAgentContent });
  }

  const conversationSyncMatch = matchPath(
    pathname,
    "/api/conversations/:id/sync",
  );
  if (conversationSyncMatch && method === "POST") {
    return noopMutation({
      conversation: findDemoConversation(conversationSyncMatch[0]!),
      synced: (state.messages[conversationSyncMatch[0]!] ?? []).length,
    });
  }

  if (method === "POST" && pathname === "/api/conversations/sync") {
    return noopMutation({ synced: state.conversations.length });
  }

  const conversationPatchMatch = matchPath(pathname, "/api/conversations/:id");
  if (conversationPatchMatch && method === "PATCH") {
    const conversation = findDemoConversation(conversationPatchMatch[0]!);
    if (conversation) {
      Object.assign(conversation, body);
      conversation.updated_at = new Date().toISOString();
    }
    return noopMutation(conversation ?? { ok: true });
  }

  const messageApproveMatch = matchPath(pathname, "/api/messages/:id/approve-reply");
  if (messageApproveMatch && method === "POST") {
    const message = findDemoMessage(messageApproveMatch[0]!);
    if (message) {
      message.status = "replied";
      message.linked_reply_text = message.draft_text ?? message.text;
      message.draft_status = null;
    }
    return noopMutation(message ?? { ok: true });
  }

  const messageAiMatch = matchPath(pathname, "/api/messages/:id/ai-reply");
  if (messageAiMatch && method === "POST") {
    const message = findDemoMessage(messageAiMatch[0]!);
    if (message) {
      message.draft_text =
        "Rascunho DM gerado na demonstração — revise antes de enviar.";
      message.draft_status = "draft";
      message.status = "pending";
    }
    return noopMutation(message ?? { ok: true });
  }

  const messageDraftMatch = matchPath(pathname, "/api/messages/:id/draft");
  if (messageDraftMatch) {
    const message = findDemoMessage(messageDraftMatch[0]!);
    if (message) {
      if (method === "DELETE") {
        message.draft_text = null;
        message.draft_status = null;
      } else if (method === "PATCH") {
        message.draft_text = String(body.draft_text ?? "");
        message.draft_status = "draft";
      }
    }
    return noopMutation(message ?? { ok: true });
  }

  const messageReplyMatch = matchPath(pathname, "/api/messages/:id/reply");
  if (messageReplyMatch && method === "POST") {
    const message = findDemoMessage(messageReplyMatch[0]!);
    if (message) {
      message.status = "replied";
      message.linked_reply_text = String(body.text ?? message.draft_text ?? "");
      message.draft_text = null;
      message.draft_status = null;
    }
    return noopMutation(message ?? { ok: true });
  }

  if (method === "POST" && pathname === "/api/products") {
    const product = {
      id: `demo-product-${Date.now()}`,
      slug: String(body.slug ?? "novo-produto"),
      name: String(body.name ?? "Novo produto"),
      short_description: String(body.short_description ?? ""),
      long_description: String(body.long_description ?? ""),
      active: body.active !== false,
      sort_order: Number(body.sort_order ?? state.products.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.products.push(product);
    return noopMutation(product);
  }

  const productMatch = matchPath(pathname, "/api/products/:id");
  if (productMatch) {
    const product = state.products.find((item) => item.id === productMatch[0]);
    if (!product) throw new Error("Produto não encontrado (demo)");
    if (method === "PATCH") {
      Object.assign(product, body);
      product.updated_at = new Date().toISOString();
      return noopMutation(product);
    }
    if (method === "DELETE") {
      state.products = state.products.filter((item) => item.id !== product.id);
      return noopMutation({ ok: true });
    }
  }

  if (method === "POST" && pathname === "/api/settings/mcp") {
    return noopMutation({
      connection_code: "demo_connection_code",
      code_hint: "demo_••••••••",
      mcp_path: "/mcp",
      mcp_url: `${state.mcpSettings.mcp_url}`,
      updated_at: new Date().toISOString(),
    });
  }

  if (method === "DELETE" && pathname === "/api/settings/mcp") {
    state.mcpSettings = {
      ...state.mcpSettings,
      configured: false,
      code_hint: null,
      updated_at: new Date().toISOString(),
    };
    return noopMutation({ ...state.mcpSettings });
  }

  if (method === "POST" && pathname === "/api/insights/refresh-all") {
    const publishedIds = state.posts
      .filter((post) => post.status === "published" || post.status === "monitored")
      .map((post) => post.id);
    return noopMutation({
      requested: publishedIds.length,
      refreshed: publishedIds.slice(0, 8),
      failed: [],
      skipped: publishedIds.slice(8),
      delay_ms: Number(body.delay_ms ?? 750),
    });
  }

  const carouselSummaryMatch = matchPath(
    pathname,
    "/api/posts/:id/generate-carousel-summary",
  );
  if (carouselSummaryMatch && method === "POST") {
    return noopMutation({
      carousel_summary:
        "Resumo gerado na demonstração — slides do carrossel fictício.",
    });
  }

  if (
    pathname.startsWith("/api/meta/") ||
    (pathname.includes("/comments/") && method !== "GET")
  ) {
    return noopMutation({ ok: true });
  }

  return noopMutation({ ok: true });
}

export async function demoApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const { pathname, searchParams } = splitPath(path);

  if (method === "GET") {
    return delay(await handleGet(pathname, searchParams)) as T;
  }

  if (method === "DELETE" && !options.body) {
    const result = await handleMutation(method, pathname, options);
    if (result === null) return null as T;
    return result as T;
  }

  return (await handleMutation(method, pathname, options)) as T;
}

export async function demoFetchAssetBlob(
  postId: string,
  filename: string,
): Promise<Blob> {
  const state = getDemoState();
  const assets = state.assets[postId] ?? [];
  const asset = assets.find(
    (item) =>
      item.storage_path === `${postId}/${filename}` ||
      item.storage_path.endsWith(`/${filename}`),
  );
  const width = asset?.width ?? 1080;
  const height = asset?.height ?? 1350;
  const url = demoAssetImageUrl(postId, filename, width, height);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Falha ao carregar mídia demo");
  }
  return response.blob();
}
