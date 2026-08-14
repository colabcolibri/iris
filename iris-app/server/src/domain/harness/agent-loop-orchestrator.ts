import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { HarnessToolContext } from "../../ports/harness-tool.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import type { HarnessToolRegistry } from "./harness-tool-registry.ts";
import { parseLlmJson } from "../reply-harness/parse-llm-json.ts";
import { stageLlmFromCompletion } from "../reply-harness/stage-llm.ts";
import type { MessageCategory } from "../message-harness/message-category.ts";
import { formatResolvedProductForPrompt } from "../products/product-field-resolver.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import { resolveProductViewBySlug } from "./resolve-product-view.ts";
import {
  appendLoopAction,
  appendLoopObservation,
  appendLoopSystemNote,
  createAgentLoopTranscript,
  hasToolCallFingerprint,
  renderLoopTranscriptForPrompt,
  serializeLoopTranscript,
  toolCallFingerprint,
  type AgentLoopTranscript,
} from "./agent-loop-transcript.ts";
import type {
  AgentLoopRunResult,
  AgentLoopStepResult,
  AgentLoopTerminalStatus,
  AgentLoopTurnAction,
  HarnessBudget,
} from "./types.ts";

export type AgentLoopTriageHints = {
  reason?: string | null;
  productSlug?: string | null;
  messageCategory?: MessageCategory | null;
};

export type RunAgentLoopInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  registry: HarnessToolRegistry;
  toolContext: HarnessToolContext;
  budget: HarnessBudget;
  maxChars: number;
  messageCategory: MessageCategory;
  focusProductSlug?: string | null;
  triageHints?: AgentLoopTriageHints;
  onStep?: (step: AgentLoopStepResult) => void | Promise<void>;
};

function formatThread(context: MessageReplyContext): string {
  if (context.thread.entries.length === 0) {
    return "(sem histórico)";
  }

  return context.thread.entries
    .map((entry) => {
      const author =
        entry.direction === "outbound"
          ? context.brandUsername ?? "marca"
          : entry.authorUsername ?? context.conversation.participantUsername ?? "usuário";
      return `[${entry.direction}] ${author}: ${entry.text}`;
    })
    .join("\n");
}

