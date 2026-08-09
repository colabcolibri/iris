import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadLocalPackage,
  parsePostMarkdown,
  validatePackage,
} from "./local-package.ts";
import { ValidationError } from "../api/json.ts";

const SAMPLE = `---
title: Test post
scheduled_at: 2099-01-01T12:00:00.000Z
channel: instagram
status: ready
source_note: test
iris_post_id:
pushed_at:
---

Legenda de teste.

#iris
`;

test("parsePostMarkdown extracts frontmatter and caption", () => {
  const parsed = parsePostMarkdown(SAMPLE);
  assert.equal(parsed.frontmatter.title, "Test post");
  assert.equal(parsed.frontmatter.channel, "instagram");
  assert.equal(parsed.frontmatter.status, "ready");
  assert.match(parsed.caption, /Legenda de teste/);
});

test("validatePackage rejects non-ready status", () => {
  const dir = mkdtempSync(join(tmpdir(), "iris-pkg-"));
  writeFileSync(join(dir, "post.md"), SAMPLE.replace("ready", "draft"));
  writeFileSync(join(dir, "01.png"), "fake");

  const pkg = loadLocalPackage(dir);
  assert.throws(() => validatePackage(pkg), ValidationError);
});

test("validatePackage accepts ready package with image", () => {
  const dir = mkdtempSync(join(tmpdir(), "iris-pkg-"));
  writeFileSync(join(dir, "post.md"), SAMPLE);
  writeFileSync(join(dir, "01.png"), "fake");

  const pkg = loadLocalPackage(dir);
  assert.doesNotThrow(() => validatePackage(pkg));
  assert.equal(pkg.imagePaths.length, 1);
});

test("listImageFiles sorts numerically", () => {
  const dir = mkdtempSync(join(tmpdir(), "iris-pkg-"));
  writeFileSync(join(dir, "post.md"), SAMPLE);
  writeFileSync(join(dir, "10.png"), "a");
  writeFileSync(join(dir, "02.png"), "b");

  const pkg = loadLocalPackage(dir);
  assert.equal(pkg.imagePaths.map((p) => p.endsWith("02.png")).some(Boolean), true);
});
