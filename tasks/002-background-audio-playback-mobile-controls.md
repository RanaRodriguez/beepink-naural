# Task 002: Implement Background Audio Playback with Native Mobile Controls

## Meta
- Status: completed
- Created: 2025-11-30
- Updated: 2025-11-30
- Completed: 2025-11-30
- Reference: None

## What & Why
**Objective:** Enable continuous audio playback when the mobile device screen turns off (automatically or manually) and display native iOS/Android audio controls on the lock screen or notification center. This ensures users can continue their binaural beats and pink noise sessions even when their device is locked.

**Context:**
The BeePink Naural app currently uses the Web Audio API with browser context. On mobile devices, the browser (Safari on iOS, Chrome on Android) automatically suspends audio playback when the screen turns off. This is a browser-level limitation that requires platform-specific solutions.

The current problem:
- Audio stops when screen turns off automatically after a few seconds of inactivity
- Audio stops when user manually locks/turns off screen
- No native mobile controls (play/pause buttons) appear on lock screen
- This breaks the user experience for background meditation/binaural beat sessions

Reference files:
- `src/audio/BinauralBeatGenerator.ts` - Audio context and oscillator management
- `src/audio/PinkNoiseGenerator.ts` - Pink noise generation with LFO
- `src/App.tsx` - Main audio state and playback control

## How
**Approach:**
Implement a refined solution based on research findings:

**Key Research Findings:**
1. **Wake Lock API is NOT the solution** - User confirmed screen should sleep normally while audio continues (like Bandcamp). Wake Lock would keep screen on, which is not desired.
2. **Root Cause**: Web Audio API alone doesn't trigger background audio playback on iOS/Android - browsers treat it as "effects" audio, not "media" audio.
3. **Existing Implementation**: App already has Media Session API and silent HTML5 audio element, but needs enhancements.

**Solution Strategy (Best Practices):**

1. **Audio Session API (iOS 17+)**: Add `navigator.audioSession.type = "playback"` to mark audio as media playback category (not ambient/ringer). This tells iOS Safari to continue audio when screen sleeps.

2. **Keep Silent HTML5 Audio Alive**: The existing silent audio element must continue playing throughout the entire playback session - browsers use this to determine if the app is a "media" app. Current implementation may not be calling `keepIOSAudioAlive()` on an interval.

3. **Media Session API Enhancements**: Already implemented for play/pause - may want to add volume controls for full native experience.

4. **Android Behavior**: HTML5 audio + Media Session API should work. Chrome for Android respects Media Session and shows notification controls.

5. **Screen Sleep Behavior**: Explicitly NOT using Wake Lock API - screen should sleep normally, only audio continues.

**Implementation Steps:**

Step 1: Enhance `src/audio/unlockIOSAudio.ts`:
- Add Audio Session API: `if ('audioSession' in navigator) { (navigator as any).audioSession.type = 'playback'; }`
- Ensure this is called before starting audio playback
- Make silent audio volume slightly higher if needed (some browsers ignore very low volumes)

Step 2: Modify `src/App.tsx`:
- Add `setInterval()` to call `keepIOSAudioAlive()` every 5-10 seconds while `isPlaying` is true
- Clear interval when playback stops
- Consider using `requestAnimationFrame` or visibility API to reduce calls when visible

Step 3: Verify Media Session integration:
- Ensure `setPlaybackState('playing')` is called AFTER silent audio starts playing
- Test that metadata appears correctly on lock screen

**Scope:**
- Enhance `src/audio/unlockIOSAudio.ts` with Audio Session API and interval-based keepAlive
- Modify `src/App.tsx` to manage keepIOSAudioAlive interval during playback
- Verify Media Session API integration with proper timing
- Test on physical iPhone: audio continues when screen auto-sleeps
- Test on physical iPhone: audio continues when manually locked
- Test on physical Android: audio continues when screen off
- Verify lock screen controls appear and function correctly
- Ensure no regressions on desktop browsers
- Confirm screen sleeps normally without wake lock

## Done When
- [x] Audio Session API added for iOS 17+
- [x] keepIOSAudioAlive called on interval during playback (every 5-10 seconds)
- [x] Silent audio element continues playing in background
- [x] Tested on physical iPhone: audio continues when screen auto-sleeps
- [x] Tested on physical iPhone: audio continues when manually locked
- [x] Tested on physical iPhone: lock screen controls appear and work
- [ ] Tested on physical Android: audio continues when screen off (no device available)
- [ ] Tested on physical Android: notification controls appear and work (no device available)
- [x] No regressions on desktop browsers
- [x] Screen sleeps normally (no wake lock keeping screen on)

## Implementation Notes (Final)
The solution required a "Never Pause Bridge" approach using MediaStreamAudioDestinationNode:
- Web Audio API output is routed through an HTMLAudioElement via MediaStreamDestination
- The HTMLAudioElement stays playing forever once started (never paused)
- Audio muting is controlled via Web Audio gain nodes, not by pausing the element
- This avoids the iOS Safari restriction that `audioElement.play()` requires a user gesture
- Lock screen play/pause now works because the bridge never needs to call `play()` again

## Reference
**Related Files:**
- `src/App.tsx:45-67` - Audio playback state and isPlaying flag
- `src/audio/unlockIOSAudio.ts` - Silent HTML5 audio element management (needs enhancement)
- `src/audio/BinauralBeatGenerator.ts` - Web Audio API initialization
- `src/audio/PinkNoiseGenerator.ts` - Audio processing
- `src/hooks/useIsMobile.ts` - Mobile detection hook

**Dependencies:**
- Audio Session API (iOS 17+, navigator.audioSession)
- Media Session API (browser native)
- HTML5 Audio element (already in use)

**Research Sources:**
- MDN Media Session API: https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
- web.dev Media Session: https://web.dev/articles/media-session
- iOS PWA Audio Session: https://dbushell.com/2023/03/20/ios-pwa-media-session-api/
- Stack Overflow iOS background audio: https://stackoverflow.com/questions/76291413/no-sound-on-ios-only-web-audio-api

**Implementation Notes:**
- Key insight: Browser uses silent HTML5 audio element to determine if app is "media" app
- Audio Session API call must happen BEFORE starting Web Audio playback
- Interval-based keepAlive is essential - single call is insufficient
- No Wake Lock API needed - screen sleep is expected behavior (like Bandcamp)
- Media Session integration already exists - verify timing relative to HTML5 audio start
- Physical device testing required - mobile emulators may not accurately simulate background audio behavior
- iOS 17+ supports Audio Session API; earlier versions may fall back to just Media Session + HTML5 audio
