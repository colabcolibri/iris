import type { PostAssetContext } from "../../domain/reply-context/post-context.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ImageContextProvider } from "../../ports/image-context-provider.ts";
import type { PostReplyContext } from "../../domain/reply-context/post-context.ts";

const MAX_IMAGES = 10;

export async function summarizeCarouselImagesWithVision(
  assets: PostAssetContext[],
  llm: LlmCompleter,
): Promise<string> {
  const slice = assets.slice(0, MAX_IMAGES);
  const descriptions: string[] = [];

  for (const asset of slice) {
    if (!asset.publishUrl) {
      descriptions.push(`Slide ${asset.sortOrder}: image URL unavailable.`);
      continue;
    }

    const prompt = [
      "Describe in one short sentence (English) what appears in this Instagram carousel slide.",
      `Image URL: ${asset.publishUrl}`,
    ].join("\n");

    try {
      const description = await llm.complete(prompt);
      descriptions.push(`Slide ${asset.sortOrder}: ${description.trim()}`);
    } catch {
      descriptions.push(`Slide ${asset.sortOrder}: description unavailable.`);
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
    return (await llm.complete(synthesisPrompt)).trim();
  } catch {
    return descriptions.join(" ");
  }
}

export type EnvImageContextProviderOptions = {
  llm?: LlmCompleter | null;
};

export function createEnvImageContextProvider(
  _options: EnvImageContextProviderOptions = {},
): ImageContextProvider {
  return {
    async build(postContext: PostReplyContext | null) {
      if (!postContext) {
        return { summaries: [], visionEnabled: false };
      }

      const configured = postContext.carouselSummary?.trim();
      if (configured) {
        return { summaries: [configured], visionEnabled: false };
      }

      const assetCount = postContext.assets.length;
      if (assetCount > 0) {
        return {
          summaries: [
            `Carousel with ${assetCount} image(s). No carousel summary configured — add one for richer reply context.`,
          ],
          visionEnabled: false,
        };
      }

      return { summaries: [], visionEnabled: false };
    },
  };
}
