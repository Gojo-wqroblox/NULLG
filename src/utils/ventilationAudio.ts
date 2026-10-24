/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Web Audio API synthesizer for spacecraft cabin & laboratory ambient ventilation humming.
 * Generates an ambient continuous ventilation hum that dynamically varies in fundamental
 * motor frequency, harmonic resonance, and airflow filter cutoff based on ventilationSpeed.
 */

class VentilationAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;

  // Web Audio Nodes
  private masterGain: GainNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private currentSpeed: number = 0.15;
  private stopTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Start generating the ambient ventilation hum
   */
  public start(initialSpeed: number = 0.15): void {
    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    if (this.isPlaying) {
      this.updateSpeed(initialSpeed);
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.currentSpeed = Math.max(0, initialSpeed);
    const now = ctx.currentTime;

    // Master volume with smooth ramp-in
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.20, now + 0.25);
    this.masterGain.connect(ctx.destination);

    // 1. Primary motor drone (triangle wave provides rich low turbine hum)
    this.motorOsc = ctx.createOscillator();
    this.motorOsc.type = 'triangle';
    const baseFreq = this.calculateMotorFrequency(this.currentSpeed);
    this.motorOsc.frequency.setValueAtTime(baseFreq, now);

    const motorGain = ctx.createGain();
    motorGain.gain.setValueAtTime(0.32, now);
    this.motorOsc.connect(motorGain);
    motorGain.connect(this.masterGain);

    // 2. Sub-bass vibration (simulates structural cabin vibration)
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(Math.max(26, baseFreq * 0.5), now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.22, now);
    this.subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    // 3. Higher overtone (fan blade passing rate)
    this.harmonicOsc = ctx.createOscillator();
    this.harmonicOsc.type = 'sine';
    this.harmonicOsc.frequency.setValueAtTime(baseFreq * 2.25, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.08, now);
    this.harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(this.masterGain);

    // 4. Airflow hiss / ventilation duct rushing sound (filtered white noise loop)
    const noiseLengthSec = 2.0;
    const bufferSize = Math.floor(ctx.sampleRate * noiseLengthSec);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    const filterFreq = this.calculateFilterFrequency(this.currentSpeed);
    this.noiseFilter.frequency.setValueAtTime(filterFreq, now);
    this.noiseFilter.Q.setValueAtTime(1.5, now);

    this.noiseGain = ctx.createGain();
    const noiseVol = this.calculateNoiseVolume(this.currentSpeed);
    this.noiseGain.gain.setValueAtTime(noiseVol, now);

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // 5. Subtle LFO (gentle draft breathing / duct turbulence pulsation)
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(0.35, now); // 0.35 Hz breathing rate

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(0.015, now);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.noiseGain.gain);

    // Start audio sources
    this.motorOsc.start(now);
    this.subOsc.start(now);
    this.harmonicOsc.start(now);
    this.noiseSource.start(now);
    this.lfo.start(now);

    this.isPlaying = true;
  }

  /**
   * Dynamically adjust humming frequency and filter resonance based on ventilationSpeed
   * Uses smooth time constants so slider dragging mimics an electric blower spooling up or down.
   */
  public updateSpeed(speed: number): void {
    this.currentSpeed = Math.max(0, speed);
    if (!this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = this.calculateMotorFrequency(this.currentSpeed);
    const filterFreq = this.calculateFilterFrequency(this.currentSpeed);
    const noiseVol = this.calculateNoiseVolume(this.currentSpeed);

    // Smooth exponential ramp using setTargetAtTime
    if (this.motorOsc) {
      this.motorOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    }
    if (this.subOsc) {
      this.subOsc.frequency.setTargetAtTime(Math.max(26, baseFreq * 0.5), now, 0.08);
    }
    if (this.harmonicOsc) {
      this.harmonicOsc.frequency.setTargetAtTime(baseFreq * 2.25, now, 0.08);
    }
    if (this.noiseFilter) {
      this.noiseFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    }
    if (this.noiseGain) {
      this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.08);
    }
  }

  /**
   * Stop the ventilation humming with a gentle fade-out
   */
  public stop(): void {
    if (!this.isPlaying) return;

    const ctx = this.ctx;
    if (ctx && this.masterGain) {
      const now = ctx.currentTime;
      // Smooth fade-out over 0.2s to prevent audio clicking
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

      this.stopTimeoutId = setTimeout(() => {
        try {
          this.motorOsc?.stop();
          this.subOsc?.stop();
          this.harmonicOsc?.stop();
          this.noiseSource?.stop();
          this.lfo?.stop();

          this.motorOsc?.disconnect();
          this.subOsc?.disconnect();
          this.harmonicOsc?.disconnect();
          this.noiseSource?.disconnect();
          this.noiseFilter?.disconnect();
          this.noiseGain?.disconnect();
          this.lfo?.disconnect();
          this.lfoGain?.disconnect();
          this.masterGain?.disconnect();
        } catch {
          // Ignore cleanup errors
        }

        this.motorOsc = null;
        this.subOsc = null;
        this.harmonicOsc = null;
        this.noiseSource = null;
        this.noiseFilter = null;
        this.noiseGain = null;
        this.lfo = null;
        this.lfoGain = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.stopTimeoutId = null;
      }, 220);
    } else {
      this.isPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Frequency calculation:
   * 0.00 m/s (stagnant/fan stopped): gentle 45 Hz sub-audible idle
   * 0.08 m/s (gentle draft): ~62 Hz
   * 0.15 m/s (standard ISS cabin): ~76 Hz hum
   * 0.40 m/s (duct fan): ~125 Hz
   * 1.00 m/s (max airflow): ~240 Hz
   */
  public calculateMotorFrequency(speed: number): number {
    return Math.round(45 + Math.min(speed, 1.5) * 195);
  }

  private calculateFilterFrequency(speed: number): number {
    return 160 + Math.min(speed, 1.5) * 900;
  }

  private calculateNoiseVolume(speed: number): number {
    return 0.02 + Math.min(speed, 1.5) * 0.14;
  }
}

export const ventilationAudio = new VentilationAudioSynthesizer();
