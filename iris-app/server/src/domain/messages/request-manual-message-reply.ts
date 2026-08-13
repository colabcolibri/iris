import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MetaMessageSender } from "../../ports/meta-message-sender.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../meta/meta-readiness.ts";
import { processMessageReply } from "./process-message-reply.ts";

export type ManualMessageReplyMode = "auto" | "draft";

export type RequestManualMessageReplyOptions = {
  llmCompleter?: LlmCompleter | null;
  metaMessageSender?: MetaMessageSender;
};

export function validateManualMessageReply(
  ctx: AppContext,
  messageId: string,
  mode: ManualMessageReplyMode,
): string | null {
  const message = ctx.messages.findById(messageId);
  if (!message) {
    return "message not found";
  }

  if (message.direction !== "inbound") {
    return "only inbound messages can receive AI reply";
  }

  if (!ctx.resolveLlmCompleter()) {
    return "LLM is not configured";
  }

  if (mode === "draft") {
    if (message.status === "skipped") {
      return "message was skipped by automation";
    }
    return null;
  }

  if (message.status === "replied" || message.status === "skipped") {
    return "message already handled";
  }

  if (message.status !== "pending" && message.status !== "failed") {
    return "message cannot receive manual AI reply";
  }

  const sent = ctx.messageReplies.findLatestSentReply(messageId);
  if (sent?.sentText) {
    return "message already has a sent reply";
  }

  if (mode === "auto") {
    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      return metaReadinessMessage(readiness);
    }

    if (!ctx.metaMessageSender) {
      return "Meta message sender is not configured";
    }
  }

  return null;
}

export async function requestManualMessageReply(
  ctx: AppContext,
  messageId: string,
  mode: ManualMessageReplyMode,
  options: RequestManualMessageReplyOptions = {},
): Promise<boolean> {
  const validationError = validateManualMessageReply(ctx, messageId, mode);
  if (validationError) {
    throw new ValidationError(validationError);
  }

  const message = ctx.messages.findById(messageId);
  if (!message) {
    throw new ValidationError("message not found");
  }

  if (message.status === "failed") {
    ctx.messages.markPending(messageId);
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  if (!llm) {
    throw new ValidationError("LLM is not configured");
  }

  return processMessageReply(ctx, messageId, {
    trigger: "manual",
    replyModeOverride: mode,
    llmCompleter: llm,
    metaMessageSender: options.metaMessageSender,
  });
}
