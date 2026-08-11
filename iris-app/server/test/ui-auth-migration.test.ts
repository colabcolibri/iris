import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("api client uses credentials include for api calls", () => {
  const source = readFileSync("../admin/src/lib/api.ts", "utf8");
  assert.match(source, /credentials:\s*"include"/);
  assert.doesNotMatch(source, /sessionStorage/);
  assert.doesNotMatch(source, /window\.prompt/);
});
