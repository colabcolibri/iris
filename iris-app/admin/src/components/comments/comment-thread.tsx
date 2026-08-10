import { Loader2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/types";

type DisplayComment = Comment & { depth: number };

function initials(username: string | undefined): string {
  const value = username?.trim() || "?";
  return value.slice(0, 2).toUpperCase();
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
  return "outline";
}

type CommentThreadProps = {
  comments: DisplayComment[];
  approvingId: string | null;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
};

export function CommentThread({ comments, approvingId, onApproveDraft }: CommentThreadProps) {
  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment, index) => {
        const isReply = comment.depth > 0;
        const username = comment.author_username ?? "usuário";
        const handle = username.startsWith("@") ? username : `@${username}`;

        return (
          <div key={comment.id}>
            <div
              className={cn(
                "flex gap-3",
                isReply && "ml-4 border-l-2 border-border/40 pl-4",
              )}
            >
              <Avatar
                className={cn(
                  "shrink-0 border border-border/30",
                  isReply ? "size-8" : "size-10",
                )}
              >
                <AvatarFallback className="text-[10px] font-semibold">
                  {initials(comment.author_username)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground">{handle}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    {comment.status ? (
                      <Badge
                        variant={statusVariant(comment.status)}
                        className="ml-2 align-middle text-[10px]"
                      >
                        {comment.status}
                      </Badge>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Mais opções"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>

                <p className="wrap-break-word text-base leading-relaxed text-foreground">
                  {comment.text ?? "(sem texto)"}
                </p>

                {comment.draft_text ? (
                  <div className="mt-2 rounded-lg border border-primary/30 bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-primary">Rascunho da IA</p>
                    <p className="mt-1 wrap-break-word text-sm">{comment.draft_text}</p>
                    {comment.status === "pending" ? (
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={approvingId === comment.id}
                          onClick={() => onApproveDraft(comment.id, comment.draft_text)}
                        >
                          {approvingId === comment.id ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : null}
                          Aprovar e publicar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {!isReply && !comment.draft_text ? (
                  <div className="mt-1 flex gap-3">
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Responder
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Ocultar
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {index < comments.length - 1 ? (
              <hr className="mt-4 border-border/30" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
