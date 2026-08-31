import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMetaOAuthState,
  verifyMetaOAuthState,
} from "./meta-oauth-state.ts";

test("meta oauth state validates instagram and page flows separately", () => {
  const secret = "session-secret";

  const igState = createMetaOAuthState(secret, "instagram");
  const pageState = createMetaOAuthState(secret, "page");

  assert.equal(verifyMetaOAuthState(igState, secret, "instagram"), true);
  assert.equal(verifyMetaOAuthState(pageState, secret, "page"), true);
  assert.equal(verifyMetaOAuthState(igState, secret, "page"), false);
  assert.equal(verifyMetaOAuthState(pageState, secret, "instagram"), false);
});
