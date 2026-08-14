import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { runMessageTriageStage } from "./triage-stage.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";

function context(text: string): MessageReplyContext {
  return {
    persona: {
      brandName: "Colibri",
      responseLanguage: "pt-BR",
      signature: null,
      maxChars: 500,
    },
    conversation: { participantUsername: "cliente", replyPrompt: null },
    thread: { entries: [] },
    products: [],
    brandUsername: "colibri",
    targetMessage: { text, authorUsername: "cliente" },
  };
}

describe("message triage support signals", () => {
  test("persists purchase_difficulty in structured output", async () => {
    const result = await runMessageTriageStage({
      context: context("Não consigo comprar, dá erro no checkout"),
      restrictions: "",
      llm: {
        async complete() {
          return createTestLlmCompletion(
            JSON.stringify({
              messageCategory: "product_inquiry",
              productSlug: null,
              shouldReply: true,
              supportIntent: "purchase_difficulty",
              supportUrgency: "medium",
              reason: "dificuldade de compra",
              reasoning: "cliente relata erro no checkout",
            }),
          );
        },
      },
    });

    assert.equal(result.supportIntent, "purchase_difficulty");
    assert.equal(result.structured?.supportIntent, "purchase_difficulty");
  });
});
