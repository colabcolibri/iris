import { test } from "node:test";
import assert from "node:assert/strict";
import {
  metaOAuthScopesForMode,
  META_OAUTH_SCOPES_ESSENTIAL,
} from "./meta-oauth-config.ts";
import { buildMetaAuthorizeUrl } from "./meta-oauth-client.ts";

test("essential oauth mode excludes messaging and insights scopes", () => {
  const scopes = metaOAuthScopesForMode("essential");
  assert.deepEqual(scopes, [...META_OAUTH_SCOPES_ESSENTIAL]);
  assert.ok(!scopes.includes("instagram_business_manage_messages"));
});

test("buildMetaAuthorizeUrl uses essential scopes when mode is essential", () => {
  const url = buildMetaAuthorizeUrl(
    {
      appId: "app-1",
      appSecret: "secret",
      redirectUri: "https://iris.example.com/auth/meta/callback",
      graphApiVersion: "v21.0",
    },
    "state-token",
    "essential",
  );

  const parsed = new URL(url);
  const scope = parsed.searchParams.get("scope") ?? "";
  assert.ok(scope.includes("instagram_business_manage_comments"));
  assert.ok(!scope.includes("instagram_business_manage_messages"));
});
