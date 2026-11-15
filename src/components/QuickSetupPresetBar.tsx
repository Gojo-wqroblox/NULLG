import React, { useState, useMemo } from 'react';
import { SIMPLE_PRESETS, SimplePreset } from './Navbar';
import {
  RotateCcw,
  Share2,
  Power,
  StepForward,
  SlidersHorizontal,
} from 'lucide-react';

export type PresetRiskTier = 'nominal' | 'elevated' | 'critical' | 'quench';

interface PresetLedMeta {
  id: string;
  shortLabel: string;
  tier: PresetRiskTier;
  tierLabel: string;
  /** 1 to 5 lit LED segments representing atmosphere intensity / fire risk */
  intensitySegments: 1 | 2 | 3 | 4 | 5;
  ledColorHex: string;
  activeBgClass: string;
  activeBorderClass: string;
  inactiveTextClass: string;
  summaryNote: string;
}

const QUICK_PRESET_META: PresetLedMeta[] = [
  {
    id: 'zero_g',
    shortLabel: '0-G Space (ISS)',
    tier: 'nominal',
    tierLabel: 'Nominal 0-G',
    intensitySegments: 2,
    ledColorHex: '#06b6d4',
    activeBgClass: 'bg-cyan-500 text-slate-950',
    activeBorderClass: 'border-cyan-400',
    inactiveTextClass: 'text-slate-200',
    summaryNote: 'Standard ISS 21% O₂ cabin air · 0.15 m/s fans',
  },
  {
    id: 'nasa_flex',
    shortLabel: 'NASA FLEX (Cool Flame)',
    tier: 'nominal',
    tierLabel: 'Stealth Cool Flame',
    intensitySegments: 2,
    ledColorHex: '#38bdf8',
    activeBgClass: 'bg-sky-400 text-slate-950',
    activeBorderClass: 'border-sky-300',
    inactiveTextClass: 'text-sky-200',
    summaryNote: 'Quiescent 0-G droplet cool-flame (500–800 K)',
  },
  {
    id: 'nasa_sofie_gel',
    shortLabel: 'NASA SOPHIA-GEL',
    tier: 'nominal',
    tierLabel: 'Controlled 18.5% O₂',
    intensitySegments: 2,
    ledColorHex: '#a855f7',
    activeBgClass: 'bg-purple-500 text-white',
    activeBorderClass: 'border-purple-400',
    inactiveTextClass: 'text-purple-200',
    summaryNote: 'Solid fuel growth & extinction limit baseline',
  },
  {
    id: 'nasa_psi159_cool',
    shortLabel: 'NASA PSI-159 (Cool Flame)',
    tier: 'elevated',
    tierLabel: 'Hyperoxic 2.02 bar',
    intensitySegments: 4,
    ledColorHex: '#f59e0b',
    activeBgClass: 'bg-amber-400 text-slate-950',
    activeBorderClass: 'border-amber-300',
    inactiveTextClass: 'text-amber-200',
    summaryNote: 'Enriched 39.5% O₂ · 202.6 kPa multi-stage transitions',
  },
  {
    id: 'earth_1g',
    shortLabel: '1-G Earth Normal',
    tier: 'nominal',
    tierLabel: 'Terrestrial 1-G',
    intensitySegments: 2,
    ledColorHex: '#818cf8',
    activeBgClass: 'bg-indigo-500 text-white',
    activeBorderClass: 'border-indigo-400',
    inactiveTextClass: 'text-indigo-200',
    summaryNote: 'Standard 1.0 G buoyant convective teardrop',
  },
  {
    id: 'hyper_10g',
    shortLabel: '10-G Hypergravity',
    tier: 'elevated',
    tierLabel: 'Extreme Buoyancy',
    intensitySegments: 4,
    ledColorHex: '#fb7185',
    activeBgClass: 'bg-rose-500 text-white',
    activeBorderClass: 'border-rose-400',
    inactiveTextClass: 'text-rose-200',
    summaryNote: '10.0 G violent chimney updraft & flame necking',
  },
  {
    id: 'methane_leak',
    shortLabel: 'Methane Flare (CH₄)',
    tier: 'critical',
    tierLabel: 'Explosive Fuel Leak',
    intensitySegments: 5,
    ledColorHex: '#f97316',
    activeBgClass: 'bg-orange-500 text-slate-950',
    activeBorderClass: 'border-orange-400',
    inactiveTextClass: 'text-orange-200',
    summaryNote: '12% CH₄ explosive vapor + 21% O₂ high heat release',
  },
  {
    id: 'krypton_thruster',
    shortLabel: 'Krypton Mix (Kr)',
    tier: 'elevated',
    tierLabel: 'Heavy Inert Damping',
    intensitySegments: 3,
    ledColorHex: '#e879f9',
    activeBgClass: 'bg-fuchsia-500 text-slate-950',
    activeBorderClass: 'border-fuchsia-400',
    inactiveTextClass: 'text-fuchsia-200',
    summaryNote: '25% heavy Krypton diluent alters diffusion kinetics',
  },
  {
    id: 'hypoxic_quench',
    shortLabel: 'Low O₂ Quench (11%)',
    tier: 'quench',
    tierLabel: 'Hypoxic Quench',
    intensitySegments: 1,
    ledColorHex: '#eab308',
    activeBgClass: 'bg-yellow-500 text-slate-950',
    activeBorderClass: 'border-yellow-400',
    inactiveTextClass: 'text-yellow-200',
    summaryNote: 'Below 12% Limiting Oxygen Index · reaction starvation',
  },
  {
    id: 'apollo_1',
    shortLabel: 'Apollo 1 (100% O₂)',
    tier: 'critical',
    tierLabel: 'Critical Pure-O₂ Flash',
    intensitySegments: 5,
    ledColorHex: '#ef4444',
    activeBgClass: 'bg-red-500 text-white',
    activeBorderClass: 'border-red-400',
    inactiveTextClass: 'text-rose-200',
    summaryNote: '100% O₂ · 115 kPa Pad 34 hyperoxic flashover hazard',
  },
  {
    id: 'mir_1997',
    shortLabel: 'Mir 1997 Fire',
    tier: 'critical',
    tierLabel: 'Toxic O₂ Surge + CO',
    intensitySegments: 4,
    ledColorHex: '#f59e0b',
    activeBgClass: 'bg-amber-500 text-slate-950',
    activeBorderClass: 'border-amber-400',
    inactiveTextClass: 'text-amber-200',
    summaryNote: '26% O₂ + 4% CO + 5% CO₂ Vika SFOG jet-fire environment',
  },
];

