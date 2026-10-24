import React, { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Flame,
  Wind,
  Gauge,
  Atom,
  RefreshCw,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  evaluateChamberSafety,
  SafetyRiskLevel,
  ChamberAtmosphereState,
} from '../utils/aiRiskAssessment';
import { FuelDefinition } from '../types';

interface AiRiskAssessmentTabProps {
  gases: Record<string, number>;
  onGasChange: (gasId: string, val: number) => void;
  onSetGases: (newGases: Record<string, number>) => void;
  gravityG: number;
  onGravityChange: (g: number) => void;
  ventilationSpeed: number;
  onVentilationChange: (v: number) => void;
  pressureKpa: number;
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  flameTempK: number;
}

export const AiRiskAssessmentTab: React.FC<AiRiskAssessmentTabProps> = ({
  gases,
  onGasChange,
  onSetGases,
  gravityG,
  onGravityChange,
  ventilationSpeed,
  onVentilationChange,
  pressureKpa,
  fuel,
  isIgnited,
  onToggleIgnite,
  flameTempK,
}) => {
  // Run simulated algorithm with active inputs
  const assessment = useMemo(() => {
    const chamberState: ChamberAtmosphereState = {
      gases,
      gravityG,
      ventilationSpeed,
      pressureKpa,
      fuelName: fuel.name,
      isIgnited,
      flameTempK,
    };
    return evaluateChamberSafety(chamberState);
  }, [gases, gravityG, ventilationSpeed, pressureKpa, fuel.name, isIgnited, flameTempK]);

  // Color mapping per Safety Risk Level
  const levelTheme = useMemo(() => {
    switch (assessment.level) {
      case 'Critical':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/60',
          badgeBg: 'bg-rose-500 text-slate-950',
          text: 'text-rose-400',
          barGradient: 'from-amber-500 via-orange-500 to-rose-600',
          icon: ShieldAlert,
          halo: 'shadow-rose-500/20 shadow-lg',
          pulse: true,
        };
      case 'High':
        return {
          bg: 'bg-orange-950/30',
          border: 'border-orange-500/60',
          badgeBg: 'bg-orange-500 text-slate-950',
          text: 'text-orange-400',
          barGradient: 'from-yellow-400 via-amber-500 to-orange-500',
          icon: AlertTriangle,
          halo: 'shadow-orange-500/20 shadow-md',
          pulse: false,
        };
      case 'Medium':
        return {
          bg: 'bg-amber-950/20',
          border: 'border-amber-500/50',
          badgeBg: 'bg-amber-400 text-slate-950',
          text: 'text-amber-400',
          barGradient: 'from-emerald-400 via-cyan-400 to-amber-400',
          icon: AlertCircle,
          halo: '',
          pulse: false,
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-950/20',
          border: 'border-emerald-500/50',
          badgeBg: 'bg-emerald-400 text-slate-950',
          text: 'text-emerald-400',
          barGradient: 'from-teal-500 to-emerald-400',
          icon: ShieldCheck,
          halo: '',
          pulse: false,
        };
    }
  }, [assessment.level]);

  // One-click Auto-Mitigation action
  const handleAutoMitigate = () => {
    // Purge volatile gases, establish safe ISS standard air
    onSetGases({
      O2: 21.0,
      N2: 78.4,
      CO2: 0.4,
      CH4: 0,
      Kr: 0,
      H2: 0,
      He: 0,
      Ar: 0.2,
      CO: 0,
      C3H8: 0,
    });
    onVentilationChange(0.08);
  };

  // Inert purge
  const handleInertPurge = () => {
    onSetGases({
      O2: 0.0,
      N2: 100.0,
      CO2: 0,
      CH4: 0,
      Kr: 0,
      H2: 0,
      He: 0,
      Ar: 0,
      CO: 0,
      C3H8: 0,
    });
    if (isIgnited) onToggleIgnite();
  };

  // CO2 extinguisher injection
  const handleInjectCO2 = () => {
    onSetGases({
      O2: 16.0,
      N2: 54.0,
      CO2: 30.0,
      CH4: 0,
      Kr: 0,
      H2: 0,
      He: 0,
      Ar: 0,
      CO: 0,
      C3H8: 0,
    });
  };

  // Preset hazard injection scenarios
  const handleLoadScenario = (scenario: 'apollo' | 'methane' | 'saffire' | 'iss' | 'quiescent' | 'helium') => {
    switch (scenario) {
      case 'apollo':
        onSetGases({ O2: 95, N2: 5, CO2: 0, CH4: 0, Kr: 0, H2: 0, He: 0, Ar: 0, CO: 0, C3H8: 0 });
        onGravityChange(1.0);
        onVentilationChange(0.1);
        if (!isIgnited) onToggleIgnite();
        break;
      case 'methane':
        onSetGases({ O2: 21, N2: 64, CO2: 0, CH4: 15, Kr: 0, H2: 0, He: 0, Ar: 0, CO: 0, C3H8: 0 });
        onGravityChange(0.0);
        onVentilationChange(0.15);
        if (!isIgnited) onToggleIgnite();
        break;
      case 'saffire':
        onSetGases({ O2: 21, N2: 78.5, CO2: 0.5, CH4: 0, Kr: 0, H2: 0, He: 0, Ar: 0, CO: 0, C3H8: 0 });
        onGravityChange(0.0);
        onVentilationChange(0.25);
        if (!isIgnited) onToggleIgnite();
        break;
      case 'iss':
        onSetGases({ O2: 21, N2: 78.4, CO2: 0.4, CH4: 0, Kr: 0, H2: 0, He: 0, Ar: 0.2, CO: 0, C3H8: 0 });
        onGravityChange(0.0);
        onVentilationChange(0.12);
        if (!isIgnited) onToggleIgnite();
        break;
      case 'quiescent':
        onSetGases({ O2: 21, N2: 78.4, CO2: 0.4, CH4: 0, Kr: 0, H2: 0, He: 0, Ar: 0.2, CO: 0, C3H8: 0 });
        onGravityChange(0.0);
        onVentilationChange(0.0);
        if (!isIgnited) onToggleIgnite();
        break;
      case 'helium':
        onSetGases({ O2: 21, N2: 53.6, CO2: 0.4, CH4: 0, Kr: 0, H2: 0, He: 25, Ar: 0, CO: 0, C3H8: 0 });
        onGravityChange(0.0);
        onVentilationChange(0.15);
        if (!isIgnited) onToggleIgnite();
        break;
    }
  };

  const LevelIcon = levelTheme.icon;

  return (
    <div className="flex flex-col gap-5">
      {/* SECTION 1: PRIMARY SAFETY ASSESSMENT BANNER */}
      <div
        className={`rounded-2xl border ${levelTheme.border} ${levelTheme.bg} ${levelTheme.halo} p-5 sm:p-6 transition-all duration-300 relative overflow-hidden`}
      >
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl ${
                assessment.level === 'Critical'
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse'
                  : assessment.level === 'High'
                  ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400'
                  : assessment.level === 'Medium'
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                  : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              }`}
            >
              <LevelIcon className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  AI Risk Assessment Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  NASA Heuristic Model
                </span>
              </div>

              <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                <span className="text-sm text-slate-300 font-medium">Safety Risk Level:</span>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight px-3 py-0.5 rounded-xl uppercase ${levelTheme.badgeBg}`}
                >
                  {assessment.level}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Score: <strong className="text-white text-sm">{assessment.overallScore}/100</strong>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-2">
                {assessment.headline}
              </p>
            </div>
          </div>

          {/* Quick Score Gauge Bar */}
          <div className="w-full md:w-56 flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Hazard Index</span>
              <span
                className={`font-bold ${
                  assessment.overallScore > 75
                    ? 'text-rose-400'
                    : assessment.overallScore > 45
                    ? 'text-orange-400'
                    : assessment.overallScore > 25
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {assessment.overallScore}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${levelTheme.barGradient} transition-all duration-500`}
                style={{ width: `${Math.max(5, assessment.overallScore)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0 (Safe)</span>
              <span>50</span>
              <span>100 (Critical)</span>
            </div>
          </div>
        </div>

        {/* Real-time Environment Snapshot Pill Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Oxygen (O₂)</span>
            <span className={`font-bold ${(gases['O2'] ?? 21) > 25 ? 'text-orange-400' : 'text-white'}`}>
              {(gases['O2'] ?? 21).toFixed(1)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Combustibles</span>
            <span
              className={`font-bold ${
                assessment.isExplosivePremix ? 'text-rose-400' : (gases['CH4'] || 0) + (gases['H2'] || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {((gases['CH4'] || 0) + (gases['H2'] || 0) + (gases['C3H8'] || 0) + (gases['CO'] || 0)).toFixed(1)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Gravity Regime</span>
            <span className="font-bold text-white">
              {gravityG === 0 ? '0.0G (Space)' : `${gravityG.toFixed(1)}G`}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Ventilation Draft</span>
            <span className="font-bold text-white">
              {ventilationSpeed.toFixed(2)} m/s
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Chamber Flame</span>
            <span className={`font-bold ${isIgnited ? 'text-amber-400' : 'text-slate-400'}`}>
              {isIgnited ? `${flameTempK} K` : 'EXTINGUISHED'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Active Fuel</span>
            <span className="font-bold text-cyan-300 truncate block">
              {fuel.name}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: TEXTUAL JUSTIFICATION & SCIENTIFIC REASONING */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            Algorithmic Textual Justification
          </h3>
        </div>

        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans space-y-3">
          {assessment.textualJustification.split('\n\n').map((para, idx) => (
            <p key={idx} className="tracking-wide">
              {para}
            </p>
          ))}
        </div>

        {/* Recommendations list */}
        {assessment.recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Safety Recommendations & Mitigation Protocols
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {assessment.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: PHYSICAL HAZARD VECTOR DECOMPOSITION */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Physical Hazard Vector Decomposition
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            5 Diagnostic Dimensions Evaluated Real-Time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {assessment.factors.map((factor) => {
            const statusColor =
              factor.status === 'danger'
                ? 'border-rose-500/60 bg-rose-950/20 text-rose-400'
                : factor.status === 'warning'
                ? 'border-orange-500/50 bg-orange-950/20 text-orange-400'
                : factor.status === 'caution'
                ? 'border-amber-500/50 bg-amber-950/20 text-amber-400'
                : 'border-slate-800 bg-slate-900/60 text-emerald-400';

            return (
              <div
                key={factor.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${statusColor} transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-xs font-mono font-bold">
                    <span className="text-slate-200">{factor.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 uppercase">
                      {factor.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono mt-1 font-semibold text-white">
                    {factor.metric}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-1.5 leading-snug">
                    {factor.detail}
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      factor.status === 'danger'
                        ? 'bg-rose-500'
                        : factor.status === 'warning'
                        ? 'bg-orange-500'
                        : factor.status === 'caution'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(5, factor.score)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: ONE-CLICK EMERGENCY OVERRIDES & ACTIONS */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              One-Click Safety Remediations & Mitigations
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Instantly adjust chamber conditions to neutralize hazard
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={handleAutoMitigate}
            className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex flex-col items-start gap-1 transition-all text-left shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Mitigate Risk</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Restore nominal ISS air (21% O₂ / 78% N₂ / 0.4% CO₂)
            </span>
          </button>

          <button
            onClick={handleInertPurge}
            className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex flex-col items-start gap-1 transition-all text-left shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-1.5 text-indigo-400">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>100% N₂ Inert Purge</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Flush volatile gases and displace oxidizer
            </span>
          </button>

          <button
            onClick={() => onVentilationChange(0.0)}
            className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex flex-col items-start gap-1 transition-all text-left shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-1.5 text-purple-400">
              <Wind className="w-3.5 h-3.5" />
              <span>Cut Ventilation (0 m/s)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Induce 0-G quiescent self-starvation
            </span>
          </button>

          <button
            onClick={handleInjectCO2}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex flex-col items-start gap-1 transition-all text-left shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <Shield className="w-3.5 h-3.5" />
              <span>CO₂ Extinguisher Blanket</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Inject 30% CO₂ for high thermal capacity quench
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 5: NASA SPACEFLIGHT STANDARDS COMPLIANCE & WHAT-IF HAZARD SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NASA Flight Standards Checklist */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              NASA Spaceflight Standards Audit
            </h3>
          </div>
          <div className="space-y-2.5">
            {assessment.nasaStandardCompliance.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-slate-200">{item.standard}</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{item.notes}</div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {item.compliant ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      PASS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                      <XCircle className="w-3 h-3" />
                      NON-COMPLIANT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive "What-If" Hazard Scenarios */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Atom className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Interactive "What-If" Hazard Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Inject known historical and experimental spaceflight scenarios to observe the AI Risk Assessment's algorithmic reaction:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => handleLoadScenario('apollo')}
              className="p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/60 text-rose-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Apollo 1 Flash Fire</span>
                <span className="text-[9px] px-1 rounded bg-rose-900 text-rose-200">CRITICAL</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                95% O₂, 1.0G, immediate deflagration
              </span>
            </button>

            <button
              onClick={() => handleLoadScenario('methane')}
              className="p-2.5 rounded-xl bg-orange-950/30 hover:bg-orange-950/50 border border-orange-800/60 text-orange-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Methane Gas Leak</span>
                <span className="text-[9px] px-1 rounded bg-orange-900 text-orange-200">CRITICAL</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                15% CH₄ premix in air, explosive
              </span>
            </button>

            <button
              onClick={() => handleLoadScenario('saffire')}
              className="p-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/60 text-amber-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>NASA SAFFIRE Draft</span>
                <span className="text-[9px] px-1 rounded bg-amber-900 text-amber-200">HIGH</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                0-G with 0.25 m/s forced ventilation
              </span>
            </button>

            <button
              onClick={() => handleLoadScenario('iss')}
              className="p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Standard ISS Cabin</span>
                <span className="text-[9px] px-1 rounded bg-cyan-900 text-cyan-200">NOMINAL</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                21% O₂, 0.12 m/s laminar flow
              </span>
            </button>

            <button
              onClick={() => handleLoadScenario('quiescent')}
              className="p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Quiescent 0-G Quench</span>
                <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-200">LOW</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                0-G, 0 m/s airflow, self-extinguishing
              </span>
            </button>

            <button
              onClick={() => handleLoadScenario('helium')}
              className="p-2.5 rounded-xl bg-teal-950/30 hover:bg-teal-950/50 border border-teal-800/60 text-teal-300 text-left transition-all active:scale-95"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Helium Heat Siphon</span>
                <span className="text-[9px] px-1 rounded bg-teal-900 text-teal-200">LOW</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                25% He conductive thermal quench
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
