import type { PostStatus } from "./post.ts";
import type { PostReplyModeSetting } from "./reply-mode.ts";
import { isPostReplyModeSetting, isReplyMode, replyModeFromAutoReplyEnabled } from "./reply-mode.ts";
import { ValidationError } from "../../api/json.ts";

const REPLY_PROMPT_MAX_CHARS = 32_000;

export type CreatePostPayload = {
  caption?: unknown;
  channel?: unknown;
  scheduled_at?: unknown;
  source_note?: unknown;
  status?: unknown;
  carousel_summary?: unknown;
  reply_prompt?: unknown;
  silence_soul?: unknown;
  silence_page?: unknown;
  silence_knowledge?: unknown;
  silence_restrictions?: unknown;
};

export type NormalizedCreatePost = {
  caption: string | null;
  channel: string;
  scheduledAt: string | null;
  sourceNote: string | null;
  status: PostStatus;
  carouselSummary: string | null;
  replyPrompt: string | null;
  silenceSoul: boolean;
  silencePage: boolean;
  silenceKnowledge: boolean;
  silenceRestrictions: boolean;
};

export function normalizeCreatePost(body: CreatePostPayload): NormalizedCreatePost {
  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  if (!channel) {
    throw new ValidationError("channel is required");
  }

  const status = "draft";

  let carouselSummary: string | null = null;
  if ("carousel_summary" in body) {
    carouselSummary =
      body.carousel_summary === null
        ? null
        : typeof body.carousel_summary === "string"
          ? body.carousel_summary
          : undefined;

    if (carouselSummary === undefined) {
      throw new ValidationError("carousel_summary must be a string or null");
    }
  }

  let replyPrompt: string | null = null;
  if ("reply_prompt" in body) {
    replyPrompt =
      body.reply_prompt === null
        ? null
        : typeof body.reply_prompt === "string"
          ? body.reply_prompt
          : undefined;

    if (replyPrompt === undefined) {
      throw new ValidationError("reply_prompt must be a string or null");
    }

    if (replyPrompt !== null && replyPrompt.length > REPLY_PROMPT_MAX_CHARS) {
      throw new ValidationError(
        `reply_prompt must be at most ${REPLY_PROMPT_MAX_CHARS} characters`,
      );
    }
  }

  let silenceSoul = false;
  if ("silence_soul" in body) {
    if (typeof body.silence_soul !== "boolean") {
      throw new ValidationError("silence_soul must be a boolean");
    }
    silenceSoul = body.silence_soul;
  }

  let silencePage = false;
  if ("silence_page" in body) {
    if (typeof body.silence_page !== "boolean") {
      throw new ValidationError("silence_page must be a boolean");
    }
    silencePage = body.silence_page;
  }

  let silenceKnowledge = false;
  if ("silence_knowledge" in body) {
    if (typeof body.silence_knowledge !== "boolean") {
      throw new ValidationError("silence_knowledge must be a boolean");
    }
    silenceKnowledge = body.silence_knowledge;
  }

  let silenceRestrictions = false;
  if ("silence_restrictions" in body) {
    if (typeof body.silence_restrictions !== "boolean") {
      throw new ValidationError("silence_restrictions must be a boolean");
    }
    silenceRestrictions = body.silence_restrictions;
  }

  return {
    caption: typeof body.caption === "string" ? body.caption : null,
    channel,
    scheduledAt: typeof body.scheduled_at === "string" ? body.scheduled_at : null,
    sourceNote: typeof body.source_note === "string" ? body.source_note : null,
    status,
    carouselSummary,
    replyPrompt,
    silenceSoul,
    silencePage,
    silenceKnowledge,
    silenceRestrictions,
  };
}

export type UpdatePostPayload = {
  caption?: unknown;
  channel?: unknown;
  scheduled_at?: unknown;
  source_note?: unknown;
  status?: unknown;
  auto_reply_enabled?: unknown;
  reply_mode?: unknown;
  carousel_summary?: unknown;
  reply_prompt?: unknown;
  silence_soul?: unknown;
  silence_page?: unknown;
  silence_knowledge?: unknown;
  silence_restrictions?: unknown;
};

