/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Web Audio API synthesizer for subtle Space Station Habitat Ambient acoustics.
 * Produces:
 * 1. Background Rack & Avionics Equipment Hum (54 Hz + 60 Hz warm sub-harmonics + 120 Hz soft inverter tone)
 * 2. Distant Low-Frequency Atmospheric Fluctuations (brownian-filtered noise modulated by dual slow LFOs at 0.07 Hz & 0.16 Hz)
 * Designed to sit gently behind the simulation without fatigue and crossfade cleanly on tab switches.
 */

class SpaceStationAmbientEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;

  // Audio Graph Nodes
  private masterGain: GainNode | null = null;
  private hullOscA: OscillatorNode | null = null;
  private hullOscB: OscillatorNode | null = null;
  private inverterOsc: OscillatorNode | null = null;
  private hullFilter: BiquadFilterNode | null = null;

  private atmosNoise: AudioBufferSourceNode | null = null;
  private atmosFilter: BiquadFilterNode | null = null;
  private atmosGain: GainNode | null = null;

  private slowLfoA: OscillatorNode | null = null;
  private slowLfoAGain: GainNode | null = null;
  private slowLfoB: OscillatorNode | null = null;
  private slowLfoBGain: GainNode | null = null;

  private stopTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Resumes AudioContext cleanly on any user gesture if browser autoplay suspended it.
   */
  public resumeIfNeeded(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Starts the Space Station Ambient bed with a gentle 0.8s fade-in.
   */
  public start(pressureKpa: number = 101.3): void {
    if (this.isMuted) return;

    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    if (this.isPlaying) {
      this.resumeIfNeeded();
      this.updateAtmosphere(pressureKpa);
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gentle ambient gain (intentionally subtle background bed)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.085, now + 0.8);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    // =========================================================================
    // 1. DISTANT EQUIPMENT & RACK TRANSFORMER HUM (Warm Filtered Low-End)
    // =========================================================================
    const hullFilter = ctx.createBiquadFilter();
    hullFilter.type = 'lowpass';
    hullFilter.frequency.setValueAtTime(145, now);
    hullFilter.Q.setValueAtTime(0.9, now);
    hullFilter.connect(masterGain);
    this.hullFilter = hullFilter;

    const hullOscA = ctx.createOscillator();
    hullOscA.type = 'sine';
    hullOscA.frequency.setValueAtTime(54, now);
    const gainA = ctx.createGain();
    gainA.gain.setValueAtTime(0.28, now);
    hullOscA.connect(gainA);
    gainA.connect(hullFilter);

    const hullOscB = ctx.createOscillator();
    hullOscB.type = 'triangle';
    hullOscB.frequency.setValueAtTime(60.4, now); // Subtle 6.4 Hz slow acoustic beat
    const gainB = ctx.createGain();
    gainB.gain.setValueAtTime(0.12, now);
    hullOscB.connect(gainB);
    gainB.connect(hullFilter);

    const inverterOsc = ctx.createOscillator();
    inverterOsc.type = 'sine';
    inverterOsc.frequency.setValueAtTime(120.2, now); // Quiet ISS avionics power supply overtone
    const gainInv = ctx.createGain();
    gainInv.gain.setValueAtTime(0.04, now);
    inverterOsc.connect(gainInv);
    gainInv.connect(hullFilter);

    // =========================================================================
    // 2. LOW-FREQUENCY ATMOSPHERIC FLUCTUATIONS (Brownian Noise + Dual LFOs)
    // =========================================================================
    const durationSec = 4.0;
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const brownBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = brownBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.015 * white) / 1.015;
      data[i] = Math.max(-1, Math.min(1, lastOut * 2.8));
    }

    const atmosNoise = ctx.createBufferSource();
    atmosNoise.buffer = brownBuffer;
    atmosNoise.loop = true;

    const atmosFilter = ctx.createBiquadFilter();
    atmosFilter.type = 'lowpass';
    atmosFilter.frequency.setValueAtTime(this.calcAtmosCutoff(pressureKpa), now);
    atmosFilter.Q.setValueAtTime(1.4, now);
    this.atmosFilter = atmosFilter;

    const atmosGain = ctx.createGain();
    atmosGain.gain.setValueAtTime(0.26, now);
    this.atmosGain = atmosGain;

    atmosNoise.connect(atmosFilter);
    atmosFilter.connect(atmosGain);
    atmosGain.connect(masterGain);

    // Slow LFO A (0.07 Hz ~14s drift modulating filter cutoff for distant cabin circulation swells)
    const slowLfoA = ctx.createOscillator();
    slowLfoA.type = 'sine';
    slowLfoA.frequency.setValueAtTime(0.07, now);
    const slowLfoAGain = ctx.createGain();
    slowLfoAGain.gain.setValueAtTime(55, now);
    slowLfoA.connect(slowLfoAGain);
    slowLfoAGain.connect(atmosFilter.frequency);

    // Slow LFO B (0.16 Hz ~6.2s breath modulating background volume gently)
    const slowLfoB = ctx.createOscillator();
    slowLfoB.type = 'sine';
    slowLfoB.frequency.setValueAtTime(0.16, now);
    const slowLfoBGain = ctx.createGain();
    slowLfoBGain.gain.setValueAtTime(0.055, now);
    slowLfoB.connect(slowLfoBGain);
    slowLfoBGain.connect(atmosGain.gain);

    hullOscA.start(now);
    hullOscB.start(now);
    inverterOsc.start(now);
    atmosNoise.start(now);
    slowLfoA.start(now);
    slowLfoB.start(now);

    this.hullOscA = hullOscA;
    this.hullOscB = hullOscB;
    this.inverterOsc = inverterOsc;
    this.atmosNoise = atmosNoise;
    this.slowLfoA = slowLfoA;
    this.slowLfoAGain = slowLfoAGain;
    this.slowLfoB = slowLfoB;
    this.slowLfoBGain = slowLfoBGain;

    this.isPlaying = true;
  }

  /**
   * Modulates ambient atmospheric density/cutoff cleanly with chamber pressure (kPa).
   */
  public updateAtmosphere(pressureKpa: number): void {
    if (!this.isPlaying || !this.ctx || !this.atmosFilter) return;
    const now = this.ctx.currentTime;
    this.atmosFilter.frequency.setTargetAtTime(this.calcAtmosCutoff(pressureKpa), now, 0.25);
  }

  /**
   * Fades out and tears down the ambient audio nodes cleanly.
   */
  public stop(): void {
    if (!this.isPlaying) return;

    const ctx = this.ctx;
    if (ctx && this.masterGain) {
      const now = ctx.currentTime;
      try {
        this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        // Ignore ramp edge
      }

      this.stopTimeoutId = setTimeout(() => {
        try {
          this.hullOscA?.stop();
          this.hullOscB?.stop();
          this.inverterOsc?.stop();
          this.atmosNoise?.stop();
          this.slowLfoA?.stop();
          this.slowLfoB?.stop();

          this.hullOscA?.disconnect();
          this.hullOscB?.disconnect();
          this.inverterOsc?.disconnect();
          this.hullFilter?.disconnect();
          this.atmosNoise?.disconnect();
          this.atmosFilter?.disconnect();
          this.atmosGain?.disconnect();
          this.slowLfoA?.disconnect();
          this.slowLfoAGain?.disconnect();
          this.slowLfoB?.disconnect();
          this.slowLfoBGain?.disconnect();
          this.masterGain?.disconnect();
        } catch {
          // Ignore teardown errors
        }

        this.hullOscA = null;
        this.hullOscB = null;
        this.inverterOsc = null;
        this.hullFilter = null;
        this.atmosNoise = null;
        this.atmosFilter = null;
        this.atmosGain = null;
        this.slowLfoA = null;
        this.slowLfoAGain = null;
        this.slowLfoB = null;
        this.slowLfoBGain = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.stopTimeoutId = null;
      }, 380);
    } else {
      this.isPlaying = false;
    }
  }

  public setMuted(muted: boolean, pressureKpa: number = 101.3): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    } else {
      this.start(pressureKpa);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private calcAtmosCutoff(pressureKpa: number): number {
    // Low pressure thins atmospheric resonance; high pressure deepens low-end body
    const clamped = Math.max(20, Math.min(250, pressureKpa));
    return 115 + (clamped / 101.3) * 85;
  }
}

export const spaceStationAmbient = new SpaceStationAmbientEngine();
