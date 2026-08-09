import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("login.html includes email and code steps", () => {
  const html = readFileSync("public/login.html", "utf8");
  assert.match(html, /id="login-email"/);
  assert.match(html, /id="login-code"/);
  assert.match(html, /id="send-code-btn"/);
});

test("login.js calls auth endpoints with credentials", () => {
  const js = readFileSync("public/login.js", "utf8");
  assert.match(js, /\/api\/auth\/request-code/);
  assert.match(js, /\/api\/auth\/confirm/);
  assert.match(js, /credentials:\s*"include"/);
});

test("app.js gates unauthenticated users", () => {
  const js = readFileSync("public/app.js", "utf8");
  assert.match(js, /ensureAuthenticated/);
});
