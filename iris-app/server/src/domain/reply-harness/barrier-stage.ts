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

/** Public IG crisis replies must stay short — distress reduces ability to process long text. */
const CRISIS_BARRIER_MAX_CHARS = 280;
const HATE_BARRIER_MAX_CHARS = 220;

function barrierCharBudget(kind: SafetyBarrierKind, personaMax: number): number {
  const softCap = kind === "crisis" ? CRISIS_BARRIER_MAX_CHARS : HATE_BARRIER_MAX_CHARS;
  return Math.min(softCap, Math.max(160, personaMax));
}

function buildBarrierPrompt(
  context: ReplyContext,
  kind: SafetyBarrierKind,
  maxChars: number,
  attempt: number,
): string {
  const brazil = usesBrazilCrisisResources(context.persona.responseLanguage);
  const handle = context.targetComment.authorUsername?.trim().replace(/^@/, "") ?? "";

  const styleRules = [
    "Instagram comment style (mandatory):",
    "- Maximum 2 short sentences after the @mention (3 only if unavoidable).",
    "- Sound human and calm — not a brochure, not a press release, not therapy.",
    "- No institutional marketing of the helpline (do not list free/confidential/24h features).",
    "- No preachy closings like \"please seek help\" / \"por favor busque ajuda\".",
    "- No clinical advice, diagnoses, or probing questions about suicide methods.",
    `- Hard character budget including @mention: ${maxChars}.`,
  ];

  const crisisRules = brazil
    ? [
        "Crisis content (config = Brazilian Portuguese):",
        "- One brief empathy line (you care / they are not alone).",
        "- Then point to help in Brazil: CVV, phone 188, https://www.cvv.org.br — facts only, no sales pitch.",
        "- Example shape (rewrite in your own words, do not copy verbatim):",
        '  "@user Sinto muito por esse momento. Você não precisa passar por isso sozinha — no Brasil o CVV atende no 188 ou em https://www.cvv.org.br."',
      ]
    : [
        "Crisis content (config language is not Brazilian Portuguese):",
        "- Write in the mandatory response language from config.",
        "- One brief empathy line + point to a concrete local crisis/emergency resource for that locale.",
        "- Examples of locale-appropriate resources (pick what fits the language/region — do not invent Brazil CVV):",
        "  Portugal (pt-PT): SNS24; many EU locales: 112; US: 988.",
        "- Keep it to 2 short sentences after @mention.",
      ];

  const hateRules = [
    "Hate/violence content:",
    "- One firm informative sentence: as a virtual assistant you do not engage with hate, discrimination, or advocacy of violence/crime.",
    "- Optional second short line inviting a respectful comment about the post.",
    "- No debate, irony, or brand pitch.",
  ];

  const retryNote =
    attempt > 1
      ? [
          "",
          "Previous draft was too long, missing facts, or too brochure-like. Rewrite shorter and include every required fact.",
        ]
      : [];

  return [
    "You write a short Instagram safety barrier reply for this comment.",
    "Understand the comment in any language; reply ONLY in the brand response language from config.",
    "No brand SOUL, product pitch, or playful persona.",
    "",
    buildResponseLanguageDirective(context.persona, { includeJsonNote: true }),
    "",
    `Barrier kind: ${kind}`,
    ...styleRules,
    "",
    ...(kind === "crisis" ? crisisRules : hateRules),
    ...retryNote,
    "",
    handle
      ? `Start with @${handle} unless already included.`
      : "No author handle — body only.",
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
  const personaMax = input.maxChars ?? input.context.persona.maxChars ?? 500;
  const maxChars = barrierCharBudget(input.kind, personaMax);
  let lastReasoning = "";
  let lastDraftText = "";
  let lastLlm: StageResult["llm"];

  for (let attempt = 1; attempt <= MAX_BARRIER_ATTEMPTS; attempt += 1) {
    const draft = await completeBarrierDraft(input, maxChars, attempt);
    lastReasoning = draft.reasoning;
    lastDraftText = draft.text;
    lastLlm = draft.llm;

    const withinBudget = draft.text.length <= maxChars + 40;
    if (
      draft.text &&
      withinBudget &&
      barrierReplyMeetsRequirements(
        input.kind,
        input.context.persona.responseLanguage,
        draft.text,
      )
    ) {
      const finalText = draft.text.slice(0, maxChars + 40);
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
      "Barrier LLM did not meet short-form + mandatory facts after retries; refusing canned fallback.",
    draftText: lastDraftText || undefined,
    structured: {
      replyTier: "none",
      contextSummary: `barrier:${input.kind}:incomplete`,
      draftPreview: (lastDraftText || "").slice(0, 200),
    },
    llm: lastLlm,
  };
}
