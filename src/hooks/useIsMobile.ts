import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a mobile device
 * @param breakpoint - Screen width breakpoint in pixels (default: 768)
 * @returns boolean indicating if device is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Check user agent
    const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    // Check screen width
    const screenWidth = window.innerWidth <= breakpoint;
    return userAgent || screenWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const screenWidth = window.innerWidth <= breakpoint;
      setIsMobile(userAgent || screenWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

