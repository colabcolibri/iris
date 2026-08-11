import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isProtectedSpaPath,
  isPublicSpaPath,
  resolveLegacyAdminRedirect,
  shouldGateSpaGet,
} from "../src/api/spa-route-policy.ts";

test("shouldGateSpaGet protects admin routes only", () => {
  assert.equal(shouldGateSpaGet("/admin", "GET"), true);
  assert.equal(shouldGateSpaGet("/admin/comments", "GET"), true);
  assert.equal(shouldGateSpaGet("/admin/settings", "GET"), true);
  assert.equal(shouldGateSpaGet("/admin/persona", "GET"), true);
});

test("shouldGateSpaGet allows landing and public routes", () => {
  assert.equal(shouldGateSpaGet("/", "GET"), false);
  assert.equal(shouldGateSpaGet("/en", "GET"), false);
  assert.equal(shouldGateSpaGet("/privacy", "GET"), false);
  assert.equal(shouldGateSpaGet("/admin/login", "GET"), false);
  assert.equal(shouldGateSpaGet("/health", "GET"), false);
  assert.equal(shouldGateSpaGet("/api/posts", "GET"), false);
  assert.equal(shouldGateSpaGet("/auth/meta", "GET"), false);
  assert.equal(shouldGateSpaGet("/assets/index.js", "GET"), false);
  assert.equal(shouldGateSpaGet("/favicon.svg", "GET"), false);
});

test("shouldGateSpaGet ignores non-GET methods", () => {
  assert.equal(shouldGateSpaGet("/admin", "POST"), false);
});

test("resolveLegacyAdminRedirect maps old admin paths", () => {
  assert.equal(resolveLegacyAdminRedirect("/login"), "/admin/login");
  assert.equal(resolveLegacyAdminRedirect("/comments"), "/admin/comments");
  assert.equal(resolveLegacyAdminRedirect("/"), null);
});

test("isProtectedSpaPath and isPublicSpaPath", () => {
  assert.equal(isProtectedSpaPath("/admin/comments"), true);
  assert.equal(isProtectedSpaPath("/admin/login"), false);
  assert.equal(isPublicSpaPath("/"), true);
  assert.equal(isPublicSpaPath("/admin/login"), true);
});
