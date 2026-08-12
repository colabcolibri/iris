import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isUmamiEnabled, umamiConfig } from "@/lib/umami";

declare global {
  interface Window {
    umami?: {
      track: (
        event?: string | (() => Record<string, unknown>),
        data?: Record<string, unknown>,
      ) => void;
    };
  }
}

export function UmamiAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!isUmamiEnabled()) return;

    let cancelled = false;
    const script = document.createElement("script");
    script.defer = true;
    script.src = umamiConfig.scriptUrl;
    script.setAttribute("data-website-id", umamiConfig.websiteId);
    script.setAttribute("data-auto-track", "false");
    script.addEventListener(
      "load",
      () => {
        if (!cancelled) window.umami?.track();
      },
      { once: true },
    );
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
      delete window.umami;
    };
  }, []);

  useEffect(() => {
    if (!isUmamiEnabled() || !window.umami) return;
    window.umami.track();
  }, [location.pathname, location.search]);

  return null;
}
