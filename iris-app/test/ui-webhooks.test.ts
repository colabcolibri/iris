import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("webhooks page uses table layout, export and fetch helper", () => {
  const card = readFileSync("admin/src/components/settings/webhook-events-card.tsx", "utf8");
  assert.match(card, /<table/);
  assert.match(card, /export function WebhookEventsPanel/);
  assert.match(card, /só assinatura inválida/);
  assert.match(card, /Exportar JSON/);
  assert.match(card, /Exportar últimos/);
  assert.match(card, /webhook-field-filter/);
  assert.match(card, /webhook_type/);
  assert.match(card, /WebhookEventMobileCard|lg:hidden/);

  const page = readFileSync("admin/src/pages/webhooks-page.tsx", "utf8");
  assert.match(page, /WebhookEventsPanel/);
  assert.match(page, /variant="fill"/);
});
