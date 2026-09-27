import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { tmpdir } from "node:os";
import { createServer } from "../../api/http-server.ts";
import { openControlDatabase, controlHasEditorialTables } from "../../adapters/sqlite/control-database.ts";
import { createAccountStore } from "../../adapters/sqlite/account-store.ts";
import { createTenancyRuntime } from "../../api/tenancy-runtime.ts";
import { createMetaOAuthState } from "../meta/meta-oauth-state.ts";
import { importInstallation } from "./import-installation.ts";
import { runPublishTick } from "../../workers/account-workers.ts";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const TENANCY = {
  enabled: true as const,
  mode: "local" as const,
  org: "",
  platformToken: "super-secret-platform-token",
  group: "iris",
  location: "gru",
};

async function signup(
  baseUrl: string,
  email: string,
  capture: { text: string },
): Promise<string> {
  const request = await fetch(`${baseUrl}/api/auth/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const requestBody = await request.text();
  assert.equal(request.status, 200, requestBody);
  const code = capture.text.match(/\b(\d{6})\b/)?.[1];
  assert.ok(code);
  const confirm = await fetch(`${baseUrl}/api/auth/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const body = await confirm.text();
  assert.equal(confirm.status, 200);
  assert.equal(body.includes(TENANCY.platformToken), false);
  const cookie = confirm.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return cookie;
}

test("two accounts do not share posts, and webhook lands on the slug", async () => {
  const root = await mkdtemp(join(tmpdir(), "iris-tenancy-"));
  const capture = { text: "" };
  const emailSender: EmailSender = {
    async send(input) {
      capture.text = input.text;
      return { ok: true };
    },
  };
  process.env.IRIS_SESSION_SECRET = "test-session-secret";
  process.env.IRIS_OTP_PEPPER = "test-otp-pepper";

  const { server, stopScheduler, closeDatabase } = createServer({
    dbPath: join(root, "fallback.db"),
    mediaRoot: join(root, "media"),
    controlDbPath: join(root, "control.db"),
    tenancy: TENANCY,
    emailSender,
    publicBaseUrl: "http://127.0.0.1",
    publishUrlSecret: "publish-secret",
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const control = openControlDatabase(join(root, "control.db"));
    assert.equal(controlHasEditorialTables(control), false);
    control.close();

    const cookieA = await signup(baseUrl, "a@example.com", capture);
    const cookieB = await signup(baseUrl, "b@example.com", capture);

    const created = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ caption: "somente A", channel: "instagram" }),
    });
    assert.equal(created.status, 201);

    const listB = await fetch(`${baseUrl}/api/posts`, { headers: { Cookie: cookieB } });
    assert.equal(listB.status, 200);
    const bodyB = (await listB.json()) as { posts: unknown[] };
    assert.equal(bodyB.posts.length, 0);

    const saved = await fetch(`${baseUrl}/api/settings/meta-app`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        app_id: "app-a",
        app_secret: "secret-a",
        verify_token: "verify-a",
      }),
    });
    const savedBody = await saved.text();
    assert.equal(saved.status, 200);
    assert.equal(savedBody.includes("secret-a"), false);

    const me = (await (await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } })).json()) as {
      slug: string;
    };
    const payload = JSON.stringify({ object: "instagram", entry: [] });
    const bad = await fetch(`${baseUrl}/webhooks/meta/${me.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hub-Signature-256": "sha256=dead" },
      body: payload,
    });
    assert.notEqual(bad.status, 200);

    const digest = createHmac("sha256", "secret-a").update(payload).digest("hex");
    const good = await fetch(`${baseUrl}/webhooks/meta/${me.slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": `sha256=${digest}`,
      },
      body: payload,
    });
    assert.equal(good.status, 200);

    const missing = await fetch(`${baseUrl}/webhooks/meta/does-not-exist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    assert.equal(missing.status, 404);

    const again = await signup(baseUrl, "a@example.com", capture);
    assert.ok(again);
    const controlAfter = openControlDatabase(join(root, "control.db"));
    const accountCount = controlAfter
      .prepare("SELECT COUNT(*) AS total FROM accounts WHERE email = ?")
      .get("a@example.com") as { total: number };
    assert.equal(accountCount.total, 1);
    const accountsTable = controlAfter
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'accounts'")
      .get();
    assert.ok(accountsTable);
    controlAfter.close();

    const publicA = (await (
      await fetch(`${baseUrl}/api/settings/meta-app`, { headers: { Cookie: cookieA } })
    ).json()) as { app_id: string; has_secret: boolean };
    assert.equal(publicA.app_id, "app-a");
    assert.equal(publicA.has_secret, true);
    const publicB = (await (
      await fetch(`${baseUrl}/api/settings/meta-app`, { headers: { Cookie: cookieB } })
    ).json()) as { app_id: string; has_secret: boolean };
    assert.equal(publicB.app_id, "");
    assert.equal(publicB.has_secret, false);

    const setup = (await (
      await fetch(`${baseUrl}/api/meta/setup`, { headers: { Cookie: cookieA } })
    ).json()) as { webhook_url: string };
    assert.match(setup.webhook_url, new RegExp(`/webhooks/meta/${me.slug}$`));

    const oauth = await fetch(`${baseUrl}/auth/meta`, {
      headers: { Cookie: cookieA },
      redirect: "manual",
    });
    assert.equal(oauth.status, 302);
    assert.match(oauth.headers.get("location") ?? "", /client_id=app-a/);

    const expired = await fetch(`${baseUrl}/api/posts`, {
      headers: { Cookie: "iris_session=v1.1.bad.bad" },
    });
    assert.equal(expired.status, 401);

    const mcp = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "POST",
      headers: { Cookie: cookieA },
    });
    assert.equal(mcp.status, 200);
    const generated = (await mcp.json()) as { connection_code: string };
    const mcpList = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${generated.connection_code}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "iris_list_posts", arguments: {} },
      }),
    });
    assert.equal(mcpList.status, 200);
    const mcpBody = (await mcpList.json()) as {
      result?: { content?: Array<{ text?: string }> };
    };
    const listed = JSON.parse(mcpBody.result?.content?.[0]?.text ?? "{}") as {
      posts: Array<{ caption: string | null }>;
    };
    assert.equal(listed.posts.length, 1);
    assert.equal(listed.posts[0]?.caption, "somente A");
    const mcpB = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "POST",
      headers: { Cookie: cookieB },
    });
    assert.equal(mcpB.status, 200);
    const generatedB = (await mcpB.json()) as { connection_code: string };
    const mcpAsB = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${generatedB.connection_code}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "iris_list_posts", arguments: {} },
      }),
    });
    assert.equal(mcpAsB.status, 200);
    const bodyBMcp = (await mcpAsB.json()) as {
      result?: { content?: Array<{ text?: string }> };
    };
    const listedB = JSON.parse(bodyBMcp.result?.content?.[0]?.text ?? "{}") as {
      posts: unknown[];
    };
    assert.equal(listedB.posts.length, 0);

    const png = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "#336699" },
    })
      .png()
      .toBuffer();
    const boundary = "----iris-tenant";
    const uploadBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="hero.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const createdPost = (await created.json()) as { id: string };
    const upload = await fetch(`${baseUrl}/api/posts/${createdPost.id}/assets`, {
      method: "POST",
      headers: {
        Cookie: cookieA,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: uploadBody,
    });
    assert.equal(upload.status, 201);
    const asset = (await upload.json()) as { storage_path: string };
    const filename = asset.storage_path.split("/").pop()!;
    const seenByA = await fetch(`${baseUrl}/api/posts/${createdPost.id}/assets/${filename}`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(seenByA.status, 200);
    const seenByB = await fetch(`${baseUrl}/api/posts/${createdPost.id}/assets/${filename}`, {
      headers: { Cookie: cookieB },
    });
    assert.equal(seenByB.status, 404);

    const ownerDb = openControlDatabase(join(root, "control.db"));
    const owner = ownerDb
      .prepare("SELECT id FROM accounts WHERE email = ?")
      .get("a@example.com") as { id: string };
    ownerDb.close();
    const state = createMetaOAuthState("test-session-secret", "instagram", owner.id);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.startsWith(baseUrl)) {
        return originalFetch(input, init);
      }
      if (url.includes("api.instagram.com/oauth/access_token")) {
        assert.match(String(init?.body), /client_secret=secret-a/);
        return new Response(JSON.stringify({ access_token: "short-a", user_id: "ig-user-a" }), {
          status: 200,
        });
      }
      if (url.includes("graph.instagram.com/access_token")) {
        assert.match(url, /client_secret=secret-a/);
        return new Response(JSON.stringify({ access_token: "long-token-a", expires_in: 3600 }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ user_id: "ig-user-a", username: "marca_a" }), {
        status: 200,
      });
    };
    try {
      const callback = await originalFetch(
        `${baseUrl}/auth/meta/callback?code=oauth-code&state=${encodeURIComponent(state)}`,
        { redirect: "manual" },
      );
      assert.equal(callback.status, 302);
      assert.match(callback.headers.get("location") ?? "", /meta_connected=1/);
    } finally {
      globalThis.fetch = originalFetch;
    }
    const accountDb = openDatabase(join(root, "tenants", owner.id, "iris.db"));
    const connection = accountDb
      .prepare("SELECT ig_username FROM meta_connection")
      .get() as { ig_username: string | null } | undefined;
    accountDb.close();
    assert.equal(connection?.ig_username, "marca_a");
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    closeDatabase();
    await rm(root, { recursive: true, force: true });
  }
});

test("migration failure on one account does not mark the other", async () => {
  const root = await mkdtemp(join(tmpdir(), "iris-migrate-"));
  const tenancy = createTenancyRuntime({
    config: TENANCY,
    controlDbPath: join(root, "control.db"),
    contextOptions: {},
  });
  try {
    await tenancy.ensureAccount("ok@example.com");
    await tenancy.ensureAccount("bad@example.com");
    const store = createAccountStore(tenancy.control);
    const bad = store.findByEmail("bad@example.com");
    assert.ok(bad);
    const originalUrl = bad.databaseUrl;
    store.saveDatabase({
      accountId: bad.id,
      name: bad.databaseName ?? "bad",
      url: "file:/this/path/does/not/exist/iris.db",
      authToken: null,
      migrationVersion: null,
    });
    const results = tenancy.migrateAll();
    const ok = results.find((item) => item.accountId !== bad.id);
    const failed = results.find((item) => item.accountId === bad.id);
    assert.ok(ok);
    assert.equal(ok.error, undefined);
    assert.ok(failed?.error);
    const still = store.findByEmail("bad@example.com");
    assert.equal(still?.migrationVersion, null);

    store.saveDatabase({
      accountId: bad.id,
      name: bad.databaseName ?? "bad",
      url: originalUrl ?? "",
      authToken: null,
      migrationVersion: null,
    });
    const retried = tenancy.migrateAll();
    const recovered = retried.find((item) => item.accountId === bad.id);
    assert.equal(recovered?.error, undefined);
    assert.ok(recovered?.version);
    const second = tenancy.migrateAll();
    const again = second.find((item) => item.accountId === bad.id);
    assert.equal(again?.error, undefined);
    assert.equal(again?.version, recovered?.version);
  } finally {
    tenancy.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("import copies posts once", async () => {
  const root = await mkdtemp(join(tmpdir(), "iris-import-"));
  const sourcePath = join(root, "source.db");
  const source = openDatabase(sourcePath);
  runMigrations(source);
  source.prepare(
    "INSERT INTO posts (id, status, channel, caption, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run("post-1", "draft", "instagram", "antigo", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
  source.close();
  const media = join(root, "media", "post-1");
  await mkdir(media, { recursive: true });
  await writeFile(join(media, "01.jpg"), "img");

  const tenancy = createTenancyRuntime({
    config: TENANCY,
    controlDbPath: join(root, "control.db"),
    contextOptions: {},
  });
  try {
    const first = await importInstallation({
      tenancy,
      email: "owner@example.com",
      sourceDbPath: sourcePath,
      sourceMediaDir: join(root, "media"),
    });
    assert.equal(first.skipped, false);
    assert.equal(first.importedPosts, 1);
    const second = await importInstallation({
      tenancy,
      email: "owner@example.com",
      sourceDbPath: sourcePath,
      sourceMediaDir: join(root, "media"),
    });
    assert.equal(second.skipped, true);
    const ctx = tenancy.contextForAccount(first.accountId);
    assert.equal(ctx?.posts.list().length, 1);
    assert.equal(existsSync(sourcePath), true);
    assert.equal(existsSync(join(root, "media", "post-1", "01.jpg")), true);
    assert.equal(
      existsSync(join(root, "tenants", first.accountId, "media", "post-1", "01.jpg")),
      true,
    );
  } finally {
    tenancy.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("publish tick uses the account context and skips a database-less account", async () => {
  const root = await mkdtemp(join(tmpdir(), "iris-workers-"));
  const tenancy = createTenancyRuntime({
    config: TENANCY,
    controlDbPath: join(root, "control.db"),
    dataRoot: root,
    contextOptions: {},
  });
  try {
    const active = await tenancy.ensureAccount("pub@example.com");
    const idle = await tenancy.ensureAccount("idle@example.com");
    tenancy.control
      .prepare("UPDATE accounts SET status = 'pending' WHERE id = ?")
      .run(idle.id);
    tenancy.control.prepare("DELETE FROM account_databases WHERE account_id = ?").run(idle.id);
    tenancy.invalidate(idle.id);

    const contexts = tenancy.listContexts();
    assert.equal(contexts.length, 1);
    assert.equal(contexts[0]?.accountId, active.id);
    assert.equal(tenancy.contextForAccount(idle.id), null);

    const ctx = contexts[0];
    assert.ok(ctx);
    const post = ctx.posts.create({
      caption: "agendado",
      channel: "instagram",
      status: "scheduled",
      scheduledAt: "2020-01-01T00:00:00.000Z",
    });
    await mkdir(join(root, "tenants", active.id, "media"), { recursive: true });
    await writeFile(join(root, "tenants", active.id, "media", "01.jpg"), "img");
    ctx.assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: "01.jpg",
      mime: "image/jpeg",
    });
    ctx.metaTokenStore.upsertToken("token-da-conta-a");
    ctx.metaConnectionStore.upsert({
      igUserId: "ig-a",
      igUsername: "marca-a",
      pageId: "page-a",
      pageName: null,
    });
    const published: string[] = [];
    ctx.metaPublisher = {
      async publish(postId: string) {
        published.push(postId);
        return { igMediaId: "ig-media-a" };
      },
    };

    await runPublishTick(ctx);
    assert.deepEqual(published, [post.id]);
    assert.equal(ctx.posts.findById(post.id)?.status, "published");
    assert.equal(existsSync(join(root, "tenants", active.id, "media", "01.jpg")), true);
  } finally {
    tenancy.close();
    await rm(root, { recursive: true, force: true });
  }
});
