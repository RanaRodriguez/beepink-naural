export class BinauralBeatGenerator {
  private context: AudioContext;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private merger: ChannelMergerNode;
  private gainNode: GainNode;
  
  private baseFreq: number = 0; // Default, will be overridden on start
  private beatFreq: number = 0;

  constructor(context: AudioContext) {
    this.context = context;
    this.merger = this.context.createChannelMerger(2);
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0; // Start muted
    
    // Connect merger to gain
    this.merger.connect(this.gainNode);
  }

  public connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  public setVolume(volume: number) {
    this.gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }

  public setFrequencies(base: number, beat: number) {
    this.baseFreq = base;
    this.beatFreq = beat;
    this.updateOscillators();
  }

  private updateOscillators() {
    if (this.leftOsc && this.rightOsc) {
      // Calculate frequencies for left and right ears
      // Left ear gets base frequency
      // Right ear gets base frequency + beat frequency
      // The brain perceives the difference (the beat frequency)
      const leftFreq = this.baseFreq;
      const rightFreq = this.baseFreq + this.beatFreq;

      this.leftOsc.frequency.setTargetAtTime(leftFreq, this.context.currentTime, 0.1);
      this.rightOsc.frequency.setTargetAtTime(rightFreq, this.context.currentTime, 0.1);
    }
  }

  public start(initialBaseFreq?: number, initialBeatFreq?: number) {
    if (this.leftOsc || this.rightOsc) return;

    // Update internal state if provided
    if (initialBaseFreq !== undefined) this.baseFreq = initialBaseFreq;
    if (initialBeatFreq !== undefined) this.beatFreq = initialBeatFreq;

    // Create oscillators
    this.leftOsc = this.context.createOscillator();
    this.rightOsc = this.context.createOscillator();
    
    this.leftOsc.type = 'sine';
    this.rightOsc.type = 'sine';

    // Initial frequencies
    // Set frequency value directly instead of using setTargetAtTime for the initial start
    // to avoid the "drop" effect from the default frequency of the oscillator (440Hz)
    const leftFreq = this.baseFreq;
    const rightFreq = this.baseFreq + this.beatFreq;

    this.leftOsc.frequency.value = leftFreq;
    this.rightOsc.frequency.value = rightFreq;
    
    // We don't call updateOscillators() here because it uses setTargetAtTime which interpolates
    // from the previous value (or default 440Hz if not set).
    // this.updateOscillators();

    // Create stereo panner for channel separation if needed, 
    // but using ChannelMerger with explicit inputs is cleaner for binaural.
    // ChannelMerger(2) input 0 is Left, input 1 is Right.
    
    this.leftOsc.connect(this.merger, 0, 0); // Connect left osc to left channel (0)
    this.rightOsc.connect(this.merger, 0, 1); // Connect right osc to right channel (1)

    this.leftOsc.start();
    this.rightOsc.start();
  }

  public stop() {
    if (this.leftOsc) {
      this.leftOsc.stop();
      this.leftOsc.disconnect();
      this.leftOsc = null;
    }
    if (this.rightOsc) {
      this.rightOsc.stop();
      this.rightOsc.disconnect();
      this.rightOsc = null;
    }
  }
}

