import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("message simulator page and routes are wired", () => {
  const page = readFileSync("../admin/src/pages/message-simulator-page.tsx", "utf8");
  assert.match(page, /MessageSimulatorPage/);
  assert.match(page, /channel: "dm"/);
  assert.match(page, /fetchMessageAgentContent/);
  assert.match(page, /MESSAGE_SIMULATOR_SCENARIOS/);
  const scenarios = readFileSync("../admin/src/lib/message-simulator-scenarios.ts", "utf8");
  assert.match(scenarios, /Jogo Grok/);
  assert.match(page, /SimulatorResultPanel/);

  const app = readFileSync("../admin/src/App.tsx", "utf8");
  assert.match(app, /message-simulator/);
  assert.match(app, /MessageSimulatorPage/);

  const nav = readFileSync("../admin/src/components/layout/app-navigation.tsx", "utf8");
  assert.match(nav, /messageSimulator/);

  const routes = readFileSync("../admin/src/lib/routes.ts", "utf8");
  assert.match(routes, /messageSimulator/);
});
