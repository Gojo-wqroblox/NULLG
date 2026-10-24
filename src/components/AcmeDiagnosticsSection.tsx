import React, { useState } from 'react';
import {
  Camera,
  Cpu,
  Flame,
  Radio,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Thermometer,
  Activity,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface AcmeDiagnosticsSectionProps {
  activeDiagnosticMode?: string;
  onSelectDiagnosticMode?: (mode: string) => void;
}

export const AcmeDiagnosticsSection: React.FC<AcmeDiagnosticsSectionProps> = ({
  activeDiagnosticMode = 'color',
  onSelectDiagnosticMode,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<'imaging' | 'burners' | 'gas' | 'pyrometry' | 'pmt' | 'ops'>('imaging');

  const DIAGNOSTIC_MODES = [
    {
      id: 'color',
      name: 'Digital Color (12-bit)',
      spec: '1360×1024 @ 30 fps',
      desc: 'Motorized zoom, iris, and focus capturing full natural flame luminosity and soot formation.',
      color: 'border-cyan-500 text-cyan-300',
    },
    {
      id: 'bg7',
      name: 'Schott BG7 Pyrometry',
      spec: 'Blue-Green Glass Filter',
      desc: 'Balances red/blue color planes to prevent soot saturation for two-color ratio pyrometry.',
      color: 'border-emerald-500 text-emerald-300',
    },
    {
      id: 'ch_star',
      name: 'CH* Chemiluminescence',
      spec: '430 nm (10 nm FWHM)',
      desc: 'Isolates excited CH* radical emission with 450 nm broadband soot subtraction filter.',
      color: 'border-blue-500 text-blue-300',
    },
    {
      id: 'oh_star',
      name: 'OH* UV Imaging (LLL-UV)',
      spec: '310 nm UV (512×512 @ 30 fps)',
      desc: 'Intensified monochrome camera (280–700 nm) detecting high-temperature reaction fronts.',
      color: 'border-violet-500 text-violet-300',
    },
    {
      id: 'tfp',
      name: 'Thin Filament Pyrometry',
      spec: '5 SiC Fibers + Pt Wire',
      desc: 'Ceramic silicon carbide fiber rake stretched across soot-free flame to measure thermal field.',
      color: 'border-amber-500 text-amber-300',
    },
    {
      id: 'pmt',
      name: 'Triple PMT Quench Sensor',
      spec: '310nm / 430nm / Neutral',
      desc: 'Photomultiplier tubes providing high-speed optical trigger for invisible cool flame extinction.',
      color: 'border-rose-500 text-rose-300',
    },
  ];

  return (
    <div className="flex flex-col gap-4 font-mono text-slate-100">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-500/30 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                NASA ACME & CIR Avionics, Burner & Optical Diagnostics Suite
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                ISS Orbit Payload
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Advanced Combustion via Microgravity Experiments (ACME) in the Combustion Integrated Rack (CIR)
            </p>
          </div>
        </div>

        {/* Diagnostic Optical Filter Mode Switcher */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Select Active Camera & Filter Diagnostic Mode:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {DIAGNOSTIC_MODES.map((mode) => {
              const isSelected = activeDiagnosticMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onSelectDiagnosticMode && onSelectDiagnosticMode(mode.id)}
                  className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? `bg-slate-900 ${mode.color} shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50`
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold leading-tight">{mode.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">{mode.spec}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Sub-systems Explorer */}
      <div className="flex items-center gap-1.5 flex-wrap p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
        <button
          onClick={() => setSelectedTopic('imaging')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'imaging'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          5-Camera Imaging Suite
        </button>
        <button
          onClick={() => setSelectedTopic('burners')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'burners'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          Burners & Stepper Igniter
        </button>
        <button
          onClick={() => setSelectedTopic('gas')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'gas'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          3 Mass Flow Controllers
        </button>
        <button
          onClick={() => setSelectedTopic('pyrometry')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'pyrometry'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          TFP & Pyrometry Rake
        </button>
        <button
          onClick={() => setSelectedTopic('pmt')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'pmt'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          PMTs & Radiometers
        </button>
        <button
          onClick={() => setSelectedTopic('ops')}
          className={`px-3 py-1.5 rounded-xl transition-all border ${
            selectedTopic === 'ops'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          TSC Operations & SAMS-II
        </button>
      </div>

      {/* Detail Content Cards */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs">
        {selectedTopic === 'imaging' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                ACME 5-Camera Suite & Illumination Packages
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
                <span className="text-cyan-300 font-bold">12-Bit Digital Color Camera (1360×1024 @ 30 fps)</span>
                <p className="text-slate-300">
                  Equipped with a motorized zoom, iris, and focus lens and a rotating 4-position filter wheel:
                  (1) Clear for full-spectrum color, (2) Schott BG7 blue-green glass to prevent red soot saturation for two-color pyrometry,
                  (3) 430 nm bandpass (10 nm FWHM) for excited CH* radical chemiluminescence, and (4) 450 nm bandpass for broadband soot background subtraction.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
                <span className="text-violet-300 font-bold">Low-Light-Level Ultraviolet Camera (LLL-UV)</span>
                <p className="text-slate-300">
                  Monochrome camera with a multi-alkali image intensifier (280–700 nm spectral sensitivity) coupled with a narrow 310 nm bandpass filter
                  (10 nm FWHM) to image OH* chemiluminescent reaction fronts at 512×512 resolution and 30 frames per second.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
                <span className="text-amber-300 font-bold">High-Bit Depth Multispectral (HiBMs) & LCTF</span>
                <p className="text-slate-300">
                  Telecentric optical system with Liquid-Crystal Tunable Filter (LCTF) for multispectral pyrometry across discrete wavelength bands,
                  and a second uncooled HiBMs camera dedicated to laser soot extinction measurements at 1024×1024 @ 30 fps.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
                <span className="text-emerald-300 font-bold">Analog Crew Camera & Chamber LEDs</span>
                <p className="text-slate-300">
                  Downlinks live real-time video to the Telescience Support Center (TSC) at NASA Glenn via a turning mirror,
                  illuminated by internal LED arrays to monitor burner positioning, igniter retraction, and flame ignition.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'burners' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                Common Burner Mount, Igniter & Thermocouple Instrumentation
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-amber-300 font-bold block mb-1">Common Burner Mounting & Differential Pressure</span>
                <p className="text-slate-300">
                  Mounts along the chamber axis to support co-flow, inverse, and porous burners (e.g. for the BRE experiment).
                  Internal pressure transducers measure the differential pressure across the outlet porous frit, while surface thermocouples
                  track burner heating to protect flight hardware (with automatic cutoff if burner temperature exceeds safety limits).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-300 font-bold block mb-1">Retracting Stepper-Motor Igniter</span>
                <p className="text-slate-300">
                  A resistively heated coil mounted on a motorized arm driven by an internal stepper motor. Allows exact axial and radial positioning.
                  Once the flame ignites, the coil is retracted to prevent thermal quenching, flow disturbance, and soot accumulation.
                  Tips and arms are crew-exchangeable on orbit.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'gas' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                3 Mass Flow Controllers (MFCs) & Bottle Supply Architecture
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-300 font-bold block mb-1">Flow Range & On-Orbit Dilution</span>
                <p className="text-slate-300">
                  Chamber insert includes three mass flow controllers:
                  Fuel MFC (max 2 standard liters per minute / slpm on N₂ basis) and two high-flow MFCs for oxidizer/inert (up to 10 slpm) and nitrogen balance.
                  Enables on-orbit dynamic dilution of fuel or oxidizer, co-flow flames, and inverse flames (oxidizer routed through burner center).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-indigo-300 font-bold block mb-1">CIR Standard Bottles & Hazard Control</span>
                <p className="text-slate-300">
                  Combustion Integrated Rack provides 1.0L, 2.25L, and 3.8L pressurized gas bottles. Smaller bottles are intentionally selected as a passive
                  hazard control to strictly bound the maximum deficient reactant volume (fuel) that can accidentally escape into the 90-liter chamber.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'pyrometry' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                Thin Filament Pyrometry (TFP) & Two-Color Pyrometry
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-amber-300 font-bold block mb-1">Thin Filament Pyrometry (TFP) SiC Fiber Array</span>
                <p className="text-slate-300">
                  For soot-free flames (e.g. methane, ethane, or methanol), ceramic silicon carbide (SiC) fibers stretch orthogonally across the flame axis.
                  As hot gases pass, the fibers glow in thermal equilibrium with local temperatures. The array can be translated axially downstream of the burner.
                  Includes a platinum calibration wire for in-flight optical emissivity characterization.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-300 font-bold block mb-1">Far-Field Thermocouple Rakes</span>
                <p className="text-slate-300">
                  Accommodates up to 6 far-field thermocouples configured on crew-installable 4-thermocouple rakes (near and far options)
                  to measure thermal spread and boundary heat loss in spherical flame experiments without interfering with optical imaging paths.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'pmt' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white text-sm">
                Photomultiplier Tubes (PMTs) & Linear Radiometer Array
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-rose-300 font-bold block mb-1">Triple Photomultiplier Tube (PMT) Quench Detector</span>
                <p className="text-slate-300">
                  Centered relative to chamber windows with wide-angle orthogonal sightlines. Features 3 PMT modules:
                  (1) 310 nm filter for OH* UV chemiluminescence, (2) 430 nm filter for CH* optical emission, and (3) Neutral density filter.
                  Provides nanosecond-speed detection of dim flame extinction and transitions into invisible cool flames!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-indigo-300 font-bold block mb-1">Broadband Radiometer Array (0.2 – 11 μm)</span>
                <p className="text-slate-300">
                  A crew-exchangeable linear array of thermopile detectors parallel to the chamber axis measuring total radiative heat loss,
                  supplemented by a high-speed 30° wide-view detector downstream of the flame for rapid spherical transient monitoring.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'ops' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">
                Telescience Ground Commanding & Microgravity Monitoring
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-emerald-300 font-bold block mb-1">Telescience Support Center (TSC) Remote Commanding</span>
                <p className="text-slate-300">
                  ACME tests are configured by ISS astronauts but operated remotely from the ground Telescience Support Center (TSC) at NASA Glenn Research Center.
                  Operators run scripted sequences or make manual real-time adjustments (such as tuning burner mass flow) based on downlink telemetry to investigate limit stability.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-300 font-bold block mb-1">SAMS-II Microgravity Accelerometer & Gas Chromatograph</span>
                <p className="text-slate-300">
                  The Space Acceleration Measurement System II (SAMS-II) continuously records residual milli-g and micro-g perturbations caused by ISS crew motion,
                  thruster firings, and solar array tracking. CIR’s on-orbit gas chromatograph validates pre- and post-test gas concentrations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
