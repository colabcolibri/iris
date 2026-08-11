import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatInTimeZone,
  monthRangeInTimeZone,
  utcIsoToZonedLocal,
  zonedLocalToUtcIso,
} from "./zoned-datetime.ts";

test("zonedLocalToUtcIso converts Sao Paulo local to UTC", () => {
  const iso = zonedLocalToUtcIso("2026-08-15T15:30", "America/Sao_Paulo");
  assert.ok(iso);
  assert.equal(utcIsoToZonedLocal(iso!, "America/Sao_Paulo"), "2026-08-15T15:30");
});

test("formatInTimeZone renders in configured zone", () => {
  const formatted = formatInTimeZone("2026-08-15T18:30:00.000Z", "America/Sao_Paulo", {
    hour: "2-digit",
    minute: "2-digit",
  });
  assert.match(formatted, /15:30/);
});

test("monthRangeInTimeZone returns ISO bounds", () => {
  const range = monthRangeInTimeZone(2026, 7, "America/Sao_Paulo");
  assert.match(range.from, /2026-08/);
  assert.ok(new Date(range.from).getTime() < new Date(range.to).getTime());
});
