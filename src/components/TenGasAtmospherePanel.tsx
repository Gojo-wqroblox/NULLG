import React, { useState, useMemo } from 'react';
import {
  Wind,
  Sparkles,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Layers,
  Percent,
} from 'lucide-react';

export interface GasConfig {
  id: string;
  name: string;
  formula: string;
  role: 'oxidizer' | 'diluent' | 'suppressant' | 'fuel' | 'noble';
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentClass: string;
  max: number;
  effect: string;
}

export const TEN_FEATURED_GASES: GasConfig[] = [
  {
    id: 'O2',
    name: 'Oxygen',
    formula: 'O₂',
    role: 'oxidizer',
    color: '#38bdf8',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    accentClass: 'accent-cyan-400',
    max: 100,
    effect: 'Primary oxidizer. Speeds up combustion; flame quenches below 12%.',
  },
  {
    id: 'N2',
    name: 'Nitrogen',
    formula: 'N₂',
    role: 'diluent',
    color: '#818cf8',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    accentClass: 'accent-indigo-400',
    max: 100,
    effect: 'Inert atmospheric buffer (78% of air). Absorbs excess heat.',
  },
  {
    id: 'CO2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    role: 'suppressant',
    color: '#94a3b8',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-300',
    borderColor: 'border-slate-500/40',
    accentClass: 'accent-slate-400',
    max: 100,
    effect: 'Fire suppressant. Chills reaction zone; quenches flame above 25-30%.',
  },
  {
    id: 'CH4',
    name: 'Methane',
    formula: 'CH₄',
    role: 'fuel',
    color: '#f97316',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    accentClass: 'accent-orange-400',
    max: 50,
    effect: 'Flammable rocket gas. Produces a bright azure blue spherical mantle.',
  },
  {
    id: 'Kr',
    name: 'Krypton',
    formula: 'Kr',
    role: 'noble',
    color: '#c084fc',
    badgeBg: 'bg-fuchsia-500/15',
    badgeText: 'text-fuchsia-300',
    borderColor: 'border-fuchsia-500/40',
    accentClass: 'accent-fuchsia-400',
    max: 60,
    effect: 'Ultra-dense noble gas (MW 84). Slows molecular diffusion in zero-G.',
  },
  {
    id: 'H2',
    name: 'Hydrogen',
    formula: 'H₂',
    role: 'fuel',
    color: '#ec4899',
    badgeBg: 'bg-pink-500/15',
    badgeText: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    accentClass: 'accent-pink-400',
    max: 50,
    effect: 'Ultra-fast burning. Burns with a pale, nearly invisible UV-blue flame.',
  },
  {
    id: 'He',
    name: 'Helium',
    formula: 'He',
    role: 'noble',
    color: '#facc15',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    accentClass: 'accent-amber-400',
    max: 60,
    effect: 'Ultra-light noble gas. Rapid thermal conduction whisks heat away.',
  },
  {
    id: 'Ar',
    name: 'Argon',
    formula: 'Ar',
    role: 'noble',
    color: '#a855f7',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    borderColor: 'border-purple-500/40',
    accentClass: 'accent-purple-400',
    max: 60,
    effect: 'Heavy noble shielding gas. Inert ballast with low heat conductivity.',
  },
  {
    id: 'CO',
    name: 'Carbon Monoxide',
    formula: 'CO',
    role: 'fuel',
    color: '#ef4444',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    accentClass: 'accent-rose-400',
    max: 40,
    effect: 'Toxic incomplete combustion gas. Flammable and hazardous to inhale.',
  },
  {
    id: 'C3H8',
    name: 'Propane',
    formula: 'C₃H₈',
    role: 'fuel',
    color: '#fb923c',
    badgeBg: 'bg-yellow-500/15',
    badgeText: 'text-yellow-300',
    borderColor: 'border-yellow-500/40',
    accentClass: 'accent-yellow-400',
    max: 30,
    effect: 'Dense hydrocarbon fuel. Burns with luminous yellow soot formation.',
  },
];

