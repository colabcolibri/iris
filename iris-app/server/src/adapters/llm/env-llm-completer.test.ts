import { test } from "node:test";
import assert from "node:assert/strict";
import { createEnvLlmCompleter } from "./env-llm-completer.ts";
import {
  createTestLlmCompletion,
  type LlmCompleteOptions,
} from "../../ports/llm-completer.ts";
import { summarizeImagesWithVision } from "../../domain/carousel-summary/summarize-images-with-vision.ts";

test("createEnvLlmCompleter sends image bytes as data URLs in multimodal content", async () => {
  let body: { messages: Array<{ content: unknown }> } | null = null;
  const recorded: string[] = [];

  const completer = createEnvLlmCompleter({
    apiKey: "test-key",
    callLog: {
      record(input) {
        recorded.push(input.source);
      },
    },
    fetchImpl: async (_url, init) => {
      body = JSON.parse(String(init?.body)) as { messages: Array<{ content: unknown }> };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "Um gato no slide." } }],
          model: "gpt-4o-mini",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });

  await completer.complete("Descreva o slide.", {
    images: [{ mime: "image/jpeg", base64: "aGVsbG8=" }],
    source: "carousel_slide",
  });
  assert.deepEqual(recorded, ["carousel_slide"]);

  const content = body?.messages[0]?.content as Array<{ type: string; image_url?: { url: string } }>;
  assert.ok(Array.isArray(content));
  assert.equal(content[0]?.type, "text");
  assert.equal(content[1]?.type, "image_url");
  assert.equal(content[1]?.image_url?.url, "data:image/jpeg;base64,aGVsbG8=");
});

test("summarizeImagesWithVision passes downloaded image bytes to the LLM", async () => {
  const calls: Array<{ prompt: string; options?: LlmCompleteOptions }> = [];

  const llm = {
    async complete(prompt: string, options?: LlmCompleteOptions) {
      calls.push({ prompt, options });
      return createTestLlmCompletion(
        calls.length === 1 ? "Uma capa de livro sobre escuta." : "Resumo do carrossel em português.",
      );
    },
  };

  const summary = await summarizeImagesWithVision(
    [
      {
        sortOrder: 1,
        image: { mime: "image/jpeg", base64: "aW1hZ2U=" },
      },
      {
        sortOrder: 2,
        image: { mime: "image/jpeg", base64: "b3V0cmE=" },
      },
    ],
    llm,
    { responseLanguage: "pt-BR", visionEnabled: true },
  );

  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0]?.options?.images, [{ mime: "image/jpeg", base64: "aW1hZ2U=" }]);
  assert.deepEqual(calls[1]?.options?.images, [{ mime: "image/jpeg", base64: "b3V0cmE=" }]);
  assert.match(calls[0]?.prompt ?? "", /Brazilian Portuguese \(pt-BR\)/);
  assert.match(calls[0]?.prompt ?? "", /ONLY on what is visible in this image/i);
  assert.match(calls[2]?.prompt ?? "", /never on captions or external context/i);
  assert.doesNotMatch(calls[0]?.prompt ?? "", /Image URL:/);
  assert.equal(summary, "Resumo do carrossel em português.");
});

test("summarizeImagesWithVision rejects when vision is disabled", async () => {
  await assert.rejects(
    () =>
      summarizeImagesWithVision(
        [{ sortOrder: 1, image: { mime: "image/jpeg", base64: "aW1hZ2U=" } }],
        { async complete() { return createTestLlmCompletion("x"); } },
        { responseLanguage: "pt-BR", visionEnabled: false },
      ),
    /vision is not enabled/i,
  );
});
