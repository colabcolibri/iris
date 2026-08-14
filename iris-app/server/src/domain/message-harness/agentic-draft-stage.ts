import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { HarnessToolContext } from "../../ports/harness-tool.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { runAgentLoop, type AgentLoopTriageHints } from "../harness/agent-loop-orchestrator.ts";
import type { HarnessToolRegistry } from "../harness/harness-tool-registry.ts";
import { DEFAULT_HARNESS_BUDGET } from "../harness/types.ts";
import type { AgentLoopStepResult, AgentLoopTerminalStatus } from "../harness/types.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import type { MessageCategory } from "./message-category.ts";
import type { MessageStageResult } from "./types.ts";

export type MessageAgenticDraftDeps = {
  registry: HarnessToolRegistry;
  toolContext: HarnessToolContext;
};

export type MessageAgenticDraftInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  maxChars: number;
  messageCategory: MessageCategory;
  productSlug?: string | null;
  triageHints?: AgentLoopTriageHints;
  harness: MessageAgenticDraftDeps;
  onLoopStep?: (step: AgentLoopStepResult) => void | Promise<void>;
};

export type MessageAgenticDraftResult = {
  stages: MessageStageResult[];
  draftText: string | null;
  resolvedProducts: ResolvedProductView[];
  loopTerminalStatus: AgentLoopTerminalStatus;
};

function mapLoopStepToMessageStage(step: AgentLoopStepResult): MessageStageResult {
  return {
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    llm: step.llm,
    structured: step.toolName
      ? {
          turnIndex: step.turnIndex,
          toolName: step.toolName,
          toolInput: step.toolInput ?? undefined,
          toolOutput: step.toolOutput,
        }
      : {
          turnIndex: step.turnIndex,
          llmContextJson: step.llmContextJson ?? undefined,
        },
  };
}

export async function runMessageAgenticDraftStage(
  input: MessageAgenticDraftInput,
): Promise<MessageAgenticDraftResult> {
  const loop = await runAgentLoop({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
    registry: input.harness.registry,
    toolContext: input.harness.toolContext,
    budget: DEFAULT_HARNESS_BUDGET,
    maxChars: input.maxChars,
    messageCategory: input.messageCategory,
    focusProductSlug: input.productSlug,
    triageHints: input.triageHints,
    onStep: input.onLoopStep,
  });

  const stages = loop.steps.map(mapLoopStepToMessageStage);

  return {
    stages,
    draftText: loop.finalText,
    resolvedProducts: loop.resolvedProducts,
    loopTerminalStatus: loop.terminalStatus,
  };
}
