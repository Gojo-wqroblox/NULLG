/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ZeroGMorphFlameGraphic.tsx
 * An interactive, animated visual graphic demonstrating how flames physically morph
 * between Zero-Gravity (0-G spherical diffusion) and Normal Gravity (1-G buoyant chimney).
 * Includes interactive sliders, real-time particle convection, chemiluminescence contours,
 * and aerodynamic streamlines.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Flame, Wind, Sliders, Play, RotateCcw, Sparkles, Layers, Info } from 'lucide-react';

interface ZeroGMorphFlameGraphicProps {
  initialGravity?: number;
  initialVentilation?: number;
}

export const ZeroGMorphFlameGraphic: React.FC<ZeroGMorphFlameGraphicProps> = ({
  initialGravity = 0.0,
  initialVentilation = 0.15,
}) => {
  const [gravity, setGravity] = useState<number>(initialGravity);
  const [ventilation, setVentilation] = useState<number>(initialVentilation);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [showChemiluminescence, setShowChemiluminescence] = useState<boolean>(true);
  const [showSootZone, setShowSootZone] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Particles for convection & soot dynamics
  const particlesRef = useRef<
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    // Initialize particles
    particlesRef.current = Array.from({ length: 45 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height / 2 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      life: Math.random() * 80,
      maxLife: 60 + Math.random() * 40,
      size: 1 + Math.random() * 2.5,
      color: Math.random() > 0.4 ? '#38bdf8' : '#fb923c',
      alpha: 0.8,
    }));

    const render = () => {
      time += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 + 10;

      ctx.clearRect(0, 0, w, h);

      // 1. Background grid with aerospace coordinate marks
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center burner coordinate reticle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Streamlines (forced airflow vs buoyant convection)
      if (showStreamlines) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 1.2;
        const streamlineCount = 8;
        for (let i = 0; i < streamlineCount; i++) {
          const offsetX = (i - streamlineCount / 2 + 0.5) * 28;
          ctx.beginPath();
          const startX = cx + offsetX;
          const startY = cy + 70;
          ctx.moveTo(startX, startY);

          // Buoyant curvature pulls inward and upward based on gravity
          const buoyantPull = gravity * 45;
          const ventShift = ventilation * 40;
          const midX = startX + (Math.sin(time + i) * 3) + ventShift * 0.3;
          const midY = cy - 20;
          const endX = cx + (offsetX * (1 / (1 + gravity * 1.5))) + ventShift;
          const endY = cy - 80 - buoyantPull;

          ctx.quadraticCurveTo(midX, midY, endX, endY);
          ctx.stroke();

          // Streamline arrow dots
          const dotProg = ((time * 0.8 + i / streamlineCount) % 1);
          const dotX = (1 - dotProg) * (1 - dotProg) * startX + 2 * (1 - dotProg) * dotProg * midX + dotProg * dotProg * endX;
          const dotY = (1 - dotProg) * (1 - dotProg) * startY + 2 * (1 - dotProg) * dotProg * midY + dotProg * dotProg * endY;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Flame Morphology Geometry Calculations
      // At 0-G: perfect sphere (rx ~ ry, elongation ~ 0)
      // At 1-G: teardrop (ry stretched upward, top tapered)
      const baseRadius = 38;
      const elongation = gravity * 38; // Stretches upward
      const flicker = Math.sin(time * 6) * (1 + gravity * 3);
      const ventLean = ventilation * 25;

      // Outer Chemiluminescent Blue Mantle (OH* emission at 308nm)
      if (showChemiluminescence) {
        ctx.save();
        const blueGrad = ctx.createRadialGradient(
          cx + ventLean * 0.5,
          cy - elongation * 0.4,
          baseRadius * 0.2,
          cx + ventLean * 0.5,
          cy - elongation * 0.3,
          baseRadius * 1.5 + flicker * 0.5
        );
        blueGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
        blueGrad.addColorStop(0.5, 'rgba(37, 99, 235, 0.35)');
        blueGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.7)');
        blueGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

        ctx.fillStyle = blueGrad;
        ctx.beginPath();

        if (gravity < 0.2) {
          // Microgravity: Pure Spherical Diffusion Shell
          ctx.arc(cx + ventLean * 0.3, cy, baseRadius * 1.25, 0, Math.PI * 2);
        } else {
          // Gravity: Teardrop Contour
          ctx.moveTo(cx - baseRadius * 1.1 + ventLean * 0.1, cy);
          ctx.bezierCurveTo(
            cx - baseRadius * 1.2,
            cy - elongation * 0.7,
            cx - baseRadius * 0.3 + ventLean,
            cy - elongation * 1.8 - flicker,
            cx + ventLean,
            cy - elongation * 2.1 - flicker
          );
          ctx.bezierCurveTo(
            cx + baseRadius * 0.3 + ventLean,
            cy - elongation * 1.8 - flicker,
            cx + baseRadius * 1.2,
            cy - elongation * 0.7,
            cx + baseRadius * 1.1 + ventLean * 0.1,
            cy
          );
          ctx.bezierCurveTo(
            cx + baseRadius * 0.9,
            cy + baseRadius * 0.9,
            cx - baseRadius * 0.9,
            cy + baseRadius * 0.9,
            cx - baseRadius * 1.1 + ventLean * 0.1,
            cy
          );
        }
        ctx.fill();
        ctx.restore();
      }

      // Inner Luminous Core / Soot Incandescence (Amber/Orange)
      if (showSootZone) {
        ctx.save();
        const coreGrad = ctx.createRadialGradient(
          cx + ventLean * 0.4,
          cy - elongation * 0.2,
          2,
          cx + ventLean * 0.4,
          cy - elongation * 0.3,
          baseRadius * (0.5 + gravity * 0.3)
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.2, '#fef08a');
        coreGrad.addColorStop(0.5, '#f97316');
        coreGrad.addColorStop(0.8, '#ea580c');
        coreGrad.addColorStop(1, 'rgba(194, 65, 12, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        if (gravity < 0.2) {
          // In 0-G, core is a quiet small golden/soot bead
          ctx.arc(cx + ventLean * 0.2, cy, baseRadius * 0.6, 0, Math.PI * 2);
        } else {
          // In 1-G, luminous yellow buoyant tongue
          ctx.moveTo(cx - baseRadius * 0.6, cy);
          ctx.bezierCurveTo(
            cx - baseRadius * 0.7,
            cy - elongation * 0.5,
            cx - baseRadius * 0.2 + ventLean,
            cy - elongation * 1.3 - flicker * 0.7,
            cx + ventLean,
            cy - elongation * 1.5 - flicker * 0.8
          );
          ctx.bezierCurveTo(
            cx + baseRadius * 0.2 + ventLean,
            cy - elongation * 1.3 - flicker * 0.7,
            cx + baseRadius * 0.7,
            cy - elongation * 0.5,
            cx + baseRadius * 0.6,
            cy
          );
          ctx.bezierCurveTo(
            cx + baseRadius * 0.4,
            cy + baseRadius * 0.4,
            cx - baseRadius * 0.4,
            cy + baseRadius * 0.4,
            cx - baseRadius * 0.6,
            cy
          );
        }
        ctx.fill();
        ctx.restore();
      }

      // 4. Burner Injector Port (Hardware Mount)
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 16, cy + 28, 32, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 12, cy + 24, 24, 4);

      // 5. Update & draw soot/spark particles
      particlesRef.current.forEach((p) => {
        p.life += 1;
        if (p.life > p.maxLife) {
          p.x = cx + (Math.random() - 0.5) * 16;
          p.y = cy + (Math.random() - 0.5) * 8;
          p.life = 0;
          p.size = 1 + Math.random() * 2;
        }

        // Velocity governed by buoyancy (gravity) + ventilation
        p.vy = -0.5 - gravity * 2.5 - Math.random() * 0.5;
        p.vx = (ventilation * 2.5) + (Math.random() - 0.5) * 0.8;
        p.x += p.vx;
        p.y += p.vy;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - lifeRatio);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 6. HUD Measurement Annotations
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`GRAVITY: ${gravity.toFixed(2)} G`, 14, 22);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`AIRFLOW: ${ventilation.toFixed(2)} m/s`, 14, 38);
      ctx.fillText(`REGIME: ${gravity < 0.2 ? 'SPHERICAL DIFFUSION (0-G)' : 'BUOYANT CHIMNEY (1-G+)'}`, 14, 54);

      // Dimension caliper lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      const caliperX = cx + 85;
      const topY = cy - elongation * (gravity < 0.2 ? 0.6 : 1.9);
      const botY = cy + (gravity < 0.2 ? baseRadius * 1.1 : baseRadius * 0.6);

      ctx.beginPath();
      ctx.moveTo(caliperX - 5, topY);
      ctx.lineTo(caliperX + 5, topY);
      ctx.moveTo(caliperX, topY);
      ctx.lineTo(caliperX, botY);
      ctx.moveTo(caliperX - 5, botY);
      ctx.lineTo(caliperX + 5, botY);
      ctx.stroke();

      const heightMm = Math.round(30 + gravity * 55);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`H = ${heightMm} mm`, caliperX + 8, (topY + botY) / 2);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gravity, ventilation, showStreamlines, showChemiluminescence, showSootZone]);

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 shadow-xl flex flex-col gap-3 font-mono">
      {/* Graphic Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Morphology Visualizer: 0-G Sphere vs 1-G Buoyant Flame
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => {
              setGravity(0.0);
              setVentilation(0.15);
            }}
            className={`px-2 py-0.5 rounded border transition-all ${
              gravity === 0
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            0-G ISS Space
          </button>
          <button
            onClick={() => {
              setGravity(1.0);
              setVentilation(0.0);
            }}
            className={`px-2 py-0.5 rounded border transition-all ${
              gravity === 1
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            1-G Earth Normal
          </button>
          <button
            onClick={() => {
              setGravity(4.0);
              setVentilation(0.3);
            }}
            className={`px-2 py-0.5 rounded border transition-all ${
              gravity >= 4
                ? 'bg-rose-500 text-white font-bold border-rose-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Hypergravity (4-G)
          </button>
        </div>
      </div>

      {/* Canvas Display Viewport */}
      <div className="relative w-full h-[240px] rounded-xl bg-gradient-to-b from-[#020617] to-[#070e1e] border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={240}
          className="w-full h-full object-contain"
        />

        {/* Overlay physics badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800/90 text-[10px] text-slate-400 backdrop-blur-sm pointer-events-none">
          {gravity < 0.2 ? (
            <span className="text-cyan-300 font-bold">● Pure Diffusion Mantle • No Buoyancy</span>
          ) : (
            <span className="text-amber-300 font-bold">▲ Natural Convection Plume • Buoyancy Active</span>
          )}
        </div>
      </div>

      {/* Interactive Controls & Layer Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        {/* Sliders */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Modulate Gravity:</span>
            <span className="font-bold text-cyan-400">{gravity.toFixed(2)} G</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="0.05"
            value={gravity}
            onChange={(e) => setGravity(parseFloat(e.target.value))}
            className="accent-cyan-400 cursor-pointer w-full h-1.5 bg-slate-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Modulate Ventilation:</span>
            <span className="font-bold text-cyan-400">{ventilation.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={ventilation}
            onChange={(e) => setVentilation(parseFloat(e.target.value))}
            className="accent-cyan-400 cursor-pointer w-full h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-col justify-between gap-1.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diagnostic Visual Layers:</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showStreamlines}
                onChange={(e) => setShowStreamlines(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>Streamlines</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300 hover:text-white">
              <input
                type="checkbox"
                checked={showChemiluminescence}
                onChange={(e) => setShowChemiluminescence(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>Blue OH* Mantle</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-white">
              <input
                type="checkbox"
                checked={showSootZone}
                onChange={(e) => setShowSootZone(e.target.checked)}
                className="accent-amber-400"
              />
              <span>Soot Zone</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
