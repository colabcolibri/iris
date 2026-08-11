import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("agent runs page and api are wired", () => {
  const page = readFileSync("../admin/src/pages/agent-runs-page.tsx", "utf8");
  assert.match(page, /AgentRunsPage/);
  assert.match(page, /fetchAgentRuns/);
  assert.match(page, /ReplyAuditTimeline/);
  assert.match(page, /run_id/);

  const app = readFileSync("../admin/src/App.tsx", "utf8");
  assert.match(app, /agent-runs/);

  const nav = readFileSync("../admin/src/components/layout/app-navigation.tsx", "utf8");
  assert.match(nav, /ROUTES\.admin\.agentRuns/);

  const api = readFileSync("../admin/src/lib/api.ts", "utf8");
  assert.match(api, /\/api\/agent-runs/);

  const route = readFileSync("../server/src/api/routes/agent-runs.ts", "utf8");
  assert.match(route, /models/);
});
