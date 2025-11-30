/**
 * Wake Lock API Integration
 *
 * The Wake Lock API prevents the screen from turning off, which helps
 * maintain audio playback on mobile devices. This is particularly useful
 * for audio apps that need to continue playing when the screen locks.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Wake_Lock_API
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Check if Wake Lock API is supported
 */
function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

/**
 * Request a screen wake lock
 * This prevents the screen from turning off
 */
export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    return false;
  }

  try {
    // Request wake lock (screen type prevents screen from turning off)
    wakeLock = await navigator.wakeLock.request('screen');

    // Handle wake lock release (e.g., when user manually locks screen)
    wakeLock.addEventListener('release', () => {
      console.log('Wake lock released');
      wakeLock = null;
    });

    return true;
  } catch (error) {
    // Wake lock request failed (e.g., permission denied, battery saver mode)
    console.warn('Failed to request wake lock:', error);
    wakeLock = null;
    return false;
  }
}

/**
 * Release the current wake lock
 */
export function releaseWakeLock(): void {
  if (wakeLock) {
    wakeLock.release().catch((error) => {
      console.warn('Failed to release wake lock:', error);
    });
    wakeLock = null;
  }
}

/**
 * Check if a wake lock is currently active
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null;
}

/**
 * Re-request wake lock if it was released
 * Useful for handling visibility changes
 */
export async function reacquireWakeLockIfNeeded(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    return false;
  }

  // If wake lock was released (e.g., screen was locked), try to reacquire
  if (!wakeLock || wakeLock.released) {
    return await requestWakeLock();
  }

  return true;
}

