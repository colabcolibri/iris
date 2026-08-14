import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildOperatorNotificationEmailContent } from "./build-operator-notification-email.ts";

describe("buildOperatorNotificationEmailContent", () => {
  const event = {
    type: "operator_attention_required" as const,
    urgency: "high" as const,
    reason: "Cliente não consegue concluir o checkout.",
    customerSummary: "Erro técnico após clicar em finalizar compra.",
    participantUsername: "maria",
    inboundMessageText: "Não consigo finalizar a compra, dá erro.",
    messageTimestamp: "2026-08-14T15:30:00.000Z",
  };

  test("builds pt shell with ai-authored customer content", () => {
    const content = buildOperatorNotificationEmailContent(event, "pt");

    assert.match(content.subject, /Mensagem aguardando/);
    assert.match(content.html, /Não consigo finalizar a compra/);
    assert.match(content.html, /@maria/);
    assert.match(content.text, /Cliente não consegue concluir o checkout/);
    assert.match(content.html, /lang="pt-BR"/);
  });

  test("builds en shell while keeping ai-authored customer content", () => {
    const content = buildOperatorNotificationEmailContent(event, "en");

    assert.match(content.subject, /Message awaiting your reply/);
    assert.match(content.html, /Não consigo finalizar a compra/);
    assert.match(content.text, /Reason: Cliente não consegue/);
    assert.match(content.html, /lang="en-US"/);
  });
});