interface TenGasAtmospherePanelProps {
  gases: Record<string, number>;
  onGasChange: (gasId: string, val: number) => void;
  onSetGases?: (newGases: Record<string, number>) => void;
}

export const TenGasAtmospherePanel: React.FC<TenGasAtmospherePanelProps> = ({
  gases,
  onGasChange,
  onSetGases,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'air' | 'fuels' | 'noble'>('all');

  // Calculate total atmospheric mix percentage
  const totalPercentage = useMemo(() => {
    return TEN_FEATURED_GASES.reduce((sum, g) => sum + (gases[g.id] ?? 0), 0);
  }, [gases]);

  // Normalize all gases so they sum exactly to 100%
  const handleNormalizeGases = () => {
    if (!onSetGases || totalPercentage <= 0) return;
    const factor = 100 / totalPercentage;
    const normalized: Record<string, number> = {};
    TEN_FEATURED_GASES.forEach((g) => {
      const current = gases[g.id] ?? 0;
      normalized[g.id] = parseFloat((current * factor).toFixed(1));
    });
    onSetGases({ ...gases, ...normalized });
  };

  // Reset to nominal clean air (21% O2, 78% N2, 0.4% CO2, 0.6% Ar)
  const handleResetToAir = () => {
    if (!onSetGases) return;
    const fresh: Record<string, number> = {};
    TEN_FEATURED_GASES.forEach((g) => (fresh[g.id] = 0));
    fresh['O2'] = 21.0;
    fresh['N2'] = 78.0;
    fresh['CO2'] = 0.4;
    fresh['Ar'] = 0.6;
    onSetGases({ ...gases, ...fresh });
  };

  // Quick Presets
  const applyGasPreset = (presetName: string) => {
    if (!onSetGases) return;
    const fresh: Record<string, number> = {};
    TEN_FEATURED_GASES.forEach((g) => (fresh[g.id] = 0));

    if (presetName === 'air') {
      fresh['O2'] = 21.0;
      fresh['N2'] = 78.0;
      fresh['CO2'] = 0.4;
      fresh['Ar'] = 0.6;
    } else if (presetName === 'mars') {
      fresh['CO2'] = 95.0;
      fresh['N2'] = 2.8;
      fresh['Ar'] = 1.6;
      fresh['O2'] = 0.2;
    } else if (presetName === 'methane') {
      fresh['O2'] = 21.0;
      fresh['N2'] = 67.0;
      fresh['CH4'] = 12.0;
    } else if (presetName === 'krypton') {
      fresh['O2'] = 21.0;
      fresh['N2'] = 54.0;
      fresh['Kr'] = 25.0;
    } else if (presetName === 'hydrogen') {
      fresh['O2'] = 20.0;
      fresh['N2'] = 65.0;
      fresh['H2'] = 15.0;
    } else if (presetName === 'helium') {
      fresh['O2'] = 21.0;
      fresh['N2'] = 54.0;
      fresh['He'] = 25.0;
    }
    onSetGases({ ...gases, ...fresh });
  };

  // Filtered list
  const filteredGases = TEN_FEATURED_GASES.filter((g) => {
    if (filterRole === 'air') return g.role === 'oxidizer' || g.role === 'diluent' || g.role === 'suppressant';
    if (filterRole === 'fuels') return g.role === 'fuel';
    if (filterRole === 'noble') return g.role === 'noble';
    return true;
  });

  return (
    <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                10-Gas Atmospheric Mixer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                MULTI-GAS SIMULATOR
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tune Methane, Nitrogen, CO₂, Krypton, Hydrogen, Helium, and more to observe real-time flame chemistry.
            </p>
          </div>
        </div>

        {/* Total mix readout & Normalize */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px]">Total:</span>
            <span
              className={`font-bold ${
                Math.abs(totalPercentage - 100) < 1.0
                  ? 'text-emerald-400'
                  : totalPercentage > 105
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {totalPercentage.toFixed(1)}%
            </span>
          </div>

          {onSetGases && Math.abs(totalPercentage - 100) >= 1.0 && (
            <button
              onClick={handleNormalizeGases}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
              title="Scale all gases to sum exactly to 100%"
            >
              Normalize to 100%
            </button>
          )}

          <button
            onClick={handleResetToAir}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-all flex items-center gap-1"
            title="Reset to nominal clean air"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Standard Air</span>
          </button>
        </div>
      </div>

      {/* Atmospheric Composition Proportional Stack Bar */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80">
          {TEN_FEATURED_GASES.map((g) => {
            const val = gases[g.id] ?? 0;
            if (val <= 0) return null;
            const pct = Math.max(1, (val / Math.max(100, totalPercentage)) * 100);
            return (
              <div
                key={g.id}
                style={{ width: `${pct}%`, backgroundColor: g.color }}
                className="h-full transition-all duration-300"
                title={`${g.name} (${g.formula}): ${val.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Quick Filter Tabs & Quick Mix Presets */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono pt-1">
          {/* Category Filters */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                filterRole === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 10 Gases
            </button>
            <button
              onClick={() => setFilterRole('air')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                filterRole === 'air'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Air & CO₂ (3)
            </button>
            <button
              onClick={() => setFilterRole('fuels')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                filterRole === 'fuels'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fuels (4)
            </button>
            <button
              onClick={() => setFilterRole('noble')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all ${
                filterRole === 'noble'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Noble Gases (3)
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-500">Quick Mix:</span>
            <button
              onClick={() => applyGasPreset('methane')}
              className="px-2 py-0.5 rounded bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border border-orange-800/80 transition-all"
            >
              + Methane (CH₄)
            </button>
            <button
              onClick={() => applyGasPreset('krypton')}
              className="px-2 py-0.5 rounded bg-fuchsia-950/40 hover:bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-800/80 transition-all"
            >
              + Krypton (Kr)
            </button>
            <button
              onClick={() => applyGasPreset('hydrogen')}
              className="px-2 py-0.5 rounded bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-800/80 transition-all"
            >
              + Hydrogen (H₂)
            </button>
            <button
              onClick={() => applyGasPreset('helium')}
              className="px-2 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 transition-all"
            >
              + Helium (He)
            </button>
            <button
              onClick={() => applyGasPreset('mars')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            >
              Mars (95% CO₂)
            </button>
          </div>
        </div>
      </div>

      {/* 10 Gases Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {filteredGases.map((gas) => {
          const currentVal = gases[gas.id] ?? 0;
          return (
            <div
              key={gas.id}
              className={`p-3 rounded-xl bg-slate-900/80 border ${gas.borderColor} flex flex-col justify-between gap-2.5 transition-all hover:border-slate-600`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: gas.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-white leading-tight">
                      {gas.formula}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {gas.name}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${gas.badgeBg} ${gas.badgeText} ${gas.borderColor}`}
                >
                  {currentVal.toFixed(1)}%
                </span>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-1">
                <input
                  type="range"
                  min="0"
                  max={gas.max}
                  step="0.5"
                  value={currentVal}
                  onChange={(e) => onGasChange(gas.id, parseFloat(e.target.value))}
                  className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${gas.accentClass}`}
                />

                {/* Quick Stepper Buttons */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <button
                    onClick={() => onGasChange(gas.id, 0)}
                    className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800"
                    title={`Set ${gas.formula} to 0%`}
                  >
                    0%
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onGasChange(gas.id, Math.min(gas.max, currentVal + 5))}
                      className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      title={`Add 5% ${gas.formula}`}
                    >
                      +5%
                    </button>
                    <button
                      onClick={() => onGasChange(gas.id, Math.min(gas.max, currentVal + 10))}
                      className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800"
                      title={`Add 10% ${gas.formula}`}
                    >
                      +10%
                    </button>
                  </div>
                </div>
              </div>

              {/* Flame Effect Description */}
              <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 min-h-[28px]">
                {gas.effect}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
