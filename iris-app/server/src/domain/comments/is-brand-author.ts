export function isBrandAuthor(
  authorUsername: string | null | undefined,
  brandUsername: string | null | undefined,
): boolean {
  if (!authorUsername || !brandUsername) {
    return false;
  }

  const normalize = (value: string) => value.trim().toLowerCase().replace(/^@/, "");
  return normalize(authorUsername) === normalize(brandUsername);
}
