import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMetaConnection } from "./meta-health-check.ts";

test("checkMetaConnection returns ok for valid graph response", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ id: "ig-1", username: "brand" }), {
      status: 200,
    });

  const result = await checkMetaConnection({
    igUserId: "ig-1",
    token: "token",
    fetchImpl: fetchImpl as typeof fetch,
  });

  assert.equal(result.ok, true);
  assert.equal(result.code, "ok");
});

test("checkMetaConnection maps token expired", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { message: "expired", code: 190 } }), {
      status: 400,
    });

  const result = await checkMetaConnection({
    igUserId: "ig-1",
    token: "token",
    fetchImpl: fetchImpl as typeof fetch,
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "token_expired");
});
