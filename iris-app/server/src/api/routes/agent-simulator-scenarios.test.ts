import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const AGENT = "integration-agent";

async function withSimulatorServer(
  run: (ctx: { baseUrl: string; adminCookie: string }) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-simulator-"));
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

test("GET simulator scenarios returns seeded lookbook-verao", async () => {
  await withSimulatorServer(async ({ baseUrl, adminCookie }) => {
    const response = await fetch(`${baseUrl}/api/agent/simulator-scenarios`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      items: Array<{ id: string; label: string }>;
    };
    assert.ok(body.items.some((item) => item.id === "lookbook-verao"));
  });
});

test("POST PUT DELETE simulator scenarios require admin", async () => {
  await withSimulatorServer(async ({ baseUrl, adminCookie }) => {
    const createResponse = await fetch(`${baseUrl}/api/agent/simulator-scenarios`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "api-created",
        label: "API created",
        description: "Created via API",
        caption: "Caption",
        carousel_summary: "Carousel",
        thread: [{ author: "user", text: "Hi" }],
        target_author: "guest",
        target_text: "Question?",
      }),
    });
    assert.equal(createResponse.status, 201);

    const agentCreate = await fetch(`${baseUrl}/api/agent/simulator-scenarios`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "agent-scenario",
        label: "Agent",
        description: "desc",
        caption: "caption",
        carousel_summary: "carousel",
        thread: [],
        target_author: "guest",
        target_text: "text",
      }),
    });
    assert.equal(agentCreate.status, 403);

    const updateResponse = await fetch(`${baseUrl}/api/agent/simulator-scenarios/api-created`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label: "API updated" }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()) as { label: string };
    assert.equal(updated.label, "API updated");

    const deleteResponse = await fetch(`${baseUrl}/api/agent/simulator-scenarios/api-created`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.equal(deleteResponse.status, 200);

    const missing = await fetch(`${baseUrl}/api/agent/simulator-scenarios/api-created`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.equal(missing.status, 404);
  });
});

test("POST simulate accepts scenario_id and validates missing scenario", async () => {
  await withSimulatorServer(async ({ baseUrl, adminCookie }) => {
    const missing = await fetch(`${baseUrl}/api/agent/simulate`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenario_id: "does-not-exist" }),
    });
    assert.equal(missing.status, 422);

    const noLlm = await fetch(`${baseUrl}/api/agent/simulate`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenario_id: "lookbook-verao" }),
    });
    assert.equal(noLlm.status, 422);
    const body = (await noLlm.json()) as {
      error: { code: string; details?: { message?: string } };
    };
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.match(body.error.details?.message ?? "", /LLM is not configured/);
  });
});
