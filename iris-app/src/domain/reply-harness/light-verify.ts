import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildLightVerifyPrompt } from "./build-harness-prompt.ts";
import type { VerifyDecisionJson } from "./decision-json.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import type { StageResult } from "./types.ts";

const HARMFUL_WORDS = [
  "idiota",
  "imbecil",
  "burro",
  "merda",
  "porra",
  "caralho",
  "fdp",
  "vai se foder",
  "seu lixo",
  "fuck",
  "shit",
  "bitch",
];

const SUSPICIOUS_URL = /(?:https?:\/\/|www\.)[^\s]+/i;

export type LightVerifyCodeResult = {
  approved: boolean;
  harmful: boolean;
  policyViolations: string[];
};

export function runCodeLightVerify(draftText: string): LightVerifyCodeResult {
  const violations: string[] = [];
  const normalized = draftText.trim().toLowerCase();

  if (!normalized) {
    violations.push("empty_draft");
  }

  for (const word of HARMFUL_WORDS) {
    if (normalized.includes(word)) {
      violations.push("harmful_language");
      break;
    }
  }

  if (SUSPICIOUS_URL.test(draftText)) {
    violations.push("unexpected_url");
  }

  const harmful = violations.includes("harmful_language");

  return {
    approved: violations.length === 0,
    harmful,
    policyViolations: violations,
  };
}

export type LightVerifyStageInput = {
  context: ReplyContext;
  draftText: string;
  maxChars: number;
  llm?: LlmCompleter;
};

export async function runLightVerifyStage(input: LightVerifyStageInput): Promise<StageResult> {
  const codeCheck = runCodeLightVerify(input.draftText);
  const trimmed = input.draftText.trim().slice(0, input.maxChars);

  if (!codeCheck.approved) {
    const structured: VerifyDecisionJson = {
      approved: false,
      harmful: codeCheck.harmful,
      policyViolations: codeCheck.policyViolations,
      reason: codeCheck.policyViolations[0] ?? "rejected",
      reasoning: "Light verify failed (code rules).",
    };

    return {
      stage: "verify",
      verdict: "fail",
      reason: structured.reason,
      reasoning: structured.reasoning,
      structured,
    };
  }

  if (input.llm) {
    const prompt = buildLightVerifyPrompt(input.context, trimmed);
    const raw = await input.llm.complete(prompt);
    const parsed = parseLlmJson<VerifyDecisionJson>(raw);

    if (parsed && typeof parsed.approved === "boolean") {
      const harmful = parsed.harmful === true;
      const policyViolations = Array.isArray(parsed.policyViolations)
        ? parsed.policyViolations.map(String)
        : [];

      const structured: VerifyDecisionJson = {
        approved: parsed.approved && !harmful,
        harmful,
        policyViolations,
        reason: parsed.reason || (parsed.approved ? "approved" : "rejected"),
        reasoning: parsed.reasoning || raw.slice(0, 500),
        finalText: parsed.approved && !harmful ? trimmed : undefined,
      };

      return {
        stage: "verify",
        verdict: structured.approved ? "pass" : "fail",
        reason: structured.reason,
        reasoning: structured.reasoning,
        finalText: structured.finalText,
        structured,
      };
    }
  }

  const structured: VerifyDecisionJson = {
    approved: true,
    harmful: false,
    policyViolations: [],
    reason: "approved_simple",
    reasoning: "Light verify passed.",
    finalText: trimmed,
  };

  return {
    stage: "verify",
    verdict: "pass",
    reason: structured.reason,
    reasoning: structured.reasoning,
    finalText: trimmed,
    structured,
  };
}
