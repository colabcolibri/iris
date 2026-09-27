import type { LlmCompleter, LlmCompletionResult } from "../../ports/llm-completer.ts";
import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import { buildResponseLanguageDirective } from "./prompt-language.ts";

/** Complements appended after the mandatory language block at send time. */
export const AGENT_LANGUAGE_COMPLEMENTS = {
  triageJsonNote:
    'JSON fields "reason" and "reasoning" may use brief English operator labels.',
  publicReplyOnly:
    "Return ONLY the reply text in that language. No JSON. No hashtags.",
  privateDmOnly:
    "Return ONLY the private DM text in that language. No JSON. No hashtags.",
  verifyFinalText: "finalText MUST follow the response language above.",
  agentLoopPublic:
    "Return ONLY public Instagram text in that language inside finish.text or notify_operator.customerMessage. No JSON wrappers for those fields. No hashtags. Write notify_operator reason and customerSummary in the same language.",
  barrierFinalText:
    'JSON field "finalText" MUST be in the response language above; "reasoning" may be brief English.',
} as const;

export type AgentLanguageComplement =
  | keyof typeof AGENT_LANGUAGE_COMPLEMENTS
  | string
  | readonly string[];

function resolveComplement(complement?: AgentLanguageComplement): string[] {
  if (!complement) {
    return [];
  }
  if (typeof complement === "string") {
    if (complement in AGENT_LANGUAGE_COMPLEMENTS) {
      return [AGENT_LANGUAGE_COMPLEMENTS[complement as keyof typeof AGENT_LANGUAGE_COMPLEMENTS]];
    }
    return [complement];
  }
  return complement.flatMap((part) => resolveComplement(part));
}

/**
 * Appends the mandatory response-language block (and optional complement) to a stage body.
 * Use at LLM send time so every agent turn shares the same language policy.
 */
export function finalizeAgentPrompt(
  body: string,
  persona: ReplyPersona,
  complement?: AgentLanguageComplement,
): string {
  const lines = [body.trimEnd(), "", buildResponseLanguageDirective(persona)];
  for (const extra of resolveComplement(complement)) {
    const trimmed = extra.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
  }
  return lines.join("\n");
}

export type CompleteAgentPromptOptions = {
  complement?: AgentLanguageComplement;
  maxOutputChars?: number;
  source: string;
};

export async function completeAgentPrompt(
  llm: LlmCompleter,
  persona: ReplyPersona,
  body: string,
  options: CompleteAgentPromptOptions,
): Promise<LlmCompletionResult> {
  const prompt = finalizeAgentPrompt(body, persona, options.complement);
  return llm.complete(prompt, {
    maxOutputChars: options.maxOutputChars,
    source: options.source,
  });
}
