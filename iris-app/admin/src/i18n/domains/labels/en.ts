import type { LabelsMessages } from "@/i18n/domains/labels/types";

export const labelsEn = {
  postStatus: {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    monitored: "Monitored",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  kanbanColumns: {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  kanbanActions: {
    cancelPost: "Cancel post",
    unschedule: "Unschedule (back to draft)",
    backToDraft: "Back to draft",
    restoreDraft: "Restore as draft",
    purgePermanent: "Delete permanently",
  },
  commentStatus: {
    pending: "Awaiting reply",
    replied: "Replied",
    skipped: "Skipped",
    failed: "Failed",
    removedOnIg: "Removed on IG",
    awaitingApproval: "Awaiting approval",
  },
  commentHints: {
    removedOnIg:
      "This comment no longer appears on Instagram. Sync the post to refresh.",
    pendingDraft:
      "Iris generated a draft — review and approve to publish on Instagram.",
    pending: "Comment received; Iris has not published a reply in this thread yet.",
    failed: "Auto-reply failed. Try syncing or replying manually.",
    skipped: "This comment was skipped by automation.",
    brandComment: "Brand comment (no Iris reply required).",
  },
  replyModeGlobal: {
    off: {
      label: "Off",
      description: "Iris does not reply to comments on any post using global mode.",
    },
    auto: {
      label: "Automatic",
      description: "Iris replies and publishes on Instagram without review.",
    },
    draft: {
      label: "With approval",
      description: "Iris suggests a reply; you review and approve before publishing.",
    },
  },
  replyModePost: {
    inherit: {
      label: "Follow global",
      description: "Uses the mode from comment agent settings.",
    },
    off: {
      label: "Pause on this post",
      description:
        "Iris does not reply on this post (global mode stays unchanged).",
    },
    auto: {
      label: "Automatic",
      description: "Iris replies and publishes on Instagram without review.",
    },
    draft: {
      label: "With approval",
      description: "Iris suggests a reply; you review and approve before publishing.",
    },
  },
  audit: {
    stages: {
      triage: "Triage",
      draft: "Draft",
      verify: "Verification",
      message_triage: "DM triage",
      message_draft: "DM draft",
      message_verify: "DM verification",
    },
    verdicts: {
      pass: "Approved",
      fail: "Rejected",
      skip: "Skipped",
    },
  },
} satisfies LabelsMessages;
