/**
 * Media Session API Integration
 *
 * The Media Session API allows web apps to integrate with system media controls
 * (lock screen, notification controls, etc.) and improves background playback
 * on mobile devices.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
 */

interface MediaSessionMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: MediaImage[];
}

/**
 * Check if Media Session API is supported
 */
function isMediaSessionSupported(): boolean {
  return 'mediaSession' in navigator;
}

/**
 * Set media session metadata
 */
export function setMediaMetadata(metadata: MediaSessionMetadata): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album || 'BeePink Naural',
      artwork: metadata.artwork || [
        {
          src: '/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });
  } catch (error) {
    console.warn('Failed to set media metadata:', error);
  }
}

/**
 * Set up media session action handlers
 */
export function setupMediaSessionActions(
  onPlay: () => void,
  onPause: () => void,
  onStop?: () => void
): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  try {
    // Play action
    navigator.mediaSession.setActionHandler('play', () => {
      onPlay();
    });

    // Pause action
    navigator.mediaSession.setActionHandler('pause', () => {
      onPause();
    });

    // Stop action (optional)
    if (onStop) {
      navigator.mediaSession.setActionHandler('stop', () => {
        onStop();
      });
    } else {
      // If no stop handler, use pause as fallback
      navigator.mediaSession.setActionHandler('stop', () => {
        onPause();
      });
    }
  } catch (error) {
    console.warn('Failed to set up media session actions:', error);
  }
}

/**
 * Update playback state in media session
 */
export function setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  try {
    navigator.mediaSession.playbackState = state;
  } catch (error) {
    console.warn('Failed to set playback state:', error);
  }
}

/**
 * Clear media session metadata and actions
 */
export function clearMediaSession(): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  } catch (error) {
    console.warn('Failed to clear media session:', error);
  }
}

/**
 * Refresh the media session state.
 * Call this when the page becomes visible again to ensure lock screen controls
 * are properly synced. iOS Safari can lose track of the media session state
 * when the page is backgrounded.
 */
export function refreshMediaSession(
  metadata: MediaSessionMetadata,
  isPlaying: boolean
): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  try {
    // Re-set metadata to ensure it's current
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album || 'BeePink Naural',
      artwork: metadata.artwork || [
        {
          src: '/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });

    // Re-set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  } catch (error) {
    console.warn('Failed to refresh media session:', error);
  }
}

