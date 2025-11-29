# Task 001: Fix iPhone Mute Switch Preventing Audio Playback

## Meta
- Status: in-progress
- Created: 2025-11-29
- Updated: 2025-11-29
- Type: Research AND Implementation
- Temporary: No

## What & Why
**Objective:** Investigate and resolve the issue where the iPhone hardware mute switch prevents audio playback from Web Audio API, while other apps like YouTube and Bandcamp can play sound normally when the mute switch is enabled.

**Context:**
- The Web Audio API implementation currently respects the iPhone's hardware mute switch, preventing all audio output
- Competing apps (YouTube, Bandcamp) demonstrate that this behavior is not a system limitation
- This indicates an implementation issue with how the Web Audio API is being used or configured
- The issue is specific to iOS/iPhone devices
- Expected behavior: Audio should play regardless of hardware mute switch state (similar to YouTube, Bandcamp, and other media apps)

## How
**Approach:** Research iOS audio session management and Web Audio API best practices to identify configuration options that allow audio playback to bypass the hardware mute switch.

**Research Areas:**
- Web Audio API audio session categories and routing
- iOS AudioSession configuration for Web Audio context
- How other apps (YouTube, Bandcamp) implement audio playback bypass
- Safari JavaScript APIs for controlling audio behavior on iOS
- Possible use of AVAudioSession categories in WebKit

**Scope:**
- Always bypass mute switch for all audio (binaural beats and pink noise)
- Should work like YouTube/Bandcamp - audio plays regardless of mute switch state
- No user toggle needed
- Research Web Audio API documentation for iOS-specific behavior
- Research audio session category options (playback, ambient, soloAmbient, etc.)
- Document current implementation approach in codebase
- Identify configuration changes needed
- Implement solution in AudioContext initialization code
- Test on physical iPhone hardware (actual mute switch testing)
- Test on iOS simulator for additional verification (iOS 15+ focus)

## Done When
- [x] Root cause identified and documented in task file with references
- [x] Solution implemented in AudioContext initialization code
- [ ] Audio plays on iPhone with mute switch enabled (both binaural beats and pink noise)
- [ ] No regression in desktop browser or Android audio functionality
- [ ] Tested on physical iPhone with mute switch on/off
- [ ] Tested on iOS simulator for additional verification

## Reference
**Related Files:**
- `/Users/willmann/Downloads/beepink-naural-main/src/App.tsx:176-214` (AudioContext initialization + iOS unlock)
- `/Users/willmann/Downloads/beepink-naural-main/src/audio/BinauralBeatGenerator.ts`
- `/Users/willmann/Downloads/beepink-naural-main/src/audio/PinkNoiseGenerator.ts`
- `/Users/willmann/Downloads/beepink-naural-main/src/audio/unlockIOSAudio.ts` (NEW - iOS audio unlock utility)

**Dependencies:**
- Web Audio API documentation
- iOS Safari documentation
- Testing device: iPhone with hardware mute switch

**Notes:**
- This task file is now finalized and ready for implementation
- Priority: High - audio playback is core functionality
- Affects user experience on iOS devices
- Task includes both research AND implementation - not just investigation
- Testing on iOS 15+ versions is required (physical device + simulator)
- No user preferences or toggles needed - should always bypass mute switch
- Check Safari documentation for any iOS-specific Web Audio limitations or configurations
- Similar behavior to YouTube, Bandcamp, and other media apps

---

## Research Findings

### Root Cause
iOS Safari uses two different audio session categories:
- **Ringer category**: Used by Web Audio API - respects the hardware mute switch
- **Media category**: Used by HTML5 `<audio>` elements - ignores the mute switch

This is why YouTube and Bandcamp work with mute enabled - they use HTML5 audio elements or combine both approaches.

### Solution
Play a silent HTML5 `<audio>` element alongside the Web Audio API. This "kicks" iOS into using the media category for all audio, effectively bypassing the mute switch.

Key implementation details:
1. Create an `<audio>` element with a base64-encoded silent WAV file
2. Set `x-webkit-airplay="deny"` to prevent showing in AirPlay/lockscreen controls
3. Set `loop="true"` and `playsinline="true"` for continuous background playback
4. Play the silent audio on user interaction (button click) before starting Web Audio

### Sources
- [feross/unmute-ios-audio](https://github.com/feross/unmute-ios-audio) - NPM package implementing this technique
- [Audjust Blog: Unmute Web Audio on iOS](https://www.audjust.com/blog/unmute-web-audio-on-ios) - Detailed explanation
- [WebKit Bug #237322](https://bugs.webkit.org/show_bug.cgi?id=237322) - Official WebKit bug tracking this issue
- [Howler.js Issue #753](https://github.com/goldfire/howler.js/issues/753) - Discussion of HTML5 vs Web Audio behavior

## Implementation

### Files Created
- `src/audio/unlockIOSAudio.ts` - New utility module with:
  - `unlockIOSAudio()` - Called when starting playback to bypass mute switch
  - `stopIOSAudioUnlock()` - Called when stopping playback to clean up
  - iOS device detection
  - Base64-encoded silent WAV file

### Files Modified
- `src/App.tsx` - Integrated iOS audio unlock into `togglePlay()` function:
  - Calls `unlockIOSAudio()` before starting playback
  - Calls `stopIOSAudioUnlock()` when stopping playback

### Build Status
- Lint: ✓ Passed
- TypeScript: ✓ Passed
- Build: ✓ Passed
