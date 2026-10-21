import React, { useState } from 'react';
import { SIAnalysisResult, FuelDefinition } from '../types';
import { HazardPdfModal } from './HazardPdfModal';
import { downloadHazardReportPdf } from '../utils/pdfExport';
import {
  ShieldAlert,
  Flame,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  History,
  Activity,
  Sparkles,
  HelpCircle,
  Radio,
  Clock,
  Skull,
  FileText,
  Download,
} from 'lucide-react';

interface HazardRankerDashboardProps {
  analysis: SIAnalysisResult;
  isLoading: boolean;
  onRefreshAnalysis: () => void;
  isBeginnerMode: boolean;
  onOpenCommander: () => void;
  gases?: Record<string, number>;
  pressureKpa?: number;
  gravityG?: number;
  ventilationSpeed?: number;
  fuel?: FuelDefinition;
  presetName?: string;
}

export const HazardRankerDashboard: React.FC<HazardRankerDashboardProps> = ({
  analysis,
  isLoading,
  onRefreshAnalysis,
  isBeginnerMode,
  onOpenCommander,
  gases = { O2: 21, N2: 78, CO2: 0.4, Ar: 0.6 },
  pressureKpa = 101.3,
  gravityG = 0.0,
  ventilationSpeed = 0.15,
  fuel,
  presetName,
}) => {
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);

  const handleDirectPdfDownload = () => {
    downloadHazardReportPdf({
      analysis,
      gases,
      pressureKpa,
      gravityG,
      ventilationSpeed,
      fuel,
      presetName,
      isBeginnerMode,
    });
  };
  const getDangerTheme = (level: string) => {
    switch (level) {
      case 'EXTREME':
        return {
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/60',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          ring: '#f43f5e',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/15',
          border: 'border-orange-500/60',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          ring: '#f97316',
        };
      case 'ELEVATED':
        return {
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/60',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          ring: '#f59e0b',
        };
      case 'EXTINGUISHED':
        return {
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/60',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          ring: '#10b981',
        };
      default:
        return {
          bg: 'bg-cyan-500/15',
          border: 'border-cyan-500/60',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          ring: '#06b6d4',
        };
    }
  };

  const theme = getDangerTheme(analysis.dangerLevel);

  // SVG Gauge Calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysis.riskScore / 100) * circumference;

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
      {/* Top SI Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
              NULL-G SI Risk Evaluation
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                GEMINI 3.8 FLASH
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Autonomous spaceflight combustion diagnostics & crew survivability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
            title="Export formatted PDF summary including gas composition & safety protocols"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onOpenCommander}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Ask Captain
          </button>

          <button
            onClick={onRefreshAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 active:scale-95"
          >
            <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Re-Evaluate'}
          </button>
        </div>
      </div>

      {/* Primary Threat Banner with Circular SVG Gauge */}
      <div className={`p-4 rounded-xl border ${theme.bg} ${theme.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg`}>
        <div className="flex items-start gap-3.5 flex-1">
          <div className="mt-1">
            <AlertOctagon className={`w-7 h-7 ${theme.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${theme.badge}`}>
                {analysis.dangerLevel} THREAT LEVEL
              </span>
              <span className="text-xs font-mono text-slate-400">
                Hazard Score: <strong className="text-white">{analysis.riskScore} / 100</strong>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-snug">
              {analysis.summarySimple}
            </p>
          </div>
        </div>

        {/* Circular SVG Gauge Meter */}
        <div className="flex items-center gap-3 shrink-0 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r={radius}
                className="text-slate-800"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                stroke={theme.ring}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-sm text-white">
              {analysis.riskScore}%
            </div>
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] text-slate-400 uppercase block">Risk Index</span>
            <span className="text-xs font-bold text-slate-200">{analysis.dangerLevel}</span>
          </div>
        </div>
      </div>

      {/* Astronomy Cadet Simple Translation Box */}
      {isBeginnerMode && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1 font-mono">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Astronomy Cadet Translation:</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            {analysis.flameBehavior}
          </p>
        </div>
      )}

      {/* Physics Diagnostics Grid (Flame Temp, Quench Distance, Sphere Radius) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
            Flame Core Temp
          </span>
          <span className="font-mono text-base font-bold text-amber-400">
            {analysis.flameTempK ? `${analysis.flameTempK} K` : '298 K'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {analysis.flameTempK ? `(~${analysis.flameTempK - 273}°C)` : 'Ambient'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
            0-G Sphere Diameter
          </span>
          <span className="font-mono text-base font-bold text-cyan-400">
            {analysis.flameRadiusCm ? `${(analysis.flameRadiusCm * 2).toFixed(1)} cm` : '0.0 cm'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Diffusion radius
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
            Spark Quench Gap
          </span>
          <span className="font-mono text-base font-bold text-pink-400">
            {analysis.quenchRadiusMm ? `${analysis.quenchRadiusMm} mm` : '2.5 mm'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Mesh ignition limit
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
            Combustion Regime
          </span>
          <span className="font-mono text-xs font-bold text-emerald-400 truncate block mt-1">
            {analysis.dangerLevel === 'EXTINGUISHED' ? 'Quenched / Inert' : 'Diffusion Limited'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Lewis & Rayleigh #
          </span>
        </div>
      </div>

      {/* Ranked Spaceflight Hazards */}
      <div>
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Ranked Spaceflight Hazards:
        </h4>
        <div className="space-y-2">
          {analysis.rankedHazards.map((hazard, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start gap-3"
            >
              <span className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                0{idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-slate-200">
                    {hazard.title}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border uppercase ${
                      hazard.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : hazard.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {hazard.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {hazard.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Astronaut Action Checklist */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          NULL-G Astronaut Emergency Protocol:
        </h4>
        <ul className="space-y-1.5">
          {analysis.astronautProtocol.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug"
            >
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Historical Mission Comparison */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
        <History className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5 font-mono">
            Spaceflight Precedent:
          </span>
          <p className="text-[11px] text-slate-400">{analysis.historicalPrecedent}</p>
        </div>
      </div>

      {/* PDF Export Action Callout */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-white">
                Export SI Hazard Report PDF
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                VECTOR PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Includes current gas percentages, combustion physics telemetry, and astronaut emergency protocol checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPdfModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all border border-slate-700 active:scale-95"
          >
            Preview Report
          </button>
          <button
            onClick={handleDirectPdfDownload}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Formatted PDF Export & Print Preview Modal */}
      <HazardPdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        analysis={analysis}
        gases={gases}
        pressureKpa={pressureKpa}
        gravityG={gravityG}
        ventilationSpeed={ventilationSpeed}
        fuel={fuel}
        presetName={presetName}
        isBeginnerMode={isBeginnerMode}
      />
    </div>
  );
};
