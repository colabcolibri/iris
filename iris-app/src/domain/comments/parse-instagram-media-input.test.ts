import { test } from "node:test";
import assert from "node:assert/strict";
import {
  instagramShortcodeToMediaId,
  parseInstagramMediaInput,
} from "./parse-instagram-media-input.ts";
import { ValidationError } from "../../api/json.ts";

test("parseInstagramMediaInput accepts numeric ig_media_id", () => {
  const parsed = parseInstagramMediaInput({ ig_media_id: "12345678901" });
  assert.equal(parsed.igMediaId, "12345678901");
});

test("parseInstagramMediaInput extracts numeric id from permalink path", () => {
  const parsed = parseInstagramMediaInput({
    permalink: "https://www.instagram.com/p/ABC/12345678901/",
  });
  assert.equal(parsed.igMediaId, "12345678901");
});

test("parseInstagramMediaInput decodes Instagram /p/ shortcode permalink", () => {
  const parsed = parseInstagramMediaInput({
    permalink:
      "https://www.instagram.com/p/Db21fkYDGKE/?igsh=MXN4aXZraWhjdWM1MQ==",
  });
  assert.equal(parsed.igMediaId, "3960588188145967748");
});

test("parseInstagramMediaInput decodes /reel/ shortcode permalink", () => {
  const parsed = parseInstagramMediaInput({
    permalink: "https://www.instagram.com/reel/CxYzAbCdEf/",
  });
  assert.equal(parsed.igMediaId, instagramShortcodeToMediaId("CxYzAbCdEf"));
});

test("parseInstagramMediaInput rejects missing input", () => {
  assert.throws(() => parseInstagramMediaInput({}), ValidationError);
});
