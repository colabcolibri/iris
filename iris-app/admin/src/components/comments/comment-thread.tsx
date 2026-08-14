import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Loader2, MessageCircle, Pin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppAccordion } from "@/components/templates/app-accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  commentStatusBadgeLabel,
  commentStatusHint,
  isCommentDeletedOnInstagram,
} from "@/lib/comment-status";
import type { CommentThreadGroup } from "@/lib/build-comment-tree";
import { cn } from "@/lib/utils";
import {
  commentTimestamp,
  formatCommentExactTime,
  indexCommentsByIgId,
  isBrandAuthor,
  shouldShowLinkedReply,
  threadNeedsAttention,
} from "@/lib/build-comment-tree";
import type { Comment } from "@/lib/types";
import {
  commentTextClassName,
  displayCommentText,
} from "@/lib/comment-text-display";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import {
  ReplyAuditPanel,
  ReplyAuditTrigger,
  useReplyAudit,
} from "@/components/comments/reply-audit-section";

function formatHandle(username: string | undefined, defaultUser: string): string {
  const value = username?.trim() || defaultUser;
  return value.startsWith("@") ? value : `@${value}`;
}

function shouldShowReplyAudit(comment: Comment): boolean {
  if (comment.draft_text) {
    return true;
  }
  const status = comment.status ?? "";
  return status === "skipped" || status === "failed" || status === "replied";
}

function initials(username: string | undefined): string {
  const value = username?.trim() || "?";
  return value.slice(0, 2).toUpperCase();
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "pending") {
    return "secondary";
  }
  if (status === "failed") {
    return "destructive";
  }
  if (status === "skipped") {
    return "outline";
  }
  return "outline";
}

function statusBadgeClassName(comment: Comment): string {
  if (isCommentDeletedOnInstagram(comment)) {
    return deletedCommentBadgeClass;
  }
  return "";
}

function previewText(text: string | undefined, noText: string, max = 140): string {
  const value = displayCommentText(text, noText);
  if (value === noText) {
    return value;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

async function copyToClipboard(
  value: string,
  label: string,
  copiedTemplate: string,
  copyFailed: string,
) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(interpolate(copiedTemplate, { label }));
  } catch {
    toast.error(copyFailed);
  }
}

function parentHandle(
  comment: Comment,
  byIgId: Map<string, Comment>,
  defaultUser: string,
): string | null {
  const parentId = comment.parent_ig_comment_id;
  if (!parentId) {
    return null;
  }
  const parent = byIgId.get(parentId);
  return parent?.author_username
    ? formatHandle(parent.author_username, defaultUser)
    : null;
}

function replyToHandle(
  replyToIgId: string | null | undefined,
  byIgId: Map<string, Comment>,
  fallbackHandle: string,
  defaultUser: string,
): string {
  if (!replyToIgId) {
    return fallbackHandle;
  }
  const target = byIgId.get(replyToIgId);
  if (target?.author_username) {
    return formatHandle(target.author_username, defaultUser);
  }
  return fallbackHandle;
}

function PinnedPostCommentBadge() {
  const thread = useDomainMessages("comments").thread;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
      title={thread.pinnedTitle}
    >
      <Pin className="size-3 shrink-0" aria-hidden />
      {thread.pinnedBadge}
    </span>
  );
}

const brandReplySurfaceClass =
  "border-primary/30 bg-primary/8 dark:border-primary/35 dark:bg-primary/12";
const brandReplyLinkedSurfaceClass =
  "border border-primary/25 bg-primary/10 dark:bg-primary/15";
const deletedCommentSurfaceClass =
  "border border-dashed border-muted-foreground/40 bg-muted/60 dark:bg-muted/30";
const deletedCommentBadgeClass =
  "border-muted-foreground/45 bg-muted text-muted-foreground";

function canRequestManualAiReply(
  comment: Comment,
  brandUsername?: string | null,
): boolean {
  if (isCommentDeletedOnInstagram(comment)) {
    return false;
  }
  if (isBrandAuthor(comment.author_username, brandUsername)) {
    return false;
  }
  const status = comment.status ?? "";
  return status === "pending" || status === "failed" || status === "replied";
}

type CommentDraftPanelProps = {
  comment: Comment;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
};

