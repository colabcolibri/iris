import type { LlmCompleter } from "../ports/llm-completer.ts";
import { createTestLlmCompletion } from "../ports/llm-completer.ts";
import type { ReplyTier } from "../domain/reply-harness/reply-tier.ts";

export type HarnessLlmMockOptions = {
  draftText?: string;
  replyTier?: ReplyTier;
  /** @deprecated use replyTier */
  shouldReply?: boolean;
  approved?: boolean;
};

function resolveReplyTier(options: HarnessLlmMockOptions): ReplyTier {
  if (options.replyTier) {
    return options.replyTier;
  }
  if (options.shouldReply === false) {
    return "none";
  }
  return "full";
}

export function createHarnessLlmMock(options: HarnessLlmMockOptions = {}): LlmCompleter {
  const draftText = options.draftText ?? "Rascunho da IA";
  const replyTier = resolveReplyTier(options);
  const approved = options.approved ?? true;
  let step = 0;

  return {
    async complete() {
      step += 1;
      if (step === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: replyTier !== "none",
            replyTier,
            blockCategory: replyTier === "none" ? "off_topic" : "none",
            reason: replyTier === "none" ? "blocked" : "ok",
            reasoning: replyTier === "none" ? "fora do escopo" : "classificado",
          }),
        );
      }
      if (step === 2) {
        return createTestLlmCompletion(draftText);
      }
      return createTestLlmCompletion(
        JSON.stringify({
          approved,
          harmful: false,
          policyViolations: approved ? [] : ["rejected"],
          reason: approved ? "ok" : "rejected",
          reasoning: approved ? "adequado" : "inadequado",
          finalText: approved ? draftText : undefined,
        }),
      );
    },
  };
}
