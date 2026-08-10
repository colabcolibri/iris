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
    const body = (await response.json()) as {
      response_language: string;
      max_chars: number;
    };
    assert.equal(body.response_language, "pt-BR");
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
        response_language: "en-US",
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
        response_language: "fr",
        brand_name: null,
        max_chars: 200,
      }),
    });
    assert.equal(agentPut.status, 403);

    const getResponse = await fetch(`${baseUrl}/api/settings/reply-persona`, {
      headers: { Cookie: adminCookie },
    });
    const body = (await getResponse.json()) as {
      response_language: string;
      brand_name: string;
      max_chars: number;
    };
    assert.equal(body.response_language, "en-US");
    assert.equal(body.brand_name, "Iris");
    assert.equal(body.max_chars, 420);
  });
});

test("GET app settings returns default timezone", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const response = await fetch(`${baseUrl}/api/settings/app`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      timezone: string;
      auto_reply_enabled: boolean;
    };
    assert.equal(body.timezone, "America/Sao_Paulo");
    assert.equal(body.auto_reply_enabled, true);
  });
});

test("PUT app settings persists timezone and rejects invalid zone", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const putResponse = await fetch(`${baseUrl}/api/settings/app`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone: "Europe/Lisbon" }),
    });
    assert.equal(putResponse.status, 200);

    const invalid = await fetch(`${baseUrl}/api/settings/app`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone: "Invalid/Zone" }),
    });
    assert.equal(invalid.status, 422);

    const getResponse = await fetch(`${baseUrl}/api/settings/app`, {
      headers: { Cookie: adminCookie },
    });
    const body = (await getResponse.json()) as { timezone: string };
    assert.equal(body.timezone, "Europe/Lisbon");
  });
});

test("PUT app settings persists auto_reply_enabled without timezone", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const disable = await fetch(`${baseUrl}/api/settings/app`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auto_reply_enabled: false }),
    });
    assert.equal(disable.status, 200);
    const disabled = (await disable.json()) as {
      auto_reply_enabled: boolean;
      timezone: string;
    };
    assert.equal(disabled.auto_reply_enabled, false);
    assert.equal(disabled.timezone, "America/Sao_Paulo");

    const getResponse = await fetch(`${baseUrl}/api/settings/app`, {
      headers: { Cookie: adminCookie },
    });
    const body = (await getResponse.json()) as { auto_reply_enabled: boolean };
    assert.equal(body.auto_reply_enabled, false);
  });
});

test("PUT and GET llm settings persist encrypted api key", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const putResponse = await fetch(`${baseUrl}/api/settings/llm`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: "sk-test-key-1234",
        api_url: "https://api.example.com/v1/chat/completions",
        model: "gpt-test",
        supports_vision: true,
      }),
    });
    assert.equal(putResponse.status, 200);

    const putBody = (await putResponse.json()) as {
      configured: boolean;
      key_hint: string;
      source: string;
      model: string;
    };
    assert.equal(putBody.configured, true);
    assert.equal(putBody.key_hint, "1234");
    assert.equal(putBody.source, "database");
    assert.equal(putBody.model, "gpt-test");

    const getResponse = await fetch(`${baseUrl}/api/settings/llm`, {
      headers: { Cookie: adminCookie },
    });
    const getBody = (await getResponse.json()) as { key_hint: string };
    assert.equal(getBody.key_hint, "1234");
  });
});

test("agent cannot update llm settings", async () => {
  await withSettingsServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/settings/llm`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: "sk-hack",
        api_url: "https://api.example.com/v1/chat/completions",
        model: "gpt-test",
      }),
    });
    assert.equal(response.status, 403);
  });
});

test("GET agent content returns defaults", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const response = await fetch(`${baseUrl}/api/settings/agent-content`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      soul: string;
      page: string;
      knowledge: string;
      restrictions: string;
    };
    assert.ok(body.soul.length > 0);
    assert.ok(body.page.length > 0);
    assert.ok(typeof body.knowledge === "string");
    assert.ok(body.restrictions.length > 0);
  });
});

test("PUT agent content persists and agent cannot write", async () => {
  await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const putResponse = await fetch(`${baseUrl}/api/settings/agent-content`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        soul: "# Soul custom",
        page: "Página teste",
        knowledge: "Fatos",
        restrictions: "Não prometer desconto",
      }),
    });
    assert.equal(putResponse.status, 200);

    const agentPut = await fetch(`${baseUrl}/api/settings/agent-content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        soul: "hack",
        page: "x",
        knowledge: "y",
        restrictions: "z",
      }),
    });
    assert.equal(agentPut.status, 403);

    const getResponse = await fetch(`${baseUrl}/api/settings/agent-content`, {
      headers: { Cookie: adminCookie },
    });
    const body = (await getResponse.json()) as { soul: string; restrictions: string };
    assert.equal(body.soul, "# Soul custom");
    assert.equal(body.restrictions, "Não prometer desconto");
  });
});
