import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedCorsOrigin } from "./cors.ts";

test("allows localhost origins for agent desk", () => {
  assert.equal(isAllowedCorsOrigin("http://127.0.0.1:8080"), true);
  assert.equal(isAllowedCorsOrigin("http://localhost:3000"), true);
  assert.equal(isAllowedCorsOrigin("null"), true);
});

test("rejects unknown origins by default", () => {
  assert.equal(isAllowedCorsOrigin("https://evil.example"), false);
});
