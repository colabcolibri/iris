import { useEffect, useRef } from "react";
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
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!isUmamiEnabled() || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.defer = true;
    script.src = umamiConfig.scriptUrl;
    script.setAttribute("data-website-id", umamiConfig.websiteId);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isUmamiEnabled()) return;
    window.umami?.track();
  }, [location.pathname, location.search]);

  return null;
}