function CommentDraftPanel({
  comment,
  approvingId,
  removingDraftId,
  savingDraftId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
}: CommentDraftPanelProps) {
  const thread = useDomainMessages("comments").thread;
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(comment.draft_text ?? "");

  useEffect(() => {
    if (!editing) {
      setDraftValue(comment.draft_text ?? "");
    }
  }, [comment.draft_text, editing]);

  if (!comment.draft_text && !editing) {
    return null;
  }

  const busy =
    approvingId === comment.id ||
    removingDraftId === comment.id ||
    savingDraftId === comment.id;
  const canAct =
    comment.status === "pending" ||
    comment.status === "replied" ||
    Boolean(comment.draft_text);

  if (editing) {
    return (
      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {thread.aiSuggestion}
        </p>
        <Textarea
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          disabled={busy}
          rows={4}
          className="mt-2 min-h-24 resize-y bg-background/80 text-sm leading-relaxed"
        />
        <div className="mt-3 flex flex-row flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setDraftValue(comment.draft_text ?? "");
              setEditing(false);
            }}
          >
            {thread.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy || !draftValue.trim()}
            onClick={() => {
              void (async () => {
                try {
                  await onSaveDraft(comment.id, draftValue.trim());
                  setEditing(false);
                } catch {
                  // Mantém edição aberta em caso de erro.
                }
              })();
            }}
          >
            {savingDraftId === comment.id ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {thread.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Sugestão da IA
      </p>
      <p className="mt-1.5 wrap-break-word text-sm leading-relaxed whitespace-pre-wrap">
        {displayCommentText(comment.draft_text, thread.noText)}
      </p>
      {canAct ? (
        <div className="mt-3 flex flex-row flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onRemoveDraft(comment.id)}
          >
            {removingDraftId === comment.id ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {thread.delete}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setDraftValue(comment.draft_text ?? "");
              setEditing(true);
            }}
          >
            {thread.edit}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onApproveDraft(comment.id, comment.draft_text)}
          >
            {approvingId === comment.id ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {thread.publish}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type CommentActionsProps = {
  comment: Comment;
  brandUsername?: string | null;
  showAudit: boolean;
  auditActive?: boolean;
  onAuditClick?: () => void;
  alwaysShowActions?: boolean;
  generating?: boolean;
  onGenerateDraft?: () => void;
};

function CommentActions({
  comment,
  brandUsername,
  showAudit,
  auditActive = false,
  onAuditClick,
  alwaysShowActions = false,
  generating = false,
  onGenerateDraft,
}: CommentActionsProps) {
  const thread = useDomainMessages("comments").thread;
  const showGenerateDraft =
    canRequestManualAiReply(comment, brandUsername) && onGenerateDraft;

  return (
    <div
      className={
        alwaysShowActions
          ? "flex shrink-0 items-center gap-0.5"
          : "flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100"
      }
    >
      {showGenerateDraft ? (
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-primary/80 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          aria-label={thread.generateDraft}
          title={thread.generateDraftAi}
          disabled={generating}
          onClick={onGenerateDraft}
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
        </button>
      ) : null}
      {showAudit && onAuditClick ? (
        <ReplyAuditTrigger active={auditActive} onClick={onAuditClick} />
      ) : null}
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={thread.copyTextAria}
        title={thread.copyTextTitle}
        onClick={() =>
          void copyToClipboard(
            comment.text ?? "",
            thread.textLabel,
            thread.copied,
            thread.copyFailed,
          )
        }
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

type CommentThreadProps = {
  groups: CommentThreadGroup[];
  allComments: Comment[];
  brandUsername?: string | null;
  focusCommentId?: string | null;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (commentId: string) => void;
};

type CommentBodyProps = {
  comment: Comment;
  byIgId: Map<string, Comment>;
  brandUsername?: string | null;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (commentId: string) => void;
  group: CommentThreadGroup;
  showReplyContext?: boolean;
  isPinnedOnPost?: boolean;
  highlightCommentId?: string | null;
};

function CommentBody({
  comment,
  byIgId,
  brandUsername,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  group,
  showReplyContext = false,
  isPinnedOnPost = false,
  highlightCommentId = null,
}: CommentBodyProps) {
  const { locale } = useAppLocale();
  const thread = useDomainMessages("comments").thread;
  const handle = formatHandle(comment.author_username, thread.defaultUser);
  const isBrandReply = isBrandAuthor(comment.author_username, brandUsername);
  const statusLabel = commentStatusBadgeLabel(comment);
  const replyTarget = parentHandle(comment, byIgId, thread.defaultUser);
  const showLinkedReply = shouldShowLinkedReply(comment, group, brandUsername);
  const linkedReplyTarget = replyToHandle(
    comment.reply_to_ig_comment_id,
    byIgId,
    handle,
    thread.defaultUser,
  );
  const brandHandle = formatHandle(brandUsername ?? thread.brandDefault, thread.defaultUser);
  const showAudit = shouldShowReplyAudit(comment);
  const auditState = useReplyAudit(comment.id);
  const isDeletedOnInstagram = isCommentDeletedOnInstagram(comment);

  return (
    <div
      id={`comment-focus-${comment.id}`}
      className={cn(
        "group/comment min-w-0 scroll-mt-24",
        highlightCommentId === comment.id &&
          "rounded-lg ring-2 ring-primary/60 ring-offset-2 ring-offset-background transition-shadow",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          className={cn(
            "size-9 shrink-0 border",
            isDeletedOnInstagram
              ? "border-muted-foreground/30 bg-muted/80 grayscale"
              : isBrandReply
                ? "border-primary/35 bg-primary/10"
                : "border-border/40",
          )}
        >
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              isDeletedOnInstagram
                ? "text-muted-foreground"
                : isBrandReply && "text-primary",
            )}
          >
            {initials(comment.author_username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isDeletedOnInstagram
                      ? "text-muted-foreground line-through decoration-muted-foreground/70"
                      : isBrandReply
                        ? "text-primary"
                        : "text-foreground",
                  )}
                >
                  {handle}
                </span>
                {isPinnedOnPost ? <PinnedPostCommentBadge /> : null}
                <span
                  className="text-xs text-muted-foreground"
                  title={commentTimestamp(comment)}
                >
                  {formatCommentExactTime(commentTimestamp(comment), locale)}
                </span>
                {statusLabel ? (
                  <Badge
                    variant={statusVariant(comment.status ?? "")}
                    className={cn("text-xs", statusBadgeClassName(comment))}
                    title={commentStatusHint(comment)}
                  >
                    {statusLabel}
                  </Badge>
                ) : null}
              </div>
              {isDeletedOnInstagram ? (
                <p className="text-xs text-muted-foreground">
                  Este comentário foi removido no Instagram e não pode receber
                  respostas.
                </p>
              ) : null}
              {replyTarget && showReplyContext ? (
                <p className="text-xs text-muted-foreground">
                  {thread.inReplyTo}{" "}
                  <span className="font-semibold text-foreground/80">
                    {replyTarget}
                  </span>
                </p>
              ) : null}
            </div>

            {!isDeletedOnInstagram ? (
              <CommentActions
                comment={comment}
                brandUsername={brandUsername}
                showAudit={showAudit}
                auditActive={auditState.open}
                onAuditClick={() => void auditState.toggle()}
                generating={generatingId === comment.id}
                onGenerateDraft={() => onGenerateDraft(comment.id)}
              />
            ) : null}
          </div>

          <p
            className={cn(
              "mt-1.5 text-sm leading-normal",
              commentTextClassName,
              isDeletedOnInstagram
                ? "text-muted-foreground/80 line-through decoration-muted-foreground/60"
                : "text-foreground",
            )}
          >
            {displayCommentText(comment.text, thread.noText)}
          </p>

          {!isDeletedOnInstagram ? (
            <CommentDraftPanel
              comment={comment}
              approvingId={approvingId}
              removingDraftId={removingDraftId}
              savingDraftId={savingDraftId}
              onApproveDraft={onApproveDraft}
              onRemoveDraft={onRemoveDraft}
              onSaveDraft={onSaveDraft}
            />
          ) : null}

          {comment.error_message ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {comment.error_message}
            </p>
          ) : null}

          {showLinkedReply ? (
            <div
              className={cn(
                "mt-3 rounded-lg px-3 py-2.5",
                brandReplyLinkedSurfaceClass,
              )}
            >
              <div className="flex gap-2.5">
                <Avatar className="size-7 shrink-0 border border-primary/35 bg-primary/10">
                  <AvatarFallback className="text-xs font-semibold text-primary">
                    {initials(brandUsername ?? thread.brandDefault)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    {brandHandle}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm text-foreground/90",
                      commentTextClassName,
                    )}
                  >
                    {displayCommentText(comment.linked_reply_text, thread.noText)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {thread.inReplyTo}{" "}
                    <span className="font-semibold text-foreground/80">
                      {linkedReplyTarget}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {showAudit && !isDeletedOnInstagram ? (
            <ReplyAuditPanel {...auditState} className="mt-3" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

type CommentRootExtrasProps = {
  comment: Comment;
  byIgId: Map<string, Comment>;
  brandUsername?: string | null;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  group: CommentThreadGroup;
};

function CommentRootExtras({
  comment,
  byIgId,
  brandUsername,
  approvingId,
  removingDraftId,
  savingDraftId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  group,
}: CommentRootExtrasProps) {
  const thread = useDomainMessages("comments").thread;
  const handle = formatHandle(comment.author_username, thread.defaultUser);
  const showLinkedReply = shouldShowLinkedReply(comment, group, brandUsername);
  const linkedReplyTarget = replyToHandle(
    comment.reply_to_ig_comment_id,
    byIgId,
    handle,
    thread.defaultUser,
  );
  const brandHandle = formatHandle(brandUsername ?? thread.brandDefault, thread.defaultUser);

  const hasExtras =
    Boolean(comment.draft_text) ||
    Boolean(comment.error_message) ||
    showLinkedReply;

  if (!hasExtras) {
    return null;
  }

  return (
    <div className="space-y-3 border-b border-border/40 pb-4">
      <CommentDraftPanel
        comment={comment}
        approvingId={approvingId}
        removingDraftId={removingDraftId}
        savingDraftId={savingDraftId}
        onApproveDraft={onApproveDraft}
        onRemoveDraft={onRemoveDraft}
        onSaveDraft={onSaveDraft}
      />

      {comment.error_message ? (
        <p className="text-xs text-muted-foreground">{comment.error_message}</p>
      ) : null}

      {showLinkedReply ? (
        <div
          className={cn(
            "rounded-lg px-3 py-2.5",
            brandReplyLinkedSurfaceClass,
          )}
        >
          <div className="flex gap-2.5">
            <Avatar className="size-7 shrink-0 border border-primary/35 bg-primary/10">
              <AvatarFallback className="text-xs font-semibold text-primary">
                {initials(brandUsername ?? thread.brandDefault)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">
                {brandHandle}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm text-foreground/90",
                  commentTextClassName,
                )}
              >
                {displayCommentText(comment.linked_reply_text, thread.noText)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Em resposta a{" "}
                <span className="font-semibold text-foreground/80">
                  {linkedReplyTarget}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ThreadCardProps = {
  group: CommentThreadGroup;
  byIgId: Map<string, Comment>;
  brandUsername?: string | null;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (commentId: string) => void;
};

function ThreadCard({
  group,
  byIgId,
  brandUsername,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  highlightCommentId = null,
}: ThreadCardProps & { highlightCommentId?: string | null }) {
  const isBrandRoot = isBrandAuthor(group.root.author_username, brandUsername);
  const isDeletedRoot = isCommentDeletedOnInstagram(group.root);

  return (
    <article
      id={`comment-focus-${group.root.id}`}
      className={cn(
        "scroll-mt-24 rounded-lg border p-4",
        highlightCommentId === group.root.id &&
          "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
        isDeletedRoot
          ? deletedCommentSurfaceClass
          : isBrandRoot
            ? brandReplySurfaceClass
            : "border-border/60 bg-card",
      )}
    >
      <CommentBody
        comment={group.root}
        byIgId={byIgId}
        brandUsername={brandUsername}
        approvingId={approvingId}
        removingDraftId={removingDraftId}
        savingDraftId={savingDraftId}
        generatingId={generatingId}
        onApproveDraft={onApproveDraft}
        onRemoveDraft={onRemoveDraft}
        onSaveDraft={onSaveDraft}
        onGenerateDraft={onGenerateDraft}
        group={group}
        isPinnedOnPost
        highlightCommentId={highlightCommentId}
      />
    </article>
  );
}

type ThreadAccordionItemProps = ThreadCardProps;

function ThreadAccordionHeader({
  group,
  showAudit,
  auditActive,
  onAuditClick,
  comment,
  brandUsername,
  generatingId,
  onGenerateDraft,
}: {
  group: CommentThreadGroup;
  showAudit: boolean;
  auditActive: boolean;
  onAuditClick: () => void;
  comment: Comment;
  brandUsername?: string | null;
  generatingId: string | null;
  onGenerateDraft: (commentId: string) => void;
}) {
  const { locale } = useAppLocale();
  const thread = useDomainMessages("comments").thread;
  const root = group.root;
  const handle = formatHandle(root.author_username, thread.defaultUser);
  const statusLabel = commentStatusBadgeLabel(root);
  const replyCount = group.replies.length;
  const needsAttention = threadNeedsAttention(group);
  const isDeletedRoot = isCommentDeletedOnInstagram(root);

  return (
    <AppAccordion.Header
      className={cn(
        "transition-colors hover:bg-muted/30 has-data-panel-open:bg-muted/20",
        isDeletedRoot &&
          "bg-muted/40 hover:bg-muted/50 has-data-panel-open:bg-muted/45",
      )}
    >
      <div className="flex w-full min-w-0 items-start gap-2 px-4 py-4">
        <AppAccordion.PanelTrigger>
          <Avatar
            className={cn(
              "size-9 shrink-0 border",
              isDeletedRoot
                ? "border-muted-foreground/30 bg-muted/80 grayscale"
                : "border-border/40",
            )}
          >
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                isDeletedRoot && "text-muted-foreground",
              )}
            >
              {initials(root.author_username)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isDeletedRoot
                    ? "text-muted-foreground line-through decoration-muted-foreground/70"
                    : "text-foreground",
                )}
              >
                {handle}
              </span>
              <span
                className="text-xs text-muted-foreground"
                title={commentTimestamp(root)}
              >
                {formatCommentExactTime(commentTimestamp(root), locale)}
              </span>
              {statusLabel ? (
                <Badge
                  variant={statusVariant(root.status ?? "")}
                  className={cn("text-xs", statusBadgeClassName(root))}
                  title={commentStatusHint(root)}
                >
                  {statusLabel}
                </Badge>
              ) : null}
              {needsAttention && !isDeletedRoot ? (
                <Badge variant="secondary" className="text-xs">
                  {thread.attention}
                </Badge>
              ) : null}
            </div>

            <p
              className={cn(
                "line-clamp-2 text-sm whitespace-pre-wrap",
                isDeletedRoot
                  ? "text-muted-foreground/80 line-through decoration-muted-foreground/60"
                  : "text-foreground/90",
              )}
            >
              {previewText(root.text, thread.noText)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {replyCount === 1
                ? interpolate(thread.repliesInThreadOne, { count: replyCount })
                : interpolate(thread.repliesInThreadOther, { count: replyCount })}
            </span>
          </div>
        </AppAccordion.PanelTrigger>

        <div className="flex shrink-0 items-center gap-0.5 self-start">
          {!isDeletedRoot ? (
            <CommentActions
              comment={comment}
              brandUsername={brandUsername}
              showAudit={showAudit}
              auditActive={auditActive}
              onAuditClick={onAuditClick}
              alwaysShowActions
              generating={generatingId === comment.id}
              onGenerateDraft={() => onGenerateDraft(comment.id)}
            />
          ) : null}
          <AppAccordion.ChevronTrigger />
        </div>
      </div>
    </AppAccordion.Header>
  );
}

function ThreadAccordionItem({
  group,
  byIgId,
  brandUsername,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  highlightCommentId = null,
}: ThreadAccordionItemProps & { highlightCommentId?: string | null }) {
  const thread = useDomainMessages("comments").thread;
  const root = group.root;
  const showAudit = shouldShowReplyAudit(root);
  const auditState = useReplyAudit(root.id);
  const isDeletedRoot = isCommentDeletedOnInstagram(root);

  return (
    <AppAccordion.Item
      value={root.id}
      id={`comment-focus-${root.id}`}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-lg border",
        highlightCommentId === root.id &&
          "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
        isDeletedRoot ? deletedCommentSurfaceClass : "border-border/60 bg-card",
      )}
    >
      <ThreadAccordionHeader
        group={group}
        comment={root}
        showAudit={showAudit}
        auditActive={auditState.open}
        onAuditClick={() => void auditState.toggle()}
        brandUsername={brandUsername}
        generatingId={generatingId}
        onGenerateDraft={onGenerateDraft}
      />

      {showAudit && auditState.open ? (
        <div className="border-b border-border/40 bg-muted/10 px-4 py-3">
          <ReplyAuditPanel
            {...auditState}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      ) : null}

      <AppAccordion.Content className="space-y-4 border-t border-border/50 bg-muted/15 px-4 pb-4 pt-4">
        <CommentRootExtras
          comment={root}
          byIgId={byIgId}
          brandUsername={brandUsername}
          approvingId={approvingId}
          removingDraftId={removingDraftId}
          savingDraftId={savingDraftId}
          onApproveDraft={onApproveDraft}
          onRemoveDraft={onRemoveDraft}
          onSaveDraft={onSaveDraft}
          group={group}
        />

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {thread.conversation}
          </p>
          <div className="space-y-3">
            {group.replies.map((reply) => {
              const isBrandReply = isBrandAuthor(
                reply.author_username,
                brandUsername,
              );
              const isDeletedReply = isCommentDeletedOnInstagram(reply);

              return (
                <div
                  key={reply.id}
                  className={cn(
                    "rounded-lg border px-3 py-3",
                    isDeletedReply
                      ? deletedCommentSurfaceClass
                      : isBrandReply
                        ? brandReplySurfaceClass
                        : "border-border/50 bg-background/80",
                  )}
                >
                  <CommentBody
                    comment={reply}
                    byIgId={byIgId}
                    brandUsername={brandUsername}
                    approvingId={approvingId}
                    removingDraftId={removingDraftId}
                    savingDraftId={savingDraftId}
                    generatingId={generatingId}
                    onApproveDraft={onApproveDraft}
                    onRemoveDraft={onRemoveDraft}
                    onSaveDraft={onSaveDraft}
                    onGenerateDraft={onGenerateDraft}
                    group={group}
                    showReplyContext
                    highlightCommentId={highlightCommentId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </AppAccordion.Content>
    </AppAccordion.Item>
  );
}

export function CommentThread({
  groups,
  allComments,
  brandUsername,
  focusCommentId = null,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
}: CommentThreadProps) {
  const byIgId = indexCommentsByIgId(allComments);
  const groupsKey = useMemo(
    () => groups.map((group) => group.root.id).join("|"),
    [groups],
  );
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setOpenIds((current) =>
      current.filter((id) => groups.some((group) => group.root.id === id)),
    );
  }, [groupsKey, groups]);

  useEffect(() => {
    if (!focusCommentId) {
      return;
    }

    const group = groups.find(
      (entry) =>
        entry.root.id === focusCommentId ||
        entry.replies.some((reply) => reply.id === focusCommentId),
    );
    if (!group) {
      return;
    }

    if (group.replies.length > 0) {
      setOpenIds((current) =>
        current.includes(group.root.id) ? current : [...current, group.root.id],
      );
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`comment-focus-${focusCommentId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      setHighlightCommentId(focusCommentId);
    });

    const timeout = window.setTimeout(() => {
      setHighlightCommentId(null);
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [focusCommentId, groupsKey, groups]);

  const onOpenChange = useCallback((next: string | string[] | undefined) => {
    const values = Array.isArray(next) ? next : next ? [next] : [];
    setOpenIds(values);
  }, []);

  const withReplies = groups.filter((group) => group.replies.length > 0);
  const withoutReplies = groups.filter((group) => group.replies.length === 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {withoutReplies.map((group) => (
        <ThreadCard
          key={group.root.id}
          group={group}
          byIgId={byIgId}
          brandUsername={brandUsername}
          approvingId={approvingId}
          removingDraftId={removingDraftId}
          savingDraftId={savingDraftId}
          generatingId={generatingId}
          onApproveDraft={onApproveDraft}
          onRemoveDraft={onRemoveDraft}
          onSaveDraft={onSaveDraft}
          onGenerateDraft={onGenerateDraft}
          highlightCommentId={highlightCommentId}
        />
      ))}

      {withReplies.length > 0 ? (
        <AppAccordion
          multiple
          value={openIds}
          onValueChange={onOpenChange}
          className="gap-3"
        >
          {withReplies.map((group) => (
            <ThreadAccordionItem
              key={group.root.id}
              group={group}
              byIgId={byIgId}
              brandUsername={brandUsername}
              approvingId={approvingId}
              removingDraftId={removingDraftId}
              savingDraftId={savingDraftId}
              generatingId={generatingId}
              onApproveDraft={onApproveDraft}
              onRemoveDraft={onRemoveDraft}
              onSaveDraft={onSaveDraft}
              onGenerateDraft={onGenerateDraft}
              highlightCommentId={highlightCommentId}
            />
          ))}
        </AppAccordion>
      ) : null}
    </div>
  );
}
