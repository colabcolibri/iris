import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContentStore } from "../../ports/agent-content-store.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import type { SimulatorScenarioStore } from "../../ports/simulator-scenario-store.ts";
import { getAgentContentOrDefault } from "../settings/agent-content-defaults.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
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
import {
  normalizeScenarioId,
  normalizeSimulateTargetComment,
  normalizeSimulateThread,
  type SimulateThreadMessage,
} from "./simulator-payload.ts";

export type { SimulateThreadMessage };

export type SimulateReplyInput = {
  scenario_id?: string;
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

export type ResolveSimulateReplyInputDeps = {
  scenarioStore: SimulatorScenarioStore;
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

export function resolveSimulateReplyInput(
  body: Record<string, unknown>,
  deps: ResolveSimulateReplyInputDeps,
): SimulateReplyInput {
  const scenarioIdRaw = body.scenario_id ?? body.scenarioId;
  const scenario =
    typeof scenarioIdRaw === "string" && scenarioIdRaw.trim()
      ? deps.scenarioStore.getById(normalizeScenarioId(scenarioIdRaw, "scenario_id"))
      : null;

  if (typeof scenarioIdRaw === "string" && scenarioIdRaw.trim() && !scenario) {
    throw new ValidationError(`scenario_id not found: ${scenarioIdRaw.trim()}`);
  }

  const base = scenario
    ? {
        caption: scenario.caption,
        carousel_summary: scenario.carouselSummary,
        thread: scenario.thread,
        target_comment: {
          author: scenario.targetAuthor,
          text: scenario.targetText,
        },
      }
    : {
        caption: null as string | null,
        carousel_summary: null as string | null,
        thread: undefined as SimulateThreadMessage[] | undefined,
        target_comment: {
          author: "user",
          text: "",
        },
      };

  const hasTargetComment =
    body.target_comment !== undefined ||
    body.targetComment !== undefined ||
    body.target_author !== undefined ||
    body.targetAuthor !== undefined ||
    body.target_text !== undefined ||
    body.targetText !== undefined;

  const targetSource = hasTargetComment
    ? {
        author:
          (body.target_comment as Record<string, unknown> | undefined)?.author ??
          (body.targetComment as Record<string, unknown> | undefined)?.author ??
          body.target_author ??
          body.targetAuthor,
        text:
          (body.target_comment as Record<string, unknown> | undefined)?.text ??
          (body.targetComment as Record<string, unknown> | undefined)?.text ??
          body.target_text ??
          body.targetText,
      }
    : base.target_comment;

  const targetComment = normalizeSimulateTargetComment(targetSource, {
    requiredText: !scenario,
  });

  return {
    scenario_id:
      typeof scenarioIdRaw === "string" && scenarioIdRaw.trim()
        ? normalizeScenarioId(scenarioIdRaw, "scenario_id")
        : undefined,
    caption:
      typeof body.caption === "string"
        ? body.caption
        : body.caption === null
          ? null
          : base.caption,
    carousel_summary:
      typeof body.carousel_summary === "string"
        ? body.carousel_summary
        : typeof body.carouselSummary === "string"
          ? body.carouselSummary
          : body.carousel_summary === null || body.carouselSummary === null
            ? null
            : base.carousel_summary,
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
    thread: Array.isArray(body.thread)
      ? normalizeSimulateThread(body.thread)
      : base.thread,
    target_comment: targetComment,
  };
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
  const targetComment = normalizeSimulateTargetComment(input.target_comment, {
    requiredText: true,
  });
  input = {
    ...input,
    target_comment: targetComment,
  };

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
