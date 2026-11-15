/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AudioOscilloscopeGraphic.tsx
 * An interactive CRT-style phosphorescent audio oscilloscope & spectrum analyzer graphic.
 * Visualizes the Web Audio API ventilation hum harmonics (45 Hz to 240 Hz) and emergency siren alarms.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Activity, Radio, Sliders, Siren } from 'lucide-react';

interface AudioOscilloscopeGraphicProps {
  onTestSiren?: () => void;
}

export const AudioOscilloscopeGraphic: React.FC<AudioOscilloscopeGraphicProps> = ({
  onTestSiren,
}) => {
  const [ventSpeed, setVentSpeed] = useState<number>(0.15); // 0 to 1.5 m/s
  const [signalType, setSignalType] = useState<'hum' | 'siren' | 'sweep'>('hum');
  const [isAudible, setIsAudible] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Derived fundamental frequency
  const fundamentalFreqHz = Math.round(45 + Math.min(ventSpeed, 1.5) * 195);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // CRT Phosphor Background
      ctx.fillStyle = '#020d0b';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope Grid Reticle (Green/Cyan tint)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      const divX = 35;
      const divY = 25;
      for (let x = 0; x < w; x += divX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += divY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center crosshair axes
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Oscilloscope Waveform Path
      ctx.strokeStyle = signalType === 'siren' ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = signalType === 'siren' ? '#ef4444' : '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const freqMultiplier = (fundamentalFreqHz / 45) * 1.5;

      for (let x = 0; x < w; x += 2) {
        let waveY = cy;
        if (signalType === 'hum') {
          // Fundamental sine + 2nd and 3rd harmonic hum
          const t1 = (x * 0.04 * freqMultiplier) + time * 3;
          const harmonic1 = Math.sin(t1) * 32;
          const harmonic2 = Math.sin(t1 * 2) * 12;
          const harmonic3 = Math.sin(t1 * 3) * 5;
          waveY = cy + harmonic1 + harmonic2 + harmonic3;
        } else if (signalType === 'siren') {
          // Sweeping dual-oscillator siren modulation
          const sweepFreq = Math.sin(time * 2) * 1.5 + 2.5;
          const t1 = (x * 0.03 * sweepFreq) + time * 6;
          const sirenWave = Math.sin(t1) * 45;
          waveY = cy + sirenWave;
        } else {
          // Fast frequency sweep
          const chirp = (x / w) * 6;
          waveY = cy + Math.sin((x * 0.05 * chirp) + time * 4) * 36;
        }

        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Real-time FFT Frequency Spectrum Bars (Bottom Right)
      const barCount = 18;
      const barW = 6;
      const barGap = 3;
      const barBaseX = w - (barCount * (barW + barGap)) - 14;
      const barBaseY = h - 14;

      for (let i = 0; i < barCount; i++) {
        // Height proportional to harmonic distribution
        const barHeight = Math.abs(
          Math.sin(time * 4 + i * 0.4) * (20 + (i === 3 ? 35 : 15) * (fundamentalFreqHz / 120))
        );
        ctx.fillStyle = signalType === 'siren' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(52, 211, 153, 0.7)';
        ctx.fillRect(barBaseX + i * (barW + barGap), barBaseY - barHeight, barW, barHeight);
      }

      // Telemetry Text HUD
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = signalType === 'siren' ? '#f87171' : '#34d399';
      ctx.fillText(`FUNDAMENTAL: ~${fundamentalFreqHz} Hz`, 14, 22);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`SIGNAL: ${signalType.toUpperCase()} MODE • OSC-1`, 14, 38);
      ctx.fillText(`CHAMBER AIRFLOW: ${ventSpeed.toFixed(2)} m/s`, 14, 54);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [ventSpeed, signalType, fundamentalFreqHz]);

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 shadow-xl flex flex-col gap-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Oscilloscope: Acoustic Ventilation Hum & Siren Harmonics
          </h4>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setSignalType('hum')}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
              signalType === 'hum'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Ventilation Hum
          </button>
          <button
            onClick={() => setSignalType('siren')}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
              signalType === 'siren'
                ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Siren Alarm
          </button>
          {onTestSiren && (
            <button
              onClick={onTestSiren}
              className="px-2.5 py-1 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/50 text-red-300 text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <Siren className="w-3 h-3 text-red-400 animate-pulse" />
              <span>Audible Klaxon</span>
            </button>
          )}
        </div>
      </div>

      {/* CRT Display Viewport */}
      <div className="relative w-full h-[220px] rounded-xl bg-black border border-emerald-950 overflow-hidden flex items-center justify-center shadow-inner">
        <canvas
          ref={canvasRef}
          width={520}
          height={220}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 right-2 text-[9px] text-emerald-500/80">
          DSP SYNTHESIZER • 48 kHz SAMPLING
        </div>
      </div>

      {/* Speed Slider */}
      <div className="flex items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-2 w-full sm:w-2/3">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">Ventilation Pitch:</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={ventSpeed}
            onChange={(e) => setVentSpeed(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[11px] font-bold text-emerald-300 min-w-[70px]">
            {ventSpeed.toFixed(2)} m/s ({fundamentalFreqHz} Hz)
          </span>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300">[A]</kbd> in app to toggle hum audio.
        </div>
      </div>
    </div>
  );
};
