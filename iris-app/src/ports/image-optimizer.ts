export type OptimizedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  mime: "image/jpeg";
};

export type ImageOptimizer = {
  optimize(input: Buffer, filename: string): Promise<OptimizedImage>;
};

export class ImageOptimizationError extends Error {
  status: 413 | 422;

  constructor(message: string, status: 413 | 422) {
    super(message);
    this.name = "ImageOptimizationError";
    this.status = status;
  }
}
