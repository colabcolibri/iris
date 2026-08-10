import { useCallback, useState } from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { commentStatusBadgeLabel, commentStatusHint } from "@/lib/comment-status";
import type { CommentTreeNode } from "@/lib/build-comment-tree";
import { indexCommentsByIgId } from "@/lib/build-comment-tree";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/types";
import { ReplyAuditSection } from "@/components/comments/reply-audit-section";

function shouldShowReplyAudit(node: Comment): boolean {
  if (node.draft_text) {
    return true;
  }
  const status = node.status ?? "";
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

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "agora";
  }
  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours} hora${diffHours === 1 ? "" : "s"}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
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

function countDescendants(node: CommentTreeNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

function hasChildWithIgId(node: CommentTreeNode, igCommentId: string | null | undefined): boolean {
  if (!igCommentId) {
    return false;
  }
  if (node.ig_comment_id === igCommentId) {
    return true;
  }
  return node.children.some((child) => hasChildWithIgId(child, igCommentId));
}

function threadBranchClass(depth: number): string | null {
  if (depth <= 0) {
    return null;
  }

  return cn(
    "border-l-2 border-border/60 ps-3 ms-2 sm:ms-3 pt-3",
    depth > 1 && "border-border/45",
  );
}

function avatarSizeClass(depth: number): string {
  if (depth <= 0) {
    return "size-9";
  }
  if (depth === 1) {
    return "size-8";
  }
  return "size-7";
}

type CommentThreadProps = {
  roots: CommentTreeNode[];
  allComments: Comment[];
  brandUsername?: string | null;
  approvingId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
};

type CommentItemProps = {
  node: CommentTreeNode;
  depth: number;
  byIgId: Map<string, Comment>;
  brandUsername?: string | null;
  approvingId: string | null;
  collapsedIds: Set<string>;
  onToggleCollapse: (commentId: string) => void;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
};

function CommentItem({
  node,
  depth,
  byIgId,
  brandUsername,
  approvingId,
  collapsedIds,
  onToggleCollapse,
  onApproveDraft,
}: CommentItemProps) {
  const handle = formatHandle(node.author_username);
  const statusLabel = commentStatusBadgeLabel(node);
  const replyTarget = parentHandle(node, byIgId);
  const showLinkedReply =
    Boolean(node.linked_reply_text) &&
    !hasChildWithIgId(node, node.linked_reply_ig_comment_id);
  const linkedReplyTarget = replyToHandle(node.reply_to_ig_comment_id, byIgId, handle);
  const descendantCount = countDescendants(node);
  const isCollapsed = collapsedIds.has(node.id);
  const brandHandle = formatHandle(brandUsername ?? "marca");
  const branchClass = threadBranchClass(depth);

  const body = (
    <>
      <div className="flex gap-2.5">
        <Avatar
          className={cn(
            "shrink-0 border border-border/30",
            avatarSizeClass(depth),
          )}
        >
          <AvatarFallback className="text-[10px] font-semibold">
            {initials(node.author_username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-foreground">{handle}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(node.created_at)}
                </span>
                {statusLabel ? (
                  <Badge
                    variant={statusVariant(node.status ?? "")}
                    className="text-[10px]"
                    title={commentStatusHint(node)}
                  >
                    {statusLabel}
                  </Badge>
                ) : null}
              </div>
              {replyTarget && depth > 0 ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Em resposta a{" "}
                  <span className="font-medium text-foreground/80">{replyTarget}</span>
                </p>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Mais opções"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => void copyToClipboard(node.text ?? "", "Texto")}
                  >
                    Copiar texto
                  </DropdownMenuItem>
                  {node.ig_comment_id ? (
                    <DropdownMenuItem
                      onClick={() => void copyToClipboard(node.ig_comment_id!, "ID Meta")}
                    >
                      Copiar ID do comentário
                    </DropdownMenuItem>
                  ) : null}
                  {node.parent_ig_comment_id ? (
                    <DropdownMenuItem
                      onClick={() =>
                        void copyToClipboard(node.parent_ig_comment_id!, "ID respondido")
                      }
                    >
                      Copiar ID respondido
                    </DropdownMenuItem>
                  ) : null}
                  {node.reply_to_ig_comment_id &&
                  node.reply_to_ig_comment_id !== node.parent_ig_comment_id ? (
                    <DropdownMenuItem
                      onClick={() =>
                        void copyToClipboard(node.reply_to_ig_comment_id!, "ID vinculado")
                      }
                    >
                      Copiar ID da resposta vinculada
                    </DropdownMenuItem>
                  ) : null}
                  {descendantCount > 0 ? (
                    <DropdownMenuItem onClick={() => onToggleCollapse(node.id)}>
                      {isCollapsed ? "Mostrar conversa" : "Ocultar conversa"}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-1 wrap-break-word text-[15px] leading-relaxed text-foreground">
            {node.text ?? "(sem texto)"}
          </p>

          {node.draft_text ? (
            <div className="mt-2 rounded-2xl border border-primary/25 bg-primary/5 px-3 py-2.5">
              <p className="text-xs font-semibold text-primary">Sugestão da IA</p>
              <p className="mt-1 wrap-break-word text-sm leading-relaxed">{node.draft_text}</p>
              {node.status === "pending" ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={approvingId === node.id}
                    onClick={() => onApproveDraft(node.id, node.draft_text)}
                  >
                    {approvingId === node.id ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Aprovar e publicar
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {shouldShowReplyAudit(node) ? (
            <ReplyAuditSection commentId={node.id} className="mt-2" />
          ) : null}

          {node.error_message ? (
            <p className="mt-2 text-xs text-muted-foreground">{node.error_message}</p>
          ) : null}

          {showLinkedReply ? (
            <div className="mt-2 border-l-2 border-primary/30 ps-3 ms-1">
              <div className="flex gap-2.5">
                <Avatar className="size-7 shrink-0 border border-border/30">
                  <AvatarFallback className="text-[9px] font-semibold">
                    {initials(brandUsername ?? "marca")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 rounded-2xl bg-muted/55 px-3 py-2">
                  <p className="text-xs font-semibold text-foreground">{brandHandle}</p>
                  <p className="mt-0.5 wrap-break-word text-sm leading-relaxed text-foreground/90">
                    {node.linked_reply_text}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Em resposta a{" "}
                    <span className="font-medium text-foreground/80">{linkedReplyTarget}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {descendantCount > 0 && isCollapsed ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-primary hover:underline"
              onClick={() => onToggleCollapse(node.id)}
            >
              Ver {descendantCount} resposta{descendantCount === 1 ? "" : "s"}
            </button>
          ) : null}

          {node.children.length > 0 && !isCollapsed ? (
            <div className={cn(depth === 0 ? "mt-3" : "mt-2")}>
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  byIgId={byIgId}
                  brandUsername={brandUsername}
                  approvingId={approvingId}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={onToggleCollapse}
                  onApproveDraft={onApproveDraft}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  if (branchClass) {
    return (
      <div className={branchClass} role="listitem" aria-level={depth + 1}>
        {body}
      </div>
    );
  }

  return (
    <div role="listitem" aria-level={depth + 1}>
      {body}
    </div>
  );
}

export function CommentThread({
  roots,
  allComments,
  brandUsername,
  approvingId,
  onApproveDraft,
}: CommentThreadProps) {
  const byIgId = indexCommentsByIgId(allComments);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const onToggleCollapse = useCallback((commentId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  if (roots.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6" role="list">
      {roots.map((root) => (
        <article key={root.id} className="min-w-0 border-b border-border/40 pb-6 last:border-b-0 last:pb-0">
          <CommentItem
            node={root}
            depth={0}
            byIgId={byIgId}
            brandUsername={brandUsername}
            approvingId={approvingId}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
            onApproveDraft={onApproveDraft}
          />
        </article>
      ))}
    </div>
  );
}
