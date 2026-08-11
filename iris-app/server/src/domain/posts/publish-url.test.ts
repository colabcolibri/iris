import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPublishImageUrl,
  signPublishUrl,
  verifyPublishSig,
} from "./publish-url.ts";

test("publish url signature round-trip", () => {
  const secret = "publish-secret";
  const expiresAt = Date.now() + 60_000;
  const sig = signPublishUrl("post-1", "01.jpg", expiresAt, secret);

  assert.equal(
    verifyPublishSig(sig, "post-1", "01.jpg", expiresAt, secret),
    true,
  );
  assert.equal(
    verifyPublishSig(sig, "post-1", "02.jpg", expiresAt, secret),
    false,
  );
});

test("buildPublishImageUrl includes exp query", () => {
  const url = buildPublishImageUrl(
    "abc",
    "01.jpg",
    "https://iris.example.com",
    "secret",
    120_000,
  );

  assert.match(url, /^https:\/\/iris\.example\.com\/publish\/media\//);
  assert.match(url, /exp=\d+/);
});
