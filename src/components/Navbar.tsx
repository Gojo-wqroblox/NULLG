import React from 'react';
import { Flame, Table, Activity, ChevronDown, ShieldAlert, Siren, Share2, Volume2, VolumeX, Keyboard, UserCheck, LogOut, Shield } from 'lucide-react';
import { AstronautProfile } from './StartingScreen';

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
  { id: 'nasa_psi159_cool', name: 'NASA PSI-159 (ISS Cool Flame 21174-C3)', gravityG: 0.0, o2: 39.5, co2: 0.2, ventilation: 0.08, gases: { O2: 39.5, N2: 60.3, CO2: 0.2 } },
  { id: 'nasa_psi159_inverse', name: 'NASA PSI-159 (Inverse Flame 21196-L2)', gravityG: 0.0, o2: 21.0, co2: 0.2, ventilation: 0.05, gases: { O2: 21.0, N2: 78.8, CO2: 0.2 } },
  { id: 'nasa_flex2_bio', name: 'NASA / ASI FLEX-ICE-GA (Biofuel 0-G)', gravityG: 0.0, o2: 21.0, co2: 0.0, ventilation: 0.0 },
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
  activeTab: 'flame' | 'dataset' | 'scatter' | 'risk' | 'emergency';
  onTabChange: (tab: 'flame' | 'dataset' | 'scatter' | 'risk' | 'emergency') => void;
  onSelectPreset: (preset: SimplePreset) => void;
  currentPresetId?: string;
  onOpenShare?: () => void;
  isAudioMode?: boolean;
  onToggleAudioMode?: () => void;
  ventilationSpeed?: number;
  onOpenShortcuts?: () => void;
  activeAstronaut?: AstronautProfile | null;
  onLockTerminal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSelectPreset,
  currentPresetId,
  onOpenShare,
  isAudioMode = false,
  onToggleAudioMode,
  ventilationSpeed = 0.15,
  onOpenShortcuts,
  activeAstronaut,
  onLockTerminal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <img
              src="/assets/aistudio/nullg_680a0fbc.jpg"
              alt="NULLG Logo"
              className="w-10 h-10 rounded-xl object-cover border border-cyan-500/50 shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform bg-black"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-pulse" />
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

        {/* Simple 4-Tab Switcher */}
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
            <span>NASA Experiments</span>
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
            <span>D3 Scatter</span>
          </button>

          <button
            onClick={() => onTabChange('risk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'risk'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Risk Assessment</span>
          </button>

          <button
            onClick={() => onTabChange('emergency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'emergency'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            <span>Emergency Drill</span>
          </button>
        </div>

        {/* Quick Presets & Share Buttons */}
        <div className="flex items-center gap-2">
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

          {/* Audio Mode Toggle */}
          {onToggleAudioMode && (
            <button
              onClick={onToggleAudioMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm active:scale-95 ${
                isAudioMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title={
                isAudioMode
                  ? `Audio Mode ON: Ambient ventilation hum active (~${Math.round(45 + Math.min(ventilationSpeed, 1.5) * 195)} Hz). Click or press [A] to turn off.`
                  : 'Audio Mode: Turn on ambient ventilation humming sound (Keyboard: [A])'
              }
            >
              {isAudioMode ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Audio Mode</span>
                  <span className="sm:hidden">Audio</span>
                  <div className="flex items-end gap-0.5 h-3 ml-0.5" aria-hidden="true">
                    <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                    <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
                    <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
                  </div>
                  <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] bg-cyan-950 text-cyan-400 rounded border border-cyan-800/80 font-mono">A</kbd>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Audio Mode</span>
                  <span className="sm:hidden">Audio</span>
                  <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">A</kbd>
                </>
              )}
            </button>
          )}

          {/* Share Simulation Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 hover:border-cyan-500/80 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              title="Share or Export Simulation JSON"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Shortcuts Accessibility Modal Trigger */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              title="Keyboard Shortcuts Guide (Press ?)"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Shortcuts</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">?</kbd>
            </button>
          )}

          {/* Active Astronaut Profile & Lock Terminal */}
          {activeAstronaut && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs font-mono"
                title={`${activeAstronaut.name} (${activeAstronaut.role}) - ${activeAstronaut.agency}`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                <span className="text-[10px] text-cyan-400 font-bold hidden lg:inline">
                  [{activeAstronaut.agency}]
                </span>
                <span className="text-cyan-100 font-medium truncate max-w-[110px] hidden sm:inline">
                  {activeAstronaut.callSign ? `"${activeAstronaut.callSign}"` : activeAstronaut.name.split(' ')[0]}
                </span>
              </div>

              {onLockTerminal && (
                <button
                  onClick={onLockTerminal}
                  className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-700/60 transition-all shadow-sm active:scale-95"
                  title="Lock Terminal & Return to Starting Screen"
                  aria-label="Lock terminal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
