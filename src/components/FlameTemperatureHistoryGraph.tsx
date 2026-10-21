import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Flame,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Pause,
  Play,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface TempHistoryPoint {
  timeSecAgo: number; // 0 to 60 (0 = now, 60 = 60s ago)
  tempK: number;
  timestamp: number;
  flickerOffset: number;
}

interface FlameTemperatureHistoryGraphProps {
  currentTempK: number;
  isIgnited: boolean;
  gravityG: number;
  ventilationSpeed: number;
  o2Pct: number;
  co2Pct: number;
}

export const FlameTemperatureHistoryGraph: React.FC<FlameTemperatureHistoryGraphProps> = ({
  currentTempK,
  isIgnited,
  gravityG,
  ventilationSpeed,
  o2Pct,
  co2Pct,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [history, setHistory] = useState<TempHistoryPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<TempHistoryPoint | null>(null);

  // Initialize with initial 60 seconds of baseline steady data
  useEffect(() => {
    const initial: TempHistoryPoint[] = [];
    const now = Date.now();
    const baseTemp = isIgnited ? currentTempK : 298;
    for (let i = 60; i >= 0; i--) {
      // Natural micro-fluctuations based on gravity
      const flickerAmp = !isIgnited
        ? 0
        : gravityG === 0
        ? 6 * (1 + ventilationSpeed * 2)
        : gravityG >= 8
        ? 110
        : 28 * Math.sqrt(Math.max(0.1, gravityG));
      const flicker = (Math.sin(i * 1.7) + Math.cos(i * 0.9) * 0.5) * (flickerAmp * 0.4);
      initial.push({
        timeSecAgo: i,
        tempK: Math.max(298, Math.round(baseTemp + flicker)),
        timestamp: now - i * 1000,
        flickerOffset: flicker,
      });
    }
    setHistory(initial);
  }, []);

  // Real-time 1-second rolling tick
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setHistory((prev) => {
        const now = Date.now();
        // Calculate realistic physical fluctuations:
        // 0-G: Very quiet, slow diffusive variations (+/- 4 to 12K with fan)
        // 1-G: Natural buoyant flicker from vortex shedding (+/- 25 to 45K)
        // 10-G: Violent turbulent chimney flutter (+/- 80 to 140K)
        let flickerAmp = 0;
        if (isIgnited && currentTempK > 350) {
          if (gravityG === 0) {
            flickerAmp = 5 + ventilationSpeed * 15;
          } else if (gravityG >= 8) {
            flickerAmp = 95 + Math.random() * 40;
          } else {
            flickerAmp = 25 * Math.pow(Math.max(0.1, gravityG), 0.45) + ventilationSpeed * 15;
          }
        }
        const randomFlicker = (Math.random() - 0.5) * flickerAmp * 2;
        const liveTemp = !isIgnited
          ? 298
          : Math.max(298, Math.round(currentTempK + randomFlicker));

        // Age existing points by 1 second and filter to last 60 seconds
        const aged = prev
          .map((p) => ({
            ...p,
            timeSecAgo: p.timeSecAgo + 1,
          }))
          .filter((p) => p.timeSecAgo <= 60);

        // Append new current point at timeSecAgo = 0
        const newPoint: TempHistoryPoint = {
          timeSecAgo: 0,
          tempK: liveTemp,
          timestamp: now,
          flickerOffset: randomFlicker,
        };

        return [...aged, newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isIgnited, currentTempK, gravityG, ventilationSpeed]);

  // Compute Combustion Stability Metrics over the last 60 seconds
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        current: currentTempK,
        mean: currentTempK,
        min: currentTempK,
        max: currentTempK,
        stdDev: 0,
        stabilityScore: 100,
        statusLabel: 'NOMINAL',
        statusColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      };
    }

    const temps = history.map((p) => p.tempK);
    const current = temps[temps.length - 1] ?? currentTempK;
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const sum = temps.reduce((a, b) => a + b, 0);
    const mean = sum / temps.length;

    // Variance & Standard Deviation
    const variance =
      temps.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / temps.length;
    const stdDev = Math.sqrt(variance);

    // Combustion Stability Classification
    let statusLabel = 'STEADY-STATE DIFFUSION';
    let statusColor = 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40';
    let stabilityScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 0.8)));

    if (!isIgnited || current < 350) {
      statusLabel = 'EXTINGUISHED / AMBIENT';
      statusColor = 'text-slate-400 bg-slate-900 border-slate-700';
      stabilityScore = 0;
    } else if (stdDev < 15) {
      statusLabel = 'QUIET ZERO-G SPHERE (HIGH STABILITY)';
      statusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    } else if (stdDev < 45) {
      statusLabel = 'BUOYANT FLICKER (EARTH 1G)';
      statusColor = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    } else {
      statusLabel = 'TURBULENT FLUTTER (HIGH G / WIND)';
      statusColor = 'text-rose-400 bg-rose-950/60 border-rose-500/50 animate-pulse';
    }

    return {
      current,
      mean: Math.round(mean),
      min,
      max,
      stdDev: parseFloat(stdDev.toFixed(1)),
      stabilityScore,
      statusLabel,
      statusColor,
    };
  }, [history, isIgnited, currentTempK]);

  // Reset History
  const handleReset = () => {
    const fresh: TempHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      fresh.push({
        timeSecAgo: i,
        tempK: isIgnited ? currentTempK : 298,
        timestamp: now - i * 1000,
        flickerOffset: 0,
      });
    }
    setHistory(fresh);
  };

  // SVG Chart Dimensions & Scales
  const svgWidth = 620;
  const svgHeight = 140;
  const padding = { top: 20, right: 35, bottom: 26, left: 52 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis Scale: Dynamic or locked to 200 - 2500K
  const yMin = Math.max(0, Math.min(250, stats.min - 100));
  const yMax = Math.max(2200, Math.min(2600, stats.max + 150));
  const yRange = yMax - yMin || 1;

  const getX = (timeAgo: number) => {
    // timeAgo ranges from 60 (left edge) to 0 (right edge / now)
    const ratio = (60 - timeAgo) / 60;
    return padding.left + ratio * graphWidth;
  };

  const getY = (tempK: number) => {
    const ratio = (tempK - yMin) / yRange;
    return padding.top + graphHeight - ratio * graphHeight;
  };

  // Build SVG Path
  const sortedPoints = [...history].sort((a, b) => b.timeSecAgo - a.timeSecAgo);
  const pathData = sortedPoints.reduce((acc, p, idx) => {
    const x = getX(p.timeSecAgo);
    const y = getY(p.tempK);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Area under line
  const areaData = pathData
    ? `${pathData} L ${padding.left + graphWidth} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`
    : '';

  // Determine line color theme based on flame conditions
  const lineColor = !isIgnited
    ? '#94a3b8'
    : gravityG === 0
    ? '#38bdf8'
    : gravityG >= 8
    ? '#f43f5e'
    : '#f59e0b';

  return (
    <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Flame Temperature History (Last 60 Seconds)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                COMBUSTION STABILITY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualizes real-time thermal fluctuations, zero-G steady diffusion vs. 1-G buoyant flicker.
            </p>
          </div>
        </div>

        {/* Live Stability Badge & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${stats.statusColor}`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{stats.statusLabel}</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isPaused ? 'Resume tracking' : 'Pause history tracking'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
            title="Reset history buffer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Numerical Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">Current Temp</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-white">
              {stats.current} K
            </span>
            <span className="text-[10px] text-slate-500">
              ({Math.round(stats.current - 273.15)}°C)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">60s Mean Temp</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-cyan-300">
              {stats.mean} K
            </span>
            <span className="text-[10px] text-slate-500">avg</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">Thermal Fluctuation (σ)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-base font-bold ${
                stats.stdDev < 15
                  ? 'text-emerald-400'
                  : stats.stdDev < 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              ±{stats.stdDev} K
            </span>
            <span className="text-[10px] text-slate-500">variance</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">Combustion Stability</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-emerald-400">
              {stats.stabilityScore}%
            </span>
            <span className="text-[10px] text-slate-500">steady</span>
          </div>
        </div>
      </div>

      {/* SVG 60-Second Trendline Chart */}
      <div className="w-full relative bg-slate-950/80 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-32 block overflow-visible select-none"
        >
          <defs>
            <linearGradient id="flameHistoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[500, 1000, 1500, 2000].map((tick) => {
            if (tick < yMin || tick > yMax) return null;
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={padding.left + graphWidth}
                  y1={y}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="2,3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="8.5px"
                  fontFamily="monospace"
                >
                  {tick}K
                </text>
              </g>
            );
          })}

          {/* Flammability limit threshold line at 1200K */}
          {yMin <= 1200 && yMax >= 1200 && (
            <g>
              <line
                x1={padding.left}
                x2={padding.left + graphWidth}
                y1={getY(1200)}
                y2={getY(1200)}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <text
                x={padding.left + graphWidth - 4}
                y={getY(1200) - 3}
                textAnchor="end"
                fill="#f43f5e"
                fontSize="8px"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.75"
              >
                QUENCH LIMIT (1200K)
              </text>
            </g>
          )}

          {/* X Axis Time Marks */}
          {[60, 45, 30, 15, 0].map((sec) => {
            const x = getX(sec);
            return (
              <g key={sec}>
                <line
                  x1={x}
                  x2={x}
                  y1={padding.top}
                  y2={padding.top + graphHeight}
                  stroke="#1e293b"
                  strokeDasharray="2,3"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9px"
                  fontFamily="monospace"
                >
                  {sec === 0 ? 'NOW' : `-${sec}s`}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaData && (
            <path d={areaData} fill="url(#flameHistoryGrad)" />
          )}

          {/* Sparkline Curve */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current Live Point Reticle */}
          {sortedPoints.length > 0 && (() => {
            const last = sortedPoints[sortedPoints.length - 1];
            const lx = getX(last.timeSecAgo);
            const ly = getY(last.tempK);
            return (
              <g>
                <circle
                  cx={lx}
                  cy={ly}
                  r="6"
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="1.5"
                  className="animate-ping"
                />
                <circle
                  cx={lx}
                  cy={ly}
                  r="4"
                  fill={lineColor}
                  stroke="#020617"
                  strokeWidth="1.5"
                />
              </g>
            );
          })()}

          {/* Interactive Mouse Hover Overlay */}
          {sortedPoints.map((p, idx) => {
            const x = getX(p.timeSecAgo);
            const y = getY(p.tempK);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="4.5"
                fill="transparent"
                className="cursor-pointer hover:stroke-white hover:stroke-2"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 pointer-events-none px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-cyan-500/50 text-[11px] font-mono text-white shadow-xl animate-fadeIn"
          >
            <span className="text-slate-400">
              {hoveredPoint.timeSecAgo === 0 ? 'Current' : `${hoveredPoint.timeSecAgo}s ago`}:{' '}
            </span>
            <strong className="text-cyan-300">{hoveredPoint.tempK} K</strong>
            <span className="text-slate-400 ml-1">
              ({Math.round(hoveredPoint.tempK - 273.15)}°C)
            </span>
          </div>
        )}
      </div>

      {/* Stability Explanatory Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {gravityG === 0
              ? 'Zero-G: Isotropic molecular diffusion produces steady, non-flickering combustion.'
              : gravityG >= 8
              ? 'Hypergravity (10G): Violent buoyant vortex updraft drives turbulent acoustic flutter.'
              : 'Earth 1-G: Buoyancy-induced vortex shedding creates natural 10-12 Hz flicker.'}
          </span>
        </span>
        <span className="text-slate-500 hidden sm:inline">
          Window: 60 sec • Resolution: 1 Hz
        </span>
      </div>
    </div>
  );
};
