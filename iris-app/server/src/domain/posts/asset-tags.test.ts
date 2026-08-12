import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAltText,
  normalizeUserTags,
  userTagsFromDb,
  userTagsToDb,
} from "./asset-tags.ts";

test("normalizeAltText trims and nulls empty", () => {
  assert.equal(normalizeAltText("  hello  "), "hello");
  assert.equal(normalizeAltText(""), null);
  assert.equal(normalizeAltText(null), null);
});

test("normalizeUserTags accepts objects and username list", () => {
  assert.deepEqual(
    normalizeUserTags([{ username: "@Alice", x: 0.2, y: 0.8 }]),
    [{ username: "Alice", x: 0.2, y: 0.8 }],
  );
  assert.deepEqual(normalizeUserTags("bob, carol"), [
    { username: "bob", x: 0.5, y: 0.5 },
    { username: "carol", x: 0.5, y: 0.5 },
  ]);
});

test("normalizeUserTags rejects bad coords", () => {
  assert.throws(
    () => normalizeUserTags([{ username: "a", x: 2, y: 0.5 }]),
    /user_tag.x/,
  );
});

test("user_tags db round-trip", () => {
  const tags = [{ username: "x", x: 0.1, y: 0.9 }];
  assert.equal(userTagsToDb([]), null);
  assert.deepEqual(userTagsFromDb(userTagsToDb(tags)), tags);
});
