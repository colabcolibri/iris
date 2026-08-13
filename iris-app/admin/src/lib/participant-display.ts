export function normalizeParticipantHandle(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim().replace(/^@+/, "").toLowerCase();
  return trimmed || null;
}

export function isBrandParticipant(
  participantUsername: string | null | undefined,
  brandUsername?: string | null,
): boolean {
  const brand = normalizeParticipantHandle(brandUsername);
  const participant = normalizeParticipantHandle(participantUsername);
  return Boolean(brand && participant && brand === participant);
}

export function resolveParticipantForDisplay(
  participantUsername: string | null | undefined,
  participantDisplayName: string | null | undefined,
  brandUsername?: string | null,
): { username: string | null; displayName: string | null } {
  if (isBrandParticipant(participantUsername, brandUsername)) {
    return {
      username: null,
      displayName: participantDisplayName?.trim() || null,
    };
  }

  return {
    username: participantUsername?.trim() || null,
    displayName: participantDisplayName?.trim() || null,
  };
}

export function formatParticipantHandle(
  username: string | null | undefined,
  fallback = "usuário",
): string {
  const value = username?.trim() || fallback;
  return value.startsWith("@") ? value : `@${value}`;
}

export function participantDisplayLabel(
  username: string | null | undefined,
  displayName?: string | null,
): string {
  const name = displayName?.trim();
  if (name) {
    return name;
  }
  const handle = username?.trim();
  if (handle) {
    return handle.startsWith("@") ? handle.slice(1) : handle;
  }
  return "Usuário";
}

export function participantInitials(
  username: string | null | undefined,
  displayName?: string | null,
): string {
  const label = participantDisplayLabel(username, displayName);
  const parts = label.replace(/^@+/, "").split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return label.replace(/^@+/, "").slice(0, 2).toUpperCase() || "?";
}
