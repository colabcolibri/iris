const STORAGE_KEY = "iris-auth-session";

type CachedAuthSession = {
  email: string;
};

export function readCachedAuthSession(): CachedAuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedAuthSession;
    if (typeof parsed.email !== "string" || parsed.email.trim() === "") {
      return null;
    }

    return { email: parsed.email.trim() };
  } catch {
    return null;
  }
}

export function writeCachedAuthSession(email: string): void {
  if (typeof window === "undefined") return;

  const trimmed = email.trim();
  if (!trimmed) return;

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: trimmed }));
}

export function clearCachedAuthSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
