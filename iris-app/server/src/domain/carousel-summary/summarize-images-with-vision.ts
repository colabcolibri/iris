import type { LlmCompleter } from "../../ports/llm-completer.ts";
import {
  resolveResponseLanguage,
  type ResponseLanguageOption,
} from "../reply-language/response-languages.ts";
import type { SlideImagePayload } from "./resolve-slide-image.ts";

const MAX_IMAGES = 10;
const SLIDE_MAX_OUTPUT_CHARS = 4_000;
const SYNTHESIS_MAX_OUTPUT_CHARS = 12_000;

export type VisionImageInput = {
  sortOrder: number;
  image: SlideImagePayload;
};

export type SummarizeImagesOptions = {
  responseLanguage: string;
  visionEnabled: boolean;
};

export async function summarizeImagesWithVision(
  images: VisionImageInput[],
  llm: LlmCompleter,
  options: SummarizeImagesOptions,
): Promise<string> {
  if (!options.visionEnabled) {
    throw new Error("LLM vision is not enabled");
  }

  const language = resolveResponseLanguage(options.responseLanguage);
  const slice = images.slice(0, MAX_IMAGES);
  const descriptions: string[] = [];

  for (const item of slice) {
    try {
      const description = await llm.complete(buildSlidePrompt(language, item.sortOrder), {
        images: [{ mime: item.image.mime, base64: item.image.base64 }],
        maxOutputChars: SLIDE_MAX_OUTPUT_CHARS,
      });
      descriptions.push(`## Slide ${item.sortOrder}\n${description.text.trim()}`);
    } catch {
      descriptions.push(`## Slide ${item.sortOrder}\n(description unavailable)`);
    }
  }

  if (descriptions.length === 0) {
    return "";
  }

  if (descriptions.length === 1) {
    return stripSlideHeading(descriptions[0] ?? "");
  }

  const synthesisPrompt = buildSynthesisPrompt(language, descriptions);

  try {
    return (
      await llm.complete(synthesisPrompt, {
        maxOutputChars: SYNTHESIS_MAX_OUTPUT_CHARS,
      })
    ).text.trim();
  } catch {
    return descriptions.map(stripSlideHeading).join("\n\n");
  }
}

function buildSlidePrompt(language: ResponseLanguageOption, sortOrder: number): string {
  return [
    `You are analyzing slide ${sortOrder} of an Instagram carousel.`,
    "Base your answer ONLY on what is visible in this image.",
    "Do NOT use, assume, or infer any Instagram caption, hashtags, or external context.",
  "",
    `Write ONLY in ${language.llmLabel} (${language.code}).`,
    "",
    "Describe this slide thoroughly:",
    "- Visual composition: layout, people, objects, colors, typography, illustration style",
    "- Any text visible in the image: transcribe it accurately (quote exact wording)",
    "- What this slide communicates on its own, including emotional tone and narrative role",
    "",
    "Be detailed and explanatory. Multiple paragraphs are welcome when the slide is rich.",
  ].join("\n");
}

function buildSynthesisPrompt(
  language: ResponseLanguageOption,
  descriptions: string[],
): string {
  return [
    "You have per-slide analyses of an Instagram carousel.",
    "Write one comprehensive editorial summary for an AI that will reply to comments later.",
    "",
    "Rules:",
    `- Write ONLY in ${language.llmLabel} (${language.code})`,
    "- Base the summary ONLY on the slide analyses below — never on captions or external context",
    "- Explain what the carousel communicates as a whole; walk through the sequence when useful",
    "- Preserve transcribed on-image text when it matters for meaning",
    "- Do not shorten unnecessarily; be thorough, clear, and explanatory",
    "",
    descriptions.join("\n\n"),
  ].join("\n");
}

function stripSlideHeading(block: string): string {
  return block.replace(/^## Slide \d+\n/, "").trim();
}
