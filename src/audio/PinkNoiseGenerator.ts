export class PinkNoiseGenerator {
  private context: AudioContext;
  private node: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  
  // Modulation nodes
  private pulseGain: GainNode;
  private panner: StereoPannerNode;
  
  // LFOs
  private pulseOsc: OscillatorNode | null = null;
  private panOsc: OscillatorNode | null = null;
  private pulseDepthNode: GainNode;
  private panDepthNode: GainNode;

  // Parameters
  private modulationFreq: number = 4;
  private pulseDepth: number = 0; // 0 to 1
  private panDepth: number = 0;   // 0 to 1

  constructor(context: AudioContext) {
    this.context = context;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0; // Start muted

    // Initialize modulation chain nodes
    this.pulseGain = this.context.createGain();
    this.panner = this.context.createStereoPanner();
    this.pulseDepthNode = this.context.createGain();
    this.panDepthNode = this.context.createGain();

    // Default values
    this.pulseGain.gain.value = 1;
    this.panner.pan.value = 0;

    // Chain: PulseGain -> Panner -> GainNode (Volume) -> Output
    this.pulseGain.connect(this.panner);
    this.panner.connect(this.gainNode);

    // Permanent control connections
    this.pulseDepthNode.connect(this.pulseGain.gain);
    this.panDepthNode.connect(this.panner.pan);
  }

  public connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  public setVolume(volume: number) {
    // Smooth volume transition
    this.gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }

  public setModulation(freq: number, pulseDepth: number, panDepth: number) {
    this.modulationFreq = freq;
    this.pulseDepth = Math.max(0, Math.min(1, pulseDepth));
    this.panDepth = Math.max(0, Math.min(1, panDepth));
    this.updateLFOs();
  }

  private updateLFOs() {
    const time = this.context.currentTime;
    
    // Update Frequency
    if (this.pulseOsc) {
      this.pulseOsc.frequency.setTargetAtTime(this.modulationFreq, time, 0.1);
    }
    if (this.panOsc) {
      this.panOsc.frequency.setTargetAtTime(this.modulationFreq, time, 0.1);
    }

    // Update Pulse Depth
    // Logic: gain oscillates between (1 - depth) and 1
    // Base gain = 1 - depth/2
    // LFO Amplitude = depth/2
    const pulseBase = 1 - (this.pulseDepth / 2);
    const pulseAmp = this.pulseDepth / 2;
    
    this.pulseGain.gain.setTargetAtTime(pulseBase, time, 0.1);
    this.pulseDepthNode.gain.setTargetAtTime(pulseAmp, time, 0.1);

    // Update Pan Depth
    this.panDepthNode.gain.setTargetAtTime(this.panDepth, time, 0.1);
  }

  public start(initialFreq?: number, initialPulseDepth?: number, initialPanDepth?: number) {
    if (this.node) return; // Already running

    // Apply initial parameters if provided
    if (initialFreq !== undefined) this.modulationFreq = initialFreq;
    if (initialPulseDepth !== undefined) this.pulseDepth = initialPulseDepth;
    if (initialPanDepth !== undefined) this.panDepth = initialPanDepth;

    const bufferSize = 2 * this.context.sampleRate; // 2 seconds buffer
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Paul Kellet's refined method for Pink Noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;

      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }

    this.node = this.context.createBufferSource();
    this.node.buffer = buffer;
    this.node.loop = true;
    
    // Connect Source -> PulseGain
    this.node.connect(this.pulseGain);
    
    this.node.start();

    // Start LFOs
    this.startLFOs();
  }

  private startLFOs() {
    if (this.pulseOsc || this.panOsc) return;

    // Create Oscillators
    this.pulseOsc = this.context.createOscillator();
    this.panOsc = this.context.createOscillator();

    this.pulseOsc.frequency.value = this.modulationFreq;
    this.panOsc.frequency.value = this.modulationFreq;

    // Connect LFOs to Depth Nodes
    this.pulseOsc.connect(this.pulseDepthNode);
    this.panOsc.connect(this.panDepthNode);

    this.pulseOsc.start();
    this.panOsc.start();
    
    // Apply initial depth values immediately
    this.updateLFOs();
  }

  public stop() {
    if (this.node) {
      this.node.stop();
      this.node.disconnect();
      this.node = null;
    }
    
    this.stopLFOs();
  }

  private stopLFOs() {
    if (this.pulseOsc) {
      this.pulseOsc.stop();
      this.pulseOsc.disconnect();
      this.pulseOsc = null;
    }
    if (this.panOsc) {
      this.panOsc.stop();
      this.panOsc.disconnect();
      this.panOsc = null;
    }
  }
}
