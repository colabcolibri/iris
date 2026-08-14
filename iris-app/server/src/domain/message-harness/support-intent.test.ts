import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { inferSupportSignals } from "./support-intent.ts";

function baseContext(text: string): MessageReplyContext {
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

describe("support intent", () => {
  test("detects purchase difficulty from natural language", () => {
    const signals = inferSupportSignals(
      baseContext("Não consigo finalizar a compra no site"),
      "none",
      "low",
      "product_inquiry",
    );
    assert.equal(signals.supportIntent, "purchase_difficulty");
    assert.notEqual(signals.supportUrgency, "low");
  });

  test("elevates urgency on repeated inbound messages", () => {
    const context = baseContext("Ainda não consegui comprar");
    context.thread.entries = [
      { direction: "outbound", text: "Aqui está o link do produto", authorUsername: "colibri" },
      { direction: "inbound", text: "Não consigo comprar", authorUsername: "cliente" },
      { direction: "inbound", text: "Ainda não consegui comprar", authorUsername: "cliente" },
    ];
    const signals = inferSupportSignals(context, "none", "low", "advice_help");
    assert.equal(signals.supportUrgency, "high");
  });
});