export type NormalizedUpdatePost = {
  caption?: string | null;
  channel?: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
  autoReplyEnabled?: boolean;
  replyMode?: PostReplyModeSetting;
  carouselSummary?: string | null;
  replyPrompt?: string | null;
  silenceSoul?: boolean;
  silencePage?: boolean;
  silenceKnowledge?: boolean;
  silenceRestrictions?: boolean;
};

export function normalizeUpdatePost(body: UpdatePostPayload): NormalizedUpdatePost {
  const update: NormalizedUpdatePost = {};

  if ("caption" in body) {
    update.caption = typeof body.caption === "string" ? body.caption : null;
  }

  if ("channel" in body) {
    if (typeof body.channel !== "string" || !body.channel.trim()) {
      throw new ValidationError("channel must be a non-empty string");
    }
    update.channel = body.channel.trim();
  }

  if ("scheduled_at" in body) {
    update.scheduledAt =
      body.scheduled_at === null
        ? null
        : typeof body.scheduled_at === "string"
          ? body.scheduled_at
          : undefined;

    if (update.scheduledAt === undefined) {
      throw new ValidationError("scheduled_at must be a string or null");
    }
  }

  if ("source_note" in body) {
    update.sourceNote =
      body.source_note === null
        ? null
        : typeof body.source_note === "string"
          ? body.source_note
          : undefined;

    if (update.sourceNote === undefined) {
      throw new ValidationError("source_note must be a string or null");
    }
  }

  if ("status" in body) {
    const allowed: PostStatus[] = [
      "draft",
      "scheduled",
      "published",
      "monitored",
      "cancelled",
      "failed",
    ];
    if (typeof body.status !== "string" || !allowed.includes(body.status as PostStatus)) {
      throw new ValidationError("invalid status");
    }
    update.status = body.status as PostStatus;
  }

  if ("carousel_summary" in body) {
    update.carouselSummary =
      body.carousel_summary === null
        ? null
        : typeof body.carousel_summary === "string"
          ? body.carousel_summary
          : undefined;

    if (update.carouselSummary === undefined) {
      throw new ValidationError("carousel_summary must be a string or null");
    }
  }

  if ("reply_mode" in body) {
    if (
      typeof body.reply_mode !== "string" ||
      !isPostReplyModeSetting(body.reply_mode)
    ) {
      throw new ValidationError("reply_mode must be inherit, off, auto, or draft");
    }
    update.replyMode = body.reply_mode;
  }

  if ("reply_prompt" in body) {
    update.replyPrompt =
      body.reply_prompt === null
        ? null
        : typeof body.reply_prompt === "string"
          ? body.reply_prompt
          : undefined;

    if (update.replyPrompt === undefined) {
      throw new ValidationError("reply_prompt must be a string or null");
    }

    if (update.replyPrompt !== null && update.replyPrompt.length > REPLY_PROMPT_MAX_CHARS) {
      throw new ValidationError(
        `reply_prompt must be at most ${REPLY_PROMPT_MAX_CHARS} characters`,
      );
    }
  }

  if ("silence_soul" in body) {
    if (typeof body.silence_soul !== "boolean") {
      throw new ValidationError("silence_soul must be a boolean");
    }
    update.silenceSoul = body.silence_soul;
  }

  if ("silence_page" in body) {
    if (typeof body.silence_page !== "boolean") {
      throw new ValidationError("silence_page must be a boolean");
    }
    update.silencePage = body.silence_page;
  }

  if ("silence_knowledge" in body) {
    if (typeof body.silence_knowledge !== "boolean") {
      throw new ValidationError("silence_knowledge must be a boolean");
    }
    update.silenceKnowledge = body.silence_knowledge;
  }

  if ("silence_restrictions" in body) {
    if (typeof body.silence_restrictions !== "boolean") {
      throw new ValidationError("silence_restrictions must be a boolean");
    }
    update.silenceRestrictions = body.silence_restrictions;
  }

  if ("auto_reply_enabled" in body) {
    if (typeof body.auto_reply_enabled !== "boolean") {
      throw new ValidationError("auto_reply_enabled must be a boolean");
    }
    update.autoReplyEnabled = body.auto_reply_enabled;
    if (!("reply_mode" in body)) {
      update.replyMode = replyModeFromAutoReplyEnabled(body.auto_reply_enabled);
    }
  }

  return update;
}
