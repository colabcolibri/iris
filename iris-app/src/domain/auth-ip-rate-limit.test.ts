import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_CONFIRM_IP_MAX,
  AUTH_IP_RATE_WINDOW_MS,
  AUTH_REQUEST_CODE_IP_MAX,
  createAuthIpRateLimiter,
  formatAuthIpRateLimitMessage,
} from "./auth-ip-rate-limit.ts";

test("request-code allows up to configured limit per IP", () => {
  const store = new Map<string, number[]>();
  const limiter = createAuthIpRateLimiter(store);
  const now = Date.now();

  for (let i = 0; i < AUTH_REQUEST_CODE_IP_MAX; i += 1) {
    const result = limiter.check("request-code", "203.0.113.1", now + i);
    assert.equal(result.allowed, true);
  }

  const blocked = limiter.check("request-code", "203.0.113.1", now + AUTH_REQUEST_CODE_IP_MAX);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("confirm limit is independent from request-code", () => {
  const store = new Map<string, number[]>();
  const limiter = createAuthIpRateLimiter(store);
  const now = Date.now();

  for (let i = 0; i < AUTH_REQUEST_CODE_IP_MAX; i += 1) {
    limiter.check("request-code", "203.0.113.2", now + i);
  }

  const confirm = limiter.check("confirm", "203.0.113.2", now);
  assert.equal(confirm.allowed, true);
});

test("different IPs have separate buckets", () => {
  const store = new Map<string, number[]>();
  const limiter = createAuthIpRateLimiter(store);
  const now = Date.now();

  for (let i = 0; i < AUTH_CONFIRM_IP_MAX; i += 1) {
    limiter.check("confirm", "203.0.113.3", now + i);
  }

  const otherIp = limiter.check("confirm", "203.0.113.4", now);
  assert.equal(otherIp.allowed, true);
});

test("expired hits fall outside the sliding window", () => {
  const store = new Map<string, number[]>();
  const limiter = createAuthIpRateLimiter(store);
  const start = 1_700_000_000_000;

  for (let i = 0; i < AUTH_REQUEST_CODE_IP_MAX; i += 1) {
    limiter.check("request-code", "203.0.113.5", start + i);
  }

  const blocked = limiter.check("request-code", "203.0.113.5", start + 100);
  assert.equal(blocked.allowed, false);

  const afterWindow = limiter.check(
    "request-code",
    "203.0.113.5",
    start + AUTH_IP_RATE_WINDOW_MS + 1,
  );
  assert.equal(afterWindow.allowed, true);
});

test("formatAuthIpRateLimitMessage uses minutes", () => {
  assert.match(formatAuthIpRateLimitMessage(90), /2 minutos/);
  assert.match(formatAuthIpRateLimitMessage(45), /1 minuto/);
});
