import { randomUUID } from "node:crypto";
import type { AppContext } from "../../api/app-context.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MetaMessageSender } from "../../ports/meta-message-sender.ts";
import type { AgentRun } from "../../ports/agent-run-repository.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { notifyMessagesChanged } from "../../adapters/sse/event-bus.ts";
import { commentReplyLimiter } from "../comments/comment-reply-limiter.ts";
import {
  executeAndRecordMessageHarness,
  MessageHarnessExecutionError,
} from "../message-harness/execute-and-record-message-harness.ts";
import { assembleMessageReplyContext } from "../message-reply-context/message-reply-context-assembler.ts";
import { getMessageAgentContentOrDefault } from "../settings/message-agent-content-defaults.ts";
import type { ReplyMode } from "../posts/reply-mode.ts";
import {
  resolveEffectiveMessageReplyMode,
  shouldScheduleMessageReply,
} from "./message-reply-mode.ts";
import { assertCanReplyToConversation } from "./assert-can-reply-to-conversation.ts";

export type ProcessMessageReplyOptions = {
  trigger: "worker" | "webhook" | "manual";
  llmCompleter?: LlmCompleter | null;
  metaMessageSender?: MetaMessageSender;
  replyModeOverride?: Extract<ReplyMode, "auto" | "draft">;
};

function guardrailMessage(reason: string): string {
  return `[guardrail] ${reason}`.slice(0, 500);
}

async function processMessageReplyCore(
  ctx: AppContext,
  messageId: string,
  options: ProcessMessageReplyOptions,
  deps: {
    effectiveReplyMode: ReplyMode;
    llm: LlmCompleter;
    sender: MetaMessageSender | undefined;
  },
): Promise<boolean> {
  const { effectiveReplyMode, llm, sender } = deps;
  const message = ctx.messages.findById(messageId);
  if (!message) {
    return false;
  }

  const conversation = ctx.conversations.findById(message.conversationId);
  if (!conversation) {
    return false;
  }

  const context = await assembleMessageReplyContext(messageId, ctx.messageReplyContextAssembler);
  if (!context) {
    return false;
  }

  const agentContent = getMessageAgentContentOrDefault(ctx.messageAgentContentStore);
  const inputSummary = JSON.stringify({
    conversationId: conversation.id,
    participant: conversation.participantUsername,
    textPreview: message.text?.slice(0, 200) ?? null,
  });

  let run: AgentRun | null = null;
  let harnessApproved = false;

  try {
    const recorded = await executeAndRecordMessageHarness(
      { agentRuns: ctx.agentRuns, agentRunSteps: ctx.agentRunSteps },
      {
        trigger: options.trigger,
        messageId,
        inputSummary,
        harnessInput: {
          context,
          agentContent,
          llm,
          maxChars: context.persona.maxChars,
        },
      },
    );
    run = recorded.run;
    const harnessResult = recorded.harness;

    if (harnessResult.terminalStatus === "blocked_harmful") {
      const reason = harnessResult.steps[0]?.reason ?? "blocked";
      if (message.status !== "replied") {
        ctx.messages.markSkipped(messageId, guardrailMessage(reason));
      }
      notifyMessagesChanged({ conversation_id: conversation.id });
      return false;
    }

    if (harnessResult.terminalStatus === "rejected_verify" || !harnessResult.finalText) {
      const reason = harnessResult.steps.at(-1)?.reason ?? "verify_rejected";
      if (message.status !== "replied") {
        ctx.messages.markFailed(messageId, guardrailMessage(reason));
      }
      notifyMessagesChanged({ conversation_id: conversation.id });
      return false;
    }

    const replyText = harnessResult.finalText;
    harnessApproved = true;

    if (effectiveReplyMode === "draft") {
      ctx.messageReplies.upsertDraft({
        messageId,
        draftText: replyText,
        agentRunId: run.id,
      });
      if (message.status === "failed") {
        ctx.messages.markPending(messageId);
      }
      notifyMessagesChanged({ conversation_id: conversation.id });
      return true;
    }

    if (!sender) {
      return false;
    }

    assertCanReplyToConversation(ctx.messages, conversation.id);

    const publishResult = await sender.sendText(
      conversation.participantIgUserId,
      replyText,
    );

    ctx.messageReplies.createReply({
      messageId,
      sentText: replyText,
      status: "sent",
      agentRunId: run.id,
      sourceIgMessageId: publishResult?.publishedIgMessageId ?? null,
    });
    ctx.messages.markReplied(messageId);
    notifyMessagesChanged({ conversation_id: conversation.id });
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "message reply failed";

    if (harnessApproved && effectiveReplyMode === "draft" && run) {
      notifyMessagesChanged({ conversation_id: conversation.id });
      throw error instanceof Error ? error : new Error(errorMessage);
    }

    let failedRun: AgentRun;
    if (error instanceof MessageHarnessExecutionError) {
      failedRun = error.run;
    } else {
      failedRun = ctx.agentRuns.create({
        trigger: options.trigger,
        inputSummary,
        outputSummary: errorMessage,
        status: "failed",
        flowId: randomUUID(),
      });
    }

    ctx.messageReplies.createReply({
      messageId,
      sentText: "",
      status: "failed",
      agentRunId: failedRun.id,
    });
    if (message.status !== "replied") {
      ctx.messages.markFailed(messageId, errorMessage);
    }
    notifyMessagesChanged({ conversation_id: conversation.id });
    return false;
  }
}

export async function processMessageReply(
  ctx: AppContext,
  messageId: string,
  options: ProcessMessageReplyOptions,
): Promise<boolean> {
  const message = ctx.messages.findById(messageId);
  if (!message) {
    return false;
  }

  const isManual = options.replyModeOverride != null;

  if (!isManual) {
    if (message.status !== "pending" || message.direction !== "inbound") {
      return false;
    }

    if (ctx.messageReplies.hasReplyRecord(messageId)) {
      return false;
    }
  } else if (options.replyModeOverride === "draft") {
    if (message.status === "skipped" || message.direction !== "inbound") {
      return false;
    }
  } else {
    if (
      message.direction !== "inbound" ||
      (message.status !== "pending" && message.status !== "failed")
    ) {
      return false;
    }

    const sent = ctx.messageReplies.findLatestSentReply(messageId);
    if (sent?.sentText) {
      return false;
    }
  }

  const conversation = ctx.conversations.findById(message.conversationId);
  if (!conversation) {
    return false;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const effectiveReplyMode =
    options.replyModeOverride ??
    resolveEffectiveMessageReplyMode(appSettings.messageReplyMode, conversation.replyMode);

  if (!isManual && !shouldScheduleMessageReply(effectiveReplyMode)) {
    return false;
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  const sender = options.metaMessageSender ?? ctx.metaMessageSender;

  if (!llm) {
    return false;
  }

  return commentReplyLimiter.run(() =>
    processMessageReplyCore(ctx, messageId, options, {
      effectiveReplyMode,
      llm,
      sender,
    }),
  );
}
