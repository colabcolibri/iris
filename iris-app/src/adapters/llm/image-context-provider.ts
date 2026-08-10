import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ImageContextProvider } from "../../ports/image-context-provider.ts";
import type { PostReplyContext } from "../../domain/reply-context/post-context.ts";

const VISION_MODEL_PATTERN = /gpt-4o|claude-3|gemini/i;
const MAX_IMAGES = 10;

function supportsVision(model: string): boolean {
  if (process.env.LLM_SUPPORTS_VISION === "1") {
    return true;
  }
  if (process.env.LLM_SUPPORTS_VISION === "0") {
    return false;
  }
  return VISION_MODEL_PATTERN.test(model);
}

export type EnvImageContextProviderOptions = {
  llm?: LlmCompleter | null;
  resolveLlm?: () => LlmCompleter | null;
  model?: string;
  resolveModel?: () => string;
  resolveSupportsVision?: () => boolean;
};

export function createEnvImageContextProvider(
  options: EnvImageContextProviderOptions = {},
): ImageContextProvider {
  const resolveModel =
    options.resolveModel ??
    (() => options.model ?? process.env.LLM_MODEL ?? "gpt-4o-mini");
  const resolveSupportsVision =
    options.resolveSupportsVision ??
    (() => {
      if (process.env.LLM_SUPPORTS_VISION === "1") {
        return true;
      }
      if (process.env.LLM_SUPPORTS_VISION === "0") {
        return false;
      }
      return supportsVision(resolveModel());
    });
  const resolveLlm = options.resolveLlm ?? (() => options.llm ?? null);

  return {
    async build(postContext: PostReplyContext | null) {
      const llm = resolveLlm();
      const visionEnabledFlag = resolveSupportsVision();

      if (!postContext || postContext.assets.length === 0) {
        return { summaries: [], visionEnabled: false };
      }

      const assets = postContext.assets.slice(0, MAX_IMAGES);
      const visionEnabled = Boolean(llm) && visionEnabledFlag;

      if (!visionEnabled) {
        return {
          summaries: [`Carrossel com ${assets.length} imagem(ns) no post.`],
          visionEnabled: false,
        };
      }

      const summaries: string[] = [];

      for (const asset of assets) {
        if (!asset.publishUrl) {
          summaries.push(
            `Imagem ${asset.sortOrder}: (URL indisponível para análise visual)`,
          );
          continue;
        }

        const prompt = `Descreva em uma frase curta (pt-BR) o que aparece nesta imagem de post Instagram: ${asset.publishUrl}`;
        try {
          const description = await llm!.complete(prompt);
          summaries.push(`Imagem ${asset.sortOrder}: ${description}`);
        } catch {
          summaries.push(`Imagem ${asset.sortOrder}: (descrição indisponível)`);
        }
      }

      return { summaries, visionEnabled: true };
    },
  };
}
