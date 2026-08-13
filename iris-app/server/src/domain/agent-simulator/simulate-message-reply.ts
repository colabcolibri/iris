import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentRunRepository } from "../../ports/agent-run-repository.ts";
import type { AgentRunStepRepository } from "../../ports/agent-run-step-repository.ts";
import type { MessageAgentContentStore } from "../../ports/message-agent-content-store.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { ValidationError } from "../../api/json.ts";
import { executeAndRecordMessageHarness } from "../message-harness/execute-and-record-message-harness.ts";
import type { MessageHarnessRunResult } from "../message-harness/types.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { getMessageAgentContentOrDefault } from "../settings/message-agent-content-defaults.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import { isSupportedResponseLanguage } from "../reply-language/response-languages.ts";
import { serializeMessageHarnessAudit } from "../reply-audit/serialize-message-harness-audit.ts";
import {
  normalizeSimulateTargetComment,
  normalizeSimulateThread,
  type SimulateThreadMessage,
} from "./simulator-payload.ts";

export type SimulateMessageReplyInput = {
  thread?: SimulateThreadMessage[];
  target_message: {
    author: string;
    text: string;
  };
  participant_username?: string | null;
  reply_prompt?: string | null;
  response_language?: string;
  brand_name?: string | null;
  brand_username?: string | null;
  max_chars?: number;
};

export type SimulateMessageReplyDeps = {
  personaStore: ReplyPersonaStore;
  messageAgentContentStore: MessageAgentContentStore;
  products: ProductRepository;
  llm: LlmCompleter | null;
  agentRuns: AgentRunRepository;
  agentRunSteps: AgentRunStepRepository;
};

export type SimulateMessageReplyResult = {
  audit: ReturnType<typeof serializeMessageHarnessAudit>;
  final_text: string | null;
  terminal_status: MessageHarnessRunResult["terminalStatus"];
  message_category: MessageHarnessRunResult["messageCategory"];
  response_language: string;
};

export function resolveSimulateMessageReplyInput(
  body: Record<string, unknown>,
): SimulateMessageReplyInput {
  const targetSource = {
    author:
      (body.target_message as Record<string, unknown> | undefined)?.author ??
      (body.targetMessage as Record<string, unknown> | undefined)?.author ??
      body.target_author ??
      body.targetAuthor,
    text:
      (body.target_message as Record<string, unknown> | undefined)?.text ??
      (body.targetMessage as Record<string, unknown> | undefined)?.text ??
      body.target_text ??
      body.targetText,
  };

  const targetMessage = normalizeSimulateTargetComment(targetSource, {
    requiredText: true,
  });

  return {
    thread: Array.isArray(body.thread) ? normalizeSimulateThread(body.thread) : undefined,
    target_message: targetMessage,
    participant_username:
      typeof body.participant_username === "string"
        ? body.participant_username
        : typeof body.participantUsername === "string"
          ? body.participantUsername
          : null,
    reply_prompt:
      typeof body.reply_prompt === "string"
        ? body.reply_prompt
        : body.reply_prompt === null
          ? null
          : typeof body.replyPrompt === "string"
            ? body.replyPrompt
            : body.replyPrompt === null
              ? null
              : undefined,
    response_language:
      typeof body.response_language === "string"
        ? body.response_language
        : typeof body.responseLanguage === "string"
          ? body.responseLanguage
          : undefined,
    brand_name:
      body.brand_name === null
        ? null
        : typeof body.brand_name === "string"
          ? body.brand_name
          : body.brandName === null
            ? null
            : typeof body.brandName === "string"
              ? body.brandName
              : undefined,
    brand_username:
      body.brand_username === null
        ? null
        : typeof body.brand_username === "string"
          ? body.brand_username
          : body.brandUsername === null
            ? null
            : typeof body.brandUsername === "string"
              ? body.brandUsername
              : undefined,
    max_chars:
      typeof body.max_chars === "number"
        ? body.max_chars
        : typeof body.maxChars === "number"
          ? body.maxChars
          : undefined,
  };
}

function buildSimulatedMessageContext(
  input: SimulateMessageReplyInput,
  deps: SimulateMessageReplyDeps,
): MessageReplyContext {
  const storedPersona = deps.personaStore.get() ?? defaultReplyPersona();
  const responseLanguage =
    typeof input.response_language === "string" &&
    isSupportedResponseLanguage(input.response_language)
      ? input.response_language
      : storedPersona.responseLanguage;

  const maxChars =
    typeof input.max_chars === "number" && Number.isInteger(input.max_chars)
      ? input.max_chars
      : storedPersona.maxChars;

  const brandName =
    input.brand_name === null
      ? null
      : typeof input.brand_name === "string" && input.brand_name.trim()
        ? input.brand_name.trim()
        : storedPersona.brandName;

  const brandUsername =
    input.brand_username === null
      ? null
      : typeof input.brand_username === "string" && input.brand_username.trim()
        ? input.brand_username.trim().replace(/^@+/, "")
        : null;

  const participantUsername =
    typeof input.participant_username === "string" && input.participant_username.trim()
      ? input.participant_username.trim().replace(/^@+/, "")
      : input.target_message.author.trim() || "user";

  const threadMessages = input.thread ?? [];
  const entries = threadMessages.map((message) => ({
    direction: message.is_brand_reply ? ("outbound" as const) : ("inbound" as const),
    text: message.text,
    authorUsername: message.is_brand_reply
      ? brandUsername
      : participantUsername,
  }));

  entries.push({
    direction: "inbound",
    text: input.target_message.text,
    authorUsername: participantUsername,
  });

  return {
    persona: {
      brandName,
      signatureInstruction: storedPersona.signatureInstruction,
      responseLanguage,
      maxChars,
      updatedAt: storedPersona.updatedAt,
    },
    conversation: {
      participantUsername,
      replyPrompt: input.reply_prompt ?? null,
    },
    thread: { entries },
    products: deps.products.list(true),
    brandUsername,
    targetMessage: {
      text: input.target_message.text,
      authorUsername: participantUsername,
    },
  };
}

export async function simulateMessageReply(
  input: SimulateMessageReplyInput,
  deps: SimulateMessageReplyDeps,
): Promise<SimulateMessageReplyResult> {
  if (!deps.llm) {
    throw new ValidationError("LLM is not configured");
  }

  const context = buildSimulatedMessageContext(input, deps);
  const agentContent = getMessageAgentContentOrDefault(deps.messageAgentContentStore);

  const recorded = await executeAndRecordMessageHarness(
    { agentRuns: deps.agentRuns, agentRunSteps: deps.agentRunSteps },
    {
      trigger: "manual_simulate",
      inputSummary: input.target_message.text.slice(0, 240),
      harnessInput: {
        context,
        agentContent,
        llm: deps.llm,
        maxChars: context.persona.maxChars,
      },
    },
  );

  return {
    audit: serializeMessageHarnessAudit(
      recorded.harness,
      "manual_simulate",
      recorded.run.id,
      recorded.flowId,
    ),
    final_text: recorded.harness.finalText,
    terminal_status: recorded.harness.terminalStatus,
    message_category: recorded.harness.messageCategory,
    response_language: context.persona.responseLanguage,
  };
}
