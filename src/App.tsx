/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_GASES, AVAILABLE_FUELS } from './data/gases';
import { FuelDefinition } from './types';
import { Navbar, SimplePreset, SIMPLE_PRESETS } from './components/Navbar';
import { ChamberCanvas } from './components/ChamberCanvas';
import { ThreeFlameChamber } from './components/ThreeFlameChamber';
import { FlameResponseControls } from './components/FlameResponseControls';
import { TenGasAtmospherePanel } from './components/TenGasAtmospherePanel';
import { FlameTemperatureHistoryGraph } from './components/FlameTemperatureHistoryGraph';
import { FlameExperimentDatasetView } from './components/FlameExperimentDatasetView';
import { OxygenTempScatterPlot } from './components/OxygenTempScatterPlot';
import { AiRiskAssessmentTab } from './components/AiRiskAssessmentTab';
import { EmergencyProceduresTab } from './components/EmergencyProceduresTab';
import { ShareSimulationModal } from './components/ShareSimulationModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { StartingScreen, AstronautProfile, DEMO_ASTRONAUTS } from './components/StartingScreen';
import { FlameMeasurement } from './data/flameExperimentDataset';
import { ventilationAudio } from './utils/ventilationAudio';
import { Flame, Table, Activity, RotateCcw, Power, Share2, Keyboard } from 'lucide-react';

