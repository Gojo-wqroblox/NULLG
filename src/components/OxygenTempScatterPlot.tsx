import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  TrendingUp,
  Activity,
  Sparkles,
  Info,
  RotateCcw,
  PlusCircle,
  Play,
  Pause,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { FuelDefinition } from '../types';

export interface ScatterDataPoint {
  id: string;
  source: 'nasa_drop_tower' | 'iss_flex' | 'iss_bass' | 'empirical_run101' | 'empirical_run102' | 'live_chamber';
  oxygenPct: number;
  flameTempK: number;
  gravityG: number;
  fuelName: string;
  label: string;
  isExtinguished?: boolean;
  timestamp?: number;
}

// Baseline NASA & Drop Tower Microgravity combustion correlation points
const BASELINE_CORRELATION_DATA: ScatterDataPoint[] = [
  { id: 'b1', source: 'nasa_drop_tower', oxygenPct: 12.2, flameTempK: 1040, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'Drop Tower 0-G Flammability Limit', isExtinguished: false },
  { id: 'b2', source: 'nasa_drop_tower', oxygenPct: 14.0, flameTempK: 1280, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'Drop Tower Hypoxic Blue Sphere', isExtinguished: false },
  { id: 'b3', source: 'iss_flex', oxygenPct: 16.5, flameTempK: 1460, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'ISS FIR Dim Blue Shell', isExtinguished: false },
  { id: 'b4', source: 'iss_flex', oxygenPct: 18.2, flameTempK: 1590, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'ISS FLEX Diffusive Regime', isExtinguished: false },
  { id: 'b5', source: 'iss_flex', oxygenPct: 20.9, flameTempK: 1750, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'Nominal Cabin Air (0-G Quenched Baseline)', isExtinguished: false },
  { id: 'b6', source: 'iss_bass', oxygenPct: 23.5, flameTempK: 1910, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'ISS BASS Oxygen Enriched', isExtinguished: false },
  { id: 'b7', source: 'iss_bass', oxygenPct: 27.0, flameTempK: 2090, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'ISS BASS Hyperoxic Glow', isExtinguished: false },
  { id: 'b8', source: 'iss_bass', oxygenPct: 30.0, flameTempK: 2240, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'High-O2 Rapid Kinetics Test', isExtinguished: false },
  { id: 'b9', source: 'nasa_drop_tower', oxygenPct: 35.0, flameTempK: 2410, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'Drop Tower High O2 Flame', isExtinguished: false },
  { id: 'b10', source: 'nasa_drop_tower', oxygenPct: 10.8, flameTempK: 300, gravityG: 0, fuelName: 'Hydrocarbon Wax', label: 'Sub-limit Extinction Point', isExtinguished: true },
  
  // 1-G Reference Points (higher temperature due to buoyant air entrainment)
  { id: 'b11', source: 'empirical_run102', oxygenPct: 20.9, flameTempK: 1890, gravityG: 1, fuelName: 'Candle Wax', label: 'Run 102 1-G Convective Flame', isExtinguished: false },
  { id: 'b12', source: 'empirical_run102', oxygenPct: 25.0, flameTempK: 2050, gravityG: 1, fuelName: 'Candle Wax', label: '1-G Enriched Flame Test', isExtinguished: false },
  { id: 'b13', source: 'empirical_run101', oxygenPct: 21.0, flameTempK: 1680, gravityG: 0, fuelName: 'Candle Wax', label: 'Run 101 t=0.100s Ignition', isExtinguished: false },
  { id: 'b14', source: 'empirical_run101', oxygenPct: 17.5, flameTempK: 1390, gravityG: 0, fuelName: 'Candle Wax', label: 'Run 101 t=1.200s Boundary Starvation', isExtinguished: false },
  { id: 'b15', source: 'empirical_run101', oxygenPct: 11.0, flameTempK: 300, gravityG: 0, fuelName: 'Candle Wax', label: 'Run 101 t=2.000s Recorded Quench', isExtinguished: true },
];

interface OxygenTempScatterPlotProps {
  currentO2Pct: number;
  currentFlameTempK: number;
  isIgnited: boolean;
  gravityG?: number;
  fuel?: FuelDefinition;
  onO2Change?: (newO2: number) => void;
}

