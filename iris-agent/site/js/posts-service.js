import { readCachedPosts, writeCachedPosts } from "./cache-store.js";

export async function loadPosts(apiClient) {
  if (!navigator.onLine) {
    const cached = readCachedPosts();
    if (cached) {
      return { posts: cached.posts, source: "cache", fetchedAt: cached.fetchedAt };
    }
    throw new Error("Sem conexão e sem dados em cache.");
  }

  try {
    const posts = await apiClient.listPosts();
    const saved = writeCachedPosts(posts);
    return { posts, source: "live", fetchedAt: saved.fetchedAt };
  } catch (error) {
    const cached = readCachedPosts();
    if (cached) {
      return {
        posts: cached.posts,
        source: "cache",
        fetchedAt: cached.fetchedAt,
        error,
      };
    }
    throw error;
  }
}
