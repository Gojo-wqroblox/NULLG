import React from 'react';
import { Flame, Table, Activity, ChevronDown } from 'lucide-react';

export interface SimplePreset {
  id: string;
  name: string;
  gravityG: number;
  o2: number;
  co2: number;
  ventilation: number;
  gases?: Record<string, number>;
}

export const SIMPLE_PRESETS: SimplePreset[] = [
  { id: 'zero_g', name: '0-G Space (ISS Air: 21% O₂ / 78% N₂)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.15 },
  { id: 'nasa_flex', name: 'NASA FLEX (Droplet Cool Flame 0-G)', gravityG: 0.0, o2: 21, co2: 0.0, ventilation: 0.0 },
  { id: 'nasa_sofie_gel', name: 'NASA SOFIE / SOPHIA GEL (Solid Fuel Limit 0-G)', gravityG: 0.0, o2: 18.5, co2: 0.4, ventilation: 0.05 },
  { id: 'nasa_sofie_mist', name: 'NASA SOPHIA-MIST (Fabric Quench 0-G)', gravityG: 0.0, o2: 19.0, co2: 0.4, ventilation: 0.04 },
  { id: 'nasa_saffire', name: 'NASA SAFFIRE (Cygnus Cargo Burn 0-G)', gravityG: 0.0, o2: 21, co2: 0.5, ventilation: 0.20 },
  { id: 'nasa_bass', name: 'NASA BASS (ISS Glovebox Solids)', gravityG: 0.0, o2: 20.9, co2: 0.4, ventilation: 0.08 },
  { id: 'nasa_acme_cfm', name: 'NASA ACME/CFM (Space Candle 0-G)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.0 },
  { id: 'nasa_acme_bre', name: 'NASA ACME/BRE (Burning Rate Emulator 0-G)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.10 },
  { id: 'earth_1g', name: '1-G Earth Normal (21% O₂)', gravityG: 1.0, o2: 21, co2: 0.04, ventilation: 0.0 },
  { id: 'hyper_10g', name: '10-G Hypergravity Chimney', gravityG: 10.0, o2: 21, co2: 0.04, ventilation: 0.0 },
  { id: 'methane_leak', name: 'Methane Flare (12% CH₄ / 21% O₂)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.15, gases: { O2: 21, N2: 66.6, CH4: 12, CO2: 0.4 } },
  { id: 'krypton_thruster', name: 'Krypton Thruster Gas (25% Kr)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.15, gases: { O2: 21, N2: 53.6, Kr: 25, CO2: 0.4 } },
  { id: 'hydrogen_ghost', name: 'Hydrogen Burn (15% H₂ Ghost Flame)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.15, gases: { O2: 21, N2: 63.6, H2: 15, CO2: 0.4 } },
  { id: 'helium_quench', name: 'Helium Heat Siphon (25% He)', gravityG: 0.0, o2: 21, co2: 0.4, ventilation: 0.15, gases: { O2: 21, N2: 53.6, He: 25, CO2: 0.4 } },
  { id: 'hypoxic_quench', name: 'Low Oxygen Quench (11% O₂)', gravityG: 0.0, o2: 11, co2: 0.4, ventilation: 0.15, gases: { O2: 11, N2: 88.6, CO2: 0.4 } },
  { id: 'co2_smother', name: 'CO₂ Smother Extinguishment (30% CO₂)', gravityG: 0.0, o2: 21, co2: 30, ventilation: 0.15, gases: { O2: 21, N2: 49, CO2: 30 } },
];

interface NavbarProps {
  activeTab: 'flame' | 'dataset' | 'scatter';
  onTabChange: (tab: 'flame' | 'dataset' | 'scatter') => void;
  onSelectPreset: (preset: SimplePreset) => void;
  currentPresetId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSelectPreset,
  currentPresetId,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20 text-white font-bold">
            <Flame className="w-5 h-5 text-amber-300 fill-amber-300/40" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white font-mono">
                NULL<span className="text-cyan-400">G</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                0-G LAB
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Zero-G Flame & Combustion Simulator
            </p>
          </div>
        </div>

        {/* Simple 3-Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange('flame')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'flame'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Flame Simulation</span>
          </button>

          <button
            onClick={() => onTabChange('dataset')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'dataset'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>NASA Experiments & Data</span>
          </button>

          <button
            onClick={() => onTabChange('scatter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'scatter'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>D3 Scatter Plot</span>
          </button>
        </div>

        {/* Quick Presets Dropdown */}
        <div className="relative hidden md:block">
          <select
            value={currentPresetId || ''}
            onChange={(e) => {
              const found = SIMPLE_PRESETS.find((p) => p.id === e.target.value);
              if (found) onSelectPreset(found);
            }}
            className="appearance-none bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-mono rounded-xl px-3 py-1.5 pr-7 cursor-pointer focus:outline-none transition-all shadow-inner"
          >
            <option value="" disabled>
              Load Preset...
            </option>
            {SIMPLE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </header>
  );
};
