/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AVAILABLE_GASES, AVAILABLE_FUELS } from './data/gases';
import { FuelDefinition } from './types';
import { Navbar, SimplePreset, SIMPLE_PRESETS } from './components/Navbar';
import { ChamberCanvas } from './components/ChamberCanvas';
import { FlameResponseControls } from './components/FlameResponseControls';
import { TenGasAtmospherePanel } from './components/TenGasAtmospherePanel';
import { FlameTemperatureHistoryGraph } from './components/FlameTemperatureHistoryGraph';
import { FlameExperimentDatasetView } from './components/FlameExperimentDatasetView';
import { OxygenTempScatterPlot } from './components/OxygenTempScatterPlot';
import { FlameMeasurement } from './data/flameExperimentDataset';
import { Flame, Table, Activity, RotateCcw, Power } from 'lucide-react';

export default function App() {
  // Navigation: Simple 3 views
  const [activeTab, setActiveTab] = useState<'flame' | 'dataset' | 'scatter'>('flame');

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

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Ultra Simple Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectPreset={handleSelectPreset}
        currentPresetId={currentPresetId}
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
              onClick={() => setIsIgnited(!isIgnited)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm active:scale-95 ${
                isIgnited
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isIgnited ? 'Extinguish Flame' : 'Ignite Flame'}</span>
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
            />

            {/* Candle Combustion Chamber */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 sm:p-4 shadow-xl">
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
      </main>

      {/* Clean, Simple Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 px-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span>NULLG • Simple Zero-G Flame & Combustion Lab</span>
          <span>Controlled G-Force (0G - 10G) • O₂ • CO₂ • Airflow</span>
        </div>
      </footer>
    </div>
  );
}
