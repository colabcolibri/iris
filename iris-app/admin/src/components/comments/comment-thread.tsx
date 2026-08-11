import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, FileText, Loader2, MessageCircle, Pin } from "lucide-react";
import { toast } from "sonner";
import { AppAccordion } from "@/components/templates/app-accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentStatusBadgeLabel, commentStatusHint } from "@/lib/comment-status";
import type { CommentThreadGroup } from "@/lib/build-comment-tree";
import { cn } from "@/lib/utils";
import {
  commentTimestamp,
  defaultCollapsedThreadIds,
  formatCommentExactTime,
  indexCommentsByIgId,
  isBrandAuthor,
  shouldShowLinkedReply,
  threadNeedsAttention,
} from "@/lib/build-comment-tree";
import type { Comment } from "@/lib/types";
import {
  ReplyAuditPanel,
  ReplyAuditTrigger,
  useReplyAudit,
} from "@/components/comments/reply-audit-section";

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

function formatHandle(username: string | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
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

function previewText(text: string | undefined, max = 140): string {
  const value = text?.trim() || "(sem texto)";
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

function parentHandle(comment: Comment, byIgId: Map<string, Comment>): string | null {
  const parentId = comment.parent_ig_comment_id;
  if (!parentId) {
    return null;
  }
  const parent = byIgId.get(parentId);
  return parent?.author_username ? formatHandle(parent.author_username) : null;
}

function replyToHandle(
  replyToIgId: string | null | undefined,
  byIgId: Map<string, Comment>,
  fallbackHandle: string,
): string {
  if (!replyToIgId) {
    return fallbackHandle;
  }
  const target = byIgId.get(replyToIgId);
  if (target?.author_username) {
    return formatHandle(target.author_username);
  }
  return fallbackHandle;
}

function PinnedPostCommentBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
      title="Comentário fixo no post"
    >
      <Pin className="size-3 shrink-0" aria-hidden />
      No post
    </span>
  );
}

const brandReplySurfaceClass =
  "border-primary/30 bg-primary/8 dark:border-primary/35 dark:bg-primary/12";
const brandReplyLinkedSurfaceClass =
  "border border-primary/25 bg-primary/10 dark:bg-primary/15";

