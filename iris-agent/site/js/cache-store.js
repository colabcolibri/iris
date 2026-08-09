const STORAGE_KEY = "iris-desk:posts:v1";

export function readCachedPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.posts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedPosts(posts) {
  const payload = {
    fetchedAt: new Date().toISOString(),
    posts,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}
