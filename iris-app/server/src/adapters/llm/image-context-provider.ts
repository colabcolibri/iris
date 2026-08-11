import type { ImageContextProvider } from "../../ports/image-context-provider.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { PostReplyContext } from "../../domain/reply-context/post-context.ts";

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
