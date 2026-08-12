import { ValidationError } from "../../api/json.ts";

export type AssetUserTag = {
  username: string;
  x: number;
  y: number;
};

const USERNAME_RE = /^[a-zA-Z0-9._]{1,30}$/;
const ALT_TEXT_MAX = 1000;
const USER_TAGS_MAX = 20;

export function normalizeAltText(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== "string") {
    throw new ValidationError("alt_text must be a string or null");
  }
  const text = raw.trim();
  if (!text) {
    return null;
  }
  if (text.length > ALT_TEXT_MAX) {
    throw new ValidationError(`alt_text must be at most ${ALT_TEXT_MAX} characters`);
  }
  return text;
}

export function normalizeUserTags(raw: unknown): AssetUserTag[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  let items: unknown[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) {
        throw new ValidationError("user_tags JSON must be an array");
      }
      items = parsed;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // comma usernames → center tags
      items = trimmed
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((username) => ({ username, x: 0.5, y: 0.5 }));
    }
  } else {
    throw new ValidationError("user_tags must be an array, JSON string, or null");
  }

  if (items.length > USER_TAGS_MAX) {
    throw new ValidationError(`user_tags accepts at most ${USER_TAGS_MAX} tags`);
  }

  const seen = new Set<string>();
  const result: AssetUserTag[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new ValidationError("each user_tag must be an object with username, x, y");
    }
    const record = item as Record<string, unknown>;
    const usernameRaw =
      typeof record.username === "string" ? record.username : "";
    const username = usernameRaw.trim().replace(/^@+/, "");
    if (!USERNAME_RE.test(username)) {
      throw new ValidationError(
        `invalid Instagram username in user_tags: ${usernameRaw || "(empty)"}`,
      );
    }
    const x = Number(record.x);
    const y = Number(record.y);
    if (!Number.isFinite(x) || x < 0 || x > 1) {
      throw new ValidationError("user_tag.x must be a number between 0 and 1");
    }
    if (!Number.isFinite(y) || y < 0 || y > 1) {
      throw new ValidationError("user_tag.y must be a number between 0 and 1");
    }
    const key = username.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({ username, x, y });
  }

  return result;
}

export function userTagsToDb(tags: AssetUserTag[]): string | null {
  return tags.length === 0 ? null : JSON.stringify(tags);
}

export function userTagsFromDb(raw: string | null | undefined): AssetUserTag[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    return normalizeUserTags(JSON.parse(raw));
  } catch {
    return [];
  }
}
