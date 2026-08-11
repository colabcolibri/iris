import type { Post } from "../posts/post.ts";
import type { RegisterMonitoredPostDeps } from "./register-monitored-post.ts";
import { registerMonitoredPost } from "./register-monitored-post.ts";

export type EnsureMonitoredPostResult =
  | { ok: true; post: Post; created: boolean }
  | { ok: false; error: string };

/**
 * Garante que `igMediaId` exista como post `published`/`monitored`.
 * Idempotente — reutiliza `registerMonitoredPost` sem HTTP/worker.
 */
export async function ensureMonitoredPost(
  igMediaId: string,
  deps: RegisterMonitoredPostDeps,
): Promise<EnsureMonitoredPostResult> {
  const trimmed = typeof igMediaId === "string" ? igMediaId.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "ig_media_id is required" };
  }

  const existing = deps.posts.findByIgMediaId(trimmed);
  if (
    existing &&
    (existing.status === "monitored" || existing.status === "published")
  ) {
    return { ok: true, post: existing, created: false };
  }

  try {
    const post = await registerMonitoredPost({ ig_media_id: trimmed }, deps);
    return { ok: true, post, created: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ensure_monitored_failed",
    };
  }
}
