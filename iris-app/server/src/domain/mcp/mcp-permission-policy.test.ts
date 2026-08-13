import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isMcpActionAllowed,
  resolveMcpPermissionPolicy,
} from "./mcp-permission-policy.ts";

test("resolveMcpPermissionPolicy defaults to full access", () => {
  const policy = resolveMcpPermissionPolicy(null);

  assert.equal(policy.preset, "full");
  assert.equal(isMcpActionAllowed(policy, "posts", "write"), true);
  assert.equal(isMcpActionAllowed(policy, "posts", "delete"), true);
  assert.equal(isMcpActionAllowed(policy, "comments", "write"), false);
});

test("read_only preset blocks write and delete but keeps read", () => {
  const policy = resolveMcpPermissionPolicy({ preset: "read_only" });

  assert.equal(isMcpActionAllowed(policy, "posts", "read"), true);
  assert.equal(isMcpActionAllowed(policy, "posts", "write"), false);
  assert.equal(isMcpActionAllowed(policy, "posts", "delete"), false);
  assert.equal(isMcpActionAllowed(policy, "comments", "read"), true);
});

test("editor preset allows write but blocks delete", () => {
  const policy = resolveMcpPermissionPolicy({ preset: "editor" });

  assert.equal(isMcpActionAllowed(policy, "posts", "write"), true);
  assert.equal(isMcpActionAllowed(policy, "posts", "delete"), false);
  assert.equal(isMcpActionAllowed(policy, "products", "delete"), false);
});

test("custom preset applies domain overrides on top of full access", () => {
  const policy = resolveMcpPermissionPolicy({
    preset: "custom",
    domainOverrides: {
      posts: { delete: false },
      settings: { write: false, read: true },
    },
  });

  assert.equal(isMcpActionAllowed(policy, "posts", "write"), true);
  assert.equal(isMcpActionAllowed(policy, "posts", "delete"), false);
  assert.equal(isMcpActionAllowed(policy, "settings", "read"), true);
  assert.equal(isMcpActionAllowed(policy, "settings", "write"), false);
});
