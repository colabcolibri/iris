import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collaboratorsFromDb,
  collaboratorsToDb,
  normalizeCollaborators,
} from "./collaborators.ts";

test("normalizeCollaborators strips @, dedupes, and caps at 3", () => {
  assert.deepEqual(normalizeCollaborators(["@Alice", "bob", "@alice"]), [
    "Alice",
    "bob",
  ]);
  assert.deepEqual(normalizeCollaborators(" @one, two  three "), [
    "one",
    "two",
    "three",
  ]);
  assert.deepEqual(normalizeCollaborators(null), []);
  assert.deepEqual(normalizeCollaborators("[]"), []);
});

test("normalizeCollaborators rejects invalid and over max", () => {
  assert.throws(() => normalizeCollaborators(["bad name"]), /invalid Instagram username/);
  assert.throws(
    () => normalizeCollaborators(["a", "b", "c", "d"]),
    /at most 3/,
  );
});

test("collaborators db round-trip", () => {
  assert.equal(collaboratorsToDb([]), null);
  assert.equal(collaboratorsToDb(["x"]), '["x"]');
  assert.deepEqual(collaboratorsFromDb('["a","b"]'), ["a", "b"]);
  assert.deepEqual(collaboratorsFromDb(null), []);
});
