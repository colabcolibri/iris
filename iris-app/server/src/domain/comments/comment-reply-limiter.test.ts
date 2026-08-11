import { test } from "node:test";
import assert from "node:assert/strict";
import { createConcurrencyLimiter } from "./comment-reply-limiter.ts";

test("createConcurrencyLimiter serializes work when max concurrent is 1", async () => {
  const limiter = createConcurrencyLimiter(1);
  const order: string[] = [];
  let releaseFirst: (() => void) | undefined;
  const firstStarted = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = limiter.run(async () => {
    order.push("first-start");
    await firstStarted;
    order.push("first-end");
  });

  await Promise.resolve();
  assert.deepEqual(order, ["first-start"]);

  const second = limiter.run(async () => {
    order.push("second");
  });

  await Promise.resolve();
  assert.deepEqual(order, ["first-start"]);

  releaseFirst?.();
  await Promise.all([first, second]);
  assert.deepEqual(order, ["first-start", "first-end", "second"]);
});
