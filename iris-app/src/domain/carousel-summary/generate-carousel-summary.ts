import { ValidationError } from "../../api/json.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import {
  resolvePostMedia,
  type ResolvePostMediaDeps,
} from "../post-media/resolve-post-media.ts";
import { summarizeImagesWithVision } from "./summarize-images-with-vision.ts";

export type GenerateCarouselSummaryDeps = ResolvePostMediaDeps & {
  posts: PostRepository;
  llm: LlmCompleter | null;
};

export async function generateCarouselSummaryForPost(
  postId: string,
  deps: GenerateCarouselSummaryDeps,
): Promise<string> {
  const post = deps.posts.findById(postId);
  if (!post) {
    throw new ValidationError("post not found");
  }

  if (!deps.llm) {
    throw new ValidationError("LLM is not configured");
  }

  const media = await resolvePostMedia(postId, deps);
  if (media.slides.length === 0) {
    throw new ValidationError("post has no images");
  }

  const summary = await summarizeImagesWithVision(
    media.slides.map((slide) => ({
      sortOrder: slide.sortOrder,
      imageUrl: slide.url,
    })),
    deps.llm,
  );

  if (!summary.trim()) {
    throw new ValidationError("could not generate carousel summary");
  }

  deps.posts.update(postId, { carouselSummary: summary.trim() });
  return summary.trim();
}
