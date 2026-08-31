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

test("submitContactForm fails when destination email is not configured", async () => {
  const previous = process.env.IRIS_CONTACT_EMAIL;
  delete process.env.IRIS_CONTACT_EMAIL;

  try {
    await assert.rejects(
      () =>
        submitContactForm(
          {
            name: "Ana Silva",
            email: "ana@example.com",
            subject: "Interest",
            message: "I would like to learn more.",
          },
          {
            emailSender: {
              async send() {
                return { ok: true };
              },
            },
          },
        ),
      (error: unknown) =>
        error instanceof ContactFormError && error.code === "email_not_configured",
    );
  } finally {
    if (previous === undefined) {
      delete process.env.IRIS_CONTACT_EMAIL;
    } else {
      process.env.IRIS_CONTACT_EMAIL = previous;
    }
  }
});

test("submitContactForm sends email to configured destination", async () => {
  const capture: { to?: string; replyTo?: string; subject?: string } = {};
  const result = await submitContactForm(
    {
      name: "Ana Silva",
      email: "ana@example.com",
      subject: "Interesse no Iris",
      message: "Gostaria de conversar sobre o produto.",
      pageUrl: "https://example.com/#contact",
    },
    {
      destinationEmail: "contact@example.com",
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
  assert.equal(capture.to, "contact@example.com");
  assert.equal(capture.replyTo, "ana@example.com");
  assert.match(capture.subject ?? "", /Interesse no Iris/);
});
