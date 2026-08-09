import { test } from "node:test";
import assert from "node:assert/strict";
import { applyScheduleRules } from "./schedule.ts";
import { ValidationError } from "../api/json.ts";

test("rejects scheduled_at in the past", () => {
  assert.throws(
    () =>
      applyScheduleRules({
        currentStatus: "draft",
        nextStatus: "scheduled",
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
        assetsCount: 1,
      }),
    ValidationError,
  );
});

test("rejects scheduling without assets", () => {
  assert.throws(
    () =>
      applyScheduleRules({
        currentStatus: "draft",
        nextStatus: "scheduled",
        scheduledAt: new Date(Date.now() + 60_000).toISOString(),
        assetsCount: 0,
      }),
    (error: Error) => error.message.includes("at least one asset"),
  );
});

test("schedules post with future date and assets", () => {
  const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
  const result = applyScheduleRules({
    currentStatus: "draft",
    nextStatus: "scheduled",
    scheduledAt,
    assetsCount: 2,
  });

  assert.equal(result.status, "scheduled");
  assert.equal(result.scheduledAt, scheduledAt);
});
