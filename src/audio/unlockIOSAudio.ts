/**
 * iOS Audio Unlock Utility
 *
 * iOS plays Web Audio API on the "ringer" category, which respects the mute switch.
 * HTML5 audio plays on the "media" category, which ignores the mute switch.
 *
 * By playing a silent HTML5 audio element alongside Web Audio, we force iOS
 * to use the media category for all audio, bypassing the mute switch.
 *
 * Additionally, we use the Audio Session API (iOS 17+) to explicitly set
 * the audio session type to "playback", which enables background audio
 * when the screen is locked or the app is backgrounded.
 *
 * This technique is used by YouTube, Bandcamp, and other media sites.
 *
 * @see https://github.com/feross/unmute-ios-audio
 * @see https://www.audjust.com/blog/unmute-web-audio-on-ios
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioSession
 */

// Base64-encoded silent WAV file (44 bytes, minimal valid WAV)
// This is a tiny silent audio file that won't add any overhead
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudioElement: HTMLAudioElement | null = null;
let isUnlocked = false;
let visibilityHandlerAttached = false;
let audioSessionConfigured = false;

/**
 * TypeScript declaration for the Audio Session API (iOS 17+)
 * This API is still experimental and not in standard TypeScript definitions
 */
interface AudioSession {
  type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record';
}

declare global {
  interface Navigator {
    audioSession?: AudioSession;
  }
}

/**
 * Detects if the current device is iOS (iPhone, iPad, iPod)
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad with iOS 13+
}

/**
 * Configures the Audio Session API (iOS 17+) for background playback.
 * This tells Safari to treat our audio as "media" (like music) rather than
 * "ambient" (like game sound effects), enabling background playback when
 * the screen is locked.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioSession
 */
function configureAudioSession(): void {
  if (audioSessionConfigured) {
    return;
  }

  // Audio Session API is available in iOS 17+ Safari
  if ('audioSession' in navigator && navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
      audioSessionConfigured = true;
      console.log('Audio Session API: configured for playback mode');
    } catch (error) {
      console.warn('Failed to configure Audio Session API:', error);
    }
  }
}

/**
 * Handle visibility changes to ensure audio continues in background
 */
function handleVisibilityChange(): void {
  if (!isIOS() || !silentAudioElement || !isUnlocked) {
    return;
  }

  // When app goes to background, ensure audio element is still playing
  if (document.visibilityState === 'hidden') {
    // Check if audio is paused and resume if needed
    if (silentAudioElement.paused) {
      silentAudioElement.play().catch((error) => {
        console.warn('Failed to resume iOS audio on visibility change:', error);
      });
    }
  }
}

/**
 * Pre-initializes the silent audio element so it's ready for instant playback.
 * Call this on app mount (outside of user interaction).
 */
export function initIOSAudio(): void {
  if (!isIOS() || silentAudioElement) {
    return;
  }

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

  // Force load the audio data
  silentAudioElement.load();

  // Attach visibility change handler for background playback
  if (!visibilityHandlerAttached) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityHandlerAttached = true;
  }
}

/**
 * Plays the silent HTML5 audio element to unlock iOS audio.
 * Must be called SYNCHRONOUSLY during a user interaction (click, touch, etc.)
 *
 * IMPORTANT: This function must remain synchronous (no async/await before play())
 * because iOS Safari only allows audio playback in direct response to user gestures.
 * Any async operation breaks the "trust chain" and iOS will block the audio.
 */
export function unlockIOSAudio(): void {
  // Configure Audio Session API for background playback (iOS 17+)
  // This must be called before starting audio playback
  configureAudioSession();

  // Skip if not iOS or already unlocked
  if (!isIOS() || isUnlocked) {
    return;
  }

  // Initialize if not already done (fallback)
  if (!silentAudioElement) {
    initIOSAudio();
  }

  if (!silentAudioElement) {
    return;
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
 * Ensures the silent HTML5 audio element continues playing.
 * This should be called periodically during playback to maintain
 * iOS media category and enable background playback.
 * Works on both iOS and Android.
 */
export function keepIOSAudioAlive(): void {
  if (!silentAudioElement || !isUnlocked) {
    return;
  }

  // If audio is paused, resume it
  // This ensures iOS treats the app as a media app during background playback
  if (silentAudioElement.paused) {
    silentAudioElement.play().catch((error) => {
      console.warn('Failed to keep iOS audio alive:', error);
    });
  }
}

/**
 * Stops and cleans up the silent audio element.
 * Call this when audio playback is stopped to be a good citizen.
 */
export function stopIOSAudioUnlock(): void {
  if (silentAudioElement) {
    silentAudioElement.pause();
    silentAudioElement.currentTime = 0;
    isUnlocked = false;
  }
}

/**
 * Resets the unlock state. Useful for testing or re-initialization.
 */
export function resetIOSAudioUnlock(): void {
  stopIOSAudioUnlock();
  silentAudioElement = null;
  isUnlocked = false;
  audioSessionConfigured = false;

  // Remove visibility change handler
  if (visibilityHandlerAttached) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    visibilityHandlerAttached = false;
  }
}
