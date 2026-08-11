import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteAdminLoginChallengeRepository } from "../../adapters/sqlite/admin-login-challenge-repository.ts";
import {
  AdminLoginError,
  confirmAdminLoginCode,
  requestAdminLoginCode,
} from "./admin-login.ts";
import { hashOtpCode } from "./admin-otp-code.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

function createMemoryDeps(captured: { text?: string }) {
  const db = openDatabase(":memory:");
  runMigrations(db);
  const challenges = createSqliteAdminLoginChallengeRepository(db);
  const emailSender: EmailSender = {
    async send(input) {
      captured.text = input.text;
      return { ok: true };
    },
  };
  return { db, challenges, emailSender };
}

test("request and confirm admin login code", async () => {
  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  process.env.IRIS_OTP_PEPPER = "test-pepper";
  const captured: { text?: string } = {};
  const { db, challenges, emailSender } = createMemoryDeps(captured);

  try {
    await requestAdminLoginCode("admin@example.com", { challenges, emailSender });
    assert.ok(captured.text);
    const match = captured.text.match(/\b(\d{6})\b/);
    assert.ok(match);

    const result = await confirmAdminLoginCode(
      "admin@example.com",
      match![1]!,
      { challenges, emailSender },
    );
    assert.equal(result.email, "admin@example.com");
    assert.equal(challenges.find("admin@example.com"), null);
  } finally {
    db.close();
    delete process.env.IRIS_ADMIN_EMAIL;
    delete process.env.IRIS_OTP_PEPPER;
  }
});

test("non-allowlisted email returns generic response without sending", async () => {
  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  const captured: { text?: string } = {};
  const { db, challenges, emailSender } = createMemoryDeps(captured);

  try {
    const result = await requestAdminLoginCode("other@example.com", {
      challenges,
      emailSender,
    });
    assert.equal(result.sent, true);
    assert.equal(captured.text, undefined);
  } finally {
    db.close();
    delete process.env.IRIS_ADMIN_EMAIL;
  }
});

test("allowlisted login fails closed when OTP pepper is missing", async () => {
  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  delete process.env.IRIS_OTP_PEPPER;
  const { db, challenges, emailSender } = createMemoryDeps({});

  try {
    await assert.rejects(
      () => requestAdminLoginCode("admin@example.com", { challenges, emailSender }),
      (error: unknown) =>
        error instanceof AdminLoginError && error.code === "security_not_configured",
    );
  } finally {
    db.close();
    delete process.env.IRIS_ADMIN_EMAIL;
  }
});

test("confirm rejects expired code", async () => {
  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  process.env.IRIS_OTP_PEPPER = "test-pepper";
  const { db, challenges, emailSender } = createMemoryDeps({});
  const code = "123456";

  try {
    challenges.upsert({
      email: "admin@example.com",
      codeHash: hashOtpCode(code, "test-pepper"),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      attempts: 0,
      lastRequestAt: new Date().toISOString(),
    });

    await assert.rejects(
      () =>
        confirmAdminLoginCode("admin@example.com", code, {
          challenges,
          emailSender,
        }),
      (error: unknown) =>
        error instanceof AdminLoginError && error.code === "code_expired",
    );
  } finally {
    db.close();
    delete process.env.IRIS_ADMIN_EMAIL;
    delete process.env.IRIS_OTP_PEPPER;
  }
});
