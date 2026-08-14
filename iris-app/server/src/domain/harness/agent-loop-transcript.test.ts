import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendLoopAction,
  appendLoopObservation,
  createAgentLoopTranscript,
  hasToolCallFingerprint,
  renderLoopTranscriptForPrompt,
  toolCallFingerprint,
} from "./agent-loop-transcript.ts";

test("loop transcript renders observations for next LLM turn", () => {
  const transcript = createAgentLoopTranscript();
  appendLoopAction(transcript, 0, "call_tool", {
    tool: "search_products",
    arguments: { query: "bolsa" },
  });
  appendLoopObservation(transcript, 0, "search_products", { items: [], totalMatched: 0 });

  const rendered = renderLoopTranscriptForPrompt(transcript);
  assert.match(rendered, /observação \(search_products\)/);
  assert.match(rendered, /totalMatched/);

  const fingerprint = toolCallFingerprint("search_products", { query: "bolsa" });
  assert.equal(hasToolCallFingerprint(transcript, fingerprint), true);
});
