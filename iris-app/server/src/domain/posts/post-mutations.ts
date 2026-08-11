import type { PostStatus } from "./post.ts";
import type { PostReplyModeSetting } from "./reply-mode.ts";
import { isPostReplyModeSetting, isReplyMode, replyModeFromAutoReplyEnabled } from "./reply-mode.ts";
import { ValidationError } from "../../api/json.ts";

export type CreatePostPayload = {
  caption?: unknown;
  channel?: unknown;
  scheduled_at?: unknown;
  source_note?: unknown;
  status?: unknown;
};

export type NormalizedCreatePost = {
  caption: string | null;
  channel: string;
  scheduledAt: string | null;
  sourceNote: string | null;
  status: PostStatus;
};

export function normalizeCreatePost(body: CreatePostPayload): NormalizedCreatePost {
  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  if (!channel) {
    throw new ValidationError("channel is required");
  }

  const status = "draft";

  return {
    caption: typeof body.caption === "string" ? body.caption : null,
    channel,
    scheduledAt: typeof body.scheduled_at === "string" ? body.scheduled_at : null,
    sourceNote: typeof body.source_note === "string" ? body.source_note : null,
    status,
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
