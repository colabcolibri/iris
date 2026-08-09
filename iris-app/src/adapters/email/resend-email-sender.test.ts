import { test } from "node:test";
import assert from "node:assert/strict";
import { createResendEmailSender } from "./resend-email-sender.ts";

test("resend email sender posts to Resend API", async () => {
  let capturedUrl = "";
  let capturedAuth = "";

  const sender = createResendEmailSender({
    apiKey: "re_test",
    defaultFrom: "Iris <test@example.com>",
    fetchImpl: async (url, init) => {
      capturedUrl = String(url);
      const headers = new Headers(init?.headers);
      capturedAuth = headers.get("Authorization") ?? "";
      return new Response(JSON.stringify({ id: "email_1" }), { status: 200 });
    },
  });

  const result = await sender.send({
    to: "admin@example.com",
    subject: "Código",
    text: "123456",
  });

  assert.equal(result.ok, true);
  assert.equal(capturedUrl, "https://api.resend.com/emails");
  assert.equal(capturedAuth, "Bearer re_test");
});

test("resend email sender surfaces API errors", async () => {
  const sender = createResendEmailSender({
    apiKey: "re_test",
    defaultFrom: "Iris <test@example.com>",
    fetchImpl: async () => new Response("invalid", { status: 401 }),
  });

  const result = await sender.send({
    to: "admin@example.com",
    subject: "Código",
    text: "123456",
  });

  assert.equal(result.ok, false);
  assert.ok(result.error?.includes("invalid"));
});
