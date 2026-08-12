import { ValidationError } from "../../api/json.ts";

/** Instagram Graph API: max 3 collaborator usernames per media. */
export const COLLABORATORS_MAX = 3;

const USERNAME_RE = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Normalize collaborator usernames for storage and Meta publish.
 * Accepts string[], comma/space-separated string, or null.
 * Strips leading @, dedupes (case-insensitive), max 3.
 */
export function normalizeCollaborators(raw: unknown): string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  let items: string[] = [];

  if (Array.isArray(raw)) {
    items = raw.map((item) => (typeof item === "string" ? item : String(item)));
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return normalizeCollaborators(parsed);
      }
    } catch {
      // not JSON — treat as comma/space separated
    }
    items = trimmed.split(/[\s,]+/).filter(Boolean);
  } else {
    throw new ValidationError("collaborators must be an array of usernames, a string, or null");
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const username = item.trim().replace(/^@+/, "");
    if (!username) {
      continue;
    }
    if (!USERNAME_RE.test(username)) {
      throw new ValidationError(
        `invalid Instagram username: ${username} (use letters, numbers, . and _)`,
      );
    }
    const key = username.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(username);
    if (result.length > COLLABORATORS_MAX) {
      throw new ValidationError(
        `collaborators accepts at most ${COLLABORATORS_MAX} usernames`,
      );
    }
  }

  return result;
}

export function collaboratorsToDb(value: string[]): string | null {
  return value.length === 0 ? null : JSON.stringify(value);
}

export function collaboratorsFromDb(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().replace(/^@+/, ""))
      .filter(Boolean)
      .slice(0, COLLABORATORS_MAX);
  } catch {
    return [];
  }
}
