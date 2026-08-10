import { ValidationError } from "../../api/json.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MediaStorage } from "../../ports/media-storage.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import { DEFAULT_RESPONSE_LANGUAGE } from "../reply-language/response-languages.ts";
import {
  resolvePostMedia,
  type ResolvePostMediaDeps,
} from "../post-media/resolve-post-media.ts";
import { resolveSlideImage } from "./resolve-slide-image.ts";
import { summarizeImagesWithVision } from "./summarize-images-with-vision.ts";

export type GenerateCarouselSummaryDeps = ResolvePostMediaDeps & {
  posts: PostRepository;
  llm: LlmCompleter | null;
  mediaStorage?: MediaStorage | null;
  responseLanguage?: string | null;
  visionEnabled?: boolean;
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

  if (!deps.visionEnabled) {
    throw new ValidationError(
      "LLM vision is not enabled — turn on supports_vision in LLM settings",
    );
  }

  const media = await resolvePostMedia(postId, deps);
  if (media.slides.length === 0) {
    throw new ValidationError("post has no images");
  }

  const imageInputs = [];
  for (const slide of media.slides) {
    const image = await resolveSlideImage(slide, {
      postId,
      mediaStorage: deps.mediaStorage,
      publicBaseUrl: deps.publicBaseUrl,
    });
    if (image) {
      imageInputs.push({ sortOrder: slide.sortOrder, image });
    }
  }

  if (imageInputs.length === 0) {
    throw new ValidationError("could not load post images for vision");
  }

  // Vision uses in-memory image bytes only; caption is never sent to the model.
  const summary = await summarizeImagesWithVision(imageInputs, deps.llm, {
    responseLanguage: deps.responseLanguage ?? DEFAULT_RESPONSE_LANGUAGE,
    visionEnabled: true,
  });

  if (!summary.trim()) {
    throw new ValidationError("could not generate carousel summary");
  }

  deps.posts.update(postId, { carouselSummary: summary.trim() });
  return summary.trim();
}
