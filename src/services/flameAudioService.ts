/**
 * FlameAudioService: Subtle, dynamic acoustic feedback engine for microgravity combustion.
 * 
 * Synthesizes:
 * 1. Thermal Core Drone: Dual detuned low-frequency oscillators whose fundamental pitch scales
 *    with flame temperature (Rayleigh criterion: acoustic speed c ∝ √T).
 * 2. Harmonic Brightness Filter: Resonant lowpass/bandpass filter opening up as flame heats up.
 * 3. Aerodynamic Ventilation Air Hiss: Pink/white noise source shaped through a dynamic bandpass
 *    filter modulated by ventilation airflow speed (m/s).
 * 4. Convective Flutter (LFO): Sub-audible tremolo/vibrato simulating convective turbulence and flickering.
 * 5. Smooth anti-pop ramping via AudioParam.setTargetAtTime for glitch-free transitions.
 */

export interface FlameAudioParams {
  isBurning: boolean;
  flameTempK: number;
  ventilationSpeed: number; // m/s
  gravityG: number;
  dangerLevel?: string;
}

export class FlameAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private userVolume: number = 0.65; // Balanced subtle master volume (0.0 to 1.0)

  // Web Audio Nodes
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;

  private oscFundamental: OscillatorNode | null = null;
  private oscHarmonic: OscillatorNode | null = null;
  private thermalFilter: BiquadFilterNode | null = null;

  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;

  // Real-time telemetry for UI display
  public currentPitchHz: number = 0;
  public currentVolumeNorm: number = 0;

  constructor() {
    // Lazy initialized on first user interaction or enable
  }

  /**
   * Initializes the Web Audio graph.
   */
  public initAudio(): boolean {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return false;

      const ctx = new AudioCtxClass();
      this.ctx = ctx;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      // =========================================================================
      // 1. THERMAL COMBUSTION DRONE (Dual warm oscillators + Biquad Lowpass)
      // =========================================================================
      const thermalFilter = ctx.createBiquadFilter();
      thermalFilter.type = 'lowpass';
      thermalFilter.frequency.setValueAtTime(320, ctx.currentTime);
      thermalFilter.Q.setValueAtTime(2.2, ctx.currentTime);
      this.thermalFilter = thermalFilter;

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.droneGain = droneGain;

      // Fundamental oscillator (triangle wave for rich, warm low-end)
      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'triangle';
      oscFundamental.frequency.setValueAtTime(75, ctx.currentTime);

      // Harmonic overtone oscillator (sine wave detuned +3 cents)
      const oscHarmonic = ctx.createOscillator();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(151, ctx.currentTime);

      // =========================================================================
      // 2. CONVECTIVE FLUTTER LFO (Simulates air current turbulence)
      // =========================================================================
      const lfoOsc = ctx.createOscillator();
      lfoOsc.type = 'sine';
      lfoOsc.frequency.setValueAtTime(4.0, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(2.5, ctx.currentTime); // Pitch flutter in Hz

      lfoOsc.connect(lfoGain);
      lfoGain.connect(oscFundamental.frequency);
      lfoGain.connect(oscHarmonic.frequency);

      // Connect drone oscillators through filter and gain
      oscFundamental.connect(thermalFilter);
      oscHarmonic.connect(thermalFilter);
      thermalFilter.connect(droneGain);
      droneGain.connect(masterGain);

      // Start oscillators
      oscFundamental.start();
      oscHarmonic.start();
      lfoOsc.start();

      this.oscFundamental = oscFundamental;
      this.oscHarmonic = oscHarmonic;
      this.lfoOsc = lfoOsc;
      this.lfoGain = lfoGain;

      // =========================================================================
      // 3. AERODYNAMIC VENTILATION & FLAME NOISE (Bandpass-shaped noise buffer)
      // =========================================================================
      const bufferSize = ctx.sampleRate * 2.0; // 2 seconds looping noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      // Pinkish noise curve (softer, non-fatiguing acoustic profile)
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.2, ctx.currentTime);
      this.noiseFilter = noiseFilter;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.noiseGain = noiseGain;

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start();
      this.noiseSource = noiseSource;

      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dynamically modulates volume, pitch, filter cutoffs, and flutter in real time.
   */
  public update(params: FlameAudioParams) {
    if (this.isDestroyed) return;
    if (!this.isEnabled) {
      this.silence();
      return;
    }

    if (!this.isInitialized) {
      return;
    }

    const ctx = this.ctx;
    if (!ctx || ctx.state === 'closed') return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const { isBurning, flameTempK, ventilationSpeed, gravityG } = params;

    if (!isBurning) {
      // Extinguished / Standby: smoothly fade to silent
      this.silence();
      this.currentPitchHz = 0;
      this.currentVolumeNorm = 0;
      return;
    }

    // -----------------------------------------------------------------------
    // PITCH SYNTHESIS (Flame Temperature Modulation)
    // -----------------------------------------------------------------------
    // Candle standard: ~1200 K -> ~95 Hz fundamental
    // Hot silane/methane: ~2000 K -> ~175 Hz fundamental
    // Airflow adds subtle acoustic tension
    const clampedTemp = Math.max(300, Math.min(2600, flameTempK));
    const normalizedTemp = (clampedTemp - 300) / 2300; // 0.0 to 1.0
    const basePitch = 68 + normalizedTemp * 115 + ventilationSpeed * 18;

    this.currentPitchHz = Math.round(basePitch);

    if (this.oscFundamental && this.oscHarmonic) {
      // Smooth frequency glides without clicking (time constant ~0.06s)
      this.oscFundamental.frequency.setTargetAtTime(basePitch, now, 0.06);
      this.oscHarmonic.frequency.setTargetAtTime(basePitch * 2.015, now, 0.06);
    }

    // -----------------------------------------------------------------------
    // HARMONIC SPECTRUM (Thermal Filter Cutoff)
    // -----------------------------------------------------------------------
    // Higher temp generates brighter acoustic overtones
    if (this.thermalFilter) {
      const targetCutoff = 220 + normalizedTemp * 780 + ventilationSpeed * 320;
      this.thermalFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);
      // In 0-G quiescent sphere, Q factor is tighter; in 1-G or wind, wider
      const targetQ = gravityG === 0 && ventilationSpeed < 0.1 ? 3.0 : 1.8;
      this.thermalFilter.Q.setTargetAtTime(targetQ, now, 0.08);
    }

    // -----------------------------------------------------------------------
    // CONVECTIVE FLUTTER LFO (Ventilation Flutter & Flicker)
    // -----------------------------------------------------------------------
    if (this.lfoOsc && this.lfoGain) {
      const flutterSpeed = 3.2 + ventilationSpeed * 7.5 + (gravityG > 0 ? 3.0 : 0.0);
      const flutterDepth = 1.0 + ventilationSpeed * 6.5 + (gravityG > 0 ? 2.5 : 0.0);
      this.lfoOsc.frequency.setTargetAtTime(flutterSpeed, now, 0.08);
      this.lfoGain.gain.setTargetAtTime(flutterDepth, now, 0.08);
    }

    // -----------------------------------------------------------------------
    // AERODYNAMIC AIRFLOW NOISE (Hiss modulated by Ventilation Speed)
    // -----------------------------------------------------------------------
    if (this.noiseFilter && this.noiseGain) {
      const noiseCenterFreq = 650 + ventilationSpeed * 1100 + normalizedTemp * 250;
      this.noiseFilter.frequency.setTargetAtTime(noiseCenterFreq, now, 0.08);

      // Noise gain: very subtle at 0 ventilation (combustion whisper), expands with airflow
      const targetNoiseGain = (0.003 + ventilationSpeed * 0.024) * this.userVolume;
      this.noiseGain.gain.setTargetAtTime(targetNoiseGain, now, 0.08);
    }

    // -----------------------------------------------------------------------
    // THERMAL DRONE VOLUME (Core Flame Intensity)
    // -----------------------------------------------------------------------
    if (this.droneGain) {
      // Base intensity scales with flame temperature
      const targetDroneGain = (0.022 + normalizedTemp * 0.028) * this.userVolume;
      this.droneGain.gain.setTargetAtTime(targetDroneGain, now, 0.08);
    }

    // -----------------------------------------------------------------------
    // MASTER GAIN & TOTAL VOLUME METRIC
    // -----------------------------------------------------------------------
    if (this.masterGain) {
      const targetMaster = 1.0;
      this.masterGain.gain.setTargetAtTime(targetMaster, now, 0.05);
    }

    this.currentVolumeNorm = Math.min(1.0, 0.2 + normalizedTemp * 0.5 + ventilationSpeed * 0.3);
  }

  /**
   * Silences audio output smoothly.
   */
  public silence() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    try {
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.12);
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.0001, now, 0.12);
      if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0.0001, now, 0.12);
    } catch {
      // Ignore audio param ramp edge errors
    }
    this.currentVolumeNorm = 0;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initAudio();
    } else {
      this.silence();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.userVolume = Math.max(0.0, Math.min(1.0, vol));
  }

  public getVolume(): number {
    return this.userVolume;
  }

  public destroy() {
    this.isDestroyed = true;
    this.silence();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
    }
    this.ctx = null;
    this.isInitialized = false;
  }
}

// Singleton audio engine instance for immediate response
export const flameAudio = new FlameAudioEngine();
