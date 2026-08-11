/** Barramento mínimo de 401 — a camada HTTP notifica; a sessão decide a transição. */

type UnauthorizedListener = () => void;

let listener: UnauthorizedListener | null = null;

export function setUnauthorizedListener(
  next: UnauthorizedListener | null,
): void {
  listener = next;
}

export function notifyUnauthorized(): void {
  listener?.();
}
