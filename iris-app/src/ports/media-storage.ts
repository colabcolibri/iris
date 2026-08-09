export type MediaFile = {
  filename: string;
  buffer: Buffer;
  mime: string;
};

export type MediaStorage = {
  write(postId: string, sortOrder: number, buffer: Buffer): Promise<string>;
  read(postId: string, filename: string): Promise<MediaFile | null>;
  resolveFilename(postId: string, sortOrder: number): string;
};
