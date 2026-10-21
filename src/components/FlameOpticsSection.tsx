import React, { useRef, useEffect, useState } from 'react';
import {
  Flame,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Thermometer,
  Eye,
  Radio,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Compass,
  Info,
  Wind,
} from 'lucide-react';
import { GasDefinition, FuelDefinition } from '../types';

interface GasPuffEvent {
  id: number;
  gasName: string;
  delta: number;
  color: string;
  badgeText: string;
}

interface CanvasPuffWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  speed: number;
}

const GAS_METADATA: Record<string, { name: string; color: string }> = {
  O2: { name: 'Oxygen (O₂)', color: '#38bdf8' },
  N2: { name: 'Nitrogen (N₂)', color: '#6366f1' },
  Novec: { name: 'Novec 1230 Clean Agent', color: '#10b981' },
  CO2: { name: 'Carbon Dioxide (CO₂)', color: '#94a3b8' },
  H2: { name: 'Hydrogen (H₂)', color: '#c084fc' },
  CH4: { name: 'Methane (CH₄)', color: '#f59e0b' },
  SiH4: { name: 'Silane (SiH₄)', color: '#06b6d4' },
  NH3: { name: 'Ammonia (NH₃)', color: '#84cc16' },
  SF6: { name: 'Sulfur Hexafluoride (SF₆)', color: '#14b8a6' },
  C3H8: { name: 'Propane (C₃H₈)', color: '#ea580c' },
  C2H4: { name: 'Ethylene (C₂H₄)', color: '#d97706' },
  N2O: { name: 'Nitrous Oxide (N₂O)', color: '#0ea5e9' },
  Ar: { name: 'Argon (Ar)', color: '#818cf8' },
  CO: { name: 'Carbon Monoxide (CO)', color: '#e2e8f0' },
};

interface FlameOpticsSectionProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  onGravityChange?: (g: number) => void;
  ventilationSpeed: number;
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  flameTempK: number;
  dangerLevel: string;
}

