import type { PostStatus } from "@/lib/types";

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  monitored: "Monitorado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

export const KANBAN_COLUMNS: { id: PostStatus; label: string }[] = [
  { id: "draft", label: "Rascunho" },
  { id: "scheduled", label: "Agendado" },
  { id: "published", label: "Publicado" },
  { id: "failed", label: "Falhou" },
  { id: "cancelled", label: "Cancelado" },
];

export const MOVE_STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "cancelled", label: "Cancelado" },
];

type PostAction = {
  status: PostStatus;
  label: string;
  variant?: "default" | "destructive";
};

/** Ações contextuais por status — labels claros para o menu do kanban. */
export function getKanbanActions(status: PostStatus): PostAction[] {
  switch (status) {
    case "draft":
      return [
        {
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "scheduled":
      return [
        { status: "draft", label: "Desagendar (voltar a rascunho)" },
        {
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "failed":
      return [
        { status: "draft", label: "Voltar a rascunho" },
        {
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "cancelled":
      return [{ status: "draft", label: "Restaurar como rascunho" }];
    default:
      return [];
  }
}
