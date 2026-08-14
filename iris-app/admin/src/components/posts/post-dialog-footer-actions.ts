import type { PostsMessages } from "@/i18n/domains/posts/types";

export type PostDialogFooterStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "monitored"
  | "failed"
  | "cancelled";

export type PostDialogFooterActionId =
  | "delete"
  | "publish_now"
  | "schedule"
  | "save_draft"
  | "save_scheduled"
  | "revert_to_draft"
  | "retry_draft"
  | "retry_schedule";

export type PostDialogFooterActionVariant =
  | "default"
  | "outline"
  | "ghost"
  | "destructive";

export type PostDialogFooterAction = {
  id: PostDialogFooterActionId;
  label: string;
  variant: PostDialogFooterActionVariant;
  disabled?: boolean;
};

export type PostDialogFooterLabels = PostsMessages["footer"];

export type PostDialogFooterActionsInput = {
  status: PostDialogFooterStatus | null | undefined;
  mode: "create" | "edit";
  hasSchedule: boolean;
  metaConnected: boolean;
  canPublishNow: boolean;
  canRevertToDraft: boolean;
  canRetryDraft: boolean;
  canRetrySchedule: boolean;
  canDelete: boolean;
  labels: PostDialogFooterLabels;
};

/**
 * Ações do rodapé do diálogo de post — no máximo um `default` (primário).
 * Ordem: deletar → secundários → primário (badge fica fora). Sem “Fechar” (já no header).
 */
export function getPostDialogFooterActions(
  input: PostDialogFooterActionsInput,
): PostDialogFooterAction[] {
  const {
    status,
    mode,
    hasSchedule,
    metaConnected,
    canPublishNow,
    canRevertToDraft,
    canRetryDraft,
    canRetrySchedule,
    canDelete,
    labels,
  } = input;

  const effectiveStatus: PostDialogFooterStatus | "create" =
    mode === "create" ? "create" : (status ?? "draft");

  const withDelete = (
    actions: PostDialogFooterAction[],
    label = labels.delete,
  ): PostDialogFooterAction[] => {
    if (!canDelete) {
      return actions;
    }
    return [
      {
        id: "delete",
        label,
        variant: "ghost",
      },
      ...actions,
    ];
  };

  switch (effectiveStatus) {
    case "create": // create ainda não tem id persistido — sem delete
    {
      const actions: PostDialogFooterAction[] = [];
      if (canPublishNow) {
        actions.push({
          id: "publish_now",
          label: labels.publishNow,
          variant: "outline",
          disabled: !metaConnected,
        });
      }
      if (hasSchedule) {
        actions.push({
          id: "schedule",
          label: labels.schedulePublication,
          variant: "outline",
          disabled: !metaConnected,
        });
      }
      actions.push({
        id: "save_draft",
        label: labels.saveDraft,
        variant: "default",
      });
      return actions;
    }

    case "draft": {
      const actions: PostDialogFooterAction[] = [];
      if (canPublishNow) {
        actions.push({
          id: "publish_now",
          label: labels.publishNow,
          variant: "outline",
          disabled: !metaConnected,
        });
      }
      if (hasSchedule) {
        actions.push({
          id: "schedule",
          label: labels.schedulePublication,
          variant: "outline",
          disabled: !metaConnected,
        });
      }
      actions.push({
        id: "save_draft",
        label: labels.saveDraft,
        variant: "default",
      });
      return withDelete(actions);
    }

    case "scheduled": {
      const actions: PostDialogFooterAction[] = [];
      if (canRevertToDraft) {
        actions.push({
          id: "revert_to_draft",
          label: labels.unschedule,
          variant: "ghost",
        });
      }
      if (canPublishNow) {
        actions.push({
          id: "publish_now",
          label: labels.publishNow,
          variant: "outline",
          disabled: !metaConnected,
        });
      }
      actions.push({
        id: "save_scheduled",
        label: labels.save,
        variant: "default",
        disabled: !metaConnected,
      });
      return withDelete(actions);
    }

    case "failed": {
      const actions: PostDialogFooterAction[] = [];
      if (canRetryDraft) {
        actions.push({
          id: "retry_draft",
          label: labels.backToDraft,
          variant: "ghost",
        });
      }
      if (canRetrySchedule) {
        actions.push({
          id: "retry_schedule",
          label: labels.reschedule,
          variant: "outline",
          disabled: !metaConnected || !hasSchedule,
        });
      }
      return withDelete(actions);
    }

    case "cancelled": {
      const actions: PostDialogFooterAction[] = [];
      if (canRevertToDraft) {
        actions.push({
          id: "revert_to_draft",
          label: labels.restoreDraft,
          variant: "ghost",
        });
      }
      return withDelete(actions, labels.deletePermanent);
    }

    case "published":
    case "monitored":
      return [];

    default:
      return [];
  }
}

export function countPrimaryFooterActions(
  actions: PostDialogFooterAction[],
): number {
  return actions.filter((action) => action.variant === "default").length;
}