export const FlameOpticsSection: React.FC<FlameOpticsSectionProps> = ({
  gases,
  pressureKpa,
  gravityG,
  onGravityChange,
  ventilationSpeed,
  fuel,
  isIgnited,
  onToggleIgnite,
  flameTempK,
  dangerLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Optical filter mode: 'visible' | 'thermal_ir' | 'uv_radical' | 'schlieren'
  const [filterMode, setFilterMode] = useState<'visible' | 'thermal_ir' | 'uv_radical' | 'schlieren'>('visible');
  const [macroZoom, setMacroZoom] = useState<number>(1.2);
  const [probePos, setProbePos] = useState<{ x: number; y: number } | null>(null);

  // Gas Injection Visual Notification & Puff Animation State
  const prevGasesRef = useRef<Record<string, number>>({});
  const puffsRef = useRef<CanvasPuffWave[]>([]);
  const [puffNotification, setPuffNotification] = useState<GasPuffEvent | null>(null);
  const notificationTimeoutRef = useRef<any>(null);

  // Detect Gas Composition Injections & Trigger Subtle 'Puff' Animation Overlay
  useEffect(() => {
    const prev = prevGasesRef.current;
    if (Object.keys(prev).length === 0) {
      // First mount: initialize baseline
      prevGasesRef.current = { ...gases };
      return;
    }

    // Check for gas changes
    let maxDelta = 0;
    let changedGasKey = '';

    for (const key of Object.keys(gases)) {
      const currentVal = gases[key] || 0;
      const prevVal = prev[key] || 0;
      const delta = currentVal - prevVal;
      if (Math.abs(delta) > Math.abs(maxDelta)) {
        maxDelta = delta;
        changedGasKey = key;
      }
    }

    prevGasesRef.current = { ...gases };

    if (Math.abs(maxDelta) >= 0.4 && changedGasKey) {
      const meta = GAS_METADATA[changedGasKey] || { name: changedGasKey, color: '#38bdf8' };

      const newPuff: GasPuffEvent = {
        id: Date.now(),
        gasName: meta.name,
        delta: maxDelta,
        color: meta.color,
        badgeText: maxDelta > 0 ? `+${maxDelta.toFixed(1)}%` : `${maxDelta.toFixed(1)}%`,
      };

      setPuffNotification(newPuff);

      // Trigger canvas gaseous puff waves radiating across the optical grid
      if (canvasRef.current) {
        const cx = canvasRef.current.width / 2;
        const cy = canvasRef.current.height * 0.52;
        puffsRef.current.push({
          x: cx - 45,
          y: cy,
          radius: 10,
          maxRadius: 175,
          alpha: 0.85,
          color: meta.color,
          speed: 3.2,
        });
        puffsRef.current.push({
          x: cx + 25,
          y: cy - 10,
          radius: 6,
          maxRadius: 135,
          alpha: 0.65,
          color: meta.color,
          speed: 2.6,
        });
      }

      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => {
        setPuffNotification(null);
      }, 2400);
    }
  }, [gases]);

  // Gas and flammability parameters
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const c3h8 = gases?.C3H8 || 0;
  const c2h4 = gases?.C2H4 || 0;

  const isSilaneAutoIgnited = sih4 > 1.2 && o2 > 10;
  const canCombust = (o2 >= 11 && novec <= 6 && sf6 <= 8 && co2 < 38) || isSilaneAutoIgnited;
  const effectivelyBurning = (isIgnited || isSilaneAutoIgnited) && canCombust;

  // Spectroscopy Emission Bands (calculated dynamically)
  const chRadicalIntensity = effectivelyBurning ? Math.min(100, Math.round(o2 * 2.8 + ch4 * 4)) : 0; // 431 nm blue
  const c2SwanIntensity = effectivelyBurning ? Math.min(100, Math.round((c3h8 + c2h4) * 12 + ch4 * 5)) : 0; // 516 nm blue-green
  const ohRadicalIntensity = effectivelyBurning ? Math.min(100, Math.round((flameTempK / 2200) * 85 + h2 * 3)) : 0; // 308 nm UV
  const sootThermalIntensity = effectivelyBurning ? Math.min(100, Math.round((gravityG * 40) + (c3h8 + c2h4) * 8 + (fuel.id === 'nomex_suit' ? 25 : 5))) : 0; // >600 nm amber

  // Canvas Macro Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.025;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height * 0.52;

      // 1. Dark Chamber Backdrop with Optical Grid
      ctx.fillStyle = filterMode === 'schlieren' ? '#1e293b' : '#030712';
      ctx.fillRect(0, 0, width, height);

      // Optical Reticle Grid
      ctx.strokeStyle = filterMode === 'schlieren' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Concentric Calibration Rings (Millimeter scale)
      const scale = macroZoom;
      ctx.setLineDash([3, 4]);
      [35 * scale, 70 * scale, 115 * scale, 160 * scale].forEach((r, idx) => {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(`${(idx + 1) * 5}mm`, cx + r + 3, cy - 2);
      });
      ctx.setLineDash([]);

      // 2. Render Macro Flame Core
      if (effectivelyBurning) {
        const baseR = 52 * scale;
        const windX = ventilationSpeed * 42 * scale;
        const flameX = cx + windX * 0.6;
        const flameY = cy;

        // Schlieren Mode: Density gradient refraction wave
        if (filterMode === 'schlieren') {
          const schlierenGrad = ctx.createRadialGradient(flameX, flameY, baseR * 0.2, flameX, flameY, baseR * 2.2);
          schlierenGrad.addColorStop(0, '#f8fafc');
          schlierenGrad.addColorStop(0.3, '#94a3b8');
          schlierenGrad.addColorStop(0.6, '#475569');
          schlierenGrad.addColorStop(0.9, '#334155');
          schlierenGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
          ctx.fillStyle = schlierenGrad;
          ctx.beginPath();
          ctx.arc(flameX, flameY, baseR * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Thermal IR False-Color Heatmap
        else if (filterMode === 'thermal_ir') {
          const irGrad = ctx.createRadialGradient(flameX, flameY, baseR * 0.1, flameX, flameY, baseR * 2.4);
          irGrad.addColorStop(0, '#ffffff'); // >2000K white hot
          irGrad.addColorStop(0.2, '#fde047'); // 1700K yellow
          irGrad.addColorStop(0.45, '#f97316'); // 1400K orange
          irGrad.addColorStop(0.7, '#dc2626'); // 1000K red
          irGrad.addColorStop(0.9, '#7c3aed'); // 600K violet warm gas
          irGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = irGrad;
          ctx.beginPath();
          ctx.arc(flameX, flameY, baseR * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // UV Radical Detection Mode (OH* and CH* chemiluminescence)
        else if (filterMode === 'uv_radical') {
          // Intense deep purple / ultraviolet reaction shell
          const uvGrad = ctx.createRadialGradient(flameX, flameY, baseR * 0.4, flameX, flameY, baseR * 1.5);
          uvGrad.addColorStop(0, 'rgba(168, 85, 247, 0.1)');
          uvGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.95)'); // OH* 308nm
          uvGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.9)'); // CH* 431nm
          uvGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = uvGrad;
          ctx.beginPath();
          ctx.arc(flameX, flameY, baseR * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Visible Natural Chemiluminescent Spectrum
        else {
          // Radiative halo
          const haloGrad = ctx.createRadialGradient(flameX, flameY, baseR * 0.2, flameX, flameY, baseR * 2.2);
          haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
          haloGrad.addColorStop(0.4, 'rgba(14, 165, 233, 0.3)');
          haloGrad.addColorStop(0.8, 'rgba(2, 132, 199, 0.1)');
          haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(flameX, flameY, baseR * 2.2, 0, Math.PI * 2);
          ctx.fill();

          if (gravityG === 0) {
            // Quiescent / forced Zero-G Sphere
            const sphereR = baseR + Math.sin(time * 3) * 2;
            const coreGrad = ctx.createRadialGradient(flameX, flameY, sphereR * 0.1, flameX, flameY, sphereR);
            coreGrad.addColorStop(0, '#ffffff'); // white-hot central reaction
            coreGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.98)'); // CH* blue
            coreGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.85)'); // C2* cyan
            coreGrad.addColorStop(0.92, 'rgba(251, 146, 60, 0.7)'); // thermal soot fringe
            coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(flameX, flameY, sphereR, 0, Math.PI * 2);
            ctx.fill();

            // Inner white-hot vaporization zone
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(flameX, flameY, sphereR * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Buoyant Teardrop with 0G-10G Power-Law scaling & base necking
            const gBuoyancy = Math.pow(Math.max(0.01, gravityG), 0.35);
            const flameH = baseR * (1.6 + gBuoyancy * 1.5);
            const necking = 1 / (1 + Math.max(0, gravityG - 1.0) * 0.05);
            const baseW = baseR * 0.7 * necking;

            ctx.save();
            ctx.translate(flameX, flameY);
            ctx.beginPath();
            ctx.moveTo(-baseW, 4);
            ctx.quadraticCurveTo(-baseW * 0.85, -flameH * 0.5, 0, -flameH);
            ctx.quadraticCurveTo(baseW * 0.85, -flameH * 0.5, baseW, 4);
            ctx.closePath();

            const buoyGrad = ctx.createLinearGradient(0, 4, 0, -flameH);
            buoyGrad.addColorStop(0, 'rgba(37, 99, 235, 0.95)');
            buoyGrad.addColorStop(0.18, '#ffffff');
            buoyGrad.addColorStop(0.48, '#fde047');
            buoyGrad.addColorStop(0.80, '#f97316');
            buoyGrad.addColorStop(1, gravityG >= 4 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.15)');
            ctx.fillStyle = buoyGrad;
            ctx.fill();
            ctx.restore();
          }
        }

        // Reaction front standoff distance measurement line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(flameX, flameY);
        ctx.lineTo(flameX + baseR, flameY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`Rq: ${(baseR / 10).toFixed(1)}mm`, flameX + baseR * 0.3, flameY - 6);
      } else {
        // Standby prompt
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('FLAME STANDBY • TRIGGER SPARK TO ACTIVATE MACRO SENSORS', cx, cy);
      }

      // 3. Render Expanding Atmospheric Gas Injection Puff Waves
      const puffs = puffsRef.current;
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.radius += p.speed;
        p.alpha = Math.max(0, 1 - p.radius / p.maxRadius);
        p.x += ventilationSpeed * 0.8; // drift downwind

        const puffGrad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius);
        puffGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        puffGrad.addColorStop(0.6, `${p.color}22`);
        puffGrad.addColorStop(0.85, `${p.color}${Math.round(p.alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
        puffGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Delicate expanding vapor filament ring
        ctx.strokeStyle = `${p.color}${Math.round(p.alpha * 0.4 * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (p.radius >= p.maxRadius || p.alpha <= 0.02) {
          puffs.splice(i, 1);
        }
      }

      // Sensor Probe Interactive Reticle
      if (probePos) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(probePos.x, 0);
        ctx.lineTo(probePos.x, height);
        ctx.moveTo(0, probePos.y);
        ctx.lineTo(width, probePos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(probePos.x, probePos.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [filterMode, macroZoom, effectivelyBurning, gravityG, ventilationSpeed, flameTempK, probePos]);

  // Handle probe position
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setProbePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseLeave = () => {
    setProbePos(null);
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 animate-fadeIn">
      {/* Header and Filter Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white font-mono uppercase flex items-center gap-2">
              Microgravity Flame Core & Spectroscopy
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MACRO OPTICS
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Chemiluminescence radical bands, thermal gradients, and reaction envelope diagnostics
            </p>
          </div>
        </div>

        {/* Optical Filter Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setFilterMode('visible')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              filterMode === 'visible'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Natural Visible
          </button>
          <button
            onClick={() => setFilterMode('thermal_ir')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              filterMode === 'thermal_ir'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thermal IR
          </button>
          <button
            onClick={() => setFilterMode('uv_radical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              filterMode === 'uv_radical'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UV Radical (OH*/CH*)
          </button>
          <button
            onClick={() => setFilterMode('schlieren')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              filterMode === 'schlieren'
                ? 'bg-slate-300 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Schlieren Density
          </button>
        </div>
      </div>

      {/* G-Force Controller Strip (0G to 10G) */}
      <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-slate-300 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> G-Force:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onGravityChange?.(0.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                gravityG === 0
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              0G Null
            </button>
            <button
              onClick={() => onGravityChange?.(0.16)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 0.16) < 0.05
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              0.16G Moon
            </button>
            <button
              onClick={() => onGravityChange?.(1.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 1.0) < 0.05
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              1G Earth
            </button>
            <button
              onClick={() => onGravityChange?.(3.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 3.0) < 0.1
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              3G Launch
            </button>
            <button
              onClick={() => onGravityChange?.(5.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 5.0) < 0.1
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              5G Jet
            </button>
            <button
              onClick={() => onGravityChange?.(10.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                Math.abs(gravityG - 10.0) < 0.1
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              10G Hyper
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onGravityChange && (
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={gravityG}
              onChange={(e) => onGravityChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Drag G-Force 0.0g to 10.0g"
            />
          )}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              gravityG === 0
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : gravityG === 1
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : gravityG >= 10
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {gravityG === 0 ? '0.00g (0-G)' : gravityG >= 10 ? '10.00g (Hyper)' : `${gravityG.toFixed(2)}g`}
          </span>
        </div>
      </div>

      {/* Main Macro Optics Viewport */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
        <canvas
          ref={canvasRef}
          width={720}
          height={405}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full object-cover block cursor-crosshair"
        />

        {/* Visual Notification Component with Subtle 'Puff' Animation Overlay */}
        {puffNotification && (
          <div
            key={puffNotification.id}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fadeIn flex flex-col items-center gap-1.5 transition-all"
          >
            {/* Animated Expanding Ripple Wave Overlay */}
            <div className="relative flex items-center justify-center">
              <span
                className="absolute inline-flex rounded-full animate-ping opacity-60"
                style={{
                  width: '90px',
                  height: '90px',
                  backgroundColor: puffNotification.color,
                  filter: 'blur(10px)',
                }}
              />
              <span
                className="absolute inline-flex rounded-full opacity-40 animate-pulse"
                style={{
                  width: '130px',
                  height: '130px',
                  borderColor: puffNotification.color,
                  borderWidth: '1.5px',
                }}
              />

              {/* High-Tech Aerospace Notification Badge */}
              <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/90 shadow-2xl backdrop-blur-xl text-xs font-mono text-white ring-1 ring-white/10">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                  style={{
                    backgroundColor: puffNotification.color,
                    boxShadow: `0 0 12px ${puffNotification.color}`,
                  }}
                />
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Gas Injected:
                </span>
                <span className="font-extrabold text-white">
                  {puffNotification.gasName}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
                  style={{
                    backgroundColor: `${puffNotification.color}25`,
                    color: puffNotification.color,
                    border: `1px solid ${puffNotification.color}60`,
                  }}
                >
                  {puffNotification.badgeText}
                </span>
                <Wind className="w-3.5 h-3.5 text-cyan-400 animate-bounce shrink-0" />
              </div>
            </div>

            {/* Subtle vapor whisper subtitle */}
            <span className="text-[10px] font-mono text-slate-300 bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-slate-800 shadow-sm backdrop-blur-md">
              💨 Atmospheric vapor diffusion wave propagating across optical grid
            </span>
          </div>
        )}

        {/* Zoom & Ignition Floating Controls */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 mr-1">Macro Zoom:</span>
          <button
            onClick={() => setMacroZoom((prev) => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-cyan-300 font-bold px-1.5">{(macroZoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setMacroZoom((prev) => Math.min(2.4, Number((prev + 0.2).toFixed(1))))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Spark Ignition Button */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={onToggleIgnite}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-1.5 active:scale-95 ${
              isIgnited
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {isIgnited ? 'Extinguish' : 'Trigger Spark'}
          </button>
        </div>

        {/* Bottom Sensor Telemetry Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>Core Temp: <strong className="text-amber-300">{effectivelyBurning ? `${flameTempK} K` : '298 K'}</strong></span>
            <span>Morphology: <strong className="text-cyan-300">{gravityG === 0 ? 'Spherical Diffusion Ball' : 'Buoyant Flickering Plume'}</strong></span>
            <span>Reaction Shell Thickness: <strong className="text-purple-300">{effectivelyBurning ? '0.62 mm' : '0.0 mm'}</strong></span>
          </div>
          <span className="text-slate-400">
            Probe: {probePos ? `(${Math.round(probePos.x)}, ${Math.round(probePos.y)})` : 'Hover to sample'}
          </span>
        </div>
      </div>

      {/* Chemiluminescent Emission Spectroscopy Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
        {/* CH* Radical Band (431 nm) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sky-400 font-bold">CH* Radical (431 nm)</span>
            <span className="text-slate-300 font-bold">{chRadicalIntensity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${chRadicalIntensity}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Luminous blue chemiluminescence</span>
        </div>

        {/* C2* Swan Bands (516 nm) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">C₂* Swan (516 nm)</span>
            <span className="text-slate-300 font-bold">{c2SwanIntensity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${c2SwanIntensity}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">High-temperature carbon reaction zone</span>
        </div>

        {/* OH* Radical Band (308 nm UV) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-purple-400 font-bold">OH* Band (308 nm UV)</span>
            <span className="text-slate-300 font-bold">{ohRadicalIntensity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${ohRadicalIntensity}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Peak heat release & oxidation front</span>
        </div>

        {/* Soot Thermal Continuum (>600 nm) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">Soot Glow (&gt;600 nm)</span>
            <span className="text-slate-300 font-bold">{sootThermalIntensity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${sootThermalIntensity}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Thermal radiation & carbon incandescence</span>
        </div>
      </div>
    </div>
  );
};
