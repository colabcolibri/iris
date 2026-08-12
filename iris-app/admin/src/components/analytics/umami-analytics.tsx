import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  isUmamiEnabled,
  shouldTrackUmamiPath,
  umamiConfig,
  umamiScriptSelector,
} from "@/lib/umami";

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

function removeUmamiScript(): void {
  document.querySelector(umamiScriptSelector())?.remove();
  delete window.umami;
}

function ensureUmamiScript(onLoad: () => void): void {
  const existing = document.querySelector<HTMLScriptElement>(
    umamiScriptSelector(),
  );
  if (existing) {
    if (window.umami) {
      onLoad();
      return;
    }
    existing.addEventListener("load", onLoad, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = umamiConfig.scriptUrl;
  script.setAttribute("data-website-id", umamiConfig.websiteId);
  script.setAttribute("data-auto-track", "false");
  script.addEventListener("load", onLoad, { once: true });
  document.head.appendChild(script);
}

export function UmamiAnalytics() {
  const location = useLocation();
  const scriptActiveRef = useRef(false);

  useEffect(() => {
    if (!isUmamiEnabled()) return;

    const trackable = shouldTrackUmamiPath(location.pathname);

    if (!trackable) {
      if (scriptActiveRef.current) {
        removeUmamiScript();
        scriptActiveRef.current = false;
      }
      return;
    }

    scriptActiveRef.current = true;
    ensureUmamiScript(() => {
      window.umami?.track();
    });
  }, [location.pathname, location.search]);

  return null;
}
