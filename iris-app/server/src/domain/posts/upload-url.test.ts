import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildUploadAssetUrl,
  redeemUploadJti,
  resetUploadJtiRegistryForTests,
  signUploadUrl,
  verifyUploadSig,
} from "./upload-url.ts";

test("upload url signature round-trip", () => {
  const secret = "upload-secret";
  const expiresAt = Date.now() + 60_000;
  const jti = "jti-1";
  const sig = signUploadUrl("post-1", 1, "hero.png", jti, expiresAt, secret);

  assert.equal(
    verifyUploadSig(sig, "post-1", 1, "hero.png", jti, expiresAt, secret),
    true,
  );
  assert.equal(
    verifyUploadSig(sig, "post-1", 2, "hero.png", jti, expiresAt, secret),
    false,
  );
});

test("buildUploadAssetUrl includes query params and curl template", () => {
  const prepared = buildUploadAssetUrl({
    postId: "abc",
    filename: "01.png",
    sortOrder: 1,
    baseUrl: "https://iris.example.com",
    secret: "secret",
    ttlMs: 120_000,
  });

  assert.match(
    prepared.uploadUrl,
    /^https:\/\/iris\.example\.com\/upload\/assets\//,
  );
  assert.match(prepared.uploadUrl, /exp=\d+/);
  assert.match(prepared.uploadUrl, /sort=1/);
  assert.match(prepared.uploadUrl, /fn=01\.png/);
  assert.match(prepared.uploadUrl, /jti=/);
  assert.match(prepared.curlCommand, /LOCAL_IMAGE_PATH/);
  assert.ok(prepared.maxBytes > 0);
});

test("redeemUploadJti is single-use", () => {
  resetUploadJtiRegistryForTests();
  const expiresAt = Date.now() + 60_000;
  assert.equal(redeemUploadJti("once", expiresAt), true);
  assert.equal(redeemUploadJti("once", expiresAt), false);
});