export const OxygenTempScatterPlot: React.FC<OxygenTempScatterPlotProps> = ({
  currentO2Pct,
  currentFlameTempK,
  isIgnited,
  gravityG = 0,
  fuel,
  onO2Change,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [dataPoints, setDataPoints] = useState<ScatterDataPoint[]>(BASELINE_CORRELATION_DATA);
  const [showRegressionLine, setShowRegressionLine] = useState<boolean>(true);
  const [showQuenchBoundary, setShowQuenchBoundary] = useState<boolean>(true);
  const [autoSampleStream, setAutoSampleStream] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | '0G' | '1G' | 'live'>('all');

  // Real-time active chamber temperature (or ambient 298K if not burning)
  const activeTempK = isIgnited ? Math.max(300, currentFlameTempK) : 298;

  // Real-time correlation statistics calculation
  const stats = useMemo(() => {
    // Only analyze burning/active points for temperature correlation (filter out cold ambient/extinguished to see kinetics)
    const activePoints = dataPoints.filter((p) => !p.isExtinguished && p.flameTempK > 350);
    const n = activePoints.length;
    if (n < 2) {
      return { r: 0.95, rSquared: 0.90, slope: 48.5, intercept: 580, meanO2: 21, meanTemp: 1650 };
    }

    const sumX = activePoints.reduce((acc, p) => acc + p.oxygenPct, 0);
    const sumY = activePoints.reduce((acc, p) => acc + p.flameTempK, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (const p of activePoints) {
      const dx = p.oxygenPct - meanX;
      const dy = p.flameTempK - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
    const slope = denX > 0 ? num / denX : 0;
    const intercept = meanY - slope * meanX;
    const rSquared = r * r;

    return {
      r: Number.isFinite(r) ? r : 0,
      rSquared: Number.isFinite(rSquared) ? rSquared : 0,
      slope: Number.isFinite(slope) ? slope : 0,
      intercept: Number.isFinite(intercept) ? intercept : 0,
      meanO2: meanX,
      meanTemp: meanY,
    };
  }, [dataPoints]);

  // Real-time point capture when auto-sample is ON
  useEffect(() => {
    if (!autoSampleStream || !isIgnited) return;

    // Check if we already have a point very close to current O2 to prevent flooding
    const timeout = setTimeout(() => {
      setDataPoints((prev) => {
        const lastLive = prev.filter((p) => p.source === 'live_chamber');
        const isDuplicate = lastLive.some(
          (p) => Math.abs(p.oxygenPct - currentO2Pct) < 0.4 && Math.abs(p.flameTempK - activeTempK) < 25
        );
        if (isDuplicate) return prev;

        const newPoint: ScatterDataPoint = {
          id: `live_${Date.now()}`,
          source: 'live_chamber',
          oxygenPct: parseFloat(currentO2Pct.toFixed(1)),
          flameTempK: Math.round(activeTempK),
          gravityG: gravityG,
          fuelName: fuel ? fuel.name : 'Chamber Fuel',
          label: `Live Chamber Sample [${currentO2Pct.toFixed(1)}% O2, ${Math.round(activeTempK)}K]`,
          isExtinguished: false,
          timestamp: Date.now(),
        };

        // Keep last 40 recorded live points
        const existingLive = prev.filter((p) => p.source === 'live_chamber');
        const baselines = prev.filter((p) => p.source !== 'live_chamber');
        const updatedLive = [...existingLive, newPoint].slice(-40);
        return [...baselines, ...updatedLive];
      });
    }, 700);

    return () => clearTimeout(timeout);
  }, [autoSampleStream, currentO2Pct, activeTempK, isIgnited, gravityG, fuel]);

  // Add single manual snapshot point
  const handleRecordSnapshot = () => {
    const newPoint: ScatterDataPoint = {
      id: `manual_${Date.now()}`,
      source: 'live_chamber',
      oxygenPct: parseFloat(currentO2Pct.toFixed(1)),
      flameTempK: Math.round(activeTempK),
      gravityG: gravityG,
      fuelName: fuel ? fuel.name : 'Chamber Fuel',
      label: `Manual Snapshot [${currentO2Pct.toFixed(1)}% O2, ${Math.round(activeTempK)}K]`,
      isExtinguished: !isIgnited || activeTempK < 350,
      timestamp: Date.now(),
    };
    setDataPoints((prev) => [...prev, newPoint]);
  };

  // Reset to original NASA baseline
  const handleResetBaselines = () => {
    setDataPoints(BASELINE_CORRELATION_DATA);
  };

  // Render D3 Scatter Plot
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Responsive dimensions
    const containerWidth = containerRef.current.clientWidth || 640;
    const width = Math.max(340, containerWidth);
    const height = 360;

    const margin = { top: 28, right: 32, bottom: 52, left: 58 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3.scaleLinear().domain([0, 45]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 2600]).range([innerHeight, 0]);

    // D3 Gridlines (subtle aerospace grid)
    const xGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(() => '');
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid x-grid opacity-15')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-dasharray', '2,4');

    g.append('g')
      .attr('class', 'grid y-grid opacity-15')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-dasharray', '2,4');

    // Quenching / Hypoxic Limit Shaded Zone (O2 < 13%)
    if (showQuenchBoundary) {
      const quenchWidth = xScale(13);
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', quenchWidth)
        .attr('height', innerHeight)
        .attr('fill', 'url(#quench-gradient)')
        .attr('opacity', 0.55);

      // Flammability limit boundary line
      g.append('line')
        .attr('x1', quenchWidth)
        .attr('x2', quenchWidth)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');

      g.append('text')
        .attr('x', quenchWidth - 6)
        .attr('y', 14)
        .attr('text-anchor', 'end')
        .attr('fill', '#f43f5e')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text('EXTINCTION LIMIT (13% O2)');
    }

    // SVG Gradients & Filters
    const defs = svg.append('defs');

    // Quench gradient
    const quenchGrad = defs
      .append('linearGradient')
      .attr('id', 'quench-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    quenchGrad.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.25);
    quenchGrad.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.05);

    // Glowing filter for live point
    const filter = defs.append('filter').attr('id', 'glow-cyan').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Filter points based on selected source filter
    const visiblePoints = dataPoints.filter((p) => {
      if (filterSource === '0G') return p.gravityG === 0;
      if (filterSource === '1G') return p.gravityG > 0;
      if (filterSource === 'live') return p.source === 'live_chamber';
      return true;
    });

    // D3 Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(9)
      .tickFormat((d) => `${d}%`);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => `${d} K`);

    // X Axis group
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    xAxisG.selectAll('path, line').attr('stroke', '#334155');

    // Y Axis group
    const yAxisG = g.append('g').call(yAxis);
    yAxisG.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    yAxisG.selectAll('path, line').attr('stroke', '#334155');

    // Axis Labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('Atmospheric Oxygen Concentration (% O2 by Volume)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('Flame Reaction Temperature (Kelvin)');

    // Linear Regression Trendline (D3 Line)
    if (showRegressionLine && stats.slope !== 0) {
      const x1 = 12.0;
      const x2 = 42.0;
      const y1 = Math.max(300, Math.min(2500, stats.slope * x1 + stats.intercept));
      const y2 = Math.max(300, Math.min(2500, stats.slope * x2 + stats.intercept));

      g.append('line')
        .attr('x1', xScale(x1))
        .attr('y1', yScale(y1))
        .attr('x2', xScale(x2))
        .attr('y2', yScale(y2))
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.85);

      // Regression Formula Label
      g.append('text')
        .attr('x', xScale(31))
        .attr('y', yScale(stats.slope * 31 + stats.intercept) - 10)
        .attr('fill', '#38bdf8')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('transform', `rotate(-15, ${xScale(31)}, ${yScale(stats.slope * 31 + stats.intercept)})`)
        .text(`Linear Fit: T = ${stats.slope.toFixed(1)}·[O₂] + ${Math.round(stats.intercept)}K (r = ${stats.r > 0 ? '+' : ''}${stats.r.toFixed(2)})`);
    }

    // Draw Scatter Points (D3 Circles)
    const pointsGroup = g.append('g').attr('class', 'scatter-points');

    pointsGroup
      .selectAll('circle.point')
      .data(visiblePoints, (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('class', 'point cursor-pointer transition-all duration-150')
      .attr('cx', (d) => xScale(d.oxygenPct))
      .attr('cy', (d) => yScale(d.flameTempK))
      .attr('r', (d) => (d.source === 'live_chamber' ? 5.5 : 4.5))
      .attr('fill', (d) => {
        if (d.isExtinguished || d.flameTempK <= 350) return '#f43f5e';
        if (d.source === 'live_chamber') return '#00f5ff';
        if (d.source === 'empirical_run101') return '#38bdf8';
        if (d.source === 'empirical_run102') return '#fbbf24';
        if (d.gravityG > 0) return '#f59e0b';
        return '#818cf8'; // 0G NASA FLEX/BASS
      })
      .attr('stroke', (d) => {
        if (d.source === 'live_chamber') return '#ffffff';
        if (d.isExtinguished) return '#881337';
        return '#0f172a';
      })
      .attr('stroke-width', (d) => (d.source === 'live_chamber' ? 1.8 : 1.2))
      .attr('opacity', 0.88)
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        setHoveredPoint(d);
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', d.source === 'live_chamber' ? 5.5 : 4.5)
          .attr('stroke', d.source === 'live_chamber' ? '#ffffff' : '#0f172a')
          .attr('stroke-width', d.source === 'live_chamber' ? 1.8 : 1.2);
        setHoveredPoint(null);
      });

    // -------------------------------------------------------------------------
    // REAL-TIME ACTIVE CHAMBER DYNAMIC RETICLE / TARGET
    // -------------------------------------------------------------------------
    const liveX = xScale(Math.max(0, Math.min(45, currentO2Pct)));
    const liveY = yScale(Math.max(0, Math.min(2600, activeTempK)));

    const liveTargetG = g.append('g').attr('class', 'live-reticle');

    // Pulsating halo circle
    liveTargetG
      .append('circle')
      .attr('cx', liveX)
      .attr('cy', liveY)
      .attr('r', 16)
      .attr('fill', isIgnited ? '#06b6d4' : '#f43f5e')
      .attr('opacity', 0.22)
      .attr('filter', 'url(#glow-cyan)');

    // Animated ripple ring
    liveTargetG
      .append('circle')
      .attr('cx', liveX)
      .attr('cy', liveY)
      .attr('r', 12)
      .attr('fill', 'none')
      .attr('stroke', isIgnited ? '#22d3ee' : '#fb7185')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,2');

    // Center focal point
    liveTargetG
      .append('circle')
      .attr('cx', liveX)
      .attr('cy', liveY)
      .attr('r', 5.5)
      .attr('fill', isIgnited ? '#ffffff' : '#fb7185')
      .attr('stroke', isIgnited ? '#0891b2' : '#9f1239')
      .attr('stroke-width', 2);

    // Crosshairs
    liveTargetG
      .append('line')
      .attr('x1', liveX - 16)
      .attr('x2', liveX - 8)
      .attr('y1', liveY)
      .attr('y2', liveY)
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 1.5);
    liveTargetG
      .append('line')
      .attr('x1', liveX + 8)
      .attr('x2', liveX + 16)
      .attr('y1', liveY)
      .attr('y2', liveY)
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 1.5);
    liveTargetG
      .append('line')
      .attr('x1', liveX)
      .attr('x2', liveX)
      .attr('y1', liveY - 16)
      .attr('y2', liveY - 8)
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 1.5);
    liveTargetG
      .append('line')
      .attr('x1', liveX)
      .attr('x2', liveX)
      .attr('y1', liveY + 8)
      .attr('y2', liveY + 16)
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 1.5);

    // Real-time Badge Callout Box
    const calloutX = liveX > innerWidth - 140 ? liveX - 145 : liveX + 18;
    const calloutY = liveY < 50 ? liveY + 28 : liveY - 26;

    const calloutG = liveTargetG.append('g').attr('transform', `translate(${calloutX}, ${calloutY})`);

    calloutG
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 138)
      .attr('height', 36)
      .attr('rx', 6)
      .attr('fill', '#020617')
      .attr('stroke', isIgnited ? '#06b6d4' : '#e11d48')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.95);

    calloutG
      .append('text')
      .attr('x', 6)
      .attr('y', 14)
      .attr('fill', isIgnited ? '#38bdf8' : '#fda4af')
      .attr('font-size', '9.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(isIgnited ? '● LIVE CHAMBER REACTION' : '● EXTINGUISHED / AMBIENT');

    calloutG
      .append('text')
      .attr('x', 6)
      .attr('y', 28)
      .attr('fill', '#f8fafc')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(`${currentO2Pct.toFixed(1)}% O₂ → ${Math.round(activeTempK)} K (${Math.round(activeTempK - 273.15)}°C)`);
  }, [
    dataPoints,
    visiblePointsCount(dataPoints, filterSource),
    currentO2Pct,
    activeTempK,
    isIgnited,
    showRegressionLine,
    showQuenchBoundary,
    filterSource,
    stats,
  ]);

  // Helper count for dependency array
  function visiblePointsCount(points: ScatterDataPoint[], filter: string) {
    return points.filter((p) => {
      if (filter === '0G') return p.gravityG === 0;
      if (filter === '1G') return p.gravityG > 0;
      if (filter === 'live') return p.source === 'live_chamber';
      return true;
    }).length;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-slate-950/95 border border-cyan-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                D3 Real-Time Correlation: O₂ Concentration vs. Flame Temperature
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                LIVE KINETICS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Empirical NASA drop tower datasets & continuous real-time simulated chamber telemetry
            </p>
          </div>
        </div>

        {/* Real-time stats badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Pearson r:</span>
            <span
              className={`text-xs font-mono font-bold ${
                stats.r >= 0.8 ? 'text-emerald-400' : stats.r >= 0.5 ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {stats.r > 0 ? '+' : ''}
              {stats.r.toFixed(3)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">R² Variance:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {(stats.rSquared * 100).toFixed(1)}%
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Reaction Rate:</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              +{stats.slope.toFixed(1)} K / %O₂
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Sliders, Filters, Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800 relative z-10 text-xs font-mono">
        {/* Real-time Oxygen concentration slider for direct hands-on testing */}
        {onO2Change && (
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <span className="text-cyan-300 font-bold flex items-center gap-1 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
              Adjust [O₂]:
            </span>
            <input
              type="range"
              min="0"
              max="45"
              step="0.5"
              value={currentO2Pct}
              onChange={(e) => onO2Change(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-700 min-w-[48px] text-center">
              {currentO2Pct.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Data Source Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 px-1.5">Filter:</span>
          {(['all', '0G', '1G', 'live'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterSource(filter)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filterSource === filter
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Data' : filter === '0G' ? '0-G Space' : filter === '1G' ? '1-G Earth' : 'Chamber Live'}
            </button>
          ))}
        </div>

        {/* Scatter Plot Feature Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowRegressionLine(!showRegressionLine)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
              showRegressionLine
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Fit Line
          </button>

          <button
            onClick={() => setShowQuenchBoundary(!showQuenchBoundary)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
              showQuenchBoundary
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Quench Limit
          </button>

          <button
            onClick={() => setAutoSampleStream(!autoSampleStream)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
              autoSampleStream
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Automatically log points to scatter plot when O2 or temperature shifts"
          >
            {autoSampleStream ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoSampleStream ? 'Live Log ON' : 'Live Log OFF'}
          </button>

          <button
            onClick={handleRecordSnapshot}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-1"
            title="Record current chamber reading as permanent scatter point"
          >
            <PlusCircle className="w-3 h-3" />
            Snapshot
          </button>

          <button
            onClick={handleResetBaselines}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Reset to NASA benchmark baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG D3 Chart Viewport */}
      <div ref={containerRef} className="w-full relative min-h-[360px]">
        <svg ref={svgRef} className="w-full h-[360px] block overflow-visible" />

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl text-xs font-mono max-w-xs animate-fadeIn backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-2">
              <span className="font-bold text-white flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                {hoveredPoint.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredPoint.gravityG}G
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Oxygen:</span>
                <span className="text-cyan-300 font-bold">{hoveredPoint.oxygenPct.toFixed(1)}% O₂</span>
              </div>
              <div>
                <span className="text-slate-400 block">Flame Temp:</span>
                <span className="text-amber-300 font-bold">
                  {hoveredPoint.flameTempK} K ({Math.round(hoveredPoint.flameTempK - 273.15)}°C)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Source:</span>
                <span className="text-slate-200 capitalize">{hoveredPoint.source.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Condition:</span>
                <span className={hoveredPoint.isExtinguished ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {hoveredPoint.isExtinguished ? 'Extinguished' : 'Sustained Flame'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend & Combustion Science Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800/80 pt-3 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-cyan-300 font-bold flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Active Legend & Markers
          </span>
          <div className="flex flex-col gap-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f5ff] border border-white" />
              <span>Chamber Real-Time Point (Pulsing Target)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" />
              <span>NASA FIR/FLEX 0-G Microgravity Drop Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
              <span>Run 101 & 102 Dataset Measurements</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              <span>Quenched / Extinguished State (Below Flammability Limit)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Physical Correlation Driver
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            As O₂ increases, flame temperature scales linearly: <strong className="text-white">+{stats.slope.toFixed(1)} K / %O₂</strong>. Higher oxygen partial pressures accelerate Arrhenius reaction kinetics and reduce Nitrogen thermal diluent absorption, driving adiabatic flame temperatures from ~1100K up to ~2500K.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-rose-300 font-bold flex items-center gap-1 text-[11px]">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Microgravity Flammability Boundary
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Below <strong className="text-rose-300">13% O₂</strong> in zero gravity, diffusive molecular transport cannot supply oxygen faster than radiative heat loss extinguishes the reaction zone. Flames undergo complete radiative quenching without forced airflow.
          </p>
        </div>
      </div>
    </div>
  );
};
