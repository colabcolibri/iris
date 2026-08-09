import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("persona page and route exist", () => {
  const app = readFileSync("admin/src/App.tsx", "utf8");
  assert.match(app, /path="\/persona"/);
  assert.match(app, /PersonaPage/);

  const page = readFileSync("admin/src/pages/persona-page.tsx", "utf8");
  assert.match(page, /fetchReplyPersona/);
  assert.match(page, /updateReplyPersona/);
  assert.match(page, /system_prompt/);

  const api = readFileSync("admin/src/lib/api.ts", "utf8");
  assert.match(api, /\/api\/settings\/reply-persona/);
});
