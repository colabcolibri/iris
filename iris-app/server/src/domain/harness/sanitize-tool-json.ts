const MAX_TOOL_JSON_CHARS = 8_192;

export function sanitizeToolJson(value: unknown): string {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = JSON.stringify({ error: "unserializable" });
  }

  if (serialized.length <= MAX_TOOL_JSON_CHARS) {
    return serialized;
  }

  return `${serialized.slice(0, MAX_TOOL_JSON_CHARS)}…`;
}

export function parseToolJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