export default function App() {
  // Application Entry Gate: NASA Space App Challenge starting screen
  const [isAppStarted, setIsAppStarted] = useState<boolean>(false);
  const [activeAstronaut, setActiveAstronaut] = useState<AstronautProfile>(() => {
    try {
      const saved = localStorage.getItem('nullg_active_astronaut');
      return saved ? JSON.parse(saved) : DEMO_ASTRONAUTS[0];
    } catch {
      return DEMO_ASTRONAUTS[0];
    }
  });

  // Navigation: Simple 5 views
  const [activeTab, setActiveTab] = useState<'flame' | 'dataset' | 'scatter' | 'risk' | 'emergency'>('flame');

  // Core Simulation State with 10 Featured Gases
  const [gases, setGases] = useState<Record<string, number>>({
    O2: 21,
    N2: 78,
    CO2: 0.4,
    CH4: 0,
    Kr: 0,
    H2: 0,
    He: 0,
    Ar: 0.6,
    CO: 0,
    C3H8: 0,
  });
  const [pressureKpa, setPressureKpa] = useState<number>(101.3);
  const [gravityG, setGravityG] = useState<number>(0.0); // 0.0G to 10.0G
  const [ventilationSpeed, setVentilationSpeed] = useState<number>(0.15); // m/s
  const [isIgnited, setIsIgnited] = useState<boolean>(true);
  const [selectedFuel, setSelectedFuel] = useState<FuelDefinition>(AVAILABLE_FUELS[0]);
  const [currentPresetId, setCurrentPresetId] = useState<string>('zero_g');
  const [chamberMode, setChamberMode] = useState<'3d' | '2d'>('3d');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isAudioMode, setIsAudioMode] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; id: number } | null>(null);

  // Ambient ventilation humming sound via Web Audio API
  useEffect(() => {
    if (isAudioMode) {
      ventilationAudio.start(ventilationSpeed);
    } else {
      ventilationAudio.stop();
    }
    return () => {
      ventilationAudio.stop();
    };
  }, [isAudioMode]);

  // Dynamically vary ventilation hum frequency when ventilationSpeed changes
  useEffect(() => {
    if (isAudioMode) {
      ventilationAudio.updateSpeed(ventilationSpeed);
    }
  }, [ventilationSpeed, isAudioMode]);

  const showShortcutNotification = useCallback((msg: string) => {
    setShortcutToast({ message: msg, id: Date.now() });
    setTimeout(() => {
      setShortcutToast((current) => (current?.message === msg ? null : current));
    }, 2200);
  }, []);

  // Global Primary Shortcut 1: Reset Environment to 0-G Settings (Key: R)
  const handleResetToZeroG = useCallback(() => {
    setGravityG(0.0);
    setVentilationSpeed(0.15);
    setPressureKpa(101.3);
    setSelectedFuel(AVAILABLE_FUELS[0]);
    setGases({
      O2: 21,
      N2: 78,
      CO2: 0.4,
      CH4: 0,
      Kr: 0,
      H2: 0,
      He: 0,
      Ar: 0.6,
      CO: 0,
      C3H8: 0,
    });
    setIsIgnited(true);
    setCurrentPresetId('zero_g');
    showShortcutNotification('Reset environment to 0-G settings (21% O₂, 0.0G, 0.15 m/s) [R]');
  }, [showShortcutNotification]);

  // Global Primary Shortcut 2: Toggle Ignition (Key: Space)
  const handleToggleIgnition = useCallback(() => {
    setIsIgnited((prev) => {
      const next = !prev;
      showShortcutNotification(next ? 'Flame Ignited (Electric Arc) [Space]' : 'Flame Extinguished [Space]');
      return next;
    });
  }, [showShortcutNotification]);

  // Global Primary Shortcut 3: Toggle Audio Mode (Key: A)
  const handleToggleAudioMode = useCallback(() => {
    setIsAudioMode((prev) => {
      const next = !prev;
      showShortcutNotification(next ? 'Audio Mode: ON (Ventilation Hum Active) [A]' : 'Audio Mode: OFF (Muted) [A]');
      return next;
    });
  }, [showShortcutNotification]);

  // Global Keyboard Shortcuts Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input, textarea, or select
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          (activeElement as HTMLElement).isContentEditable);

      if (!isAppStarted) return;
      if (isInput) return;

      // Don't intercept if modifier keys (Ctrl, Alt, Meta) are pressed to respect browser shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 1. Space: Toggle ignition
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling down
        handleToggleIgnition();
        return;
      }

      // 2. R: Reset environment to 0-G baseline
      if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        e.preventDefault();
        handleResetToZeroG();
        return;
      }

      // 3. A: Toggle Audio Mode
      if (e.key === 'a' || e.key === 'A' || e.code === 'KeyA') {
        e.preventDefault();
        handleToggleAudioMode();
        return;
      }

      // 4. Quick Tab Switching (1 - 5)
      if (e.key === '1') {
        setActiveTab('flame');
        showShortcutNotification('View: Flame Simulation [1]');
      } else if (e.key === '2') {
        setActiveTab('dataset');
        showShortcutNotification('View: NASA Experiments [2]');
      } else if (e.key === '3') {
        setActiveTab('scatter');
        showShortcutNotification('View: D3 Scatter Plot [3]');
      } else if (e.key === '4') {
        setActiveTab('risk');
        showShortcutNotification('View: AI Risk Assessment [4]');
      } else if (e.key === '5') {
        setActiveTab('emergency');
        showShortcutNotification('View: Emergency Drill [5]');
      } else if (e.key === '?' || (e.shiftKey && e.key === '?')) {
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsShareModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAppStarted, handleToggleIgnition, handleResetToZeroG, handleToggleAudioMode, showShortcutNotification]);

  // Apply an imported shared simulation configuration
  const handleApplyImportedSimulation = (params: {
    gravityG?: number;
    pressureKpa?: number;
    ventilationSpeed?: number;
    fuel?: FuelDefinition;
    gases?: Record<string, number>;
    isIgnited?: boolean;
  }) => {
    if (typeof params.gravityG === 'number') setGravityG(params.gravityG);
    if (typeof params.pressureKpa === 'number') setPressureKpa(params.pressureKpa);
    if (typeof params.ventilationSpeed === 'number') setVentilationSpeed(params.ventilationSpeed);
    if (params.fuel) setSelectedFuel(params.fuel);
    if (params.gases) {
      setGases((prev) => {
        const next = { ...prev };
        // Reset non-specified gases to 0 if an explicit gasComposition was provided
        Object.keys(next).forEach((k) => (next[k] = 0));
        Object.assign(next, params.gases);
        return next;
      });
    }
    if (typeof params.isIgnited === 'boolean') setIsIgnited(params.isIgnited);
    setCurrentPresetId('');
    setActiveTab('flame');
  };

  // Gas change handler
  const handleGasChange = (gasId: string, val: number) => {
    setGases((prev) => ({
      ...prev,
      [gasId]: val,
    }));
    setCurrentPresetId('');
  };

  // Preset Selection
  const handleSelectPreset = (preset: SimplePreset) => {
    setCurrentPresetId(preset.id);
    setGravityG(preset.gravityG);
    setVentilationSpeed(preset.ventilation);
    if (preset.gases) {
      const updated: Record<string, number> = {
        O2: 0,
        N2: 0,
        CO2: 0,
        CH4: 0,
        Kr: 0,
        H2: 0,
        He: 0,
        Ar: 0,
        CO: 0,
        C3H8: 0,
      };
      Object.assign(updated, preset.gases);
      setGases(updated);
    } else {
      setGases((prev) => ({
        ...prev,
        O2: preset.o2,
        CO2: preset.co2,
        N2: Math.max(0, 100 - preset.o2 - preset.co2),
      }));
    }
    setIsIgnited(true);
  };

  // Replay Measurement from Experiment CSV Dataset
  const handleApplyExperimentMeasurement = (m: FlameMeasurement) => {
    if (m.is_extinguished || m.flame_radius_mm === 0) {
      setIsIgnited(false);
    } else {
      setIsIgnited(true);
      if (m.flame_color.toLowerCase().includes('blue')) {
        setGases((prev) => ({ ...prev, O2: 21, CO2: 0.4, N2: 78 }));
        setGravityG(0.0);
        setVentilationSpeed(0.15);
        setCurrentPresetId('zero_g');
      } else if (m.flame_color.toLowerCase().includes('yellow')) {
        setGases((prev) => ({ ...prev, O2: 23, CO2: 0.04, N2: 76.96 }));
        setGravityG(1.0);
        setVentilationSpeed(0.0);
        setCurrentPresetId('earth_1g');
      }
    }
    setActiveTab('flame');
  };

  // Apply NASA Experiment Environmental Conditions to Chamber
  const handleApplyExperimentConditions = (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa?: number;
  }) => {
    setGravityG(conditions.gravityG);
    setVentilationSpeed(conditions.ventilationSpeed);
    if (conditions.pressureKpa) setPressureKpa(conditions.pressureKpa);
    setGases((prev) => ({
      ...prev,
      O2: conditions.o2Pct,
      CO2: conditions.co2Pct,
      N2: Math.max(0, 100 - conditions.o2Pct - conditions.co2Pct),
    }));
    setIsIgnited(true);
    setActiveTab('flame');
  };

  // Calculated flame temp estimation for D3 scatter plot
  const o2 = gases['O2'] ?? 21;
  const co2 = gases['CO2'] ?? 0.4;
  const flameTempK = !isIgnited
    ? 298
    : o2 < 12 || co2 > 25
    ? 300
    : Math.round(Math.min(2600, 600 + o2 * 52 - co2 * 18 + (gravityG > 0 ? 120 : 0)));

  if (!isAppStarted) {
    return (
      <StartingScreen
        initialAstronaut={activeAstronaut}
        onStartSimulation={(astronaut) => {
          setActiveAstronaut(astronaut);
          try {
            localStorage.setItem('nullg_active_astronaut', JSON.stringify(astronaut));
          } catch {
            // storage error catch
          }
          setIsAppStarted(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Ultra Simple Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectPreset={handleSelectPreset}
        currentPresetId={currentPresetId}
        onOpenShare={() => setIsShareModalOpen(true)}
        isAudioMode={isAudioMode}
        onToggleAudioMode={handleToggleAudioMode}
        ventilationSpeed={ventilationSpeed}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        activeAstronaut={activeAstronaut}
        onLockTerminal={() => setIsAppStarted(false)}
      />

      {/* Main Single-Column Focused Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Quick Simulation Presets & Power Bar (Always Visible) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 mr-1 text-[11px]">Quick Setup:</span>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'zero_g');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                gravityG === 0 && ventilationSpeed > 0 && currentPresetId === 'zero_g'
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              0-G Space (ISS)
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'nasa_flex');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                currentPresetId === 'nasa_flex'
                  ? 'bg-cyan-400 text-slate-950 font-bold border-cyan-300'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              NASA FLEX (Cool Flame)
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'nasa_sofie_gel');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                currentPresetId === 'nasa_sofie_gel'
                  ? 'bg-purple-500 text-white font-bold border-purple-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              NASA SOPHIA-GEL
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'nasa_psi159_cool');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                currentPresetId === 'nasa_psi159_cool'
                  ? 'bg-cyan-400 text-slate-950 font-bold border-cyan-300'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              NASA PSI-159 (Cool Flame)
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'earth_1g');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                gravityG === 1
                  ? 'bg-indigo-500 text-slate-950 font-bold border-indigo-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              1-G Earth Normal
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'hyper_10g');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                gravityG >= 9.9
                  ? 'bg-rose-500 text-white font-bold border-rose-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              10-G Hypergravity
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'methane_leak');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                (gases['CH4'] ?? 0) > 0
                  ? 'bg-orange-500 text-slate-950 font-bold border-orange-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Methane Flare (CH₄)
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'krypton_thruster');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                (gases['Kr'] ?? 0) > 0
                  ? 'bg-fuchsia-500 text-slate-950 font-bold border-fuchsia-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Krypton Mix (Kr)
            </button>
            <button
              onClick={() => {
                const p = SIMPLE_PRESETS.find((x) => x.id === 'hypoxic_quench');
                if (p) handleSelectPreset(p);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                o2 <= 12
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Low O₂ Quench (11%)
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleResetToZeroG}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              title="Reset environment to 0-G baseline settings (Keyboard: [R])"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset 0-G</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">R</kbd>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              title="Share simulation parameters as JSON"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share Simulation</span>
            </button>

            <button
              onClick={handleToggleIgnition}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm active:scale-95 ${
                isIgnited
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
              }`}
              title="Toggle flame ignition (Keyboard: [Space])"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isIgnited ? 'Extinguish Flame' : 'Ignite Flame'}</span>
              <kbd className={`hidden sm:inline-block px-1.5 py-0.2 text-[9px] rounded border font-mono ${
                isIgnited ? 'bg-rose-950/80 border-rose-700 text-rose-300' : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              }`}>Space</kbd>
            </button>
          </div>
        </div>

        {/* TAB 1: FLAME SIMULATION (Chamber + 4 Drivers + 10-Gas Mixer) */}
        {activeTab === 'flame' && (
          <div className="flex flex-col gap-4">
            {/* 4 Core Controls (O2, CO2, Airflow, G-Force) & Response Status */}
            <FlameResponseControls
              gases={gases}
              onGasChange={handleGasChange}
              ventilationSpeed={ventilationSpeed}
              onVentilationChange={setVentilationSpeed}
              gravityG={gravityG}
              onGravityChange={setGravityG}
              isIgnited={isIgnited}
              onToggleIgnite={() => setIsIgnited(!isIgnited)}
              isAudioMode={isAudioMode}
            />

            {/* Combustion Chamber with 3D Studio PBR & 2D Telemetry Toggle */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 sm:p-4 shadow-xl flex flex-col gap-3">
              {/* Chamber Mode Switcher Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-bold">VIEWPORT MODE:</span>
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setChamberMode('3d')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-bold ${
                        chamberMode === '3d'
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🔬 3D Studio PBR Rig (Three.js)</span>
                    </button>
                    <button
                      onClick={() => setChamberMode('2d')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-bold ${
                        chamberMode === '2d'
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>📊 2D Sensor Diagnostics</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                  {/* Fuel Specimen Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px]">FUEL:</span>
                    <select
                      value={selectedFuel.id}
                      onChange={(e) => {
                        const found = AVAILABLE_FUELS.find((f) => f.id === e.target.value);
                        if (found) setSelectedFuel(found);
                      }}
                      className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-[11px]"
                    >
                      {AVAILABLE_FUELS.map((fuel) => (
                        <option key={fuel.id} value={fuel.id} className="bg-slate-900 text-slate-100">
                          {fuel.name.split('(')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {chamberMode === '3d' ? 'PBR Studio Lighting • Zero-Occlusion' : 'Flame Boundary • Sensor Probe'}
                  </span>
                </div>
              </div>

              {/* Viewport Content */}
              {chamberMode === '3d' ? (
                <ThreeFlameChamber
                  gases={gases}
                  pressureKpa={pressureKpa}
                  gravityG={gravityG}
                  onGravityChange={setGravityG}
                  ventilationSpeed={ventilationSpeed}
                  onVentilationChange={setVentilationSpeed}
                  fuel={selectedFuel}
                  isIgnited={isIgnited}
                  onToggleIgnite={() => setIsIgnited(!isIgnited)}
                  flameTempK={flameTempK}
                  dangerLevel={gravityG > 0 ? 'NOMINAL' : 'MICROGRAVITY'}
                />
              ) : (
                <ChamberCanvas
                  gases={gases}
                  onGasChange={handleGasChange}
                  pressureKpa={pressureKpa}
                  gravityG={gravityG}
                  onGravityChange={setGravityG}
                  ventilationSpeed={ventilationSpeed}
                  onVentilationChange={setVentilationSpeed}
                  fuel={selectedFuel}
                  isIgnited={isIgnited}
                  onToggleIgnite={() => setIsIgnited(!isIgnited)}
                  onCutVentilation={() => setVentilationSpeed(0)}
                  onPurgeChamber={() => {
                    setGases({ O2: 0, N2: 100, CO2: 0, CH4: 0, Kr: 0, H2: 0, He: 0, Ar: 0, CO: 0, C3H8: 0 });
                    setIsIgnited(false);
                  }}
                  flameTempK={flameTempK}
                  dangerLevel={gravityG > 0 ? 'NOMINAL' : 'MICROGRAVITY'}
                />
              )}
            </div>

            {/* 60-Second Flame Temperature History & Stability Graph */}
            <FlameTemperatureHistoryGraph
              currentTempK={flameTempK}
              isIgnited={isIgnited}
              gravityG={gravityG}
              ventilationSpeed={ventilationSpeed}
              o2Pct={o2}
              co2Pct={co2}
            />

            {/* 10-Gas Atmospheric Mixer Panel */}
            <TenGasAtmospherePanel
              gases={gases}
              onGasChange={handleGasChange}
              onSetGases={setGases}
            />
          </div>
        )}

        {/* TAB 2: EXPERIMENT DATA VIEWER (RUN 101, RUN 102 & CSV TABLE) */}
        {activeTab === 'dataset' && (
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 shadow-2xl">
            <FlameExperimentDatasetView
              isEmbedded={true}
              onApplyMeasurementToChamber={handleApplyExperimentMeasurement}
              onApplyExperimentConditions={handleApplyExperimentConditions}
              gases={gases}
              flameTempK={flameTempK}
              gravityG={gravityG}
              pressureKpa={pressureKpa}
              ventilationSpeed={ventilationSpeed}
              currentPresetId={currentPresetId}
              fuel={selectedFuel}
              isIgnited={isIgnited}
              onGasChange={handleGasChange}
            />
          </div>
        )}

        {/* TAB 3: D3 REAL-TIME O2 VS FLAME TEMPERATURE SCATTER PLOT */}
        {activeTab === 'scatter' && (
          <div className="flex flex-col gap-4">
            <OxygenTempScatterPlot
              currentO2Pct={o2}
              currentFlameTempK={flameTempK}
              isIgnited={isIgnited}
              gravityG={gravityG}
              fuel={selectedFuel}
              onO2Change={(newO2) => handleGasChange('O2', newO2)}
            />

            {/* Direct Switch to Flame Simulator */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>
                Want to see the flame shape change in the visualizer?
              </span>
              <button
                onClick={() => setActiveTab('flame')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                Open Flame Simulator
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: AI RISK ASSESSMENT TAB */}
        {activeTab === 'risk' && (
          <AiRiskAssessmentTab
            gases={gases}
            onGasChange={handleGasChange}
            onSetGases={setGases}
            gravityG={gravityG}
            onGravityChange={setGravityG}
            ventilationSpeed={ventilationSpeed}
            onVentilationChange={setVentilationSpeed}
            pressureKpa={pressureKpa}
            fuel={selectedFuel}
            isIgnited={isIgnited}
            onToggleIgnite={() => setIsIgnited(!isIgnited)}
            flameTempK={flameTempK}
          />
        )}

        {/* TAB 5: EMERGENCY PROCEDURES TAB */}
        {activeTab === 'emergency' && (
          <EmergencyProceduresTab
            onSimulateInChamber={(conditions) => {
              setGravityG(conditions.gravityG);
              setVentilationSpeed(conditions.ventilationSpeed);
              setPressureKpa(conditions.pressureKpa);
              setGases((prev) => ({
                ...prev,
                O2: conditions.o2Pct,
                CO2: conditions.co2Pct,
                N2: Math.max(0, 100 - conditions.o2Pct - conditions.co2Pct),
              }));
              setIsIgnited(true);
              setActiveTab('flame');
            }}
          />
        )}
      </main>

      {/* Share Simulation Modal */}
      <ShareSimulationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gravityG={gravityG}
        pressureKpa={pressureKpa}
        ventilationSpeed={ventilationSpeed}
        fuel={selectedFuel}
        gases={gases}
        isIgnited={isIgnited}
        flameTempK={flameTempK}
        currentPresetId={currentPresetId}
        onApplyImportedSimulation={handleApplyImportedSimulation}
      />

      {/* Keyboard Shortcuts Accessibility Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onTriggerShortcut={(id) => {
          if (id === 'space') handleToggleIgnition();
          else if (id === 'r') handleResetToZeroG();
          else if (id === 'a') handleToggleAudioMode();
          else if (id === '1') {
            setActiveTab('flame');
            showShortcutNotification('View: Flame Simulation [1]');
          } else if (id === '2') {
            setActiveTab('dataset');
            showShortcutNotification('View: NASA Experiments [2]');
          } else if (id === '3') {
            setActiveTab('scatter');
            showShortcutNotification('View: D3 Scatter Plot [3]');
          } else if (id === '4') {
            setActiveTab('risk');
            showShortcutNotification('View: AI Risk Assessment [4]');
          } else if (id === '5') {
            setActiveTab('emergency');
            showShortcutNotification('View: Emergency Drill [5]');
          }
        }}
      />

      {/* Floating Keyboard Shortcut Trigger Notification HUD */}
      {shortcutToast && (
        <div
          key={shortcutToast.id}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/60 text-cyan-200 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span>{shortcutToast.message}</span>
        </div>
      )}

      {/* Clean, Simple Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 px-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/nullg_680a0fbc.jpg"
              alt="NULLG"
              className="w-5 h-5 rounded-md object-cover border border-cyan-500/40 bg-black"
            />
            <span>NULLG • Simple Zero-G Flame & Combustion Lab</span>
          </div>
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts: Space (Ignite) • R (0-G Reset) • A (Audio) • ? (Guide)</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
