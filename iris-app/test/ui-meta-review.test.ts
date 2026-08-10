import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("meta review card and api exist for app review tests", () => {
  const card = readFileSync("admin/src/components/settings/meta-review-card.tsx", "utf8");
  const api = readFileSync("admin/src/lib/api.ts", "utf8");
  const settings = readFileSync("admin/src/pages/settings-page.tsx", "utf8");

  assert.match(card, /MetaReviewCard/);
  assert.match(card, /Testar insights/);
  assert.match(card, /Testar mensagens/);
  assert.match(card, /instagram_business_manage_insights/);
  assert.match(api, /fetchMetaTestInsights/);
  assert.match(api, /\/api\/meta\/test\/insights/);
  assert.match(api, /fetchMetaTestConversations/);
  assert.match(settings, /MetaReviewCard/);
});
