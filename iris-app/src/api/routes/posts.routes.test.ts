import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { createServer } from "../http-server.ts";

const ADMIN = "integration-admin";
const AGENT = "integration-agent";

async function withIntegrationServer(
  run: (ctx: { port: number; baseUrl: string }) => Promise<void>,
  options: { metaAccessToken?: string; igUserId?: string } = {},
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-media-"));
  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot,
    metaAccessToken: options.metaAccessToken ?? "integration-meta-token",
    igUserId: options.igUserId ?? "123456789",
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ port, baseUrl });
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

function authHeaders(token = AGENT): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

test("posts crud and asset upload flow", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        caption: "Legenda teste",
        channel: "instagram",
        source_note: "integration",
      }),
    });

    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as { id: string; status: string };
    assert.equal(created.status, "draft");

    const png = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: "#336699",
      },
    })
      .png()
      .toBuffer();

    const boundary = "----iris-boundary";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="sort_order"\r\n\r\n1\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="hero.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadResponse = await fetch(`${baseUrl}/api/posts/${created.id}/assets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    assert.equal(uploadResponse.status, 201);
    const asset = (await uploadResponse.json()) as {
      mime: string;
      width: number;
      storage_path: string;
    };
    assert.equal(asset.mime, "image/jpeg");
    assert.ok(asset.width <= 1080);
    assert.match(asset.storage_path, /\.jpg$/);

    const listResponse = await fetch(`${baseUrl}/api/posts/${created.id}/assets`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    const listPayload = (await listResponse.json()) as { assets: unknown[] };
    assert.equal(listPayload.assets.length, 1);

    const filename = asset.storage_path.split("/").pop()!;
    const fileResponse = await fetch(
      `${baseUrl}/api/posts/${created.id}/assets/${filename}`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(fileResponse.status, 200);
    assert.equal(fileResponse.headers.get("content-type"), "image/jpeg");

    const agentFileResponse = await fetch(
      `${baseUrl}/api/posts/${created.id}/assets/${filename}`,
      { headers: { Authorization: `Bearer ${AGENT}` } },
    );
    assert.equal(agentFileResponse.status, 200);
    assert.equal(agentFileResponse.headers.get("content-type"), "image/jpeg");

    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
    const scheduleResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "scheduled", scheduled_at: scheduledAt }),
    });
    assert.equal(scheduleResponse.status, 200);
    const scheduled = (await scheduleResponse.json()) as {
      status: string;
      scheduled_at: string;
    };
    assert.equal(scheduled.status, "scheduled");
    assert.equal(scheduled.scheduled_at, scheduledAt);

    const deleteResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "DELETE",
      headers: authHeaders(ADMIN),
    });
    assert.equal(deleteResponse.status, 200);
    const cancelled = (await deleteResponse.json()) as { status: string };
    assert.equal(cancelled.status, "cancelled");
  });
});

test("agent cannot delete posts", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ caption: "x", channel: "instagram" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const deleteResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "DELETE",
      headers: authHeaders(AGENT),
    });
    assert.equal(deleteResponse.status, 403);
  });
});

test("agent cannot toggle auto_reply without admin", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ caption: "x", channel: "instagram" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const patchResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(AGENT),
      body: JSON.stringify({ auto_reply_enabled: true }),
    });
    assert.equal(patchResponse.status, 403);

    const adminPatch = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(ADMIN),
      body: JSON.stringify({ auto_reply_enabled: true }),
    });
    assert.equal(adminPatch.status, 200);
    const updated = (await adminPatch.json()) as { auto_reply_enabled: boolean };
    assert.equal(updated.auto_reply_enabled, true);
  });
});

