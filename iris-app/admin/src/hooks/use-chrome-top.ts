import { useLayoutEffect, useRef, useState } from "react";

/** Fallback — altura do AppHeader (h-14). */
const DEFAULT_CHROME_TOP = "3.5rem";

/**
 * Mede a altura real do stack fixo no topo (banner demo + header).
 * Atualiza --iris-chrome-top via ResizeObserver — sem valores fixos por locale.
 */
export function useChromeTop() {
  const chromeRef = useRef<HTMLDivElement>(null);
  const [chromeTop, setChromeTop] = useState(DEFAULT_CHROME_TOP);

  useLayoutEffect(() => {
    const node = chromeRef.current;
    if (!node) return;

    const update = () => {
      const height = node.getBoundingClientRect().height;
      if (height > 0) {
        setChromeTop(`${Math.ceil(height)}px`);
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { chromeRef, chromeTop };
}
