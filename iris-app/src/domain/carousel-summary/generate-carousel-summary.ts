import type { PostAssetContext } from "../reply-context/post-context.ts";
import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { ValidationError } from "../../api/json.ts";
import { summarizeCarouselImagesWithVision } from "../../adapters/llm/image-context-provider.ts";
import {
  buildPostReplyContext,
  type BuildPostReplyContextDeps,
} from "../reply-context/build-post-context.ts";

export type GenerateCarouselSummaryDeps = BuildPostReplyContextDeps & {
  posts: PostRepository;
  assets: AssetRepository;
  llm: LlmCompleter | null;
};

export async function generateCarouselSummaryForPost(
  postId: string,
  deps: GenerateCarouselSummaryDeps,
): Promise<string> {
  const post = buildPostReplyContext(postId, deps);
  if (!post) {
    throw new ValidationError("post not found");
  }

  if (post.assets.length === 0) {
    throw new ValidationError("post has no images");
  }

  if (!deps.llm) {
    throw new ValidationError("LLM is not configured");
  }

  const summary = await summarizeCarouselImagesWithVision(post.assets, deps.llm);
  if (!summary.trim()) {
    throw new ValidationError("could not generate carousel summary");
  }

  deps.posts.update(postId, { carouselSummary: summary.trim() });
  return summary.trim();
}
