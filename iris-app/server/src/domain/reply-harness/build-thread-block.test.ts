import { test } from "node:test";
import assert from "node:assert/strict";
import { buildThreadBlock } from "./build-thread-block.ts";

test("buildThreadBlock sorts entries chronologically by timestamp", () => {
  const block = buildThreadBlock(
    {
      entries: [
        {
          author: "b",
          text: "segundo",
          isBrandReply: false,
          at: "2026-08-10T12:00:00.000Z",
          depth: 1,
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

test("buildThreadBlock places brand reply after user comment at the same second", () => {
  const block = buildThreadBlock(
    {
      entries: [
        {
          author: "marca",
          text: "obrigado!",
          isBrandReply: true,
          at: "2026-08-10T11:00:00.001Z",
          depth: 0,
        },
        {
          author: "fan",
          text: "valeu!",
          isBrandReply: false,
          at: "2026-08-10T11:00:00.000Z",
          depth: 0,
        },
      ],
    },
    { brandName: "Iris" },
  );

  const userIndex = block.indexOf("valeu!");
  const brandIndex = block.indexOf("obrigado!");
  assert.ok(userIndex >= 0 && brandIndex > userIndex);
});

test("buildThreadBlock keeps the last N entries", () => {
  const entries = Array.from({ length: 20 }, (_, index) => ({
    author: `u${index}`,
    text: `msg ${index}`,
    isBrandReply: false,
    at: new Date(Date.UTC(2026, 7, 10, 10, index, 0)).toISOString(),
    depth: 0,
  }));

  const block = buildThreadBlock({ entries }, { maxEntries: 16, brandName: "Iris" });
  assert.match(block, /msg 19/);
  assert.match(block, /msg 4/);
  assert.doesNotMatch(block, /msg 3/);
  assert.doesNotMatch(block, /msg 0/);
});

test("buildThreadBlock marks target comment for triage without depth markers", () => {
  const block = buildThreadBlock(
    {
      entries: [
        {
          author: "mother",
          text: "post root",
          isBrandReply: false,
          at: "2026-08-10T11:00:00.000Z",
          depth: 0,
          igCommentId: "root",
        },
        {
          author: "fan",
          text: "@other_user concordo",
          isBrandReply: false,
          at: "2026-08-10T11:02:00.000Z",
          depth: 1,
          igCommentId: "target",
        },
      ],
    },
    {
      brandUsername: "colabcolibri",
      targetIgCommentId: "target",
    },
  );

  assert.doesNotMatch(block, /\[depth=/);
  assert.match(block, />>> TARGET/);
  assert.match(block, /@fan: @other_user concordo/);
});
