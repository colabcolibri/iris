import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSmtpConfig } from "./smtp-config.ts";
import { createSmtpEmailSender } from "./smtp-email-sender.ts";

test("resolveSmtpConfig defaults to Mailpit", () => {
  delete process.env.IRIS_SMTP_HOST;
  delete process.env.IRIS_SMTP_PORT;

  const config = resolveSmtpConfig();
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 1025);
  assert.equal(config.secure, false);
});

test("smtp email sender delegates to transport", async () => {
  const sent: Array<Record<string, unknown>> = [];
  const sender = createSmtpEmailSender({
    defaultFrom: "Iris <test@localhost>",
    transport: {
      async sendMail(mail: { to?: string }) {
        sent.push(mail as Record<string, unknown>);
        return { messageId: "msg-1" };
      },
    } as never,
  });

  const result = await sender.send({
    to: "admin@example.com",
    subject: "Código",
    text: "123456",
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.to, "admin@example.com");
});
