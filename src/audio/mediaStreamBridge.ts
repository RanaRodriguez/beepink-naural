import { setPlaybackState } from './mediaSession';

/**
 * MediaStream Bridge
 *
 * This module bridges Web Audio API output to an HTMLAudioElement using
 * MediaStreamAudioDestinationNode. This enables iOS/Android to recognize
 * the audio as "media" playback, enabling:
 * - Lock screen controls
 * - Background playback
 * - Media Session API integration
 *
 * KEY INSIGHT: The HTMLAudioElement must NEVER be paused once started.
 * iOS Safari requires a user gesture to call play(), but Media Session
 * handlers are NOT considered user gestures. By keeping the bridge
 * always "playing", we avoid needing to call play() from lock screen.
 *
 * Audio is controlled via Web Audio gain (0 = muted, >0 = audible).
 * The bridge acts as a "carrier signal" that stays playing.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination
 */

interface MediaStreamBridge {
  destination: MediaStreamAudioDestinationNode;
  audioElement: HTMLAudioElement;
  isStarted: boolean;  // Has the bridge been started (with user gesture)?
}

let bridge: MediaStreamBridge | null = null;

/**
 * Check if MediaStreamDestination is supported
 */
function isMediaStreamDestinationSupported(ctx: AudioContext): boolean {
  return typeof ctx.createMediaStreamDestination === 'function';
}

/**
 * Creates the MediaStream bridge.
 * Call this when creating the AudioContext.
 *
 * @param audioContext - The AudioContext to create the bridge for
 * @returns The MediaStreamAudioDestinationNode to connect audio sources to
 */
export function createMediaStreamBridge(
  audioContext: AudioContext
): MediaStreamAudioDestinationNode | null {
  // Don't create multiple bridges
  if (bridge) {
    return bridge.destination;
  }

  // Check if createMediaStreamDestination is supported
  if (!isMediaStreamDestinationSupported(audioContext)) {
    console.warn('MediaStreamDestination not supported, lock screen controls may not work');
    return null;
  }

  try {
    // Create the MediaStreamDestination - this captures Web Audio output
    const destination = audioContext.createMediaStreamDestination();

    // Create an audio element that will play the captured stream
    const audioElement = document.createElement('audio');

    // Set the stream as the audio source
    audioElement.srcObject = destination.stream;

    // Configure for mobile playback
    audioElement.setAttribute('playsinline', 'true');

    // Prevent showing in AirPlay picker (we handle this ourselves)
    audioElement.setAttribute('x-webkit-airplay', 'deny');

    // Store the bridge
    bridge = {
      destination,
      audioElement,
      isStarted: false,
    };

    // Set up event listeners to sync Media Session state
    audioElement.addEventListener('play', () => {
      setPlaybackState('playing');
    });

    // IMPORTANT: Bridge should NEVER pause once started.
    // If pause event fires (e.g., from OS), immediately resume.
    // Audio muting is controlled via Web Audio gain, not by pausing.
    audioElement.addEventListener('pause', () => {
      if (bridge?.isStarted) {
        // Bridge was started - ALWAYS try to resume
        // This is the key to making lock screen controls work
        audioElement.play().catch((error) => {
          console.warn('Failed to resume bridge after pause event:', error);
          // Only update state if we truly can't resume
          setPlaybackState('paused');
        });
      }
    });

    // Handle visibility changes - re-sync when page becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange);

    console.log('MediaStream bridge created successfully');
    return destination;
  } catch (error) {
    console.warn('Failed to create MediaStream bridge:', error);
    return null;
  }
}

/**
 * Gets the MediaStreamDestination node to connect audio sources to.
 * Returns null if bridge hasn't been created.
 */
export function getBridgeDestination(): MediaStreamAudioDestinationNode | null {
  return bridge?.destination ?? null;
}

/**
 * Starts playback of the bridge audio element.
 * IMPORTANT: Call this ONCE on first user interaction.
 * The bridge stays playing forever - audio is controlled via Web Audio gain.
 */
export async function startBridge(): Promise<void> {
  if (!bridge) {
    return;
  }

  // Only start once - bridge should never be stopped
  if (bridge.isStarted) {
    return;
  }

  bridge.isStarted = true;

  try {
    await bridge.audioElement.play();
    console.log('MediaStream bridge started - will stay playing');
  } catch (error) {
    console.warn('Failed to start bridge audio element:', error);
    bridge.isStarted = false;
  }
}

/**
 * Handles visibility changes to ensure bridge stays playing.
 * The bridge should NEVER be paused - if it is, resume it.
 */
function handleVisibilityChange(): void {
  if (!bridge || !bridge.isStarted) {
    return;
  }

  if (document.visibilityState === 'visible') {
    // Page is visible again - ensure bridge is still playing
    if (bridge.audioElement.paused) {
      bridge.audioElement.play().catch((error) => {
        console.warn('Failed to resume bridge on visibility change:', error);
      });
    }
  }
}

/**
 * Checks if the bridge has been started.
 */
export function isBridgeStarted(): boolean {
  return bridge?.isStarted ?? false;
}

/**
 * Cleans up the bridge.
 * Call this when the audio context is being destroyed.
 */
export function destroyBridge(): void {
  if (!bridge) {
    return;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);

  bridge.audioElement.pause();
  bridge.audioElement.srcObject = null;
  bridge = null;
}

/**
 * Checks if the bridge is currently set up and ready.
 */
export function isBridgeReady(): boolean {
  return bridge !== null;
}
