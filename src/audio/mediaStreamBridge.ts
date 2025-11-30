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
 * The key insight is that iOS/Android only show lock screen controls for
 * HTMLAudioElement playback, not for raw Web Audio API output.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination
 */

import { setPlaybackState } from './mediaSession';

interface MediaStreamBridge {
  destination: MediaStreamAudioDestinationNode;
  audioElement: HTMLAudioElement;
  isPlaying: boolean;
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
      isPlaying: false,
    };

    // Set up event listeners to sync Media Session state
    audioElement.addEventListener('play', () => {
      setPlaybackState('playing');
    });

    audioElement.addEventListener('pause', () => {
      if (bridge?.isPlaying) {
        // If we're supposed to be playing, try to resume
        audioElement.play().catch(() => {
          // If resume fails, update state
          setPlaybackState('paused');
        });
      } else {
        setPlaybackState('paused');
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
 * Call this when starting audio playback.
 */
export async function playBridge(): Promise<void> {
  if (!bridge) {
    return;
  }

  bridge.isPlaying = true;

  try {
    await bridge.audioElement.play();
  } catch (error) {
    console.warn('Failed to play bridge audio element:', error);
  }
}

/**
 * Stops playback of the bridge audio element.
 * Call this when stopping audio playback.
 */
export function stopBridge(): void {
  if (!bridge) {
    return;
  }

  bridge.isPlaying = false;
  bridge.audioElement.pause();
}

/**
 * Handles visibility changes to ensure bridge stays in sync.
 */
function handleVisibilityChange(): void {
  if (!bridge) {
    return;
  }

  if (document.visibilityState === 'visible') {
    // Page is visible again - if we should be playing, ensure audio is playing
    if (bridge.isPlaying && bridge.audioElement.paused) {
      bridge.audioElement.play().catch((error) => {
        console.warn('Failed to resume bridge on visibility change:', error);
      });
    }
  }
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
