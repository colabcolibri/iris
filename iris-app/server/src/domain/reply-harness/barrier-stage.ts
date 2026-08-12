import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import { buildResponseLanguageDirective } from "./prompt-language.ts";
import { targetCommentLine } from "./prompt-sections.ts";
import {
  barrierReplyMeetsRequirements,
  ensureAuthorMention,
  usesBrazilCrisisResources,
  type SafetyBarrierKind,
} from "./safety-barrier-policy.ts";
import { stageLlmFromCompletion } from "./stage-llm.ts";
import type { StageResult } from "./types.ts";

export type BarrierStageInput = {
  context: ReplyContext;
  llm: LlmCompleter;
  kind: SafetyBarrierKind;
  maxChars?: number;
};

type BarrierLlmJson = {
  finalText?: string;
  reasoning?: string;
};

const MAX_BARRIER_ATTEMPTS = 2;

function buildBarrierPrompt(
  context: ReplyContext,
  kind: SafetyBarrierKind,
  maxChars: number,
  attempt: number,
): string {
  const brazil = usesBrazilCrisisResources(context.persona.responseLanguage);
  const handle = context.targetComment.authorUsername?.trim().replace(/^@/, "") ?? "";

  const crisisRules = brazil
    ? [
        "Mandatory facts for crisis (config language = Brazilian Portuguese):",
        "- Empathize briefly; no therapy or clinical advice.",
        "- Mention Brazil, CVV (Centro de Valorização da Vida), phone 188, and https://www.cvv.org.br.",
        "- Say they do not have to face this alone.",
        "- Write original wording — do not paste a template.",
      ]
    : [
        "Mandatory facts for crisis (config language is not Brazilian Portuguese):",
        "- Empathize briefly; no therapy or clinical advice.",
        "- Write in the mandatory response language from config.",
        "- Direct them to local emergency services or a crisis hotline in their country.",
        "- Do not invent Brazilian numbers or CVV.",
        "- Write original wording — do not paste a template.",
      ];

  const hateRules = [
    "Mandatory facts for hate_violence:",
    "- State you are a virtual assistant and do not engage with hate, discrimination, violence advocacy, or crime.",
    "- Informative and firm — no debate, no brand pitch.",
    "- Write original wording — do not paste a template.",
  ];

  const retryNote =
    attempt > 1
      ? [
          "",
          "Previous draft missed mandatory facts. Rewrite completely and include every required fact.",
        ]
      : [];

  return [
    "You write the Instagram safety barrier reply for this comment.",
    "Understand the comment in any language; reply ONLY in the brand response language from config.",
    "No brand SOUL, product pitch, or playful persona.",
    "",
    buildResponseLanguageDirective(context.persona, { includeJsonNote: true }),
    "",
    `Barrier kind: ${kind}`,
    ...(kind === "crisis" ? crisisRules : hateRules),
    ...retryNote,
    "",
    handle
      ? `Start with @${handle} unless already included.`
      : "No author handle — body only.",
    `Soft character budget: ${maxChars}`,
    "",
    "## Target comment",
    targetCommentLine(context),
    `Comment text: ${context.targetComment.text ?? "(empty)"}`,
    "",
    "Reply with valid JSON only:",
    '{"finalText":"complete publishable reply","reasoning":"brief why this barrier applies"}',
  ].join("\n");
}

async function completeBarrierDraft(
  input: BarrierStageInput,
  maxChars: number,
  attempt: number,
): Promise<{ text: string; reasoning: string; llm: StageResult["llm"] }> {
  const prompt = buildBarrierPrompt(input.context, input.kind, maxChars, attempt);
  const completion = await input.llm.complete(prompt, { maxOutputChars: maxChars + 200 });
  const parsed = parseLlmJson<BarrierLlmJson>(completion.text);
  const body = parsed?.finalText?.trim() ?? "";
  const text = ensureAuthorMention(body, input.context.targetComment.authorUsername);

  return {
    text,
    reasoning: parsed?.reasoning?.trim() || completion.text.slice(0, 500),
    llm: stageLlmFromCompletion(completion),
  };
}

export async function runBarrierStage(input: BarrierStageInput): Promise<StageResult> {
  const maxChars = input.maxChars ?? Math.max(280, input.context.persona.maxChars ?? 500);
  let lastReasoning = "";
  let lastLlm: StageResult["llm"];

  for (let attempt = 1; attempt <= MAX_BARRIER_ATTEMPTS; attempt += 1) {
    const draft = await completeBarrierDraft(input, maxChars, attempt);
    lastReasoning = draft.reasoning;
    lastLlm = draft.llm;

    if (
      draft.text &&
      barrierReplyMeetsRequirements(
        input.kind,
        input.context.persona.responseLanguage,
        draft.text,
      )
    ) {
      const finalText = draft.text.slice(0, maxChars + 80);
      return {
        stage: "draft",
        verdict: "pass",
        reason: `barrier_llm:${input.kind}`,
        reasoning: draft.reasoning,
        draftText: finalText,
        finalText,
        structured: {
          replyTier: "none",
          contextSummary: `barrier:${input.kind}`,
          draftPreview: finalText.slice(0, 200),
        },
        llm: draft.llm,
      };
    }
  }

  return {
    stage: "draft",
    verdict: "fail",
    reason: `barrier_incomplete:${input.kind}`,
    reasoning:
      lastReasoning ||
      "Barrier LLM did not include mandatory facts after retries; refusing canned fallback.",
    structured: {
      replyTier: "none",
      contextSummary: `barrier:${input.kind}:incomplete`,
      draftPreview: "",
    },
    llm: lastLlm,
  };
}
