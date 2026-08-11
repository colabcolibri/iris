import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContentStore } from "../../ports/agent-content-store.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { getAgentContentOrDefault } from "../agent-content-defaults.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";
import { isSupportedResponseLanguage } from "../reply-language/response-languages.ts";
import { ValidationError } from "../../api/json.ts";
import type { CommentThreadContext } from "../reply-context/thread-context.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { executeAndRecordHarness } from "../reply-harness/execute-and-record-harness.ts";
import type { HarnessRunResult } from "../reply-harness/types.ts";
import { serializeHarnessAudit } from "../reply-audit/serialize-harness-audit.ts";
import { createEnvImageContextProvider } from "../../adapters/llm/image-context-provider.ts";
import type { AgentRunRepository } from "../../ports/agent-run-repository.ts";
import type { AgentRunStepRepository } from "../../ports/agent-run-step-repository.ts";
import {
  buildReplyAuditSummary,
  serializeReplyAuditSummary,
} from "../reply-context/build-reply-audit-summary.ts";

export type SimulateThreadMessage = {
  author: string;
  text: string;
  is_brand_reply?: boolean;
  at?: string;
};

export type SimulateReplyInput = {
  caption?: string | null;
  carousel_summary?: string | null;
  response_language?: string;
  brand_name?: string | null;
  brand_username?: string | null;
  max_chars?: number;
  thread?: SimulateThreadMessage[];
  target_comment: {
    author: string;
    text: string;
  };
};

export type SimulateReplyDeps = {
  personaStore: ReplyPersonaStore;
  agentContentStore: AgentContentStore;
  llm: LlmCompleter | null;
  agentRuns: AgentRunRepository;
  agentRunSteps: AgentRunStepRepository;
};

export type SimulateReplyResult = {
  audit: ReturnType<typeof serializeHarnessAudit>;
  final_text: string | null;
  terminal_status: HarnessRunResult["terminalStatus"];
  reply_tier: HarnessRunResult["replyTier"];
  response_language: string;
};

function buildThread(messages: SimulateThreadMessage[] | undefined): CommentThreadContext {
  const entries = (messages ?? []).map((message, index) => ({
    igCommentId: `sim-${index + 1}`,
    author: message.author.trim() || "user",
    text: message.text,
    depth: message.is_brand_reply ? 1 : 0,
    isBrandReply: Boolean(message.is_brand_reply),
    at: message.at ?? new Date(Date.now() - (messages!.length - index) * 60_000).toISOString(),
  }));

  return { entries };
}

function buildSimulatedContext(input: SimulateReplyInput, deps: SimulateReplyDeps): ReplyContext {
  const storedPersona = deps.personaStore.get() ?? defaultReplyPersona();
  const responseLanguage =
    typeof input.response_language === "string" && isSupportedResponseLanguage(input.response_language)
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

  const persona = {
    brandName,
    signatureInstruction: storedPersona.signatureInstruction,
    responseLanguage,
    maxChars,
    updatedAt: storedPersona.updatedAt,
  };

  const post = {
    postId: "simulate",
    caption: typeof input.caption === "string" ? input.caption : null,
    carouselSummary:
      typeof input.carousel_summary === "string" ? input.carousel_summary : null,
    channel: "instagram",
    status: "published",
    scheduledAt: null,
    publishedAt: new Date().toISOString(),
    assets: [],
  };

  return {
    persona,
    post,
    thread: buildThread(input.thread),
    imageContext: { summaries: [], visionEnabled: false },
    brandUsername,
    targetComment: {
      authorUsername: input.target_comment.author.trim() || "user",
      text: input.target_comment.text,
      igCommentId: "sim-target",
    },
  };
}

export async function simulateReply(
  input: SimulateReplyInput,
  deps: SimulateReplyDeps,
): Promise<SimulateReplyResult> {
  if (!input.target_comment?.text?.trim()) {
    throw new ValidationError("target_comment.text is required");
  }

  if (!deps.llm) {
    throw new ValidationError("LLM is not configured");
  }

  const context = buildSimulatedContext(input, deps);
  context.imageContext = await createEnvImageContextProvider().build(context.post);

  const agentContent = getAgentContentOrDefault(deps.agentContentStore);
  const inputSummary = serializeReplyAuditSummary(buildReplyAuditSummary(context));

  const recorded = await executeAndRecordHarness(
    { agentRuns: deps.agentRuns, agentRunSteps: deps.agentRunSteps },
    {
      trigger: "simulate",
      inputSummary,
      harnessInput: {
        context,
        agentContent,
        llm: deps.llm,
        maxChars: context.persona.maxChars,
      },
    },
  );

  return {
    audit: serializeHarnessAudit(
      recorded.harness,
      "simulate",
      recorded.run.id,
      recorded.flowId,
    ),
    final_text: recorded.harness.finalText,
    terminal_status: recorded.harness.terminalStatus,
    reply_tier: recorded.harness.replyTier,
    response_language: context.persona.responseLanguage,
  };
}