interface QuickSetupPresetBarProps {
  currentPresetId: string;
  gravityG: number;
  ventilationSpeed: number;
  gases: Record<string, number>;
  isIgnited: boolean;
  onSelectPreset: (preset: SimplePreset) => void;
  onResetToZeroG: () => void;
  onOpenShare: () => void;
  onToggleIgnition: () => void;
}

export const QuickSetupPresetBar: React.FC<QuickSetupPresetBarProps> = ({
  currentPresetId,
  gravityG,
  ventilationSpeed,
  gases,
  isIgnited,
  onSelectPreset,
  onResetToZeroG,
  onOpenShare,
  onToggleIgnition,
}) => {
  const [tierFilter, setTierFilter] = useState<'all' | PresetRiskTier>('all');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  const o2 = gases['O2'] ?? 21;

  const isPresetActive = (metaId: string): boolean => {
    if (currentPresetId === metaId) return true;
    if (metaId === 'zero_g') return gravityG === 0 && ventilationSpeed > 0 && currentPresetId === 'zero_g';
    if (metaId === 'earth_1g') return gravityG === 1 && currentPresetId !== 'apollo_1';
    if (metaId === 'hyper_10g') return gravityG >= 9.9;
    if (metaId === 'methane_leak') return (gases['CH4'] ?? 0) > 0;
    if (metaId === 'krypton_thruster') return (gases['Kr'] ?? 0) > 0;
    if (metaId === 'hypoxic_quench') return o2 <= 12;
    return false;
  };

  const visiblePresets = useMemo(() => {
    if (tierFilter === 'all') return QUICK_PRESET_META;
    return QUICK_PRESET_META.filter((p) => p.tier === tierFilter);
  }, [tierFilter]);

  const hoveredPreset = useMemo(() => {
    if (!hoveredPresetId) return null;
    const meta = QUICK_PRESET_META.find((m) => m.id === hoveredPresetId);
    const preset = SIMPLE_PRESETS.find((p) => p.id === hoveredPresetId);
    if (!meta || !preset) return null;
    return { meta, preset };
  }, [hoveredPresetId]);

  const handleCycleNextPreset = () => {
    const activeIdx = QUICK_PRESET_META.findIndex((m) => isPresetActive(m.id));
    const nextMeta = QUICK_PRESET_META[(activeIdx + 1) % QUICK_PRESET_META.length];
    const preset = SIMPLE_PRESETS.find((p) => p.id === nextMeta.id);
    if (preset) onSelectPreset(preset);
  };

  return (
    <section
      aria-label="Quick Setup Atmosphere Presets"
      className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono"
    >
      {/* Top Control Row: Title, Tier Filter, Cycle, Primary Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick Setup</span>
          </span>

          {/* Interactive Atmosphere Intensity / Risk Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {(
              [
                { id: 'all', label: 'All (11)' },
                { id: 'nominal', label: 'Nominal' },
                { id: 'elevated', label: 'Elevated' },
                { id: 'critical', label: 'Critical' },
                { id: 'quench', label: 'Quench' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTierFilter(f.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap ${
                  tierFilter === f.id
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* LED Intensity Scale Key */}
          <div className="hidden xl:flex items-center gap-3 pl-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-xs bg-cyan-400 inline-block" />
              <span>Nominal (2/5)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-xs bg-amber-400 inline-block" />
              <span>Elevated (3–4/5)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-xs bg-red-500 inline-block" />
              <span>Critical (5/5)</span>
            </span>
          </div>
        </div>

        {/* Interactive Chamber & Power Actions */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            type="button"
            onClick={handleCycleNextPreset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-mono font-bold transition-all active:scale-95 whitespace-nowrap"
            title="Step sequentially to the next atmosphere preset"
          >
            <StepForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Step Preset</span>
          </button>

          <button
            type="button"
            onClick={onResetToZeroG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            title="Reset environment to 0-G baseline settings (Keyboard: [R])"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset 0-G</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
              R
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            title="Share simulation parameters as JSON"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Share Simulation</span>
          </button>

          <button
            type="button"
            onClick={onToggleIgnition}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${
              isIgnited
                ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30'
                : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
            }`}
            title="Toggle flame ignition (Keyboard: [Space])"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isIgnited ? 'Extinguish Flame' : 'Ignite Flame'}</span>
            <kbd
              className={`hidden sm:inline-block px-1.5 py-0.2 text-[9px] rounded border font-mono ${
                isIgnited
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              }`}
            >
              Space
            </kbd>
          </button>
        </div>
      </div>

      {/* Preset Buttons with Color-Coded LED Visual Indicator Bars Beneath Each */}
      <div className="flex items-stretch gap-2 flex-wrap">
        {visiblePresets.map((meta) => {
          const active = isPresetActive(meta.id);
          const preset = SIMPLE_PRESETS.find((p) => p.id === meta.id);
          if (!preset) return null;

          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              onMouseEnter={() => setHoveredPresetId(meta.id)}
              onMouseLeave={() => setHoveredPresetId((curr) => (curr === meta.id ? null : curr))}
              onFocus={() => setHoveredPresetId(meta.id)}
              onBlur={() => setHoveredPresetId((curr) => (curr === meta.id ? null : curr))}
              title={`${meta.tierLabel}: ${meta.summaryNote}`}
              className={`group flex flex-col justify-between gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 min-w-[128px] ${
                active
                  ? `${meta.activeBgClass} ${meta.activeBorderClass} font-bold shadow-md`
                  : `bg-slate-900/90 ${meta.inactiveTextClass} border-slate-800 hover:border-slate-600 hover:bg-slate-800/80`
              }`}
            >
              {/* Preset Title & O2 Quick Metric */}
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-[11px] leading-tight whitespace-nowrap">
                  {meta.shortLabel}
                </span>
                <span
                  className={`text-[9px] tabular-nums font-bold ${
                    active ? 'opacity-90' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {preset.o2.toFixed(0)}%
                </span>
              </div>

              {/* 5-Segment Hardware LED-Style Atmosphere Intensity & Risk Indicator Bar */}
              <div
                className={`w-full h-1.5 rounded-sm p-[1.5px] grid grid-cols-5 gap-[2px] border ${
                  active
                    ? 'bg-slate-950/75 border-black/30'
                    : 'bg-slate-950/95 border-slate-800/90'
                }`}
                aria-label={`Intensity level ${meta.intensitySegments} of 5: ${meta.tierLabel}`}
              >
                {[1, 2, 3, 4, 5].map((segment) => {
                  const isLit = segment <= meta.intensitySegments;
                  return (
                    <span
                      key={segment}
                      className="block h-full w-full rounded-[1px] transition-opacity"
                      style={
                        isLit
                          ? {
                              backgroundColor: meta.ledColorHex,
                              boxShadow: `0 0 6px ${meta.ledColorHex}`,
                              opacity: active ? 1 : 0.88,
                            }
                          : {
                              backgroundColor: 'rgba(30, 41, 59, 0.75)',
                              opacity: 0.45,
                            }
                      }
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Live Atmosphere Delta Inspector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono tabular-nums">
        {hoveredPreset ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-2.5 h-1.5 rounded-sm inline-block shrink-0"
                style={{
                  backgroundColor: hoveredPreset.meta.ledColorHex,
                  boxShadow: `0 0 6px ${hoveredPreset.meta.ledColorHex}`,
                }}
              />
              <span className="font-bold text-white">{hoveredPreset.meta.shortLabel}</span>
              <span className="text-slate-500">·</span>
              <span style={{ color: hoveredPreset.meta.ledColorHex }} className="font-semibold">
                {hoveredPreset.meta.tierLabel} ({hoveredPreset.meta.intensitySegments}/5 LED)
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{hoveredPreset.meta.summaryNote}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 ml-auto">
              <span>
                O₂: <strong className="text-white">{hoveredPreset.preset.o2.toFixed(1)}%</strong>{' '}
                <span className="text-cyan-400">
                  ({hoveredPreset.preset.o2 - o2 >= 0 ? '+' : ''}
                  {(hoveredPreset.preset.o2 - o2).toFixed(1)}%)
                </span>
              </span>
              <span>
                P: <strong className="text-white">{(hoveredPreset.preset.pressureKpa ?? 101.3).toFixed(1)} kPa</strong>
              </span>
              <span>
                G: <strong className="text-white">{hoveredPreset.preset.gravityG.toFixed(1)}g</strong>
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-400">
            <span>
              Hover any preset LED bar to preview atmospheric delta before loading · Click to engage chamber parameters
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Live Chamber: <strong className="text-cyan-300">{o2.toFixed(1)}% O₂</strong> ·{' '}
              <strong className="text-white">{gravityG.toFixed(1)}g</strong> ·{' '}
              <strong className="text-white">{ventilationSpeed.toFixed(2)} m/s</strong>
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
