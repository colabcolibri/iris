import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("persona page and route exist", () => {
  const app = readFileSync("../admin/src/App.tsx", "utf8");
  assert.match(app, /ROUTES\.admin\.persona/);
  assert.match(app, /PersonaPage/);

  const page = readFileSync("../admin/src/pages/persona-page.tsx", "utf8");
  assert.match(page, /fetchReplyPersona/);
  assert.match(page, /updateReplyPersona/);
  assert.match(page, /fetchAgentContent/);
  assert.match(page, /updateAgentContent/);
  assert.match(page, /t\.sections\.commentContent\.title/);
  assert.match(page, /response_language/);
  assert.match(page, /t\.fields\.responseLanguage/);

  const api = readFileSync("../admin/src/lib/api.ts", "utf8");
  assert.match(api, /\/api\/settings\/reply-persona/);
  assert.match(api, /\/api\/settings\/agent-content/);
});
