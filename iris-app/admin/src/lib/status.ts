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

export type KanbanMenuAction =
  | {
      kind: "status";
      status: PostStatus;
      label: string;
      variant?: "default" | "destructive";
    }
  | {
      kind: "purge";
      label: string;
      variant: "destructive";
    };

/** Ações contextuais por status — labels claros para o menu do kanban. */
export function getKanbanActions(status: PostStatus): KanbanMenuAction[] {
  switch (status) {
    case "draft":
      return [
        {
          kind: "status",
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "scheduled":
      return [
        {
          kind: "status",
          status: "draft",
          label: "Desagendar (voltar a rascunho)",
        },
        {
          kind: "status",
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "failed":
      return [
        { kind: "status", status: "draft", label: "Voltar a rascunho" },
        {
          kind: "status",
          status: "cancelled",
          label: "Cancelar postagem",
          variant: "destructive",
        },
      ];
    case "cancelled":
      return [
        { kind: "status", status: "draft", label: "Restaurar como rascunho" },
        {
          kind: "purge",
          label: "Deletar permanentemente",
          variant: "destructive",
        },
      ];
    default:
      return [];
  }
}
