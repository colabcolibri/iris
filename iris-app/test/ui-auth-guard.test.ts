import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("app routes use protected and guest guards", () => {
  const app = readFileSync("admin/src/App.tsx", "utf8");
  assert.match(app, /ProtectedRoute/);
  assert.match(app, /GuestRoute/);
  assert.match(app, /AuthSessionProvider/);
  assert.match(app, /path="\/comments"/);
  assert.match(app, /<ProtectedRoute>\s*<CommentsPage/);
});

test("protected route redirects anonymous users to login with returnUrl", () => {
  const guard = readFileSync("admin/src/components/auth/protected-route.tsx", "utf8");
  assert.match(guard, /status === "loading"/);
  assert.match(guard, /returnUrl/);
  assert.match(guard, /Navigate to=\{`\/login\?returnUrl=/);
});

test("auth session provider bootstraps via fetchAuthMe", () => {
  const context = readFileSync("admin/src/contexts/auth-session-context.tsx", "utf8");
  assert.match(context, /fetchAuthMe/);
  assert.match(context, /status: AuthStatus/);
});

test("login page refreshes session and honors returnUrl", () => {
  const login = readFileSync("admin/src/pages/login-page.tsx", "utf8");
  assert.match(login, /refresh\(\)/);
  assert.match(login, /returnUrl/);
});
