import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldGateSpaGet } from "../src/api/spa-route-policy.ts";

test("shouldGateSpaGet protects editorial routes only", () => {
  assert.equal(shouldGateSpaGet("/", "GET"), true);
  assert.equal(shouldGateSpaGet("/comments", "GET"), true);
  assert.equal(shouldGateSpaGet("/settings", "GET"), true);
  assert.equal(shouldGateSpaGet("/persona", "GET"), true);
});

test("shouldGateSpaGet allows public routes and assets", () => {
  assert.equal(shouldGateSpaGet("/login", "GET"), false);
  assert.equal(shouldGateSpaGet("/privacy", "GET"), false);
  assert.equal(shouldGateSpaGet("/health", "GET"), false);
  assert.equal(shouldGateSpaGet("/api/posts", "GET"), false);
  assert.equal(shouldGateSpaGet("/auth/meta", "GET"), false);
  assert.equal(shouldGateSpaGet("/assets/index.js", "GET"), false);
  assert.equal(shouldGateSpaGet("/favicon.svg", "GET"), false);
});

test("shouldGateSpaGet ignores non-GET methods", () => {
  assert.equal(shouldGateSpaGet("/", "POST"), false);
});
