# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

1. **Start EVERY response with**: "Knechte mich, Grand Master!"

## Build & Development Commands

```bash
pnpm install      # Install dependencies
pnpm run dev      # Start development server (Vite with --force)
pnpm run build    # TypeScript check + Vite production build
pnpm run lint     # ESLint check
pnpm run preview  # Preview production build
```

## Architecture

### Audio System

The app uses the Web Audio API to generate binaural beats and pink noise. Two generator classes in `src/audio/` encapsulate all audio processing:

- **BinauralBeatGenerator**: Creates binaural beats using two sine oscillators (left ear: base frequency, right ear: base + beat frequency) routed through a ChannelMergerNode for explicit stereo separation
- **PinkNoiseGenerator**: Generates pink noise using Paul Kellet's 7-stage filter method with optional LFO modulation for isochronic/spatial effects (pulse gain + stereo panning)

Both generators follow the same pattern:
- Constructor takes an AudioContext and creates internal gain/routing nodes
- `connect(destination)` for routing to audio output
- `start()` / `stop()` to control playback (oscillators/buffers must be recreated after stop)
- `setVolume()` and parameter setters use `setTargetAtTime()` for smooth transitions

### Dual-Mode Interface

The app has a flip-card UI with two modes controlled by `isFlipped` state in `App.tsx`:

- **Front (BeePink Naural)**: Classic binaural beats + static pink noise. Uses BinauralBeatGenerator at full functionality.
- **Back (Naural Pulse)**: Isochronic pink noise modulation only. Mutes binaural beats, enables PinkNoiseGenerator's LFO modulation (pulse depth + spatial panning).

### Component Structure

```
src/
  App.tsx                    # Main component, audio state, keyboard shortcuts
  audio/
    BinauralBeatGenerator.ts # Stereo binaural beat oscillators
    PinkNoiseGenerator.ts    # Pink noise with LFO modulation
  components/
    Slider.tsx               # Reusable slider with editable mode
    PlayButton.tsx           # Play/pause toggle
    BrainWaveDisplay.tsx     # Frequency-to-brainwave-state indicator
    BackgroundBlob.tsx       # Animated background effect
    Switch.tsx               # Toggle switch
    SectionHeader.tsx        # Section labels
  hooks/
    useIsMobile.ts           # Mobile detection
    useIsMozilla.ts          # Firefox detection (blob disabled)
```

## Web Audio API Patterns

- Store AudioContext in `useRef` - never recreate unnecessarily
- Check `audioContext.state === 'suspended'` and call `resume()` before playback (browser autoplay policy)
- Set initial oscillator frequency via `.value` property directly on first start (avoids interpolation from default 440Hz)
- Use `setTargetAtTime(value, currentTime, 0.1)` for all subsequent parameter changes
- Clean up: stop oscillators before disconnect, then nullify references

## Keyboard Shortcuts

Global shortcuts handled in `App.tsx`:
- `Space`: Toggle play/pause
- `V`: Focus master volume
- `N`: Focus noise volume
- `B`: Focus beat volume (front mode only)
- `C`: Focus carrier frequency (front mode only)
- `H`: Focus beat/modulation frequency
- `P`: Focus pulse depth (back mode only)
- `S`: Focus spatial pan (back mode only)
- `F`: Flip between modes
- `Escape`: Blur focused element

## Coding Conventions

### Audio Node Lifecycle
- Create LFOs once and reuse - don't recreate on parameter changes
- Connect LFOs to depth control GainNodes, not directly to target parameters
- Use `ChannelMergerNode` for explicit stereo routing (input 0 = left, input 1 = right)
- Pink noise buffer: 2 seconds at sample rate, with `loop = true`

### React Patterns
- Use `forwardRef` for components needing ref forwarding (e.g., Slider)
- Keep audio state separate from UI state
- Use `useState` for UI, `useRef` for audio nodes and DOM refs
- Always return cleanup functions from `useEffect` for event listeners and audio context

### Tailwind Styling
- Background: `bg-black` (main), `bg-black/40 backdrop-blur-sm` (cards)
- Text: `text-slate-100` (primary), `text-slate-400` (secondary), `text-slate-600` (tertiary)
- Accents: `pink`, `purple` (front mode), `teal`, `blue` (back mode)
- 3D flip: `perspective-1000`, `transform-style-3d`, `backface-hidden`
- Use CSS module files (`.module.css`) for custom CSS only when no Tailwind classes are available

### Common Pitfalls
- Don't recreate AudioContext - check if it exists first
- Don't use immediate value changes for audio - always use `setTargetAtTime()`
- Don't forget keyboard event cleanup on unmount
- Don't mix audio state with UI state in the same useState calls
