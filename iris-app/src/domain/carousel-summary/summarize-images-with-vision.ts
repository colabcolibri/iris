import type { LlmCompleter } from "../../ports/llm-completer.ts";

const MAX_IMAGES = 10;

export type VisionImageInput = {
  sortOrder: number;
  imageUrl: string;
};

export async function summarizeImagesWithVision(
  images: VisionImageInput[],
  llm: LlmCompleter,
): Promise<string> {
  const slice = images.slice(0, MAX_IMAGES);
  const descriptions: string[] = [];

  for (const image of slice) {
    const prompt = [
      "Describe in one short sentence (English) what appears in this Instagram carousel slide.",
      `Image URL: ${image.imageUrl}`,
    ].join("\n");

    try {
      const description = await llm.complete(prompt);
      descriptions.push(`Slide ${image.sortOrder}: ${description.text.trim()}`);
    } catch {
      descriptions.push(`Slide ${image.sortOrder}: description unavailable.`);
    }
  }

  if (descriptions.length === 0) {
    return "";
  }

  if (descriptions.length === 1) {
    return descriptions[0] ?? "";
  }

  const synthesisPrompt = [
    "Combine these per-slide descriptions into one concise carousel summary (2–4 sentences, English).",
    "Focus on what the audience sees across the whole post.",
    "",
    descriptions.join("\n"),
  ].join("\n");

  try {
    return (await llm.complete(synthesisPrompt)).text.trim();
  } catch {
    return descriptions.join(" ");
  }
}
