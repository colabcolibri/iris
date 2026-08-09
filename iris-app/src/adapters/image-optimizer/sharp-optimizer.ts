import sharp from "sharp";
import { getImageLimits } from "../../domain/image-limits.ts";
import {
  ImageOptimizationError,
  type ImageOptimizer,
  type OptimizedImage,
} from "../../ports/image-optimizer.ts";

const QUALITY_STEPS = [85, 75, 65];

async function encodeJpeg(
  pipeline: ReturnType<typeof sharp>,
  quality: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { data, info } = await pipeline
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
  };
}

export function createSharpImageOptimizer(): ImageOptimizer {
  return {
    async optimize(input, filename) {
      const limits = getImageLimits();
      const originalSizeBytes = input.length;

      if (originalSizeBytes > limits.uploadMaxBytes) {
        throw new ImageOptimizationError(
          "upload exceeds maximum allowed size",
          413,
        );
      }

      let pipeline = sharp(input, { failOn: "none" }).rotate();

      const metadata = await pipeline.metadata();
      if (!metadata.width || !metadata.height) {
        throw new ImageOptimizationError("invalid image file", 422);
      }

      pipeline = pipeline.resize({
        width: limits.imageMaxLongEdge,
        height: limits.imageMaxLongEdge,
        fit: "inside",
        withoutEnlargement: true,
      });

      if (metadata.hasAlpha) {
        pipeline = pipeline.flatten({ background: "#ffffff" });
      }

      const qualities =
        limits.jpegQuality === 85
          ? QUALITY_STEPS
          : [limits.jpegQuality, ...QUALITY_STEPS.filter((q) => q < limits.jpegQuality)];

      let lastResult: { buffer: Buffer; width: number; height: number } | null = null;

      for (const quality of qualities) {
        const attempt = await encodeJpeg(pipeline.clone(), quality);
        lastResult = attempt;
        if (attempt.buffer.length <= limits.imageMaxBytes) {
          return {
            buffer: attempt.buffer,
            width: attempt.width,
            height: attempt.height,
            originalSizeBytes,
            optimizedSizeBytes: attempt.buffer.length,
            mime: "image/jpeg",
          };
        }
      }

      if (!lastResult) {
        throw new ImageOptimizationError("unable to optimize image", 422);
      }

      throw new ImageOptimizationError(
        "optimized image still exceeds maximum allowed size",
        422,
      );
    },
  };
}
