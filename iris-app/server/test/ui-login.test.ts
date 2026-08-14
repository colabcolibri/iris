import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ADMIN = "../admin/src";

test("login page uses auth api", () => {
  const login = readFileSync(`${ADMIN}/pages/login-page.tsx`, "utf8");
  assert.match(login, /requestLoginCode/);
  assert.match(login, /confirmLoginCode/);
  assert.match(login, /shell\.login\.resendCode/);
});

test("dashboard gates unauthenticated users via api client", () => {
  const dashboard = readFileSync(`${ADMIN}/pages/dashboard-page.tsx`, "utf8");
  assert.match(dashboard, /UnauthorizedError/);
  assert.match(dashboard, /handleAuthError/);
});
