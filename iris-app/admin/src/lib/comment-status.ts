import type { Comment } from "@/lib/types";

export const COMMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando resposta",
  replied: "Respondido",
  skipped: "Ignorado",
  failed: "Falha",
};

export function isCommentDeletedOnInstagram(
  comment: Pick<Comment, "deleted_at">,
): boolean {
  return Boolean(comment.deleted_at);
}

/** Label curto para badge na thread — omitimos estados já resolvidos. */
export function commentStatusBadgeLabel(comment: Comment): string | null {
  if (isCommentDeletedOnInstagram(comment)) {
    return "Removido no IG";
  }
  if (comment.status === "replied" || comment.status === "skipped") {
    return null;
  }
  if (comment.status === "pending") {
    return comment.draft_text ? "Aguardando aprovação" : COMMENT_STATUS_LABELS.pending;
  }
  if (comment.status === "failed") {
    return COMMENT_STATUS_LABELS.failed;
  }
  if (comment.status === "skipped") {
    return COMMENT_STATUS_LABELS.skipped;
  }
  return null;
}

export function commentStatusHint(comment: Comment): string {
  if (isCommentDeletedOnInstagram(comment)) {
    return "Este comentário não aparece mais no Instagram. Sincronize o post para atualizar.";
  }
  if (comment.status === "pending" && comment.draft_text) {
    return "A Iris gerou um rascunho — revise e aprove para publicar no Instagram.";
  }
  if (comment.status === "pending") {
    return "Comentário recebido; a Iris ainda não publicou resposta neste thread.";
  }
  if (comment.status === "failed") {
    return "A resposta automática falhou. Tente sincronizar ou responder manualmente.";
  }
  if (comment.status === "skipped") {
    return "Este comentário foi ignorado pela automação.";
  }
  if (comment.status === "skipped") {
    return "Comentário da marca (não requer resposta da Iris).";
  }
  return "";
}
