import { useState, useEffect, useRef } from 'react';
import { PinkNoiseGenerator } from './audio/PinkNoiseGenerator';
import { BinauralBeatGenerator } from './audio/BinauralBeatGenerator';
import { initIOSAudio, unlockIOSAudio, stopIOSAudioUnlock } from './audio/unlockIOSAudio';
import { Slider } from './components/Slider';
import { SectionHeader } from './components/SectionHeader';
import { PlayButton } from './components/PlayButton';
import { BrainWaveDisplay } from './components/BrainWaveDisplay';
import { BackgroundBlob } from './components/BackgroundBlob';
import { Switch } from './components/Switch';
import { AnimatePresence, useMotionValue, motion } from 'motion/react';
import { useIsMozilla } from './hooks/useIsMozilla';

interface FlipButtonProps {
  onClick: () => void;
  targetLabel: string;
}

const FlipButton = ({ onClick, targetLabel }: FlipButtonProps) => (
  <div className="pt-4 flex justify-center mt-auto">
    <button 
      onClick={onClick}
      className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 cursor-pointer"
    >
      <span className="font-medium">
        <span className="underline decoration-slate-500 underline-offset-2 group-hover:decoration-slate-300">F</span>lip to {targetLabel}
      </span>
    </button>
  </div>
);

