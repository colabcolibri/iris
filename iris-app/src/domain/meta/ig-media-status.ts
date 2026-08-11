export type IgMediaStatus = "on_feed" | "archived" | "unavailable";

export type IgMediaAvailability = {
  status: IgMediaStatus;
  detail: string | null;
};

export function humanizeMetaMediaError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("does not exist") ||
    lower.includes("unsupported get request") ||
    lower.includes("cannot be loaded due to missing permissions")
  ) {
    return "A publicação não existe mais no Instagram ou a Iris não tem permissão para acessá-la.";
  }

  if (lower.includes("access token")) {
    return "Token da Meta inválido ou expirado. Reconecte o Instagram nas configurações.";
  }

  return message;
}

export function igMediaStatusPresentation(status: IgMediaStatus): {
  label: string;
  hint: string;
} {
  switch (status) {
    case "on_feed":
      return {
        label: "No feed do IG",
        hint: "A publicação está visível no feed do Instagram.",
      };
    case "archived":
      return {
        label: "Arquivada no IG",
        hint:
          "A publicação ainda existe na Meta, mas não está no feed (arquivada). Comentários e insights podem falhar.",
      };
    case "unavailable":
      return {
        label: "Indisponível no IG",
        hint: "A publicação foi excluída ou a Iris não consegue mais acessá-la na Meta.",
      };
  }
}
