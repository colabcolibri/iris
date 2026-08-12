import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("webhooks page uses shadcn table layout, export and fetch helper", () => {
  const card = readFileSync("../admin/src/components/settings/webhook-events-card.tsx", "utf8");
  assert.match(card, /from "@\/components\/ui\/table"/);
  assert.match(card, /<Table/);
  assert.match(card, /TableHeader/);
  assert.match(card, /TableBody/);
  assert.match(card, /export function WebhookEventsPanel/);
  assert.match(card, /só assinatura inválida/);
  assert.match(card, /Exportar JSON/);
  assert.match(card, /Exportar últimos/);
  assert.match(card, /webhook-field-filter/);
  assert.match(card, /webhook_type/);

  const page = readFileSync("../admin/src/pages/webhooks-page.tsx", "utf8");
  assert.match(page, /WebhookEventsPanel/);
  assert.match(page, /variant="fill"/);

  const table = readFileSync("../admin/src/components/ui/table.tsx", "utf8");
  assert.match(table, /data-slot="table"/);
});
