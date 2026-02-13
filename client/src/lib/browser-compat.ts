/**
 * Browser Compatibility Utilities
 * Handles Chrome-specific DOM manipulation issues with Radix UI portals
 */

export const BrowserCompat = {
  /**
   * Detect if running in Chrome browser
   */
  isChrome(): boolean {
    if (typeof window === "undefined") return false;
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  },

  /**
   * Detect if running in Firefox browser
   */
  isFirefox(): boolean {
    if (typeof window === "undefined") return false;
    return /Firefox/.test(navigator.userAgent);
  },

  /**
   * Detect if running in Safari browser
   */
  isSafari(): boolean {
    if (typeof window === "undefined") return false;
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  },

  /**
   * Safe DOM node removal with Chrome compatibility
   * Chrome sometimes has issues with removeChild when portals are involved
   */
  safeRemoveChild(parent: Node, child: Node): boolean {
    try {
      // Check if child is actually a child of parent
      if (child.parentNode !== parent) {
        return false;
      }
      parent.removeChild(child);
      return true;
    } catch (error) {
      // Silently fail - Chrome may have already removed the node
      if (error instanceof DOMException && error.code === 8) {
        // NotFoundError - node not found, this is expected in some cases
        return false;
      }
      console.warn("[BrowserCompat] Error removing child:", error);
      return false;
    }
  },

  /**
   * Safe element removal with Chrome compatibility
   * Handles the case where element might already be removed
   */
  safeRemoveElement(element: Element): boolean {
    try {
      if (!element.parentNode) {
        return false;
      }
      element.parentNode.removeChild(element);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.code === 8) {
        return false;
      }
      console.warn("[BrowserCompat] Error removing element:", error);
      return false;
    }
  },

  /**
   * Defer DOM operations to avoid Chrome portal conflicts
   * Chrome sometimes needs a microtask delay to properly handle portal cleanup
   */
  deferDOMOperation(callback: () => void): void {
    if (this.isChrome()) {
      // Use Promise.resolve() for microtask queue (faster than setTimeout)
      Promise.resolve().then(callback);
    } else {
      // Other browsers can execute immediately
      callback();
    }
  },

  /**
   * Get browser name for debugging
   */
  getBrowserName(): string {
    if (this.isChrome()) return "Chrome";
    if (this.isFirefox()) return "Firefox";
    if (this.isSafari()) return "Safari";
    return "Unknown";
  },
};

export default BrowserCompat;
