import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = "public";

test("public js does not use sessionStorage or prompt for auth", () => {
  const files = readdirSync(PUBLIC_DIR).filter((name) => name.endsWith(".js"));

  for (const file of files) {
    const source = readFileSync(join(PUBLIC_DIR, file), "utf8");
    assert.doesNotMatch(source, /sessionStorage/);
    assert.doesNotMatch(source, /window\.prompt/);
    assert.doesNotMatch(source, /IRIS_ADMIN_TOKEN/);
  }
});

test("api-client uses credentials include for api calls", () => {
  const source = readFileSync("public/api-client.js", "utf8");
  assert.match(source, /credentials:\s*"include"/);
});
