/** Rotas públicas do modo demonstração (sem sessão admin). */
export function isDemoPath(pathname?: string): boolean {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  return path === "/demo" || path.startsWith("/demo/");
}
