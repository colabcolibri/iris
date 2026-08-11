import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateMetaReadiness, MetaNotConnectedError, assertMetaReadyForSchedule } from "./meta-readiness.ts";
import type { AppContext } from "../api/app-context.ts";

test("evaluateMetaReadiness returns ready when token and ig user present", () => {
  const result = evaluateMetaReadiness({
    token: "token",
    igUserId: "123",
    tokenExpired: false,
  });
  assert.equal(result.ready, true);
});

test("evaluateMetaReadiness fails without token", () => {
  const result = evaluateMetaReadiness({
    token: null,
    igUserId: "123",
    tokenExpired: false,
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "no_token");
});

test("evaluateMetaReadiness fails without ig user", () => {
  const result = evaluateMetaReadiness({
    token: "token",
    igUserId: null,
    tokenExpired: false,
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "no_ig_user");
});

test("evaluateMetaReadiness fails when token expired", () => {
  const result = evaluateMetaReadiness({
    token: "token",
    igUserId: "123",
    tokenExpired: true,
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "token_expired");
});

test("assertMetaReadyForSchedule throws MetaNotConnectedError", () => {
  const ctx = {
    metaTokenStore: { getActiveToken: () => null },
    metaConnectionStore: { get: () => null },
    db: {
      prepare: () => ({
        get: () => undefined,
      }),
    },
  } as unknown as AppContext;

  assert.throws(() => assertMetaReadyForSchedule(ctx), MetaNotConnectedError);
});
