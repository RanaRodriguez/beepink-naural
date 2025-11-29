import { useMemo } from 'react';

/**
 * Hook to detect if the current browser is Mozilla-based (uses Gecko rendering engine)
 * Mozilla-based browsers include: Firefox, SeaMonkey, Waterfox, Iceweasel, IceCat, Pale Moon, etc.
 * Based on user agent detection best practices
 * @returns boolean indicating if browser is Mozilla-based
 */
export function useIsMozilla(): boolean {
  return useMemo(() => {
    // Check if we're in a browser environment
    if (typeof navigator === 'undefined') {
      return false;
    }

    const ua = navigator.userAgent.toLowerCase();
    
    // Mozilla-based browsers use the Gecko rendering engine
    // Check for Gecko in the user agent string
    const hasGecko = ua.includes('gecko');
    
    // Exclude WebKit/Blink-based browsers (Chrome, Safari, Edge, Opera, etc.)
    // These browsers don't use Gecko, even though they might mention it for compatibility
    const isWebKitBased = ua.includes('webkit') || 
                         ua.includes('khtml') || 
                         (ua.includes('chrome') && !ua.includes('chromium')) ||
                         (ua.includes('edge') && !ua.includes('edgios')) ||
                         ua.includes('safari');
    
    // Check for specific Mozilla-based browser identifiers
    // This includes Firefox, SeaMonkey, Waterfox, Iceweasel, IceCat, Pale Moon, etc.
    const isKnownMozillaBrowser = /firefox|seamonkey|waterfox|iceweasel|icecat|palemoon|thunderbird/i.test(ua);
    
    // Return true if:
    // 1. It's a known Mozilla-based browser, OR
    // 2. It has Gecko engine AND is not WebKit/Blink-based
    return isKnownMozillaBrowser || (hasGecko && !isWebKitBased);
  }, []);
}

