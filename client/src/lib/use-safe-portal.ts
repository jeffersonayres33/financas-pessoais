/**
 * Hook for safe portal rendering in Chrome
 * Prevents removeChild errors that occur in Chrome with Radix UI portals
 */

import { useEffect, useRef } from "react";
import BrowserCompat from "./browser-compat";

/**
 * Hook to handle safe portal cleanup for Chrome compatibility
 * Use this in components that manage portal elements
 */
export function useSafePortal() {
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: safely remove portal if it exists
      if (portalRef.current && portalRef.current.parentNode) {
        BrowserCompat.deferDOMOperation(() => {
          if (portalRef.current && portalRef.current.parentNode) {
            BrowserCompat.safeRemoveChild(
              portalRef.current.parentNode,
              portalRef.current
            );
          }
        });
      }
    };
  }, []);

  return portalRef;
}

export default useSafePortal;
