/**
 * iOS Audio Unlock Utility
 *
 * iOS plays Web Audio API on the "ringer" category, which respects the mute switch.
 * HTML5 audio plays on the "media" category, which ignores the mute switch.
 *
 * By playing a silent HTML5 audio element alongside Web Audio, we force iOS
 * to use the media category for all audio, bypassing the mute switch.
 *
 * This technique is used by YouTube, Bandcamp, and other media sites.
 *
 * @see https://github.com/feross/unmute-ios-audio
 * @see https://www.audjust.com/blog/unmute-web-audio-on-ios
 */

// Base64-encoded silent WAV file (44 bytes, minimal valid WAV)
// This is a tiny silent audio file that won't add any overhead
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudioElement: HTMLAudioElement | null = null;
let isUnlocked = false;

/**
 * Detects if the current device is iOS (iPhone, iPad, iPod)
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad with iOS 13+
}

/**
 * Creates and plays a silent HTML5 audio element to unlock iOS audio.
 * Must be called SYNCHRONOUSLY during a user interaction (click, touch, etc.)
 *
 * IMPORTANT: This function must remain synchronous (no async/await before play())
 * because iOS Safari only allows audio playback in direct response to user gestures.
 * Any async operation breaks the "trust chain" and iOS will block the audio.
 */
export function unlockIOSAudio(): void {
  // Skip if not iOS or already unlocked
  if (!isIOS() || isUnlocked) {
    return;
  }

  // Create silent audio element if not exists
  if (!silentAudioElement) {
    silentAudioElement = document.createElement('audio');

    // Prevent showing in AirPlay/lockscreen controls
    silentAudioElement.setAttribute('x-webkit-airplay', 'deny');

    // Configure for background playback
    silentAudioElement.preload = 'auto';
    silentAudioElement.loop = true;
    silentAudioElement.volume = 0.01; // Near-silent but not zero (some browsers ignore 0)
    silentAudioElement.src = SILENT_WAV_BASE64;

    // Required for iOS to allow background playback
    silentAudioElement.setAttribute('playsinline', 'true');
  }

  // Play the silent audio - this "kicks" iOS into media category
  // Don't await - must be synchronous for iOS Safari user gesture requirement
  silentAudioElement.play().then(() => {
    isUnlocked = true;
  }).catch((error) => {
    // Silently fail - audio will just respect mute switch on iOS
    console.warn('iOS audio unlock failed:', error);
  });
}

/**
 * Stops and cleans up the silent audio element.
 * Call this when audio playback is stopped to be a good citizen.
 */
export function stopIOSAudioUnlock(): void {
  if (silentAudioElement) {
    silentAudioElement.pause();
    silentAudioElement.currentTime = 0;
  }
}

/**
 * Resets the unlock state. Useful for testing or re-initialization.
 */
export function resetIOSAudioUnlock(): void {
  stopIOSAudioUnlock();
  silentAudioElement = null;
  isUnlocked = false;
}