function canRequestManualAiReply(
  comment: Comment,
  brandUsername?: string | null,
): boolean {
  if (isBrandAuthor(comment.author_username, brandUsername)) {
    return false;
  }
  if (comment.linked_reply_text) {
    return false;
  }
  const status = comment.status ?? "";
  return status === "pending" || status === "failed";
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
  const canAct = comment.status === "pending";

  if (editing) {
    return (
      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sugestão da IA</p>
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
            Cancelar
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
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sugestão da IA</p>
      <p className="mt-1.5 wrap-break-word text-sm leading-relaxed">{comment.draft_text}</p>
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
            Deletar
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
            Editar
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
            Publicar
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
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Gerar rascunho"
          title="Gerar rascunho"
          disabled={generating}
          onClick={onGenerateDraft}
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
        </button>
      ) : null}
      {showAudit && onAuditClick ? (
        <ReplyAuditTrigger active={auditActive} onClick={onAuditClick} />
      ) : null}
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Copiar texto"
        title="Copiar texto"
        onClick={() => void copyToClipboard(comment.text ?? "", "Texto")}
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
}: CommentBodyProps) {
  const handle = formatHandle(comment.author_username);
  const isBrandReply = isBrandAuthor(comment.author_username, brandUsername);
  const statusLabel = commentStatusBadgeLabel(comment);
  const replyTarget = parentHandle(comment, byIgId);
  const showLinkedReply = shouldShowLinkedReply(comment, group, brandUsername);
  const linkedReplyTarget = replyToHandle(comment.reply_to_ig_comment_id, byIgId, handle);
  const brandHandle = formatHandle(brandUsername ?? "marca");
  const showAudit = shouldShowReplyAudit(comment);
  const auditState = useReplyAudit(comment.id);

  return (
    <div className="group/comment min-w-0">
      <div className="flex items-start gap-3">
        <Avatar
          className={cn(
            "size-9 shrink-0 border",
            isBrandReply ? "border-primary/35 bg-primary/10" : "border-border/40",
          )}
        >
          <AvatarFallback
            className={cn(
              "text-[10px] font-semibold",
              isBrandReply && "text-primary",
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
                    isBrandReply ? "text-primary" : "text-foreground",
                  )}
                >
                  {handle}
                </span>
                {isPinnedOnPost ? <PinnedPostCommentBadge /> : null}
                <span className="text-xs text-muted-foreground" title={commentTimestamp(comment)}>
                  {formatCommentExactTime(commentTimestamp(comment))}
                </span>
                {statusLabel ? (
                  <Badge
                    variant={statusVariant(comment.status ?? "")}
                    className="text-[10px]"
                    title={commentStatusHint(comment)}
                  >
                    {statusLabel}
                  </Badge>
                ) : null}
              </div>
              {replyTarget && showReplyContext ? (
                <p className="text-xs text-muted-foreground">
                  Em resposta a{" "}
                  <span className="font-medium text-foreground/80">{replyTarget}</span>
                </p>
              ) : null}
            </div>

            <CommentActions
              comment={comment}
              brandUsername={brandUsername}
              showAudit={showAudit}
              auditActive={auditState.open}
              onAuditClick={() => void auditState.toggle()}
              generating={generatingId === comment.id}
              onGenerateDraft={() => onGenerateDraft(comment.id)}
            />
          </div>

          <p className="mt-1.5 wrap-break-word text-[15px] leading-relaxed text-foreground">
            {comment.text ?? "(sem texto)"}
          </p>

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
            <p className="mt-2 text-xs text-muted-foreground">{comment.error_message}</p>
          ) : null}

          {showLinkedReply ? (
            <div className={cn("mt-3 rounded-xl px-3 py-2.5", brandReplyLinkedSurfaceClass)}>
              <div className="flex gap-2.5">
                <Avatar className="size-7 shrink-0 border border-primary/35 bg-primary/10">
                  <AvatarFallback className="text-[9px] font-semibold text-primary">
                    {initials(brandUsername ?? "marca")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">{brandHandle}</p>
                  <p className="mt-0.5 wrap-break-word text-sm leading-relaxed text-foreground/90">
                    {comment.linked_reply_text}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Em resposta a{" "}
                    <span className="font-medium text-foreground/80">{linkedReplyTarget}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {showAudit ? <ReplyAuditPanel {...auditState} className="mt-3" /> : null}
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
  auditState: ReturnType<typeof useReplyAudit>;
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
  auditState,
}: CommentRootExtrasProps) {
  const handle = formatHandle(comment.author_username);
  const showLinkedReply = shouldShowLinkedReply(comment, group, brandUsername);
  const linkedReplyTarget = replyToHandle(comment.reply_to_ig_comment_id, byIgId, handle);
  const brandHandle = formatHandle(brandUsername ?? "marca");
  const showAudit = shouldShowReplyAudit(comment);

  const hasExtras =
    Boolean(comment.draft_text) ||
    Boolean(comment.error_message) ||
    showLinkedReply ||
    (showAudit && auditState.open);

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
        <div className={cn("rounded-xl px-3 py-2.5", brandReplyLinkedSurfaceClass)}>
          <div className="flex gap-2.5">
            <Avatar className="size-7 shrink-0 border border-primary/35 bg-primary/10">
              <AvatarFallback className="text-[9px] font-semibold text-primary">
                {initials(brandUsername ?? "marca")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">{brandHandle}</p>
              <p className="mt-0.5 wrap-break-word text-sm leading-relaxed text-foreground/90">
                {comment.linked_reply_text}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Em resposta a{" "}
                <span className="font-medium text-foreground/80">{linkedReplyTarget}</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showAudit ? <ReplyAuditPanel {...auditState} /> : null}
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
}: ThreadCardProps) {
  const isBrandRoot = isBrandAuthor(group.root.author_username, brandUsername);

  return (
    <article
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        isBrandRoot ? brandReplySurfaceClass : "border-border/60 bg-card",
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
  const root = group.root;
  const handle = formatHandle(root.author_username);
  const statusLabel = commentStatusBadgeLabel(root);
  const replyCount = group.replies.length;
  const needsAttention = threadNeedsAttention(group);

  return (
    <AppAccordion.Header className="transition-colors hover:bg-muted/30 has-data-panel-open:bg-muted/20">
      <div className="flex w-full min-w-0 items-start gap-2 px-4 py-4">
        <AppAccordion.PanelTrigger>
          <Avatar className="size-9 shrink-0 border border-border/40">
            <AvatarFallback className="text-[10px] font-semibold">
              {initials(root.author_username)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">{handle}</span>
              <span className="text-xs text-muted-foreground" title={commentTimestamp(root)}>
                {formatCommentExactTime(commentTimestamp(root))}
              </span>
              {statusLabel ? (
                <Badge variant={statusVariant(root.status ?? "")} className="text-[10px]">
                  {statusLabel}
                </Badge>
              ) : null}
              {needsAttention ? (
                <Badge variant="secondary" className="text-[10px]">
                  Atenção
                </Badge>
              ) : null}
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">
              {previewText(root.text)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {replyCount} resposta{replyCount === 1 ? "" : "s"} na conversa
            </span>
          </div>
        </AppAccordion.PanelTrigger>

        <div className="flex shrink-0 items-center gap-0.5 self-start">
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
}: ThreadAccordionItemProps) {
  const root = group.root;
  const showAudit = shouldShowReplyAudit(root);
  const auditState = useReplyAudit(root.id);

  return (
    <AppAccordion.Item
      value={root.id}
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
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
          auditState={auditState}
        />

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversa
          </p>
          <div className="space-y-3">
            {group.replies.map((reply) => {
              const isBrandReply = isBrandAuthor(reply.author_username, brandUsername);

              return (
                <div
                  key={reply.id}
                  className={cn(
                    "rounded-lg border px-3 py-3",
                    isBrandReply
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
  const groupsKey = useMemo(() => groups.map((group) => group.root.id).join("|"), [groups]);
  const [openIds, setOpenIds] = useState<string[]>(() =>
    groups
      .filter((group) => !defaultCollapsedThreadIds(groups).has(group.root.id))
      .map((group) => group.root.id),
  );

  useEffect(() => {
    const collapsed = defaultCollapsedThreadIds(groups);
    setOpenIds(groups.filter((group) => !collapsed.has(group.root.id)).map((group) => group.root.id));
  }, [groupsKey, groups]);

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
            />
          ))}
        </AppAccordion>
      ) : null}
    </div>
  );
}
