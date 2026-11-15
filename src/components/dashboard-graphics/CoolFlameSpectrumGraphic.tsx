/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CoolFlameSpectrumGraphic.tsx
 * An interactive optical radiometer graphic demonstrating the famous NASA FLEX "Cool Flame"
 * phenomenon. Explains why microgravity cool flames burn invisibly to human vision
 * while radiating intense mid-infrared thermal energy.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Radio, Sparkles, Thermometer, Info } from 'lucide-react';

export const CoolFlameSpectrumGraphic: React.FC = () => {
  const [visionMode, setVisionMode] = useState<'human' | 'infrared'>('human');
  const [wavelengthNm, setWavelengthNm] = useState<number>(550); // 300 to 3500 nm

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.32;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Divider between visualizer (left) and spectrum graph (right)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, 10);
      ctx.lineTo(w * 0.62, h - 10);
      ctx.stroke();

      // =========================================================================
      // LEFT SIDE: FLAME SENSOR VIEWPORT
      // =========================================================================
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(15, 15, w * 0.58, h - 30);
      ctx.setLineDash([]);

      // Droplet burner post
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 6, cy + 25, 12, 35);
      // Droplet (fuel n-heptane)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx, cy + 24, 4, 0, Math.PI * 2);
      ctx.fill();

      // Flame rendering based on Vision Mode
      if (visionMode === 'human') {
        // Human eye (400-700nm): PITCH DARK / INVISIBLE!
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('NO VISIBLE EMISSION', cx - 55, cy - 40);
        ctx.fillText('[INVISIBLE TO HUMAN EYE]', cx - 65, cy + 50);

        // Subtle cold ghost ring
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Infrared Radiometer Mode (Thermal Imaging): GLOWING 750K EMISSION!
        const pulse = Math.sin(time * 4) * 2;
        const irGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 45 + pulse);
        irGrad.addColorStop(0, '#ffffff');
        irGrad.addColorStop(0.2, '#38bdf8');
        irGrad.addColorStop(0.6, '#6366f1');
        irGrad.addColorStop(0.85, 'rgba(168, 85, 247, 0.4)');
        irGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = irGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 45 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Radiometer thermal contours
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 26 + pulse * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('RADIOMETER DETECTED: ~750 K', cx - 75, cy - 48);
        ctx.fillStyle = '#c084fc';
        ctx.fillText('QUASI-STEADY COOL FLAME', cx - 65, cy + 55);
      }

      // =========================================================================
      // RIGHT SIDE: SPECTRAL EMISSION CURVE (UV to IR)
      // =========================================================================
      const gx = w * 0.65;
      const gy = 25;
      const gw = w * 0.32;
      const gh = h - 55;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('SPECTRAL RADIANCE (W/sr·m²)', gx, gy);

      // Spectrum coordinate axes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh);
      ctx.lineTo(gx + gw, gy + gh);
      ctx.moveTo(gx, gy + 12);
      ctx.lineTo(gx, gy + gh);
      ctx.stroke();

      // Wavelength zone bands
      // UV: 300-400nm (left 15%)
      // Visible: 400-700nm (15% - 40%)
      // Infrared: 700-3500nm (40% - 100%)
      const visStart = gx + gw * 0.15;
      const visEnd = gx + gw * 0.42;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.fillRect(visStart, gy + 12, visEnd - visStart, gh - 12);

      ctx.fillStyle = '#475569';
      ctx.font = '8px monospace';
      ctx.fillText('UV', gx + 4, gy + gh - 4);
      ctx.fillText('VIS', visStart + 8, gy + gh - 4);
      ctx.fillText('INFRARED (2-5μm)', visEnd + 14, gy + gh - 4);

      // Draw spectral emission curve
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= gw; px += 2) {
        const normX = px / gw;
        // Peak is in Mid-IR (normX ~ 0.75), very near zero in visible (0.15 - 0.4)
        let emission = 0;
        if (normX > 0.4) {
          emission = Math.exp(-Math.pow((normX - 0.72) / 0.18, 2)) * (gh * 0.7);
        } else if (normX < 0.15) {
          // Tiny UV OH* chemiluminescent spike
          emission = Math.exp(-Math.pow((normX - 0.1) / 0.03, 2)) * (gh * 0.25);
        } else {
          // Zero visible light!
          emission = 2 + Math.sin(time * 3 + px * 0.1) * 1.5;
        }

        const plotY = gy + gh - emission - 8;
        if (px === 0) ctx.moveTo(gx + px, plotY);
        else ctx.lineTo(gx + px, plotY);
      }
      ctx.stroke();

      // Current wavelength marker line
      const markerNorm = (wavelengthNm - 300) / (3500 - 300);
      const markerX = gx + markerNorm * gw;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(markerX, gy + 12);
      ctx.lineTo(markerX, gy + gh);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '8px monospace';
      ctx.fillText(`λ=${wavelengthNm}nm`, markerX - 18, gy + 10);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [visionMode, wavelengthNm]);

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 shadow-xl flex flex-col gap-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            NASA FLEX Radiometer: The Invisible "Cool Flame" Hazard
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => {
              setVisionMode('human');
              setWavelengthNm(550);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              visionMode === 'human'
                ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Human Eye View (Invisible)</span>
          </button>
          <button
            onClick={() => {
              setVisionMode('infrared');
              setWavelengthNm(2700);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              visionMode === 'infrared'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/25'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Infrared Imager (750K Revealed)</span>
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative w-full h-[220px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={220}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Interactive slider & takeaway */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">Wavelength λ:</span>
          <input
            type="range"
            min="300"
            max="3500"
            step="25"
            value={wavelengthNm}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setWavelengthNm(val);
              if (val >= 400 && val <= 700) setVisionMode('human');
              else if (val > 800) setVisionMode('infrared');
            }}
            className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[11px] font-bold text-purple-300 min-w-[50px]">{wavelengthNm} nm</span>
        </div>

        <div className="text-[11px] text-slate-300 bg-purple-950/30 border border-purple-800/40 px-3 py-1.5 rounded-xl w-full sm:w-1/2">
          {visionMode === 'human' ? (
            <span className="text-amber-300">
              ⚠️ In 400-700nm band, zero soot glows. The flame is burning at 750K without any visible light!
            </span>
          ) : (
            <span className="text-cyan-300">
              ✓ Mid-IR sensor reveals low-temperature quasi-steady reaction zone surrounding the fuel droplet.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
