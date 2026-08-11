/** Sliding window for public contact form — stricter than auth OTP. */
export const CONTACT_IP_RATE_WINDOW_MS = 15 * 60 * 1000;
export const CONTACT_IP_MAX = 5;

export type ContactIpRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type ContactIpRateLimiter = {
  check(ip: string, now?: number): ContactIpRateLimitResult;
};

const hits = new Map<string, number[]>();

export function createContactIpRateLimiter(store = hits): ContactIpRateLimiter {
  return {
    check(ip, now = Date.now()) {
      const key = `contact:${ip}`;
      const windowStart = now - CONTACT_IP_RATE_WINDOW_MS;
      const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

      if (timestamps.length >= CONTACT_IP_MAX) {
        const oldest = timestamps[0]!;
        const retryAfterMs = Math.max(0, oldest + CONTACT_IP_RATE_WINDOW_MS - now);
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

export const contactIpRateLimiter = createContactIpRateLimiter();

export function resetContactIpRateLimiterForTests(): void {
  hits.clear();
}

export function formatContactIpRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  if (minutes === 1) {
    return "Muitas mensagens deste endereço. Tente novamente em cerca de 1 minuto.";
  }
  return `Muitas mensagens deste endereço. Tente novamente em cerca de ${minutes} minutos.`;
}
