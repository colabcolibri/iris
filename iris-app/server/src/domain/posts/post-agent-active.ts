import type { Post } from "./post.ts";

export function resolvePostAgentActiveUntil(post: Post): Date | null {
  const days = post.agentActiveDays;
  if (days == null || days <= 0) {
    return null;
  }

  const anchor = post.publishedAt ?? post.createdAt;
  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isPostWithinAgentActiveWindow(
  post: Post,
  now: Date = new Date(),
): boolean {
  const until = resolvePostAgentActiveUntil(post);
  if (!until) {
    return true;
  }

  return now.getTime() <= until.getTime();
}

export function buildPostAgentInactiveMessage(): string {
  return "[guardrail] post agent campaign expired".slice(0, 500);
}

/** Dias restantes até o fim da campanha; null sem TTL; 0 se já expirou. */
export function resolveAgentActiveDaysRemaining(
  post: Post,
  now: Date = new Date(),
): number | null {
  const until = resolvePostAgentActiveUntil(post);
  if (!until) {
    return null;
  }

  const diffMs = until.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}
