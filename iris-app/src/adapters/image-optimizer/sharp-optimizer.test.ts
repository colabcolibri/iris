import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createSharpImageOptimizer } from "./sharp-optimizer.ts";
import { ImageOptimizationError } from "../../ports/image-optimizer.ts";

test("optimizes large png to jpeg under size limits", async () => {
  const optimizer = createSharpImageOptimizer();
  const input = await sharp({
    create: {
      width: 3000,
      height: 2000,
      channels: 3,
      background: "#ff0000",
    },
  })
    .png()
    .toBuffer();

  const result = await optimizer.optimize(input, "large.png");

  assert.equal(result.mime, "image/jpeg");
  assert.ok(result.width <= 1080);
  assert.ok(result.height <= 1080);
  assert.ok(result.optimizedSizeBytes < result.originalSizeBytes);
});

test("rejects oversized raw upload", async () => {
  const optimizer = createSharpImageOptimizer();
  const previous = process.env.IRIS_UPLOAD_MAX_BYTES;
  process.env.IRIS_UPLOAD_MAX_BYTES = "1024";

  try {
    await assert.rejects(
      () => optimizer.optimize(Buffer.alloc(2048), "big.bin"),
      ImageOptimizationError,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.IRIS_UPLOAD_MAX_BYTES;
    } else {
      process.env.IRIS_UPLOAD_MAX_BYTES = previous;
    }
  }
});
