import { ValidationError } from "../../api/json.ts";

export type SimulateThreadMessage = {
  author: string;
  text: string;
  is_brand_reply?: boolean;
  at?: string;
};

export type SimulateTargetComment = {
  author: string;
  text: string;
};

export const SIMULATOR_SCENARIO_ID_MAX = 64;
export const SIMULATOR_SCENARIO_LABEL_MAX = 200;
export const SIMULATOR_SCENARIO_DESCRIPTION_MAX = 500;
export const SIMULATOR_SCENARIO_TEXT_MAX = 2200;
export const SIMULATOR_THREAD_MAX_MESSAGES = 100;
export const SIMULATOR_AUTHOR_MAX = 120;

const SCENARIO_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertMaxLength(value: string, field: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`);
  }
  return trimmed;
}

export function normalizeScenarioId(raw: unknown, field = "id"): string {
  if (typeof raw !== "string") {
    throw new ValidationError(`${field} is required`);
  }

  const id = raw.trim();
  if (!id) {
    throw new ValidationError(`${field} is required`);
  }
  if (id.length > SIMULATOR_SCENARIO_ID_MAX) {
    throw new ValidationError(`${field} must be at most ${SIMULATOR_SCENARIO_ID_MAX} characters`);
  }
  if (!SCENARIO_ID_PATTERN.test(id)) {
    throw new ValidationError(`${field} must use lowercase letters, numbers, and hyphens`);
  }

  return id;
}

export function normalizeSimulateThread(
  raw: unknown,
  options?: { required?: boolean },
): SimulateThreadMessage[] {
  if (raw === undefined || raw === null) {
    if (options?.required) {
      throw new ValidationError("thread is required");
    }
    return [];
  }

  if (!Array.isArray(raw)) {
    throw new ValidationError("thread must be an array");
  }

  if (raw.length > SIMULATOR_THREAD_MAX_MESSAGES) {
    throw new ValidationError(`thread must have at most ${SIMULATOR_THREAD_MAX_MESSAGES} messages`);
  }

  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new ValidationError(`thread[${index}] must be an object`);
    }

    const row = entry as Record<string, unknown>;
    const authorRaw = typeof row.author === "string" ? row.author : "user";
    const textRaw = typeof row.text === "string" ? row.text : "";

    return {
      author: assertMaxLength(authorRaw, `thread[${index}].author`, SIMULATOR_AUTHOR_MAX) || "user",
      text: assertMaxLength(textRaw, `thread[${index}].text`, SIMULATOR_SCENARIO_TEXT_MAX),
      is_brand_reply: row.is_brand_reply === true,
      at: typeof row.at === "string" ? row.at : undefined,
    };
  });
}

export function normalizeSimulateTargetComment(
  raw: unknown,
  options?: { requiredText?: boolean },
): SimulateTargetComment {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const authorRaw = typeof record.author === "string" ? record.author : "user";
  const textRaw = typeof record.text === "string" ? record.text : "";

  const author =
    assertMaxLength(authorRaw, "target_comment.author", SIMULATOR_AUTHOR_MAX) || "user";
  const text = assertMaxLength(textRaw, "target_comment.text", SIMULATOR_SCENARIO_TEXT_MAX);

  if (options?.requiredText && !text) {
    throw new ValidationError("target_comment.text is required");
  }

  return { author, text };
}

export function normalizeSimulatorTextField(
  raw: unknown,
  field: string,
  options?: { required?: boolean; max?: number },
): string {
  if (raw === undefined || raw === null) {
    if (options?.required) {
      throw new ValidationError(`${field} is required`);
    }
    return "";
  }

  if (typeof raw !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }

  const value = assertMaxLength(raw, field, options?.max ?? SIMULATOR_SCENARIO_TEXT_MAX);
  if (options?.required && !value) {
    throw new ValidationError(`${field} is required`);
  }

  return value;
}
