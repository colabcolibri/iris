import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/lib/types";

type DisplayComment = Comment & { depth: number };

function initials(username: string | undefined): string {
  const value = username?.trim() || "?";
  return value.slice(0, 2).toUpperCase();
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
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
          style={{ marginLeft: `${Math.min(comment.depth, 4) * 16}px` }}
        >
          <div className="flex gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-[10px] font-semibold">
                {initials(comment.author_username)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{comment.author_username ?? "usuário"}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString("pt-BR")}
                </span>
                {comment.status ? (
                  <Badge variant={statusVariant(comment.status)} className="text-[10px]">
                    {comment.status}
                  </Badge>
                ) : null}
              </div>

              <p className="wrap-break-word text-sm leading-relaxed">
                {comment.text ?? "(sem texto)"}
              </p>

              {comment.draft_text ? (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-primary">Rascunho da IA</p>
                  <p className="wrap-break-word text-sm">{comment.draft_text}</p>
                  {comment.status === "pending" ? (
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
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
