import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const AGENT = "integration-agent";

async function withSettingsServer(
  run: (ctx: { baseUrl: string; adminCookie: string }) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-settings-"));
  const capture = { text: "" };
  const emailSender: EmailSender = {
    async send(input) {
      capture.text = input.text;
      return { ok: true };
    },
  };

  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  process.env.IRIS_SESSION_SECRET = "test-session-secret";
  process.env.IRIS_OTP_PEPPER = "test-otp-pepper";

  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: "admin-token",
    agentToken: AGENT,
    mediaRoot,
    emailSender,
    startScheduler: false,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  await fetch(`${baseUrl}/api/auth/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com" }),
  });
  const match = capture.text.match(/\b(\d{6})\b/);
  assert.ok(match);
  const confirmResponse = await fetch(`${baseUrl}/api/auth/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", code: match![1] }),
  });
  const adminCookie = confirmResponse.headers.get("set-cookie")!.split(";")[0]!;

  try {
    await run({ baseUrl, adminCookie });
  } finally {
    stopScheduler();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

test("GET reply persona returns default when empty", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const response = await fetch(`${baseUrl}/api/settings/reply-persona`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { tone: string; max_chars: number };
    assert.ok(body.tone);
    assert.equal(body.max_chars, 500);
  });
});

test("PUT reply persona persists and agent cannot write", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const putResponse = await fetch(`${baseUrl}/api/settings/reply-persona`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_prompt: "Fale como a marca Iris.",
        tone: "profissional",
        brand_name: "Iris",
        max_chars: 420,
      }),
    });
    assert.equal(putResponse.status, 200);

    const agentPut = await fetch(`${baseUrl}/api/settings/reply-persona`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_prompt: "hack",
        tone: "x",
        brand_name: null,
        max_chars: 200,
      }),
    });
    assert.equal(agentPut.status, 403);

    const getResponse = await fetch(`${baseUrl}/api/settings/reply-persona`, {
      headers: { Cookie: adminCookie },
    });
    const body = (await getResponse.json()) as {
      system_prompt: string;
      brand_name: string;
      max_chars: number;
    };
    assert.equal(body.system_prompt, "Fale como a marca Iris.");
    assert.equal(body.brand_name, "Iris");
    assert.equal(body.max_chars, 420);
  });
});
