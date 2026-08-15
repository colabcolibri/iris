import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMcpAgentHelp, MCP_HELP_TOPICS } from "./mcp-agent-help.ts";

test("buildMcpAgentHelp returns all topics by default", () => {
  const help = buildMcpAgentHelp();
  assert.equal(help.version, "1.29");
  assert.deepEqual(help.topics, MCP_HELP_TOPICS);
  assert.ok(help.markdown.includes("Publish flow"));
  assert.ok(help.markdown.includes("agent_active_days"));
  assert.ok(help.markdown.includes("private_reply_mode"));
  assert.ok(help.sections);
});

test("buildMcpAgentHelp filters by topic", () => {
  const campaign = buildMcpAgentHelp("campaign");
  assert.equal(campaign.topic, "campaign");
  assert.ok(campaign.markdown.includes("private reply"));
  assert.equal(campaign.sections, undefined);

  const publish = buildMcpAgentHelp("publish");
  assert.ok(publish.markdown.includes("iris_prepare_post_asset_upload"));
});

test("buildMcpAgentHelp handles unknown topic", () => {
  const bad = buildMcpAgentHelp("nope");
  assert.match(bad.markdown, /Unknown topic/);
});
