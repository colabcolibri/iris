/**
 * Lorem Picsum — imagens placeholder estáveis por seed.
 * @see https://picsum.photos/
 */
export function demoPicsumUrl(
  seed: string,
  width: number,
  height: number,
): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

export function demoAssetSeed(postId: string, filename: string): string {
  return `estudio-nomade-${postId}-${filename}`;
}

export function demoPostPreviewUrl(
  postId: string,
  width = 480,
  height = 600,
): string {
  return demoPicsumUrl(`estudio-nomade-post-${postId}`, width, height);
}

export function demoAssetImageUrl(
  postId: string,
  filename: string,
  width: number,
  height: number,
): string {
  return demoPicsumUrl(demoAssetSeed(postId, filename), width, height);
}
