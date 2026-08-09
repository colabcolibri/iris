import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  createMetaOAuthState,
  verifyMetaOAuthState,
} from "./meta-oauth-state.ts";

const SECRET = "test-session-secret";

test("meta oauth state verifies valid token", () => {
  const state = createMetaOAuthState(SECRET);
  assert.equal(verifyMetaOAuthState(state, SECRET), true);
});

test("meta oauth state rejects tampered signature", () => {
  const state = createMetaOAuthState(SECRET);
  const parts = state.split(".");
  parts[2] = parts[2]!.slice(0, -1) + (parts[2]!.endsWith("a") ? "b" : "a");
  const tampered = parts.join(".");
  assert.equal(verifyMetaOAuthState(tampered, SECRET), false);
});

test("meta oauth state rejects expired token", () => {
  const expiresMs = Date.now() - 1000;
  const payload = `oauth1.${expiresMs}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const state = `${payload}.${signature}.nonce`;
  assert.equal(verifyMetaOAuthState(state, SECRET), false);
});
