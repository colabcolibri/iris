import type { PostStatus } from "@/lib/types";

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
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
