import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSafeDocsLocation,
  resolveDocsRedirect,
} from "../src/api/docs-route-policy.ts";

test("resolveDocsRedirect maps entry and legacy meta paths", () => {
  assert.equal(resolveDocsRedirect("/docs"), "/docs/inicio/");
  assert.equal(resolveDocsRedirect("/docs/"), "/docs/inicio/");
  assert.equal(resolveDocsRedirect("/docs/meta"), "/docs/configuracao/");
  assert.equal(resolveDocsRedirect("/docs/meta/"), "/docs/configuracao/");
  assert.equal(
    resolveDocsRedirect("/docs/meta/04-webhooks/"),
    "/docs/configuracao/04-webhooks/",
  );
  assert.equal(resolveDocsRedirect("/admin"), null);
});

test("resolveDocsRedirect rejects path traversal in legacy prefix", () => {
  assert.equal(resolveDocsRedirect("/docs/meta/../../../admin"), null);
  assert.equal(resolveDocsRedirect("/docs/meta/foo?x=1"), null);
  assert.equal(resolveDocsRedirect("/docs/meta/foo#bar"), null);
});

test("isSafeDocsLocation allows internal docs paths only", () => {
  assert.equal(isSafeDocsLocation("/docs/inicio/"), true);
  assert.equal(isSafeDocsLocation("https://evil.com/docs/"), false);
  assert.equal(isSafeDocsLocation("/docs/../admin"), false);
  assert.equal(isSafeDocsLocation("/docs/inicio/?q=1"), false);
});