function App() {
  const isMozilla = useIsMozilla();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  // Disable blob on Mozilla browsers due to rendering issues
  const [showBlob, setShowBlob] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Front Face State (Classic)
  const [noiseVolume, setNoiseVolume] = useState(0.5);
  const [beatVolume, setBeatVolume] = useState(0.5);
  const [baseFreq, setBaseFreq] = useState(60);
  const [beatFreq, setBeatFreq] = useState(4);

  // Back Face State (Naural Pulse)
  const [neuralFreq, setNeuralFreq] = useState(0.5);
  const [neuralPulseDepth, setNeuralPulseDepth] = useState(0.8);
  const [neuralPanDepth, setNeuralPanDepth] = useState(0.5);
  const [neuralNoiseVolume, setNeuralNoiseVolume] = useState(0.5);

  // Mouse position tracking
  const mouseX = useMotionValue(window.innerWidth / 2);
  const mouseY = useMotionValue(window.innerHeight / 2);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseGenRef = useRef<PinkNoiseGenerator | null>(null);
  const beatGenRef = useRef<BinauralBeatGenerator | null>(null);

  // Refs for shortcuts
  const masterVolRef = useRef<HTMLInputElement>(null);
  const noiseVolRef = useRef<HTMLInputElement>(null);
  const beatVolRef = useRef<HTMLInputElement>(null);
  const carrierRef = useRef<HTMLInputElement>(null);
  const beatFreqRef = useRef<HTMLInputElement>(null);

  // Back Face Refs
  const neuralNoiseVolRef = useRef<HTMLInputElement>(null);
  const neuralFreqRef = useRef<HTMLInputElement>(null);
  const pulseDepthRef = useRef<HTMLInputElement>(null);
  const panDepthRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') {
          // Allow typing in text inputs
      }
      
      const key = e.key.toLowerCase();

      switch(key) {
        case ' ':
          if (!(e.target instanceof HTMLInputElement && e.target.type === 'text')) {
             e.preventDefault();
             document.getElementById('play-button')?.click();
          }
          break;
        case 'v':
          e.preventDefault();
          masterVolRef.current?.focus();
          break;
        case 'n':
          e.preventDefault();
          if (isFlipped) neuralNoiseVolRef.current?.focus();
          else noiseVolRef.current?.focus();
          break;
        case 'escape':
          e.preventDefault();
          if (document.activeElement instanceof HTMLElement) {
             document.activeElement.blur();
          }
          break;
        // Mode specific
        case 'b': // Beat Volume (Front)
          if (!isFlipped) { e.preventDefault(); beatVolRef.current?.focus(); }
          break;
        case 'c': // Carrier (Front)
          if (!isFlipped) { e.preventDefault(); carrierRef.current?.focus(); }
          break;
        case 'h': // Frequency (Shared)
          e.preventDefault();
          if (isFlipped) neuralFreqRef.current?.focus();
          else beatFreqRef.current?.focus();
          break;
        case 'p': // Pulse (Back)
          if (isFlipped) { e.preventDefault(); pulseDepthRef.current?.focus(); }
          break;
        case 's': // Spatial/Pan (Back)
          if (isFlipped) { e.preventDefault(); panDepthRef.current?.focus(); }
          break;
        case 'f': // Flip
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped]);

  // Pre-initialize iOS audio on mount (so it's ready for instant playback)
  useEffect(() => {
    initIOSAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Audio Logic based on Flip State
    if (!isFlipped) {
       // Front Logic
       if (noiseGenRef.current) {
          noiseGenRef.current.setVolume(isPlaying ? noiseVolume * volume : 0);
          noiseGenRef.current.setModulation(0, 0, 0); // Disable modulation
       }
       if (beatGenRef.current) {
          beatGenRef.current.setVolume(isPlaying ? beatVolume * volume : 0);
          beatGenRef.current.setFrequencies(baseFreq, beatFreq);
       }
    } else {
       // Back Logic
       if (noiseGenRef.current) {
          noiseGenRef.current.setVolume(isPlaying ? neuralNoiseVolume * volume : 0);
          noiseGenRef.current.setModulation(neuralFreq, neuralPulseDepth, neuralPanDepth);
       }
       if (beatGenRef.current) {
          beatGenRef.current.setVolume(0); // Mute binaural beats
       }
    }
  }, [isPlaying, volume, noiseVolume, beatVolume, baseFreq, beatFreq, isFlipped, neuralFreq, neuralPulseDepth, neuralPanDepth, neuralNoiseVolume]);

  const togglePlay = () => {
    // When starting playback, unlock iOS audio first (bypasses mute switch)
    // IMPORTANT: Must be synchronous - no await before play() calls on iOS Safari
    if (!isPlaying) {
      unlockIOSAudio(); // Synchronous call - don't await
    }

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const noiseGen = new PinkNoiseGenerator(ctx);
      const beatGen = new BinauralBeatGenerator(ctx);

      noiseGen.connect(ctx.destination);
      beatGen.connect(ctx.destination);

      noiseGenRef.current = noiseGen;
      beatGenRef.current = beatGen;

      // Determine initial parameters for Pink Noise based on current mode
      const initModFreq = isFlipped ? neuralFreq : 0;
      const initPulse = isFlipped ? neuralPulseDepth : 0;
      const initPan = isFlipped ? neuralPanDepth : 0;

      noiseGen.start(initModFreq, initPulse, initPan);
      beatGen.start(baseFreq, beatFreq);
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume(); // Don't await - must stay synchronous for iOS
    }

    // When stopping, also stop the iOS unlock audio
    if (isPlaying) {
      stopIOSAudioUnlock();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center px-8 py-14 font-sans relative z-0 overflow-hidden">
      <AnimatePresence>
        {showBlob && <BackgroundBlob key="blob" mouseX={mouseX} mouseY={mouseY} />}
      </AnimatePresence>
      
      {/* Top controls container - Hide blob toggle on Mozilla browsers */}
      {!isMozilla && (
        <div className="absolute top-4 right-4 z-50">
          <Switch 
            checked={showBlob} 
            onChange={setShowBlob} 
            label="Shimmer" 
          />
        </div>
      )}

      <div className="perspective-1000 w-full max-w-md relative z-10">
        <motion.div 
          className="w-full relative transform-3d duration-700 h-auto"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* FRONT FACE */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/10 w-full relative flex flex-col backface-hidden">
            <h1 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text">
              BeePink Naural
            </h1>
            <p className="text-slate-400 text-center mb-8 text-sm">
              Binaural Beats & Pink Noise
            </p>

            <div className="flex justify-center mb-8">
              <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
            </div>

            <div className="space-y-6 flex-1">
              <Slider
                ref={masterVolRef}
                label="Master Volume"
                displayValue={`${Math.round(volume * 100)}%`}
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={setVolume}
                color="pink"
                shortcutChar="v"
              />

              <div className="h-px bg-slate-700 my-4" />

              <div className="space-y-4">
                <SectionHeader title="Pink Noise" color="pink" />
                <Slider
                  ref={noiseVolRef}
                  label="Noise Volume"
                  displayValue={`${Math.round(noiseVolume * 100)}%`}
                  value={noiseVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setNoiseVolume}
                  color="pink"
                  shortcutChar="n"
                />
              </div>

              <div className="space-y-4">
                <SectionHeader title="Binaural Beats" color="purple" />
                
                <Slider
                  ref={beatVolRef}
                  label="Beats Volume"
                  displayValue={`${Math.round(beatVolume * 100)}%`}
                  value={beatVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setBeatVolume}
                  color="purple"
                  shortcutChar="b"
                />

                <div className="space-y-4">
                  <Slider
                    ref={carrierRef}
                    label="Carrier"
                    value={baseFreq}
                    min={10}
                    max={500}
                    onChange={(val) => setBaseFreq(Math.round(val))}
                    color="purple"
                    editable={true}
                    unit="Hz"
                    shortcutChar="c"
                  />
                  <Slider
                    ref={beatFreqRef}
                    label={`Beat (${beatFreq} Hz)`}
                    value={beatFreq}
                    min={0.5}
                    max={40}
                    step={0.1}
                    onChange={setBeatFreq}
                    color="purple"
                    shortcutChar="h"
                  />
                </div>
                
                <BrainWaveDisplay freq={beatFreq} />
              </div>

              <FlipButton onClick={() => setIsFlipped(true)} targetLabel="Naural Pulse" />
            </div>
          </div>

          {/* BACK FACE */}
          <div className="backface-hidden absolute top-0 left-0 w-full h-full rotate-y-180 bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/10 flex flex-col">
            <h1 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-teal-400 to-blue-400 text-transparent bg-clip-text">
              Naural Pulse
            </h1>
            <p className="text-slate-400 text-center mb-8 text-sm">
              Isochronic Pink Noise Modulation
            </p>

            <div className="flex justify-center mb-8">
              <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
            </div>

            <div className="space-y-6 flex-1">
              <Slider
                label="Master Volume"
                displayValue={`${Math.round(volume * 100)}%`}
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={setVolume}
                color="teal"
                shortcutChar="v"
              />

              <div className="h-px bg-slate-700 my-4" />

              <div className="space-y-4">
                 <SectionHeader title="Entrainment" color="teal" />
                 <Slider
                    ref={neuralFreqRef}
                    label={`Beat (${neuralFreq} Hz)`}
                    value={neuralFreq}
                    min={0.5}
                    max={40}
                    step={0.1}
                    onChange={setNeuralFreq}
                    color="teal"
                    shortcutChar="h"
                  />
                  
                  <BrainWaveDisplay freq={neuralFreq} />
              </div>

              <div className="space-y-4">
                <SectionHeader title="Modulation" color="blue" />
                <Slider
                  ref={neuralNoiseVolRef}
                  label="Noise Volume"
                  displayValue={`${Math.round(neuralNoiseVolume * 100)}%`}
                  value={neuralNoiseVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setNeuralNoiseVolume}
                  color="blue"
                  shortcutChar="n"
                />
                <Slider
                  ref={pulseDepthRef}
                  label={`Pulse Depth (${Math.round(neuralPulseDepth * 100)}%)`}
                  value={neuralPulseDepth}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setNeuralPulseDepth}
                  color="blue"
                  shortcutChar="p"
                />
                 <Slider
                  ref={panDepthRef}
                  label={`Spatial Pan (${Math.round(neuralPanDepth * 100)}%)`}
                  value={neuralPanDepth}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setNeuralPanDepth}
                  color="blue"
                  shortcutChar="s"
                />
              </div>

              <FlipButton onClick={() => setIsFlipped(false)} targetLabel="BeePink Naural" />
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="mt-8 text-xs text-slate-600 max-w-md text-center">
        <p>Use stereo headphones for the binaural/spatial effect.</p>
        <p className="mt-2">Made by <a href="https://sueden.social/@Rana" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 underline underline-offset-2">Rana</a></p>
      </div>
    </div>
  );
}

export default App;
