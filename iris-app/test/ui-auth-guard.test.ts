import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("app routes use protected and guest guards", () => {
  const app = readFileSync("admin/src/App.tsx", "utf8");
  assert.match(app, /ProtectedRoute/);
  assert.match(app, /GuestRoute/);
  assert.match(app, /AuthSessionProvider/);
  assert.match(app, /ConfirmDialogProvider/);
  assert.match(app, /path="\/comments"/);
  assert.match(app, /path="\/agent-runs"/);
  assert.match(app, /<ProtectedRoute>[\s\S]*<CommentsPage/);
});

test("protected route redirects anonymous users to login with returnUrl", () => {
  const guard = readFileSync("admin/src/components/auth/protected-route.tsx", "utf8");
  assert.match(guard, /status === "loading"/);
  assert.match(guard, /returnUrl/);
  assert.match(guard, /Navigate to=\{`\/login\?returnUrl=/);
  assert.match(guard, /AuthLoadingScreen/);
});

test("guest route shares auth loading screen", () => {
  const guest = readFileSync("admin/src/components/auth/guest-route.tsx", "utf8");
  assert.match(guest, /AuthLoadingScreen/);
  assert.match(guest, /Navigate to="\/"/);
});

test("auth session invalidates only when authenticated", () => {
  const context = readFileSync("admin/src/contexts/auth-session-context.tsx", "utf8");
  assert.match(context, /fetchAuthMe/);
  assert.match(context, /setUnauthorizedListener/);
  assert.match(context, /statusRef\.current !== "authenticated"/);
  assert.match(context, /signOut/);
});

test("api fetch notifies unauthorized bus on 401", () => {
  const api = readFileSync("admin/src/lib/api.ts", "utf8");
  assert.match(api, /notifyUnauthorized/);
  assert.doesNotMatch(api, /setUnauthorizedListener/);
});

test("confirm dialog template supports typed phrase", () => {
  const dialog = readFileSync("admin/src/components/templates/confirm-dialog.tsx", "utf8");
  assert.match(dialog, /confirmPhrase/);
  assert.match(dialog, /AlertDialog/);
});

test("login page refreshes session silently and honors returnUrl", () => {
  const login = readFileSync("admin/src/pages/login-page.tsx", "utf8");
  assert.match(login, /refresh\(\{ silent: true \}\)/);
  assert.match(login, /returnUrl/);
});
