import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeScenarioUpdate,
  normalizeSimulatorScenarioInput,
} from "./simulator-scenario.ts";
import { resolveSimulateReplyInput } from "./simulate-reply.ts";
import {
  normalizeSimulateTargetComment,
  normalizeSimulateThread,
} from "./simulator-payload.ts";

const minimalScenarioBody = {
  id: "test-scenario",
  label: "Test label",
  description: "Test description",
  caption: "Caption text",
  carousel_summary: "Carousel summary",
  thread: [{ author: "user.one", text: "Hello", is_brand_reply: false }],
  target_author: "user.two",
  target_text: "What do you think?",
};

test("normalizeSimulatorScenarioInput validates required fields", () => {
  const input = normalizeSimulatorScenarioInput(minimalScenarioBody, { requireId: true });
  assert.equal(input.id, "test-scenario");
  assert.equal(input.targetText, "What do you think?");
  assert.equal(input.thread.length, 1);
});

test("normalizeSimulatorScenarioInput rejects invalid id", () => {
  assert.throws(
    () =>
      normalizeSimulatorScenarioInput(
        { ...minimalScenarioBody, id: "Invalid ID" },
        { requireId: true },
      ),
    /id must use lowercase letters/,
  );
});

test("normalizeSimulateThread enforces max messages", () => {
  const thread = Array.from({ length: 101 }, (_, index) => ({
    author: `user-${index}`,
    text: "msg",
  }));

  assert.throws(() => normalizeSimulateThread(thread), /at most 100 messages/);
});

test("normalizeSimulateTargetComment requires text when requested", () => {
  assert.throws(
    () => normalizeSimulateTargetComment({ author: "user", text: "   " }, { requiredText: true }),
    /target_comment.text is required/,
  );
});

test("mergeScenarioUpdate keeps unchanged fields", () => {
  const current = normalizeSimulatorScenarioInput(minimalScenarioBody, { requireId: true });
  const merged = mergeScenarioUpdate(
    {
      ...current,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    { label: "Updated label" },
  );

  assert.equal(merged.label, "Updated label");
  assert.equal(merged.caption, current.caption);
  assert.equal(merged.targetText, current.targetText);
});

test("resolveSimulateReplyInput loads scenario by id", () => {
  const input = resolveSimulateReplyInput(
    { scenario_id: "jogo-grok" },
    {
      scenarioStore: {
        list: () => [],
        getById: (id) =>
          id === "jogo-grok"
            ? {
                id: "jogo-grok",
                label: "Carrossel",
                description: "desc",
                caption: "Caption from db",
                carouselSummary: "Carousel from db",
                thread: [{ author: "renata.psi", text: "Oi" }],
                targetAuthor: "renata.psi",
                targetText: "Pergunta do cenário",
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
              }
            : null,
        create: () => {
          throw new Error("not implemented");
        },
        update: () => null,
        delete: () => false,
      },
    },
  );

  assert.equal(input.scenario_id, "jogo-grok");
  assert.equal(input.caption, "Caption from db");
  assert.equal(input.target_comment.text, "Pergunta do cenário");
});

test("resolveSimulateReplyInput allows inline overrides", () => {
  const input = resolveSimulateReplyInput(
    {
      scenario_id: "jogo-grok",
      caption: "Override caption",
      target_comment: { author: "other", text: "Override question" },
    },
    {
      scenarioStore: {
        list: () => [],
        getById: () => ({
          id: "jogo-grok",
          label: "Carrossel",
          description: "desc",
          caption: "Caption from db",
          carouselSummary: "Carousel from db",
          thread: [],
          targetAuthor: "renata.psi",
          targetText: "Pergunta do cenário",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
        create: () => {
          throw new Error("not implemented");
        },
        update: () => null,
        delete: () => false,
      },
    },
  );

  assert.equal(input.caption, "Override caption");
  assert.equal(input.target_comment.text, "Override question");
});

test("resolveSimulateReplyInput rejects unknown scenario_id", () => {
  assert.throws(
    () =>
      resolveSimulateReplyInput(
        { scenario_id: "missing" },
        {
          scenarioStore: {
            list: () => [],
            getById: () => null,
            create: () => {
              throw new Error("not implemented");
            },
            update: () => null,
            delete: () => false,
          },
        },
      ),
    /scenario_id not found/,
  );
});
