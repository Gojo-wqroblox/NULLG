import React, { useState } from 'react';
import { Radar as RadarIcon, Shield, AlertTriangle, Eye, Compass, Info, Sparkles } from 'lucide-react';
import { SIAnalysisResult } from '../types';

interface FireSafetyRadarProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number;
  dangerLevel: string;
  riskScore: number;
  flameTempK: number;
  quenchRadiusMm?: number;
  isGuestMode: boolean;
}

export const FireSafetyRadar: React.FC<FireSafetyRadarProps> = ({
  gases,
  pressureKpa,
  gravityG,
  ventilationSpeed,
  dangerLevel,
  riskScore,
  flameTempK,
  quenchRadiusMm = 2.5,
  isGuestMode,
}) => {
  const [radarView, setRadarView] = useState<'spider' | 'sonar'>('spider');
  const [activeAxisInfo, setActiveAxisInfo] = useState<string | null>(null);

  // Compute 6 normalized radar indices (0 to 100)
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const c3h8 = gases?.C3H8 || 0;
  const c2h4 = gases?.C2H4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const co = gases?.CO || 0;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;

  // 1. Deflagration / Flashover Risk
  let deflagration = 15;
  if (sih4 > 1) deflagration = 100;
  else if (h2 > 4 && o2 > 12) deflagration = 95;
  else if (c2h4 > 3 || c3h8 > 3) deflagration = 85;
  else if (ch4 > 5) deflagration = 75;
  else if (o2 > 30) deflagration = 80;
  if (novec > 5 || sf6 > 8 || co2 > 35) deflagration = 5;

  // 2. Toxic Gas Hazard (CO, NH3, HCN, soot)
  let toxicity = 10;
  if (nh3 > 5) toxicity = 95;
  else if (co > 2) toxicity = 90;
  else if (c3h8 > 2 || c2h4 > 2) toxicity = 70;
  else if (o2 < 12) toxicity = 60; // asphyxiation
  else toxicity = 25;

  // 3. Flame Persistence (Longevity in Zero-G)
  let persistence = 30;
  if (gravityG === 0) {
    if (ventilationSpeed > 0.05) persistence = 85; // fed by fans
    else persistence = 20; // suffocates in stagnant air
  } else {
    persistence = 70; // 1G buoyant replenishment
  }
  if (novec > 5 || sf6 > 8 || o2 < 11) persistence = 0;

  // 4. Spark Ignition Sensitivity (Low quench distance = high vulnerability)
  let sparkSensitivity = 20;
  if (sih4 > 1) sparkSensitivity = 100; // pyrophoric
  else if (h2 > 4) sparkSensitivity = 95; // 0.6mm quench
  else if (o2 > 35) sparkSensitivity = 85;
  else if (quenchRadiusMm < 1.5) sparkSensitivity = 75;
  else sparkSensitivity = 35;
  if (novec > 5 || sf6 > 8) sparkSensitivity = 5;

  // 5. Oxidizer Severity (Effective O2 power)
  let oxidizerSeverity = Math.min(100, Math.round((o2 / 100) * 100 * 1.15));

  // 6. Thermal Radiation Flux
  let thermalFlux = Math.min(100, Math.round(((flameTempK - 298) / 2200) * 100));
  if (deflagration === 5) thermalFlux = 0;

  const radarData = [
    {
      key: 'deflagration',
      label: isGuestMode ? 'Explosion Risk' : 'Deflagration Index',
      guestTip: 'How easily this gas mix can detonate into an explosive fireball.',
      techTip: 'Chain-branching acceleration & volumetric expansion kinetics.',
      value: Math.min(100, Math.max(0, deflagration)),
    },
    {
      key: 'toxicity',
      label: isGuestMode ? 'Poison Smoke' : 'Atmospheric Toxicity',
      guestTip: 'How poisonous the air becomes to human lungs from burning gases.',
      techTip: 'Lethal CO, NH3, NOx, and particulate off-gassing concentration.',
      value: Math.min(100, Math.max(0, toxicity)),
    },
    {
      key: 'persistence',
      label: isGuestMode ? 'Flame Stubbornness' : '0-G Flame Longevity',
      guestTip: 'Whether the fire keeps burning or chokes out when you turn off fans.',
      techTip: 'Diffusive-convective transport ratio and self-suffocation time.',
      value: Math.min(100, Math.max(0, persistence)),
    },
    {
      key: 'sparkSensitivity',
      label: isGuestMode ? 'Static Shock Sensitivity' : 'Quench Penetration',
      guestTip: 'Can a tiny static shock from your socks set this room on fire?',
      techTip: 'Critical spark gap activation limit (quench distance threshold).',
      value: Math.min(100, Math.max(0, sparkSensitivity)),
    },
    {
      key: 'oxidizerSeverity',
      label: isGuestMode ? 'Oxygen Fire Power' : 'Oxidizer Enrichment',
      guestTip: 'How much oxygen is feeding the flame snacks.',
      techTip: 'Partial pressure of O2 and exothermic N2O decomposition flux.',
      value: Math.min(100, Math.max(0, oxidizerSeverity)),
    },
    {
      key: 'thermalFlux',
      label: isGuestMode ? 'Inferno Heat Radiance' : 'Thermal Radiation Flux',
      guestTip: 'How scorching hot the heat waves are against the spaceship walls.',
      techTip: 'Stefan-Boltzmann radiative heat flux (q = εσT⁴) to module hull.',
      value: Math.min(100, Math.max(0, thermalFlux)),
    },
  ];

  // SVG Geometry for 6-axis Spider Radar
  const size = 260;
  const center = size / 2;
  const maxR = 95;
  const angleStep = (Math.PI * 2) / 6;

  // Calculate points for current atmosphere
  const points = radarData.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * maxR;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });
  const polygonPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // ISS baseline safe polygon points (all values ~25)
  const issPoints = radarData.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = 0.25 * maxR;
    return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  // Apollo 1 disaster boundary polygon points (all values ~85-95)
  const apolloPoints = radarData.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = 0.90 * maxR;
    return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <RadarIcon className="w-4 h-4 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
              Spacecraft Fire Safety Radar
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                6-AXIS TELEMETRY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isGuestMode
                ? 'Guest Mode: Visual danger radar comparing your cabin vs safe limits'
                : 'Multi-parametric combustion envelope & spatial safety perimeter'}
            </p>
          </div>
        </div>

        {/* View toggle pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setRadarView('spider')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              radarView === 'spider'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Polygon
          </button>
          <button
            onClick={() => setRadarView('sonar')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              radarView === 'sonar'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sonar Scan
          </button>
        </div>
      </div>

      {/* Main Radar Display Area */}
      {radarView === 'spider' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          {/* SVG Spider Radar */}
          <div className="relative w-[260px] h-[260px] shrink-0 mx-auto">
            <svg width={size} height={size} className="overflow-visible">
              {/* Concentric Grid Rings */}
              {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                <polygon
                  key={idx}
                  points={radarData
                    .map((_, i) => {
                      const angle = i * angleStep - Math.PI / 2;
                      const r = frac * maxR;
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="rgba(51, 65, 85, 0.5)"
                  strokeWidth="1"
                  strokeDasharray={idx === 3 ? 'none' : '3,3'}
                />
              ))}

              {/* Grid Spokes */}
              {radarData.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + maxR * Math.cos(angle)}
                    y2={center + maxR * Math.sin(angle)}
                    stroke="rgba(51, 65, 85, 0.6)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* ISS Nominal Safe Envelope (Green boundary) */}
              <polygon
                points={issPoints}
                fill="rgba(16, 185, 129, 0.08)"
                stroke="rgba(16, 185, 129, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />

              {/* Apollo 1 Danger Zone (Red boundary) */}
              <polygon
                points={apolloPoints}
                fill="none"
                stroke="rgba(244, 63, 94, 0.25)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />

              {/* Live Active Atmosphere Polygon */}
              <polygon
                points={polygonPoints}
                fill={
                  riskScore > 75
                    ? 'rgba(244, 63, 94, 0.35)'
                    : riskScore > 40
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(56, 189, 248, 0.3)'
                }
                stroke={
                  riskScore > 75
                    ? '#f43f5e'
                    : riskScore > 40
                    ? '#f59e0b'
                    : '#38bdf8'
                }
                strokeWidth="2.5"
                className="transition-all duration-500 ease-out"
              />

              {/* Axis Data Points & Labels */}
              {points.map((p, i) => {
                const item = radarData[i];
                const angle = i * angleStep - Math.PI / 2;
                const labelDist = maxR + 18;
                const lx = center + labelDist * Math.cos(angle);
                const ly = center + labelDist * Math.sin(angle);

                return (
                  <g key={i}>
                    {/* Glowing vertex dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="cursor-pointer transition-all duration-300"
                      fill={riskScore > 75 ? '#f43f5e' : '#38bdf8'}
                      stroke="#020617"
                      strokeWidth="2"
                      onMouseEnter={() => setActiveAxisInfo(item.key)}
                      onMouseLeave={() => setActiveAxisInfo(null)}
                    />
                    {/* Axis Title */}
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-mono fill-slate-300 font-semibold cursor-pointer hover:fill-cyan-400 transition-colors"
                      onClick={() => setActiveAxisInfo(item.key)}
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Radar Legend & Quick Breakdown */}
          <div className="flex-1 flex flex-col justify-between gap-2.5 w-full">
            {/* Interactive Legend */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Radar Baseline Legend:
              </span>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500/40 border border-cyan-400" />
                  <span>Current Spacecraft Atmosphere ({riskScore}%)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-400" />
                  <span>ISS Safe Human Operating Limit (Nominal)</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <span className="w-3 h-0.5 border-b-2 border-dotted border-rose-400" />
                  <span>Apollo 1 Catastrophic Flashover Limit</span>
                </div>
              </div>
            </div>

            {/* Axis Inspector or Guest Explainer */}
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-200">
              {activeAxisInfo ? (
                (() => {
                  const current = radarData.find((d) => d.key === activeAxisInfo);
                  if (!current) return null;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-cyan-300 font-mono text-xs">{current.label}</strong>
                        <span className="font-mono text-xs font-bold text-cyan-400">{current.value}%</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {isGuestMode ? current.guestTip : current.techTip}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    {isGuestMode
                      ? 'Guest Tip: Hover over any point on the radar to see what each space fire danger means!'
                      : 'Hover over radar vertices to inspect physical transport and threshold equations.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Sonar Spatial Perimeter Scanner */
        <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-4">
          {/* Sonar Radar Circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-cyan-500/20" />
            <div className="w-48 h-48 rounded-full border border-cyan-500/20" />
            <div className="w-72 h-72 rounded-full border border-cyan-500/20" />
            <div className="w-full h-[1px] bg-cyan-500/15" />
            <div className="h-full w-[1px] bg-cyan-500/15" />

            {/* Rotating Radar Sweep Line */}
            <div
              className="absolute w-36 h-36 origin-bottom-right top-[calc(50%-144px)] left-[calc(50%-144px)] pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 75%, rgba(56, 189, 248, 0.45) 100%)',
                borderRadius: '100% 0 0 0',
                animation: 'spin 4s linear infinite',
              }}
            />
          </div>

          {/* Spatial Blip overlay */}
          <div className="relative z-10 text-center font-mono text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 mb-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>SONAR DETECTION: {dangerLevel} DANGER RADIUS</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-400 max-w-sm mx-auto">
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="block text-white font-bold">~{(riskScore * 0.08).toFixed(1)} m</span>
                <span>Evacuation Buffer</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="block text-white font-bold">{ventilationSpeed > 0 ? 'Downwind' : 'Radial Spherical'}</span>
                <span>Smoke Direction</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="block text-white font-bold">{flameTempK} K</span>
                <span>Thermal Core</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
