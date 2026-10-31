/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EmergencyInstructionsDashboard.tsx
 * An immersive, dedicated flight operations and safety instructions dashboard modal
 * opened via a prominent button near the emergency drill area.
 * 
 * Contains:
 * 1. Comprehensive Simulator User Manual (Viewports, 10-gas mixer, keyboard shortcuts, datasets)
 * 2. Real NASA Spaceflight Fire Safety Doctrine (Flight Rule A13-1, 0-G physics traps, invisible cool flames)
 * 3. Interactive Astronaut Safety Readiness Checklist with verification badges
 * 4. Fast 1-click test actions to load safety scenarios into the simulator
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Compass,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Wind,
  Zap,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Volume2,
  Keyboard,
  Activity,
  Layers,
  Sparkles,
  Info,
  Gauge,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  X,
  Radio,
  FileText,
  Search,
  ExternalLink,
  Shield,
  HelpCircle,
  Siren,
  Sliders,
  Database,
  LineChart,
} from 'lucide-react';

interface EmergencyInstructionsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateInChamber?: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa: number;
  }) => void;
  onTestAudio?: () => void;
  onTriggerRandomScenario?: () => void;
}

export const EmergencyInstructionsDashboard: React.FC<EmergencyInstructionsDashboardProps> = ({
  isOpen,
  onClose,
  onSimulateInChamber,
  onTestAudio,
  onTriggerRandomScenario,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'atmosphere' | 'physics' | 'protocol' | 'shortcuts' | 'checklist'>('workflow');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({
    item1: true,
    item2: true,
    item3: false,
    item4: false,
    item5: false,
    item6: false,
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleChecklist = (id: string) => {
    setCheckedChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checklistItems = [
    {
      id: 'item1',
      category: 'CONTAINMENT',
      title: 'Quench Forced Airflow Before Extinguishing',
      desc: 'In microgravity without buoyancy, ventilation fans provide 100% of the oxidizer flow. Shutting airflow & bus power starves the flame and prevents smoke circulation across modules.',
    },
    {
      id: 'item2',
      category: 'OPTICS & KINETICS',
      title: 'Never Rely Purely on Visible Eyesight ("Cool Flames")',
      desc: 'NASA FLEX and PSI-159 flight experiments demonstrated low-temperature quasi-steady combustion (600K-800K) with zero visible chemiluminescence. Always inspect radiometer/gas sensors.',
    },
    {
      id: 'item3',
      category: 'AGENT SELECTION',
      title: 'Strictly Prohibit Liquid Water on Avionics & Power Racks',
      desc: 'Liquid water conducts high voltage and beads up into floating droplets that bridge internal electrical circuitry. Discharged gaseous CO₂ or Fine Nitrogen Flood is required.',
    },
    {
      id: 'item4',
      category: 'ATMOSPHERE HAZARDS',
      title: 'Beware Hyperoxic Acceleration (>21% O₂)',
      desc: 'Oxygen enriched atmospheres (>21% O₂) dramatically lower ignition energy, quadruple flame propagation speeds, and can turn fire-retardant materials combustible.',
    },
    {
      id: 'item5',
      category: 'POST-FIRE DOCTRINE',
      title: 'Wear PBA and Verify Toxicity Before Hatch Ingress',
      desc: 'Burning cable insulation and composites yield lethal concentrations of Carbon Monoxide (CO) and Hydrogen Fluoride (HF). Always engage scrubbers and verify parts-per-million levels.',
    },
    {
      id: 'item6',
      category: 'ACOUSTICS & SHORTCUTS',
      title: 'Maintain Audio Situational Awareness',
      desc: 'Activate Audio Mode [A] to hear ambient ventilation hum frequency shifts (45 Hz to 240 Hz). Use [Space] for emergency flame shutdown and [R] to return to safe 0-G ISS conditions.',
    },
  ];

  const totalChecked = Object.values(checkedChecklist).filter(Boolean).length;
  const isAllCertified = totalChecked === checklistItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Dashboard Outer Container */}
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-950 border border-cyan-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-cyan-500/20">
        
        {/* ========================================================================= */}
        {/* 1. DASHBOARD TOP COMMAND BAR                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <img
                src="/assets/aistudio/nullg_680a0fbc.jpg"
                alt="NULLG Logo"
                className="w-11 h-11 rounded-xl object-cover border border-cyan-500/60 shadow-lg shadow-cyan-500/25 bg-black"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
                  NULLG FLIGHT SAFETY & OPERATIONS DASHBOARD
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  NASA SOP A13-1
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ISS EXP-71
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Astronaut Guide: How to operate the zero-gravity simulation consoles properly & manage fires safely
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Close & Audio siren test */}
          <div className="flex items-center gap-2.5 ml-auto">
            {onTestAudio && (
              <button
                onClick={onTestAudio}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Test Emergency Siren Alarm"
              >
                <Siren className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="hidden sm:inline">Test Siren</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-mono"
              title="Close Dashboard (Press Esc)"
              aria-label="Close Dashboard"
            >
              <X className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Close [Esc]</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DASHBOARD NAVIGATION TABS & SEARCH BAR                                */}
        {/* ========================================================================= */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-0.5">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'workflow'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>1. App Workflow & Views</span>
            </button>

            <button
              onClick={() => setActiveTab('atmosphere')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'atmosphere'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>2. Atmospheric Mixing</span>
            </button>

            <button
              onClick={() => setActiveTab('physics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'physics'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>3. 0-G Physics & Hazards</span>
            </button>

            <button
              onClick={() => setActiveTab('protocol')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'protocol'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>4. Emergency Protocol A13-1</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'shortcuts'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>5. Shortcuts & Audio</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                activeTab === 'checklist'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>6. Safety Checklist ({totalChecked}/{checklistItems.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[180px] max-w-[240px] hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DASHBOARD MAIN SCROLLABLE CONTENT BODY                                 */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">

          {/* TAB 1: APP WORKFLOW & VIEWS */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3">
                <Compass className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Console Architecture & Navigation Workflow
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    NULLG is an interactive spaceflight combustion chamber designed to simulate multi-gas reactions, microgravity physics, and emergency fire response protocols under realistic spacecraft atmospheric conditions. You can switch between all 5 flight views using the top navigation bar or the number keys <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-[10px]">1</kbd> through <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-[10px]">5</kbd>.
                  </p>
                </div>
              </div>

              {/* 5 Views Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                      1
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">KEY [1]</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Flame Simulation Chamber
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Core zero-G combustion laboratory. Features 3D Studio PBR rig with volumetric chemiluminescence or 2D Sensor Diagnostics. Control gravity (0.0G to 10.0G), airflow ventilation, and 6 fuel specimens (Methane, Propane, Ethanol, Polyethylene, PMMA, Candle wax).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                      2
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">KEY [2]</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    NASA Flight Experiment Datasets
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Access authentic empirical spaceflight test data from NASA FLEX (droplet cool flames), NASA SAFFIRE (Cygnus cargo burn), NASA BASS (glovebox solids), and NASA SOFIE. Click <strong>"Apply to Chamber"</strong> to load real flight data.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                      3
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">KEY [3]</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <LineChart className="w-4 h-4 text-emerald-400" />
                    D3 Scatter Plot & Flame Temp
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Dynamic D3 visualization analyzing Oxygen concentration ($O_2$) versus flame temperature (Kelvin), displaying theoretical flammability limits and extinguishment quench boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                      4
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">KEY [4]</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-400" />
                    AI Fire Risk Assessment
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Automated spaceflight safety risk analyzer. Generates a composite safety score (0-100) combining Oxygen enrichment, toxic byproducts ($CO, HF, HCN$), heat release rate, and cabin pressure.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-2.5 md:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center font-mono font-bold text-xs">
                      5
                    </span>
                    <span className="text-[10px] font-mono text-red-400 font-bold">KEY [5] • CURRENT TAB</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Spacecraft Emergency Procedures Drill (A13-1)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    High-stakes tactical emergency scenario trainer. You are tasked with resolving compartment fire alarms across ISS modules (Destiny Lab, Columbus, Kibo, Node 1) under time pressure by selecting the correct containment actions, suppression agents, and post-fire scrub procedures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATMOSPHERIC MIXING */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
                <Gauge className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Atmospheric Mixing & Gas Chemistry Rules
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Spacecraft operate as sealed closed-loop environmental ecosystems. Understanding gas ratios is vital for preventing flashovers and controlling combustion kinetics.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Oxygen (O₂) Thresholds
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    <strong>• Nominal ISS:</strong> 20.9% to 21.0% O₂ at 101.3 kPa.<br />
                    <strong>• Hypoxic Quench (&lt;12%):</strong> Most hydrocarbon flames cannot sustain themselves and self-extinguish.<br />
                    <strong>• Hyperoxic Hazard (&gt;21%):</strong> Severe explosion danger. Flammability limits expand drastically.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Inert Diluents (N₂, Ar, He, Kr)
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    <strong>• Nitrogen (N₂):</strong> Primary cabin buffer gas (~78%).<br />
                    <strong>• Helium (He):</strong> High thermal conductivity siphons heat rapidly away from reaction zones, causing thermal quench.<br />
                    <strong>• Argon &amp; Krypton:</strong> Heavy noble gases that dampen gas-phase kinetic reactions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Suppressant Gases (CO₂)
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    <strong>• Carbon Dioxide (CO₂):</strong> Heavy gas that smothers diffusion flames by displacing oxygen and absorbing radiant heat through vibrational relaxation. Over 25% CO₂ will rapidly extinguish active fires.
                  </p>
                </div>
              </div>

              {/* Action trigger */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Try loading the official 0-G Space baseline in the Chamber:</span>
                </div>
                {onSimulateInChamber && (
                  <button
                    onClick={() => {
                      onSimulateInChamber({
                        gravityG: 0.0,
                        o2Pct: 21,
                        co2Pct: 0.4,
                        ventilationSpeed: 0.15,
                        fuelName: 'Methane (CH4)',
                        pressureKpa: 101.3,
                      });
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Load 0-G Atmosphere in Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 0-G PHYSICS & HAZARDS */}
          {activeTab === 'physics' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 flex items-start gap-3">
                <Flame className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Microgravity Combustion Physics & Critical Hazards
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Zero gravity alters combustion thermodynamics entirely. Without buoyancy, traditional Earth fire instincts can lead to catastrophic mistakes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <h4 className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    1. The Spherical Quiescent Flame
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    On Earth (1-G), buoyant hot air rises, carrying heat away and pulling fresh oxygen into the base of the flame. In 0-G, there is <strong>NO buoyant rise</strong>. Fire forms a calm, spherical blue dome. Combustion products pool around the fuel, creating a self-smothering blanket unless ventilation is present.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <h4 className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    2. The Invisible "Cool Flame" Trap
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    As proven by the <strong>NASA FLEX</strong> experiment aboard the ISS, certain hydrocarbon droplet flames continue burning in a second quasi-steady chemical stage at low temperatures (~600K-800K) with <em>zero visible glow</em>. An astronaut entering a dark rack could be severely burned by an invisible flame.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <h4 className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    3. Ventilation Flashover
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    A zero-G flame that appears to have died may simply be oxygen-starved. If an astronaut opens a hatch or cycles an air circulation fan, the sudden burst of airflow feeds fresh oxygen into the hot vapor cloud, causing an explosive flashover.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY PROTOCOL A13-1 */}
          {activeTab === 'protocol' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    NASA Flight Rule A13-1 Emergency Response Doctrine
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    The international standard protocol for resolving an in-flight spacecraft fire is structured into three mandatory sequential stages:
                  </p>
                </div>
              </div>

              {/* Step Sequence */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-mono font-bold text-cyan-300 shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                      Phase 1: Immediate Containment (Airflow & Bus Power)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                      Shut module ventilation and inter-module ventilation (IMV) valves immediately. This cuts off forced oxygen delivery and prevents lethal smoke from invading crew sleep quarters. De-energize high-voltage power busses feeding the involved avionics rack to kill ignition energy.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-mono font-bold text-amber-300 shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider">
                      Phase 2: Targeted Suppressant Discharge
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                      <strong>• Avionics / Electrical Racks:</strong> Inject Carbon Dioxide (CO₂) or Fine Nitrogen Flood through extinguisher ports. Never discharge water onto live electronics.<br />
                      <strong>• Open Cabin / Solid Fires:</strong> Deploy portable Water Mist extinguishers (fine droplets evaporate to absorb latent heat).<br />
                      <strong>• Fatal Warning:</strong> NEVER discharge Halon in enclosed modules; thermal decomposition releases lethal concentrations of Hydrogen Fluoride (HF).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center font-mono font-bold text-emerald-300 shrink-0">
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider">
                      Phase 3: Atmospheric Scrubbing & Post-Fire Verification
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                      Don Personal Breathing Apparatus (PBA) masks. Engage the Trace Contaminant Control System (TCCS) with activated charcoal and catalytic oxidizers. Test for toxic gases (CO &lt; 50 ppm, HF &lt; 1 ppm) using Draeger tubes or optical sensors before opening hatches.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action trigger */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs font-mono text-slate-300">
                  Ready to test your response time under time pressure?
                </span>
                {onTriggerRandomScenario && (
                  <button
                    onClick={() => {
                      onTriggerRandomScenario();
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Launch Random Drill Scenario</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SHORTCUTS & AUDIO */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
                <Keyboard className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Cockpit Audio Feedback & Global Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Rapid reflexes are essential in zero-G fire safety. NULLG supports real-time Web Audio API ambient feedback and keyboard hotkeys.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Web Audio API Ventilation Hum
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[10px]">A</kbd> or click <strong>Audio Mode</strong> in the navbar to toggle the ambient ventilation hum synthesizer. As you increase airflow speed (0.0 to 1.5 m/s), the hum frequency dynamically climbs from 45 Hz to 240 Hz.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-mono font-bold text-red-300 flex items-center gap-2">
                    <Siren className="w-4 h-4 text-red-400" />
                    Emergency Klaxon Siren
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Triggers when a fire scenario starts or via the <strong>"Test Siren"</strong> button in the drill header. Employs a dual-oscillator swept frequency with dynamic compression for maximum acoustic clarity.
                  </p>
                </div>
              </div>

              {/* Table of Shortcuts */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 grid grid-cols-12">
                  <span className="col-span-3">KEY</span>
                  <span className="col-span-4">ACTION</span>
                  <span className="col-span-5">DESCRIPTION</span>
                </div>
                <div className="divide-y divide-slate-800/80 bg-slate-950/70">
                  <div className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-3 text-cyan-400 font-bold"><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Space</kbd></span>
                    <span className="col-span-4 text-white font-semibold">Toggle Ignition</span>
                    <span className="col-span-5 text-slate-400">Instantly spark or extinguish the combustion chamber flame</span>
                  </div>
                  <div className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-3 text-cyan-400 font-bold"><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">R</kbd></span>
                    <span className="col-span-4 text-white font-semibold">Reset to 0-G</span>
                    <span className="col-span-5 text-slate-400">Restore 0.0G, 21% O₂, 0.15 m/s airflow, 101.3 kPa standard ISS air</span>
                  </div>
                  <div className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-3 text-cyan-400 font-bold"><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">A</kbd></span>
                    <span className="col-span-4 text-white font-semibold">Audio Mode</span>
                    <span className="col-span-5 text-slate-400">Toggle ambient ventilation pitch synthesizer on/off</span>
                  </div>
                  <div className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-3 text-cyan-400 font-bold"><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">1 - 5</kbd></span>
                    <span className="col-span-4 text-white font-semibold">Switch Viewports</span>
                    <span className="col-span-5 text-slate-400">Jump directly between Flame [1], Datasets [2], Scatter [3], Risk [4], Drill [5]</span>
                  </div>
                  <div className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-3 text-cyan-400 font-bold"><kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">?</kbd></span>
                    <span className="col-span-4 text-white font-semibold">Shortcuts Guide</span>
                    <span className="col-span-5 text-slate-400">Toggle accessibility keyboard shortcuts modal</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SAFETY CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Astronaut Safety Readiness Verification
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Check each item below to verify your operational comprehension before live emergency drill simulations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Readiness Score:</span>
                  <span className={`text-base font-mono font-bold px-3 py-1 rounded-xl border ${
                    isAllCertified
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-slate-900 text-amber-300 border-slate-700'
                  }`}>
                    {totalChecked} / {checklistItems.length}
                  </span>
                </div>
              </div>

              {/* Certification banner */}
              {isAllCertified ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/50 flex items-center justify-between flex-wrap gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                        FLIGHT SAFETY CLEARANCE GRANTED: MISSION READY
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        You have verified all 6 core spaceflight combustion safety rules. You are authorized to command drills.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600">
                    CERTIFIED ASTRONAUT
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Click any unverified checklist card below to complete your flight certification.</span>
                </div>
              )}

              {/* Checklist Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {checklistItems.map((item) => {
                  const isChecked = checkedChecklist[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-4 rounded-2xl border text-xs font-mono cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-emerald-950/25 border-emerald-600/50 shadow-sm'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'border border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                            {item.category}
                          </span>
                          <span className={`font-bold text-xs ${isChecked ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 4. DASHBOARD FOOTER BAR                                                   */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800/90 flex items-center justify-between flex-wrap gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NULLG • NASA Space App Challenge | Flame Safety Intelligence</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold transition-all shadow-md active:scale-95"
            >
              Return to Emergency Drill
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
