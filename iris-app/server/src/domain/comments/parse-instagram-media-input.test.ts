import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeInstagramPermalink,
  parseInstagramMediaInput,
} from "./parse-instagram-media-input.ts";
import { ValidationError } from "../../api/json.ts";

test("parseInstagramMediaInput accepts numeric ig_media_id", () => {
  const parsed = parseInstagramMediaInput({ ig_media_id: "12345678901" });
  assert.equal(parsed.igMediaId, "12345678901");
  assert.equal(parsed.permalink, null);
});

test("parseInstagramMediaInput normalizes Instagram /p/ permalink", () => {
  const parsed = parseInstagramMediaInput({
    permalink:
      "https://www.instagram.com/p/Db21fkYDGKE/?igsh=MXN4aXZraWhjdWM1MQ==",
  });
  assert.equal(parsed.igMediaId, null);
  assert.equal(parsed.permalink, "https://www.instagram.com/p/Db21fkYDGKE/");
});

test("parseInstagramMediaInput normalizes /reels/ permalink", () => {
  const parsed = parseInstagramMediaInput({
    permalink: "https://www.instagram.com/reels/CxYzAbCdEf/",
  });
  assert.equal(parsed.permalink, "https://www.instagram.com/reel/CxYzAbCdEf/");
});

test("normalizeInstagramPermalink strips query params", () => {
  assert.equal(
    normalizeInstagramPermalink("https://www.instagram.com/p/ABC/?utm=1"),
    "https://www.instagram.com/p/ABC/",
  );
});

test("parseInstagramMediaInput rejects missing input", () => {
  assert.throws(() => parseInstagramMediaInput({}), ValidationError);
});
