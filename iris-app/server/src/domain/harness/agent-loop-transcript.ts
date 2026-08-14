import { sanitizeToolJson } from "./sanitize-tool-json.ts";

export type AgentLoopTranscriptEntry =
  | { kind: "action"; turnIndex: number; action: string; payload: Record<string, unknown> }
  | { kind: "observation"; turnIndex: number; toolName: string; payload: unknown }
  | { kind: "system_note"; turnIndex: number; message: string };

export type AgentLoopTranscript = {
  entries: AgentLoopTranscriptEntry[];
};

export function createAgentLoopTranscript(): AgentLoopTranscript {
  return { entries: [] };
}

export function appendLoopAction(
  transcript: AgentLoopTranscript,
  turnIndex: number,
  action: string,
  payload: Record<string, unknown>,
): void {
  transcript.entries.push({ kind: "action", turnIndex, action, payload });
}

export function appendLoopObservation(
  transcript: AgentLoopTranscript,
  turnIndex: number,
  toolName: string,
  payload: unknown,
): void {
  transcript.entries.push({ kind: "observation", turnIndex, toolName, payload });
}

export function appendLoopSystemNote(
  transcript: AgentLoopTranscript,
  turnIndex: number,
  message: string,
): void {
  transcript.entries.push({ kind: "system_note", turnIndex, message });
}

export function renderLoopTranscriptForPrompt(transcript: AgentLoopTranscript): string {
  if (transcript.entries.length === 0) {
    return "";
  }

  const lines = transcript.entries.map((entry) => {
    if (entry.kind === "action") {
      return `[turn ${entry.turnIndex}] action: ${entry.action} ${sanitizeToolJson(entry.payload)}`;
    }
    if (entry.kind === "observation") {
      return `[turn ${entry.turnIndex}] observation (${entry.toolName}): ${sanitizeToolJson(entry.payload)}`;
    }
    return `[turn ${entry.turnIndex}] note: ${entry.message}`;
  });

  return [
    "",
    "Loop history (actions and observations — use to decide the next step):",
    ...lines,
  ].join("\n");
}

export function serializeLoopTranscript(transcript: AgentLoopTranscript): string {
  return JSON.stringify(transcript.entries);
}

export function toolCallFingerprint(tool: string, args: Record<string, unknown>): string {
  const keys = Object.keys(args).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    normalized[key] = args[key];
  }
  return `${tool}:${JSON.stringify(normalized)}`;
}

export function hasToolCallFingerprint(
  transcript: AgentLoopTranscript,
  fingerprint: string,
): boolean {
  return transcript.entries.some(
    (entry) =>
      entry.kind === "action" &&
      entry.action === "call_tool" &&
      toolCallFingerprint(
        typeof entry.payload.tool === "string" ? entry.payload.tool : "",
        (entry.payload.arguments as Record<string, unknown>) ?? {},
      ) === fingerprint,
  );
}
