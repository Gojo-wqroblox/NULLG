/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StationCompartmentRadarGraphic.tsx
 * An animated tactical station module radar graphic showing the ISS cylindrical layout
 * with active emergency sector beacons, smoke dispersion vectors, and module telemetry.
 */

import React, { useRef, useEffect } from 'react';

interface StationCompartmentRadarGraphicProps {
  moduleName: string;
  urgency: 'EXTREME' | 'CRITICAL' | 'ELEVATED' | string;
  fireClass: string;
  tempC: number;
}

export const StationCompartmentRadarGraphic: React.FC<StationCompartmentRadarGraphicProps> = ({
  moduleName,
  urgency,
  fireClass,
  tempC,
}) => {
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
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Radar Sweep background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Circular range rings
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;
      [35, 65, 95].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating Radar Beam Sweep Line
      const sweepAngle = time * 1.5;
      const sweepX = cx + Math.cos(sweepAngle) * 95;
      const sweepY = cy + Math.sin(sweepAngle) * 95;

      const beamGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 95);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 95, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Station modules diagram
      // Central Node 2, Left Destiny Lab, Right Columbus, Top Kibo
      const modules = [
        { name: 'Node 2', x: cx, y: cy, w: 28, h: 28, isIncident: moduleName.includes('Node') },
        { name: 'Destiny', x: cx - 48, y: cy, w: 46, h: 22, isIncident: moduleName.includes('Destiny') },
        { name: 'Columbus', x: cx + 48, y: cy, w: 38, h: 22, isIncident: moduleName.includes('Columbus') },
        { name: 'JEM Kibo', x: cx, y: cy - 42, w: 24, h: 42, isIncident: moduleName.includes('Kibo') },
        { name: 'Airlock', x: cx, y: cy + 40, w: 22, h: 28, isIncident: moduleName.includes('Airlock') },
      ];

      // Draw module cylinders
      modules.forEach((mod) => {
        const isHazard = mod.isIncident;

        ctx.fillStyle = isHazard ? '#1f1322' : '#0f172a';
        ctx.fillRect(mod.x - mod.w / 2, mod.y - mod.h / 2, mod.w, mod.h);

        ctx.strokeStyle = isHazard ? '#f43f5e' : '#334155';
        ctx.lineWidth = isHazard ? 1.8 : 1;
        ctx.strokeRect(mod.x - mod.w / 2, mod.y - mod.h / 2, mod.w, mod.h);

        // Incident Flashing Beacon
        if (isHazard) {
          const pulse = Math.abs(Math.sin(time * 5)) * 12;
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(mod.x, mod.y, 14 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(mod.x, mod.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Small text
        ctx.fillStyle = isHazard ? '#fda4af' : '#64748b';
        ctx.font = '7px monospace';
        ctx.fillText(mod.name, mod.x - mod.w / 2 + 2, mod.y + 2);
      });

      // HUD Text Overlays
      ctx.font = '9px monospace';
      ctx.fillStyle = urgency === 'EXTREME' ? '#f43f5e' : '#fbbf24';
      ctx.fillText(`SECTOR: ${moduleName.toUpperCase()}`, 10, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`HAZARD CLASS: ${fireClass}`, 10, 28);
      ctx.fillText(`THERMAL: ${tempC}°C`, w - 85, 16);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [moduleName, urgency, fireClass, tempC]);

  return (
    <div className="relative w-full h-[140px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner font-mono">
      <canvas
        ref={canvasRef}
        width={340}
        height={140}
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-1 right-2 text-[8px] text-slate-500 font-mono">
        ISS HABITAT COMPARTMENT RADAR
      </div>
    </div>
  );
};
