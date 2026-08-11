import type { PostReplyModeSetting, ReplyMode } from "./reply-mode.ts";
import {
  isPostReplyModeSetting,
  isReplyMode,
  replyModeFromAutoReplyEnabled,
  resolveEffectiveReplyMode,
} from "./reply-mode.ts";

export type PostReplyModeInput = {
  reply_mode?: PostReplyModeSetting | ReplyMode | null;
  auto_reply_enabled?: boolean | null;
};

export type ResolvedReplyPolicy = {
  globalMode: ReplyMode;
  postSetting: PostReplyModeSetting;
  effectiveMode: ReplyMode;
};

export function resolvePostReplyModeSetting(
  post: PostReplyModeInput,
): PostReplyModeSetting {
  if (post.reply_mode) {
    if (isPostReplyModeSetting(post.reply_mode)) {
      return post.reply_mode;
    }
    if (isReplyMode(post.reply_mode)) {
      return post.reply_mode;
    }
  }

  if (post.auto_reply_enabled) {
    return "auto";
  }

  return "off";
}

export function resolveReplyPolicy(
  globalMode: ReplyMode,
  post: PostReplyModeInput,
): ResolvedReplyPolicy {
  const postSetting = resolvePostReplyModeSetting(post);

  return {
    globalMode,
    postSetting,
    effectiveMode: resolveEffectiveReplyMode(globalMode, postSetting),
  };
}

export type EffectivePostReplyStatus = {
  kind: ReplyMode;
  inherited: boolean;
};

export function resolveEffectivePostReplyStatus(
  globalMode: ReplyMode,
  postSetting: PostReplyModeSetting,
): EffectivePostReplyStatus {
  return {
    kind: resolveEffectiveReplyMode(globalMode, postSetting),
    inherited: postSetting === "inherit",
  };
}

export function resolveEffectivePostReplyStatusFromPost(
  globalMode: ReplyMode,
  post: PostReplyModeInput,
): EffectivePostReplyStatus {
  return resolveEffectivePostReplyStatus(
    globalMode,
    resolvePostReplyModeSetting(post),
  );
}

/** @deprecated Use global reply_mode. Mantido para transição da API legada. */
export function resolveEffectivePostReplyStatusFromLegacyBoolean(
  globalAutoReplyEnabled: boolean,
  post: PostReplyModeInput,
): EffectivePostReplyStatus {
  return resolveEffectivePostReplyStatusFromPost(
    replyModeFromAutoReplyEnabled(globalAutoReplyEnabled),
    post,
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
  const inheritedSuffix = status.inherited ? " (global)" : "";

  switch (status.kind) {
    case "auto":
      return {
        label: `IA automática${inheritedSuffix}`,
        shortLabel: status.inherited ? "Auto (global)" : "Auto",
        hint: status.inherited
          ? "Este post segue o modo automático definido nas configurações globais."
          : undefined,
      };
    case "draft":
      return {
        label: `Aprovação manual${inheritedSuffix}`,
        shortLabel: status.inherited ? "Aprovação (global)" : "Aprovação",
        hint: status.inherited
          ? "Este post segue o modo de aprovação definido nas configurações globais."
          : "A Iris sugere respostas; você aprova antes de publicar no Instagram.",
      };
    case "off":
      return {
        label: `IA desligada${inheritedSuffix}`,
        shortLabel: status.inherited ? "Off (global)" : "Pausada",
        hint: status.inherited
          ? "Este post segue o agente desligado nas configurações globais."
          : "A Iris não responde comentários nesta publicação (o modo global não muda).",
      };
  }
}
