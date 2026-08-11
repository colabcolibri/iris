import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLlmJson } from "./parse-llm-json.ts";

test("parseLlmJson extracts JSON from fenced block", () => {
  const parsed = parseLlmJson<{ shouldReply: boolean }>(
    '```json\n{"shouldReply":false,"reason":"off_topic"}\n```',
  );
  assert.deepEqual(parsed, { shouldReply: false, reason: "off_topic" });
});
