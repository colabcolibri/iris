/** Sliding window for auth endpoints — generous enough for legitimate admin login. */
export const AUTH_IP_RATE_WINDOW_MS = 15 * 60 * 1000;

/** Aligns with per-email resend cooldown (60s): up to ~15 requests in 15 min. */
export const AUTH_REQUEST_CODE_IP_MAX = 20;

/** Allows several OTP codes × 5 attempts each without blocking a real user. */
export const AUTH_CONFIRM_IP_MAX = 40;

export type AuthIpRateLimitAction = "request-code" | "confirm";

export type AuthIpRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type AuthIpRateLimiter = {
  check(action: AuthIpRateLimitAction, ip: string, now?: number): AuthIpRateLimitResult;
};

type ActionConfig = {
  windowMs: number;
  maxRequests: number;
};

const hits = new Map<string, number[]>();

const ACTION_CONFIG: Record<AuthIpRateLimitAction, ActionConfig> = {
  "request-code": {
    windowMs: AUTH_IP_RATE_WINDOW_MS,
    maxRequests: AUTH_REQUEST_CODE_IP_MAX,
  },
  confirm: {
    windowMs: AUTH_IP_RATE_WINDOW_MS,
    maxRequests: AUTH_CONFIRM_IP_MAX,
  },
};

export function createAuthIpRateLimiter(store = hits): AuthIpRateLimiter {
  return {
    check(action, ip, now = Date.now()) {
      const config = ACTION_CONFIG[action];
      const key = `${action}:${ip}`;
      const windowStart = now - config.windowMs;
      const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

      if (timestamps.length >= config.maxRequests) {
        const oldest = timestamps[0]!;
        const retryAfterMs = Math.max(0, oldest + config.windowMs - now);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      timestamps.push(now);
      store.set(key, timestamps);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export const authIpRateLimiter = createAuthIpRateLimiter();

/** Test-only: clears in-memory counters between integration tests. */
export function resetAuthIpRateLimiterForTests(): void {
  hits.clear();
}

export function formatAuthIpRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  if (minutes === 1) {
    return "Muitas tentativas deste endereço. Tente novamente em cerca de 1 minuto.";
  }
  return `Muitas tentativas deste endereço. Tente novamente em cerca de ${minutes} minutos.`;
}
