import { test } from "node:test";
import assert from "node:assert/strict";
import { buildThreadBlock } from "./build-thread-block.ts";

test("buildThreadBlock orders entries chronologically", () => {
  const block = buildThreadBlock(
    {
      entries: [
        {
          author: "b",
          text: "segundo",
          isBrandReply: false,
          at: "2026-08-10T12:00:00.000Z",
          depth: 0,
        },
        {
          author: "a",
          text: "primeiro",
          isBrandReply: false,
          at: "2026-08-10T11:00:00.000Z",
          depth: 0,
        },
      ],
    },
    { brandName: "Iris" },
  );

  const firstIndex = block.indexOf("primeiro");
  const secondIndex = block.indexOf("segundo");
  assert.ok(firstIndex >= 0 && secondIndex > firstIndex);
});

test("buildThreadBlock limits entries for simple tier usage", () => {
  const entries = Array.from({ length: 8 }, (_, index) => ({
    author: `u${index}`,
    text: `msg ${index}`,
    isBrandReply: false,
    at: `2026-08-10T1${index}:00:00.000Z`,
    depth: 0,
  }));

  const block = buildThreadBlock({ entries }, { maxEntries: 5, brandName: "Iris" });
  assert.match(block, /msg 7/);
  assert.doesNotMatch(block, /msg 2/);
});
