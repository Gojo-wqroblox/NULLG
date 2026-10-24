/**
 * Web Audio API synthesizer for NASA Spacecraft Emergency Procedures
 * Synthesizes alarm klaxons, gas discharge hisses, and confirmation chimes directly in browser without external sound files.
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setEmergencyAudioMuted(muted: boolean) {
  isMuted = muted;
}

export function isEmergencyAudioMuted(): boolean {
  return isMuted;
}

/**
 * Play High-Power Emergency Siren (Very loud sweeping spacecraft warning siren)
 */
export function playKlaxonAlarm() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 2.2;

  // Dynamics compressor to push volume to maximum loudness without clipping
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-6, now);
  compressor.knee.setValueAtTime(3, now);
  compressor.ratio.setValueAtTime(14, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.15, now);
  compressor.connect(ctx.destination);

  // Master Gain - very loud
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.72, now);
  masterGain.gain.setValueAtTime(0.72, now + duration - 0.25);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  masterGain.connect(compressor);

  // Oscillator 1: Primary piercing sawtooth horn
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';

  // Oscillator 2: Slightly detuned secondary siren horn for wide multi-tone acoustic wail
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.detune.setValueAtTime(16, now); // +16 cents detuning

  // Oscillator 3: Sub-horn square wave for mechanical bass punch
  const osc3 = ctx.createOscillator();
  osc3.type = 'square';
  const osc3Gain = ctx.createGain();
  osc3Gain.gain.setValueAtTime(0.25, now);
  osc3.connect(osc3Gain);

  // Sweeping siren pitch automation (3 rising & falling wailing cycles)
  // Cycle 1 (0 to 0.70s)
  osc1.frequency.setValueAtTime(520, now);
  osc1.frequency.exponentialRampToValueAtTime(1280, now + 0.35);
  osc1.frequency.exponentialRampToValueAtTime(620, now + 0.70);

  // Cycle 2 (0.70s to 1.40s)
  osc1.frequency.exponentialRampToValueAtTime(1420, now + 1.05);
  osc1.frequency.exponentialRampToValueAtTime(580, now + 1.40);

  // Cycle 3 (1.40s to 2.15s)
  osc1.frequency.exponentialRampToValueAtTime(1320, now + 1.75);
  osc1.frequency.exponentialRampToValueAtTime(460, now + 2.15);

  // Sync Osc2
  osc2.frequency.setValueAtTime(520, now);
  osc2.frequency.exponentialRampToValueAtTime(1280, now + 0.35);
  osc2.frequency.exponentialRampToValueAtTime(620, now + 0.70);
  osc2.frequency.exponentialRampToValueAtTime(1420, now + 1.05);
  osc2.frequency.exponentialRampToValueAtTime(580, now + 1.40);
  osc2.frequency.exponentialRampToValueAtTime(1320, now + 1.75);
  osc2.frequency.exponentialRampToValueAtTime(460, now + 2.15);

  // Sync Osc3 (sub octave)
  osc3.frequency.setValueAtTime(260, now);
  osc3.frequency.exponentialRampToValueAtTime(640, now + 0.35);
  osc3.frequency.exponentialRampToValueAtTime(310, now + 0.70);
  osc3.frequency.exponentialRampToValueAtTime(710, now + 1.05);
  osc3.frequency.exponentialRampToValueAtTime(290, now + 1.40);
  osc3.frequency.exponentialRampToValueAtTime(660, now + 1.75);
  osc3.frequency.exponentialRampToValueAtTime(230, now + 2.15);

  // Horn acoustic filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3200, now);
  filter.Q.setValueAtTime(2.2, now);

  osc1.connect(filter);
  osc2.connect(filter);
  osc3Gain.connect(filter);
  filter.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  osc1.stop(now + duration);
  osc2.stop(now + duration);
  osc3.stop(now + duration);
}

/**
 * Play High-Pressure Suppressant Gas Discharge Hiss
 */
export function playGasDischargeHiss() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 0.8;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate shaped white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
}

/**
 * Play Mission Success / Fire Suppressed Chime
 */
export function playSuccessChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.15, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.45);
  });
}

/**
 * Play Failure / Explosion Warning Buzz
 */
export function playFailureBuzz() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.4);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}
