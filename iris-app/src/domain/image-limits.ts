export type ImageLimits = {
  uploadMaxBytes: number;
  imageMaxLongEdge: number;
  jpegQuality: number;
  imageMaxBytes: number;
};

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getImageLimits(): ImageLimits {
  return {
    uploadMaxBytes: readInt("IRIS_UPLOAD_MAX_BYTES", 15 * 1024 * 1024),
    imageMaxLongEdge: readInt("IRIS_IMAGE_MAX_LONG_EDGE", 1080),
    jpegQuality: readInt("IRIS_JPEG_QUALITY", 85),
    imageMaxBytes: readInt("IRIS_IMAGE_MAX_BYTES", 1.5 * 1024 * 1024),
  };
}
