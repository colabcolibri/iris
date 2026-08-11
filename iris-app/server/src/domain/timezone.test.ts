import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidIanaTimeZone, resolveTimeZone } from "./timezone.ts";

test("isValidIanaTimeZone accepts known zones", () => {
  assert.equal(isValidIanaTimeZone("America/Sao_Paulo"), true);
  assert.equal(isValidIanaTimeZone("UTC"), true);
});

test("isValidIanaTimeZone rejects invalid zones", () => {
  assert.equal(isValidIanaTimeZone(""), false);
  assert.equal(isValidIanaTimeZone("Not/AZone"), false);
});

test("resolveTimeZone falls back to default", () => {
  assert.equal(resolveTimeZone(null), "America/Sao_Paulo");
  assert.equal(resolveTimeZone("Europe/Lisbon"), "Europe/Lisbon");
});
