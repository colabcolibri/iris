const STATUS_LABELS = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function postErrorTitle(post) {
  if (post?.status !== "failed" || !post.error_message) {
    return "";
  }
  return post.error_message;
}

export function failedChipPrefix(post) {
  if (post?.status !== "failed" || !post.error_message) {
    return "";
  }
  return "⚠ ";
}
