/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SpacecraftModuleCutawayGraphic.tsx
 * An interactive, animated cutaway schematic of an ISS pressurized module (e.g. Destiny / Columbus).
 * Allows users to visually test and observe:
 * - Overhead ventilation duct airflow & motorized isolation dampers
 * - Electrical avionics rack fire with live spark particles
 * - CO2 gas flood vs Water Mist injection animations
 * - Post-fire TCCS atmospheric scrubber recirculation
 */

import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Zap, Wind, Power, CheckCircle2, RotateCcw, AlertTriangle, Radio } from 'lucide-react';

export const SpacecraftModuleCutawayGraphic: React.FC = () => {
  const [ventDamperClosed, setVentDamperClosed] = useState<boolean>(false);
  const [powerCut, setPowerCut] = useState<boolean>(false);
  const [activeAgent, setActiveAgent] = useState<'none' | 'co2' | 'mist' | 'nitrogen'>('none');
  const [scrubberActive, setScrubberActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Particles for smoke, airflow, and suppression gas
  const gasParticles = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
      alpha: number;
    }>
  >([]);

  // Simulation parameters derived from state
  const isFireSuppressed = ventDamperClosed && (activeAgent === 'co2' || activeAgent === 'nitrogen');
  const oxygenPct = ventDamperClosed
    ? activeAgent === 'co2'
      ? 14.2
      : activeAgent === 'nitrogen'
      ? 11.8
      : 18.5
    : 20.9;
  const rackTempC = isFireSuppressed ? 38 : powerCut ? 140 : 385;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.035;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Module Hull Outline (Curved cylindrical ISS pressure shell)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Metallic hull ribs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 40; x < w - 40; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - 20);
        ctx.stroke();
      }

      // Curved module outer boundary
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(30, 20, w - 60, h - 40);

      // 2. Overhead Ventilation Duct (Top horizontal channel)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 25, w - 80, 26);
      ctx.strokeStyle = ventDamperClosed ? '#ef4444' : '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 25, w - 80, 26);

      // Duct Airflow Arrow Flow (if damper open)
      if (!ventDamperClosed) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.font = '10px monospace';
        const flowShift = (time * 40) % 60;
        for (let x = 60 + flowShift; x < w - 100; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 34);
          ctx.lineTo(x + 10, 38);
          ctx.lineTo(x, 42);
          ctx.fill();
        }
      }

      // Motorized Damper Valve
      ctx.fillStyle = ventDamperClosed ? '#ef4444' : '#22c55e';
      ctx.fillRect(w - 110, 27, 8, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText(ventDamperClosed ? 'DAMPER: SHUT' : 'DAMPER: OPEN', w - 190, 41);

      // 3. Avionics Racks Array (Left, Center, Right)
      const racks = [
        { label: 'RACK 1: LIFE SUPPORT', x: 60, isFire: false },
        { label: 'RACK 2: AVIONICS & POWER', x: 200, isFire: true },
        { label: 'RACK 3: SCIENCE GLOVEBOX', x: 340, isFire: false },
      ];

      racks.forEach((rack) => {
        const rw = 120;
        const rh = 130;
        const ry = h - 165;

        // Rack casing
        ctx.fillStyle = rack.isFire ? '#1e1b2e' : '#111827';
        ctx.fillRect(rack.x, ry, rw, rh);
        ctx.strokeStyle = rack.isFire && !isFireSuppressed ? '#ef4444' : '#334155';
        ctx.lineWidth = rack.isFire && !isFireSuppressed ? 2 : 1;
        ctx.strokeRect(rack.x, ry, rw, rh);

        // Rack header label
        ctx.fillStyle = rack.isFire ? '#f87171' : '#94a3b8';
        ctx.font = '8px monospace';
        ctx.fillText(rack.label, rack.x + 6, ry + 14);

        // Status LEDs
        for (let led = 0; led < 4; led++) {
          ctx.fillStyle = rack.isFire && !powerCut
            ? Math.random() > 0.3 ? '#ef4444' : '#fbbf24'
            : powerCut && rack.isFire
            ? '#475569'
            : '#22c55e';
          ctx.beginPath();
          ctx.arc(rack.x + 14 + led * 16, ry + 26, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Circuit slots
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let slot = 0; slot < 5; slot++) {
          ctx.strokeRect(rack.x + 8, ry + 36 + slot * 16, rw - 16, 10);
        }

        // Active Fire in Rack 2
        if (rack.isFire && !isFireSuppressed) {
          const fx = rack.x + rw / 2;
          const fy = ry + 75;

          // Fire flame glow
          const fireSize = powerCut ? 14 : 24;
          const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, fireSize);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#facc15');
          grad.addColorStop(0.7, '#ea580c');
          grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fx + Math.sin(time * 8) * 2, fy, fireSize, 0, Math.PI * 2);
          ctx.fill();

          // Electrical sparks if power not cut
          if (!powerCut && Math.random() > 0.4) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + (Math.random() - 0.5) * 35, fy + (Math.random() - 0.5) * 35);
            ctx.stroke();
          }
        }
      });

      // 4. Fire Extinguisher Discharge Cloud (CO2 / Mist / Nitrogen)
      if (activeAgent !== 'none') {
        const dischargeX = 260;
        const dischargeY = h - 110;

        ctx.save();
        if (activeAgent === 'co2') {
          // Volumetric dense white/cyan CO2 blanket
          const co2Grad = ctx.createRadialGradient(dischargeX, dischargeY, 5, dischargeX, dischargeY, 65);
          co2Grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          co2Grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
          co2Grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = co2Grad;
          ctx.beginPath();
          ctx.arc(dischargeX, dischargeY, 65 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText('DISCHARGING CO₂ [SMOTHERING]', dischargeX - 65, dischargeY - 70);
        } else if (activeAgent === 'mist') {
          // Fine atomized blue water droplets
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
          for (let m = 0; m < 25; m++) {
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(dischargeX + Math.sin(time + m) * 40, dischargeY + Math.cos(time + m) * 35, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#60a5fa';
          ctx.font = '10px monospace';
          ctx.fillText('WATER MIST SPRAY [LATENT HEAT SINK]', dischargeX - 85, dischargeY - 70);
        }
        ctx.restore();
      }

      // 5. TCCS Scrubbing Recirculation Fan
      if (scrubberActive) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(w - 75, h - 80, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#10b981';
        ctx.font = '8px monospace';
        ctx.fillText('TCCS SCRUBBER: ACTIVE', w - 125, h - 45);
      }

      // 6. Real-Time HUD Status Banner
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(40, h - 35, w - 80, 25);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(40, h - 35, w - 80, 25);

      ctx.font = '9px monospace';
      ctx.fillStyle = isFireSuppressed ? '#34d399' : '#f87171';
      ctx.fillText(
        isFireSuppressed ? 'STATUS: FIRE EXTINGUISHED • RACK STABILIZED' : 'STATUS: ACTIVE COMBATION DRILL',
        52,
        h - 19
      );

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`O₂: ${oxygenPct.toFixed(1)}%`, w - 240, h - 19);
      ctx.fillStyle = rackTempC > 100 ? '#f87171' : '#34d399';
      ctx.fillText(`TEMP: ${rackTempC}°C`, w - 160, h - 19);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [ventDamperClosed, powerCut, activeAgent, scrubberActive, isFireSuppressed, oxygenPct, rackTempC]);

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 shadow-xl flex flex-col gap-3 font-mono">
      {/* Graphic Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Interactive ISS Module Cutaway: Fire Suppression Sequence
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">DESTINY LAB RACK-2 MONITOR</span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[250px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={250}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Interactive Sequence Trigger Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <button
          onClick={() => setVentDamperClosed(!ventDamperClosed)}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            ventDamperClosed
              ? 'bg-rose-950/80 text-rose-300 border-rose-600 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>{ventDamperClosed ? '1. Damper: SHUT' : '1. Shut Ventilation'}</span>
        </button>

        <button
          onClick={() => setPowerCut(!powerCut)}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            powerCut
              ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{powerCut ? '2. Power: DE-ENERGIZED' : '2. Cut Bus Power'}</span>
        </button>

        <button
          onClick={() => setActiveAgent(activeAgent === 'co2' ? 'none' : 'co2')}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeAgent === 'co2'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
          }`}
        >
          <span>{activeAgent === 'co2' ? '3. Discharging CO₂' : '3. Discharge CO₂'}</span>
        </button>

        <button
          onClick={() => setScrubberActive(!scrubberActive)}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            scrubberActive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
        >
          <span>{scrubberActive ? '4. TCCS Active' : '4. Start TCCS Scrub'}</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
        <span>Click steps 1 through 4 in sequence to witness Flight Rule A13-1 in action.</span>
        <button
          onClick={() => {
            setVentDamperClosed(false);
            setPowerCut(false);
            setActiveAgent('none');
            setScrubberActive(false);
          }}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Module State</span>
        </button>
      </div>
    </div>
  );
};
