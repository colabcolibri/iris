import { test } from "node:test";
import assert from "node:assert/strict";
import { isMessageCategory, normalizeMessageCategory } from "./message-category.ts";

test("message categories normalize unknown values to general_unclear", () => {
  assert.equal(normalizeMessageCategory("product_inquiry"), "product_inquiry");
  assert.equal(normalizeMessageCategory("invalid"), "general_unclear");
  assert.equal(isMessageCategory("harmful"), true);
  assert.equal(isMessageCategory("spam"), false);
});
