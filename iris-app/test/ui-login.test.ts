import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("login.html has minimal professional layout", () => {
  const html = readFileSync("public/login.html", "utf8");
  assert.match(html, /class="login-progress"/);
  assert.match(html, /id="code-sent-email"/);
  assert.match(html, /id="resend-code-btn"/);
  assert.match(html, /id="change-email-btn"/);
  assert.match(html, /id="login-feedback"/);
  assert.doesNotMatch(html, /login-hint/);
  assert.doesNotMatch(html, /notice-banner/);
});

test("login.js calls auth endpoints with credentials", () => {
  const js = readFileSync("public/login.js", "utf8");
  assert.match(js, /\/api\/auth\/request-code/);
  assert.match(js, /\/api\/auth\/confirm/);
  assert.match(js, /credentials:\s*"include"/);
  assert.match(js, /goToCodeStep/);
  assert.match(js, /Enviando/);
});

test("app.js gates unauthenticated users", () => {
  const js = readFileSync("public/app.js", "utf8");
  assert.match(js, /ensureAuthenticated/);
});
