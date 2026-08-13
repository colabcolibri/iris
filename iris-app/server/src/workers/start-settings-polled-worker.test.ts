import { test } from "node:test";
import assert from "node:assert/strict";
import { startSettingsPolledWorker } from "./start-settings-polled-worker.ts";

test("startSettingsPolledWorker runs tick on boot and respects interval override", async () => {
  let ticks = 0;

  const stop = startSettingsPolledWorker({
    intervalMs: 30,
    resolveIntervalMs: () => 10_000,
    tick: async () => {
      ticks += 1;
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 80));
  stop();

  assert.ok(ticks >= 2);
});

test("startSettingsPolledWorker releitura de intervalo entre ciclos", async () => {
  let ticks = 0;
  let intervalMs = 40;

  const stop = startSettingsPolledWorker({
    resolveIntervalMs: () => intervalMs,
    tick: async () => {
      ticks += 1;
      if (ticks === 1) {
        intervalMs = 20;
      }
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 120));
  stop();

  assert.ok(ticks >= 2);
});
