import type { PostReplyModeSetting, PostStatus, ReplyMode } from "@/lib/types";
import type { ReplyAuditStep } from "@/lib/types";

export type LabelsMessages = {
  postStatus: Record<PostStatus, string>;
  kanbanColumns: Record<"draft" | "scheduled" | "published" | "failed" | "cancelled", string>;
  kanbanActions: {
    cancelPost: string;
    unschedule: string;
    backToDraft: string;
    restoreDraft: string;
    purgePermanent: string;
  };
  commentStatus: {
    pending: string;
    replied: string;
    skipped: string;
    failed: string;
    removedOnIg: string;
    awaitingApproval: string;
  };
  commentHints: {
    removedOnIg: string;
    pendingDraft: string;
    pending: string;
    failed: string;
    skipped: string;
    brandComment: string;
  };
  replyModeGlobal: Record<
    ReplyMode,
    { label: string; description: string }
  >;
  replyModePost: Record<
    PostReplyModeSetting,
    { label: string; description: string }
  >;
  audit: {
    stages: Record<string, string>;
    verdicts: Record<ReplyAuditStep["verdict"], string>;
  };
};
