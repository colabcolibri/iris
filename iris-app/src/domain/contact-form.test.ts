import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ContactFormError,
  isContactHoneypotTriggered,
  submitContactForm,
  validateContactFormInput,
} from "./contact-form.ts";

test("validateContactFormInput rejects invalid email", () => {
  assert.throws(
    () =>
      validateContactFormInput({
        name: "Ana",
        email: "invalid",
        subject: "Interesse",
        message: "Quero saber mais sobre o Iris.",
      }),
    (error: unknown) => error instanceof ContactFormError && error.code === "invalid_email",
  );
});

test("isContactHoneypotTriggered detects bot submissions", () => {
  assert.equal(isContactHoneypotTriggered(""), false);
  assert.equal(isContactHoneypotTriggered("https://spam.test"), true);
});

test("submitContactForm returns success for honeypot without sending", async () => {
  let sent = false;
  const result = await submitContactForm(
    {
      name: "Bot",
      email: "bot@example.com",
      subject: "Spam",
      message: "Buy now buy now",
      website: "https://spam.test",
    },
    {
      emailSender: {
        async send() {
          sent = true;
          return { ok: true };
        },
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(sent, false);
});

test("submitContactForm sends email to configured destination", async () => {
  const capture: { to?: string; replyTo?: string; subject?: string } = {};
  const result = await submitContactForm(
    {
      name: "Ana Silva",
      email: "ana@example.com",
      subject: "Interesse no Iris",
      message: "Gostaria de conversar sobre o produto.",
      pageUrl: "https://iris.sergioluciano.com/#contato",
    },
    {
      destinationEmail: "ola@sergioluciano.com",
      emailSender: {
        async send(input) {
          capture.to = input.to;
          capture.replyTo = input.replyTo;
          capture.subject = input.subject;
          return { ok: true };
        },
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(capture.to, "ola@sergioluciano.com");
  assert.equal(capture.replyTo, "ana@example.com");
  assert.match(capture.subject ?? "", /Interesse no Iris/);
});
