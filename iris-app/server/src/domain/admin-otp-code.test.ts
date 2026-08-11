import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateOtpCode,
  hashOtpCode,
  hasActiveOtpResendCooldown,
  verifyOtpCode,
} from "./admin-otp-code.ts";

test("otp hash round-trip", () => {
  const code = "042819";
  const hash = hashOtpCode(code, "test-pepper");
  assert.equal(verifyOtpCode(code, hash, "test-pepper"), true);
  assert.equal(verifyOtpCode("000000", hash, "test-pepper"), false);
});

test("generateOtpCode returns 6 digits", () => {
  const code = generateOtpCode();
  assert.match(code, /^\d{6}$/);
});

test("resend cooldown active while code valid", () => {
  const record = {
    email: "a@b.com",
    codeHash: "x",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    attempts: 0,
    lastRequestAt: new Date().toISOString(),
  };
  assert.equal(hasActiveOtpResendCooldown(record), true);
});
