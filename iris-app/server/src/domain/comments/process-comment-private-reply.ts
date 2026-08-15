import type { AppContext } from "../../api/app-context.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MetaMessageSender } from "../../ports/meta-message-sender.ts";
import type { Comment } from "./comment.ts";
import type { Post } from "../posts/post.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import { assembleReplyContext } from "../reply-context/reply-context-assembler.ts";
import { getAgentContentOrDefault } from "../settings/agent-content-defaults.ts";
import { filterAgentContentForPost } from "../reply-harness/filter-agent-content-for-post.ts";
import { runPrivateReplyDraft } from "../reply-harness/private-reply-draft.ts";
import {
  resolveEffectiveReplyMode,
  type ReplyMode,
} from "../posts/reply-mode.ts";
import {
  resolveEffectivePrivateReplyMode,
  shouldSchedulePrivateReply,
} from "../posts/private-reply-mode.ts";
import {
  buildPrivateReplyWindowExpiredMessage,
  isCommentWithinPrivateReplyWindow,
} from "./comment-private-reply-window.ts";
import { isPostWithinAgentActiveWindow } from "../posts/post-agent-active.ts";
import { commentReplyLimiter } from "./comment-reply-limiter.ts";

export type ProcessCommentPrivateReplyOptions = {
  trigger: "worker" | "webhook" | "manual";
  llmCompleter?: LlmCompleter | null;
  metaMessageSender?: MetaMessageSender;
};

function shouldDeferPrivateUntilPublicApproved(
  effectivePublicMode: ReplyMode,
  ctx: AppContext,
  commentId: string,
): boolean {
  if (effectivePublicMode !== "draft") {
    return false;
  }

  const publicDraft = ctx.comments.findLatestDraft(commentId, "public");
  const publicSent = ctx.comments.findLatestSentReply(commentId, "public");
  return Boolean(publicDraft && !publicSent);
}

async function processCommentPrivateReplyCore(
  ctx: AppContext,
  commentId: string,
  options: ProcessCommentPrivateReplyOptions,
  deps: {
    comment: Comment;
    post: Post;
    effectivePrivateMode: ReturnType<typeof resolveEffectivePrivateReplyMode>;
    effectivePublicMode: ReplyMode;
    llm: LlmCompleter;
    sender: MetaMessageSender | undefined;
  },
): Promise<boolean> {
  const { comment, post, effectivePrivateMode, effectivePublicMode, llm, sender } = deps;

  if (
    effectivePrivateMode === "auto" &&
    shouldDeferPrivateUntilPublicApproved(effectivePublicMode, ctx, commentId)
  ) {
    return false;
  }

  const context = await assembleReplyContext(commentId, ctx.replyContextAssembler);
  if (!context) {
    return false;
  }

  const agentContent = filterAgentContentForPost(
    getAgentContentOrDefault(ctx.agentContentStore),
    {
      silenceSoul: post.silenceSoul,
      silencePage: post.silencePage,
      silenceKnowledge: post.silenceKnowledge,
      silenceRestrictions: post.silenceRestrictions,
    },
  );

  const message = await runPrivateReplyDraft({
    context,
    agentContent,
    llm,
    maxChars: context.persona.maxChars ?? 500,
  });

  if (!message) {
    return false;
  }

  if (effectivePrivateMode === "draft") {
    ctx.comments.upsertDraft(commentId, message, { channel: "private" });
    notifyCommentsChanged({ post_id: comment.postId });
    return true;
  }

  if (!sender) {
    return false;
  }

  try {
    const publishResult = await sender.sendPrivateReplyToComment(
      comment.igCommentId,
      message,
    );

    ctx.comments.createReply({
      commentId,
      channel: "private",
      sentText: message,
      status: "sent",
      replyToIgCommentId: comment.igCommentId,
      publishedIgMessageId: publishResult.publishedIgMessageId,
    });
    notifyCommentsChanged({ post_id: comment.postId });
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "private reply failed";
    ctx.comments.createReply({
      commentId,
      channel: "private",
      sentText: "",
      status: "failed",
    });
    notifyCommentsChanged({ post_id: comment.postId });
    console.warn(`[private-reply] failed for ${commentId}: ${errorMessage}`);
    return false;
  }
}

export async function processCommentPrivateReply(
  ctx: AppContext,
  commentId: string,
  options: ProcessCommentPrivateReplyOptions = { trigger: "worker" },
): Promise<boolean> {
  const comment = ctx.comments.findById(commentId);
  if (!comment || comment.deletedAt) {
    return false;
  }

  if (ctx.comments.hasPrivateReplyRecord(commentId)) {
    return false;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const post = ctx.posts.findById(comment.postId);
  if (!post) {
    return false;
  }

  const effectivePrivateMode = resolveEffectivePrivateReplyMode(
    appSettings.privateReplyMode,
    post.privateReplyMode,
  );

  if (!shouldSchedulePrivateReply(effectivePrivateMode)) {
    return false;
  }

  const effectivePublicMode = resolveEffectiveReplyMode(
    appSettings.replyMode,
    post.replyMode,
  );

  if (!isPostWithinAgentActiveWindow(post)) {
    return false;
  }

  if (!isCommentWithinPrivateReplyWindow(comment)) {
    return false;
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  if (!llm) {
    return false;
  }

  const sender = options.metaMessageSender ?? ctx.metaMessageSender;

  return commentReplyLimiter.run(() =>
    processCommentPrivateReplyCore(ctx, commentId, options, {
      comment,
      post,
      effectivePrivateMode,
      effectivePublicMode,
      llm,
      sender,
    }),
  );
}
