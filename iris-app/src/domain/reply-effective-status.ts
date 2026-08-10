import type { ReplyMode } from "./reply-mode.ts";

export type PostReplyModeInput = {
  reply_mode?: ReplyMode | null;
  auto_reply_enabled?: boolean | null;
};

export type EffectivePostReplyStatus =
  | { kind: "auto" }
  | { kind: "draft" }
  | { kind: "off" }
  | { kind: "paused"; configuredMode: Exclude<ReplyMode, "off"> | null };

export function resolvePostReplyMode(post: PostReplyModeInput): ReplyMode {
  if (post.reply_mode) {
    return post.reply_mode;
  }
  return post.auto_reply_enabled ? "auto" : "off";
}

/** Global desligado impera sobre o modo do post. */
export function resolveEffectivePostReplyStatus(
  globalAutoReplyEnabled: boolean,
  postReplyMode: ReplyMode,
): EffectivePostReplyStatus {
  if (!globalAutoReplyEnabled) {
    return {
      kind: "paused",
      configuredMode: postReplyMode === "off" ? null : postReplyMode,
    };
  }

  if (postReplyMode === "auto") {
    return { kind: "auto" };
  }
  if (postReplyMode === "draft") {
    return { kind: "draft" };
  }
  return { kind: "off" };
}

export function resolveEffectivePostReplyStatusFromPost(
  globalAutoReplyEnabled: boolean,
  post: PostReplyModeInput,
): EffectivePostReplyStatus {
  return resolveEffectivePostReplyStatus(
    globalAutoReplyEnabled,
    resolvePostReplyMode(post),
  );
}

export type ReplyStatusPresentation = {
  label: string;
  shortLabel: string;
  hint?: string;
};

export function replyStatusPresentation(
  status: EffectivePostReplyStatus,
): ReplyStatusPresentation {
  switch (status.kind) {
    case "auto":
      return {
        label: "IA automática",
        shortLabel: "Auto",
      };
    case "draft":
      return {
        label: "Aprovação manual",
        shortLabel: "Aprovação",
        hint: "A Iris sugere respostas; você aprova antes de publicar no Instagram.",
      };
    case "off":
      return {
        label: "IA desligada",
        shortLabel: "Off",
      };
    case "paused":
      return {
        label: "IA pausada (global)",
        shortLabel: "Pausada",
        hint:
          status.configuredMode === "auto"
            ? "Post configurado para automático — retoma quando o agente global voltar."
            : status.configuredMode === "draft"
              ? "Post configurado para aprovação manual — retoma quando o agente global voltar."
              : "Agente global desligado nas configurações.",
      };
  }
}