export function buildAgentLoopPrompt(
  input: RunAgentLoopInput,
  focusProduct: ResolvedProductView | null,
  transcript: AgentLoopTranscript,
): string {
  const focusBlock = focusProduct
    ? `Produto em foco (triagem):\n${formatResolvedProductForPrompt(focusProduct)}`
    : "Nenhum produto em foco — use search_products se precisar.";

  const triageBlock = input.triageHints?.reason
    ? [
        "Contexto da triagem:",
        `- categoria: ${input.triageHints.messageCategory ?? input.messageCategory}`,
        `- productSlug: ${input.triageHints.productSlug ?? "(nenhum)"}`,
        `- raciocínio: ${input.triageHints.reason}`,
        "- Se search_products retornar vazio e o produto não existir, responda com finish explicando educadamente.",
        "- Não repita a mesma tool com os mesmos argumentos.",
      ].join("\n")
    : "";

  const base = [
    "Você redige resposta em DM do Instagram usando tools de catálogo.",
    `Categoria triada: ${input.messageCategory}`,
    `Limite final: ${input.maxChars} caracteres.`,
    "",
    "Responda APENAS JSON por turno:",
    '{"action":"call_tool","tool":"nome","arguments":{...}}',
    'ou {"action":"finish","text":"resposta final"}',
    "",
    "Tools disponíveis:",
    input.registry.describeForPrompt(),
    "",
    focusBlock,
    triageBlock,
    "",
    "Alma (dm_soul):",
    input.agentContent.dmSoul || "(vazio)",
    "",
    "Conhecimento (dm_knowledge):",
    input.agentContent.dmKnowledge || "(vazio)",
    "",
    "Restrições:",
    input.agentContent.dmRestrictions || "(nenhuma)",
    "",
    "Thread:",
    formatThread(input.context),
    "",
    "Mensagem a responder:",
    input.context.targetMessage.text ?? "(vazio)",
    input.context.conversation.replyPrompt
      ? `\nBriefing:\n${input.context.conversation.replyPrompt}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return base + renderLoopTranscriptForPrompt(transcript);
}

function parseTurnAction(raw: string): AgentLoopTurnAction | null {
  const parsed = parseLlmJson<Record<string, unknown>>(raw);
  if (!parsed || typeof parsed.action !== "string") {
    return null;
  }

  if (parsed.action === "finish") {
    const text = typeof parsed.text === "string" ? parsed.text : "";
    return { action: "finish", text };
  }

  if (parsed.action === "call_tool") {
    const tool = typeof parsed.tool === "string" ? parsed.tool : "";
    const args =
      parsed.arguments && typeof parsed.arguments === "object" && !Array.isArray(parsed.arguments)
        ? (parsed.arguments as Record<string, unknown>)
        : {};
    if (!tool) {
      return null;
    }
    return { action: "call_tool", tool, arguments: args };
  }

  return null;
}

function isResolvedProductView(value: unknown): value is ResolvedProductView {
  return (
    !!value &&
    typeof value === "object" &&
    "productId" in value &&
    "slug" in value &&
    "name" in value
  );
}

function collectProductsFromToolOutput(
  toolName: string,
  output: unknown,
  bucket: ResolvedProductView[],
): void {
  if (toolName === "search_products" && output && typeof output === "object" && "items" in output) {
    const items = (output as { items?: unknown }).items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (isResolvedProductView(item)) {
          bucket.push(item);
        }
      }
    }
    return;
  }

  if (isResolvedProductView(output)) {
    bucket.push(output);
  }
}

function buildPromptForTurn(
  input: RunAgentLoopInput,
  focusProduct: ResolvedProductView | null,
  transcript: AgentLoopTranscript,
): string {
  return buildAgentLoopPrompt(input, focusProduct, transcript);
}

export async function runAgentLoop(input: RunAgentLoopInput): Promise<AgentLoopRunResult> {
  const steps: AgentLoopStepResult[] = [];
  const transcript = createAgentLoopTranscript();
  const resolvedProducts: ResolvedProductView[] = [];
  const startedAt = Date.now();
  let toolCalls = 0;
  let finalText: string | null = null;
  let terminalStatus: AgentLoopTerminalStatus = "invalid_response";

  const focusProduct = input.focusProductSlug
    ? resolveProductViewBySlug(
        {
          products: input.toolContext.products,
          productStoreLinks: input.toolContext.productStoreLinks,
          productFieldPolicies: input.toolContext.productFieldPolicies,
        },
        input.focusProductSlug,
      )
    : null;

  for (let turn = 0; turn < input.budget.maxTurns; turn += 1) {
    if (Date.now() - startedAt > input.budget.timeoutMs) {
      terminalStatus = "timeout";
      break;
    }

    const prompt = buildPromptForTurn(input, focusProduct, transcript);
    const completion = await input.llm.complete(prompt);
    const turnStep: AgentLoopStepResult = {
      stage: "message_draft_turn",
      stepKind: "llm",
      turnIndex: turn,
      verdict: "pass",
      reason: `draft_turn:${turn}`,
      reasoning: completion.text.slice(0, 2000),
      llmContextJson: JSON.stringify({
        prompt,
        transcript: JSON.parse(serializeLoopTranscript(transcript)),
      }),
      llm: stageLlmFromCompletion(completion),
    };
    steps.push(turnStep);
    if (input.onStep) {
      await input.onStep(turnStep);
    }

    const action = parseTurnAction(completion.text);
    if (!action) {
      terminalStatus = "invalid_response";
      break;
    }

    if (action.action === "finish") {
      finalText = action.text.trim().slice(0, input.maxChars) || null;
      terminalStatus = finalText ? "finished" : "invalid_response";
      break;
    }

    if (toolCalls >= input.budget.maxToolCalls) {
      terminalStatus = "budget_exceeded";
      break;
    }

    const fingerprint = toolCallFingerprint(action.tool, action.arguments);
    if (hasToolCallFingerprint(transcript, fingerprint)) {
      appendLoopSystemNote(
        transcript,
        turn,
        "tool duplicada bloqueada — use finish ou altere a estratégia",
      );
      continue;
    }

    const tool = input.registry.get(action.tool);
    if (!tool) {
      const failStep: AgentLoopStepResult = {
        stage: "tool_call",
        stepKind: "tool",
        turnIndex: turn,
        verdict: "fail",
        reason: "unknown_tool",
        reasoning: action.tool,
        toolName: action.tool,
        toolInput: action.arguments,
        toolOutput: { error: "unknown_tool" },
        toolLatencyMs: 0,
      };
      steps.push(failStep);
      if (input.onStep) {
        await input.onStep(failStep);
      }
      terminalStatus = "tool_error";
      break;
    }

    appendLoopAction(transcript, turn, "call_tool", {
      tool: action.tool,
      arguments: action.arguments,
    });

    const toolStarted = Date.now();
    const callStep: AgentLoopStepResult = {
      stage: "tool_call",
      stepKind: "tool",
      turnIndex: turn,
      verdict: "pass",
      reason: `tool:${action.tool}`,
      reasoning: "",
      toolName: action.tool,
      toolInput: action.arguments,
    };
    steps.push(callStep);
    if (input.onStep) {
      await input.onStep(callStep);
    }

    toolCalls += 1;
    const result = await tool.execute(input.toolContext, action.arguments);
    const toolLatencyMs = Date.now() - toolStarted;

    appendLoopObservation(transcript, turn, action.tool, result.output);

    const resultStep: AgentLoopStepResult = {
      stage: "tool_result",
      stepKind: "tool",
      turnIndex: turn,
      verdict: result.success ? "pass" : "fail",
      reason: result.success ? `tool_ok:${action.tool}` : result.errorCode ?? "tool_failed",
      reasoning: "",
      toolName: action.tool,
      toolInput: action.arguments,
      toolOutput: result.output,
      toolLatencyMs,
      parentStepId: null,
    };
    steps.push(resultStep);
    if (input.onStep) {
      await input.onStep(resultStep);
    }

    collectProductsFromToolOutput(action.tool, result.output, resolvedProducts);

    if (action.tool === "finish_draft" && result.success) {
      const text =
        result.output && typeof result.output === "object" && "text" in result.output
          ? String((result.output as { text: unknown }).text)
          : "";
      finalText = text.trim().slice(0, input.maxChars) || null;
      terminalStatus = finalText ? "finished" : "invalid_response";
      break;
    }

    if (!result.success) {
      terminalStatus = "tool_error";
      break;
    }
  }

  if (!finalText && terminalStatus === "invalid_response" && toolCalls >= input.budget.maxToolCalls) {
    terminalStatus = "budget_exceeded";
  }

  if (!finalText && terminalStatus === "invalid_response" && steps.length > 0) {
    const exhaustedTurns = steps.filter((s) => s.stage === "message_draft_turn").length;
    if (exhaustedTurns >= input.budget.maxTurns) {
      terminalStatus = "budget_exceeded";
    }
  }

  return {
    terminalStatus,
    finalText,
    steps,
    resolvedProducts,
  };
}