test("list posts filters by from/to and includes assets_count", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const inRangeAt = "2026-08-15T12:00:00.000Z";
    const outRangeAt = "2026-09-10T12:00:00.000Z";

    const inRangeResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        caption: "Agosto",
        channel: "instagram",
        scheduled_at: inRangeAt,
      }),
    });
    const inRange = (await inRangeResponse.json()) as { id: string };

    const outRangeResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        caption: "Setembro",
        channel: "instagram",
        scheduled_at: outRangeAt,
      }),
    });
    const outRange = (await outRangeResponse.json()) as { id: string };

    const draftResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        caption: "Draft sem agenda",
        channel: "instagram",
      }),
    });
    const draft = (await draftResponse.json()) as { id: string };

    const listResponse = await fetch(
      `${baseUrl}/api/posts?from=2026-08-01T00:00:00.000Z&to=2026-08-31T23:59:59.999Z`,
      { headers: { Authorization: `Bearer ${AGENT}` } },
    );
    assert.equal(listResponse.status, 200);
    const payload = (await listResponse.json()) as {
      posts: Array<{ id: string; assets_count?: number }>;
    };

    const ids = payload.posts.map((post) => post.id);
    assert.ok(ids.includes(inRange.id));
    assert.ok(ids.includes(draft.id));
    assert.ok(!ids.includes(outRange.id));
    assert.ok(payload.posts.every((post) => typeof post.assets_count === "number"));

    const emptyResponse = await fetch(
      `${baseUrl}/api/posts?from=2099-01-01T00:00:00.000Z&to=2099-01-31T23:59:59.999Z`,
      { headers: { Authorization: `Bearer ${AGENT}` } },
    );
    const emptyPayload = (await emptyResponse.json()) as { posts: unknown[] };
    assert.equal(emptyPayload.posts.length, 0);

    const invalidResponse = await fetch(`${baseUrl}/api/posts?from=not-a-date`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    assert.equal(invalidResponse.status, 422);
  });
});

test("list posts returns assets_count after upload", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ caption: "com mídia", channel: "instagram" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const png = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: "#ff0000",
      },
    })
      .png()
      .toBuffer();

    const boundary = "----iris-assets-count";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="sort_order"\r\n\r\n1\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    await fetch(`${baseUrl}/api/posts/${created.id}/assets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    const listResponse = await fetch(`${baseUrl}/api/posts`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    const payload = (await listResponse.json()) as {
      posts: Array<{ id: string; assets_count: number }>;
    };
    const listed = payload.posts.find((post) => post.id === created.id);
    assert.ok(listed);
    assert.equal(listed!.assets_count, 1);
  });
});

test("schedule without meta connection returns meta_not_connected", async () => {
  await withIntegrationServer(
    async ({ baseUrl }) => {
      const createResponse = await fetch(`${baseUrl}/api/posts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ caption: "sem meta", channel: "instagram" }),
      });
      const created = (await createResponse.json()) as { id: string };

      const png = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 3,
          background: "#000000",
        },
      })
        .png()
        .toBuffer();

      const boundary = "----iris-no-meta";
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="sort_order"\r\n\r\n1\r\n`,
        ),
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`,
        ),
        png,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      await fetch(`${baseUrl}/api/posts/${created.id}/assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AGENT}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
      const scheduleResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: "scheduled", scheduled_at: scheduledAt }),
      });

      assert.equal(scheduleResponse.status, 422);
      const payload = (await scheduleResponse.json()) as { error: string; code: string };
      assert.equal(payload.code, "meta_not_connected");
    },
    { metaAccessToken: "", igUserId: "" },
  );
});

test("failed post can return to draft or be rescheduled when meta connected", async () => {
  await withIntegrationServer(async ({ baseUrl }) => {
    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ caption: "falhou", channel: "instagram" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const png = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: "#336699",
      },
    })
      .png()
      .toBuffer();

    const boundary = "----iris-failed";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="sort_order"\r\n\r\n1\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    await fetch(`${baseUrl}/api/posts/${created.id}/assets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "failed" }),
    });

    const draftResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "draft" }),
    });
    assert.equal(draftResponse.status, 200);
    const draft = (await draftResponse.json()) as { status: string; error_message: string | null };
    assert.equal(draft.status, "draft");
    assert.equal(draft.error_message, null);

    await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "failed" }),
    });

    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
    const scheduleResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "scheduled", scheduled_at: scheduledAt }),
    });
    assert.equal(scheduleResponse.status, 200);
    const scheduled = (await scheduleResponse.json()) as {
      status: string;
      scheduled_at: string;
    };
    assert.equal(scheduled.status, "scheduled");
    assert.equal(scheduled.scheduled_at, scheduledAt);
  });
});
