import React from 'react';
import {
  Wind,
  Flame,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FlameResponseControlsProps {
  gases: Record<string, number>;
  onGasChange?: (gasId: string, val: number) => void;
  ventilationSpeed: number; // m/s
  onVentilationChange?: (speed: number) => void;
  gravityG: number; // G
  onGravityChange?: (g: number) => void;
  isIgnited: boolean;
  onToggleIgnite?: () => void;
  isBeginnerMode?: boolean;
}

export const FlameResponseControls: React.FC<FlameResponseControlsProps> = ({
  gases,
  onGasChange,
  ventilationSpeed,
  onVentilationChange,
  gravityG,
  onGravityChange,
  isIgnited,
  onToggleIgnite,
  isBeginnerMode = false,
}) => {
  const o2 = gases['O2'] ?? 21;
  const co2 = gases['CO2'] ?? 0.4;
  const ch4 = gases['CH4'] ?? 0;
  const kr = gases['Kr'] ?? 0;
  const h2 = gases['H2'] ?? 0;
  const he = gases['He'] ?? 0;
  const co = gases['CO'] ?? 0;
  const c3h8 = gases['C3H8'] ?? 0;

  // ---------------------------------------------------------------------------
  // Real-Time Simulated Flame Response Physics Calculations
  // ---------------------------------------------------------------------------
  // 1. Oxygen Factor: reaction kinetics scale with [O2]
  // Flammability limit typically around 12% O2 for typical hydrocarbons/plastics.
  const isHypoxic = o2 < 12;
  const isNearQuench = o2 >= 12 && o2 < 15;
  const isHyperoxic = o2 > 28;
  const o2Factor = Math.max(0.1, Math.min(2.5, 0.4 + (o2 / 21) * 0.6));

  // 2. Carbon Dioxide Factor: high molar heat capacity thermal sink
  // CO2 suppresses flame by taking heat away from reaction zone
  const co2Damping = Math.max(0.05, 1 - (co2 / 30) * 0.85);
  const isSmotheredByCO2 = co2 > 25;

  // 3. Airflow Factor (Ventilation Speed)
  // In 0G, airflow supplies fresh O2. At 0 m/s in 0G, combustion products accumulate.
  const isStagnantZeroG = gravityG === 0 && ventilationSpeed < 0.02;
  const isHighWind = ventilationSpeed > 0.45;

  // 4. Gravity & Buoyancy Factor (0G to 10G)
  // Buoyant acceleration drives upward chimney effect and flame necking
  const isZeroG = gravityG === 0;
  const isHyperG = gravityG > 3.0;
  const isExtremeHyperG = gravityG >= 8.0;

  // Estimated Flame Morphology & Response Status
  let flameResponseStatus = 'NOMINAL COMBUSTION';
  let flameStatusColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/50';
  let flameDescription = '';
  let flameShapeIcon = 'Sphere';
  let extinctionRisk: 'SAFE' | 'ELEVATED' | 'CRITICAL' | 'EXTINGUISHED' = 'SAFE';

  if (!isIgnited) {
    flameResponseStatus = 'IGNITER OFF / EXTINGUISHED';
    flameStatusColor = 'text-slate-400 border-slate-700 bg-slate-900';
    flameDescription = 'The flame is currently extinguished. Press ignite to strike an electric arc and start combustion.';
    extinctionRisk = 'EXTINGUISHED';
  } else if (isHypoxic || isSmotheredByCO2) {
    flameResponseStatus = isHypoxic ? 'O₂ QUENCHED (HYPOXIC STARVATION)' : 'CO₂ THERMAL QUENCH (SMOTHERED)';
    flameStatusColor = 'text-rose-400 border-rose-500/60 bg-rose-950/60 animate-pulse';
    flameDescription = isHypoxic
      ? `Oxygen is at ${o2.toFixed(1)}% (below the 12.0% Limiting Oxygen Index). Reaction kinetics cannot generate enough heat to overcome thermal losses. Flame is self-extinguishing.`
      : `Carbon Dioxide is at ${co2.toFixed(1)}%. Its high molar heat capacity absorbs combustion enthalpy rapidly, chilling the reaction front until flame quenches.`;
    extinctionRisk = 'CRITICAL';
  } else if (h2 > 5) {
    flameResponseStatus = `HYDROGEN GHOST FLAME (${h2.toFixed(1)}% H₂)`;
    flameStatusColor = 'text-pink-300 border-pink-500/40 bg-pink-950/40';
    flameDescription = `Hydrogen burns with ultra-high burning velocity and an almost invisible pale UV-blue chemiluminescence with scalding heat release and zero smoke.`;
    extinctionRisk = 'ELEVATED';
  } else if (ch4 > 4) {
    flameResponseStatus = `METHANE FLAME ENVELOPE (${ch4.toFixed(1)}% CH₄)`;
    flameStatusColor = 'text-orange-300 border-orange-500/40 bg-orange-950/40';
    flameDescription = `Methane fuel enrichment forms a luminous azure-blue reaction shell with enhanced soot cap luminosity.`;
    extinctionRisk = 'SAFE';
  } else if (c3h8 > 2) {
    flameResponseStatus = `PROPANE HEAVY SOOT FLAME (${c3h8.toFixed(1)}% C₃H₈)`;
    flameStatusColor = 'text-amber-300 border-amber-500/40 bg-amber-950/40';
    flameDescription = `Dense propane hydrocarbon fuel produces large incandescent yellow soot agglomerations that float freely in microgravity.`;
    extinctionRisk = 'SAFE';
  } else if (kr > 10) {
    flameResponseStatus = `KRYPTON NOBLE DAMPING (${kr.toFixed(1)}% Kr)`;
    flameStatusColor = 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-950/40';
    flameDescription = `Ultra-heavy Krypton (MW 83.8) increases gas density significantly, dampening molecular diffusion and cooling the reaction fringe.`;
    extinctionRisk = 'SAFE';
  } else if (he > 10) {
    flameResponseStatus = `HELIUM HEAT SIPHON (${he.toFixed(1)}% He)`;
    flameStatusColor = 'text-amber-300 border-amber-500/40 bg-amber-950/40';
    flameDescription = `Helium high thermal conductivity rapidly whisks heat away from the flame zone, narrowing combustion limits.`;
    extinctionRisk = 'ELEVATED';
  } else if (isStagnantZeroG) {
    flameResponseStatus = 'STAGNANT 0-G (CHOKING IN CO₂ SHELL)';
    flameStatusColor = 'text-amber-400 border-amber-500/50 bg-amber-950/50 animate-pulse';
    flameDescription = 'In zero gravity with zero ventilation (0.00 m/s), absence of buoyancy traps combustion products around the wick. The flame is suffocating in its own CO₂ sphere!';
    extinctionRisk = 'CRITICAL';
  } else if (isExtremeHyperG) {
    flameResponseStatus = `EXTREME 10G HYPERGRAVITY CHIMNEY (${gravityG.toFixed(1)}g)`;
    flameStatusColor = 'text-rose-400 border-rose-500/50 bg-rose-950/40';
    flameDescription = `Intense gravitational buoyancy (Grashof number Gr > 10⁶) pulls a violent chimney updraft. The flame base constricts (necking factor 0.35), the tip shoots upward, and rapid turbulent acoustic flicker sets in.`;
    extinctionRisk = 'ELEVATED';
  } else if (isHyperG) {
    flameResponseStatus = `HYPERGRAVITY BUOYANT CONVECTION (${gravityG.toFixed(1)}g)`;
    flameStatusColor = 'text-indigo-300 border-indigo-500/40 bg-indigo-950/40';
    flameDescription = `Elevated buoyancy accelerates hot convective updraft, pulling fresh air into the flame base and stretching the incandescent luminous soot zone.`;
    extinctionRisk = 'SAFE';
  } else if (isZeroG) {
    if (ventilationSpeed > 0.1) {
      flameResponseStatus = `FORCED-CONVECTION 0-G TAIL (${ventilationSpeed.toFixed(2)} m/s)`;
      flameStatusColor = 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40';
      flameDescription = `Microgravity diffusion flame stretched downwind by spacecraft air fans. Fresh oxygen is continuously swept over the fuel, sustaining an asymmetric blue-orange convective wake.`;
    } else {
      flameResponseStatus = 'QUIESCENT ZERO-G BLUE SPHERE';
      flameStatusColor = 'text-blue-300 border-blue-500/40 bg-blue-950/40';
      flameDescription = `Pure isotropic diffusion flame in microgravity. Without buoyancy, hot gases diffuse uniformly in all directions, forming a perfectly spherical dim blue chemiluminescent envelope.`;
    }
  } else {
    // 1G Earth Normal
    flameResponseStatus = `EARTH NORMAL BUOYANT TEARDROP (${gravityG.toFixed(1)}g)`;
    flameStatusColor = 'text-amber-300 border-amber-500/40 bg-amber-950/40';
    flameDescription = `Classical 1-G candle flame. Natural thermal buoyancy draws cool air into the base, creating the familiar upright flickering teardrop with golden incandescent soot apex.`;
  }

  // Calculated physical parameters for quantitative display
  const effectiveRadiusMm = !isIgnited
    ? 0
    : Math.max(0.5, 3.2 * o2Factor * co2Damping * (isZeroG ? 1.25 : 0.95));
  const reactionRateMultiplier = !isIgnited ? 0 : (o2Factor * co2Damping);
  const flameHeightMm = !isIgnited
    ? 0
    : isZeroG
    ? effectiveRadiusMm * 2.0
    : effectiveRadiusMm * (1.8 + Math.pow(Math.max(0.1, gravityG), 0.38) * 1.6);

  return (
    <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-4 shadow-2xl backdrop-blur-md flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Simulated Flame Response Controls
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                O₂ • CO₂ • AIRFLOW • G-FORCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Adjust sliders below to observe real-time physical responses in flame morphology, temperature, and extinction.
            </p>
          </div>
        </div>

        {/* Live Flame State Badge */}
        <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${flameStatusColor}`}>
          <Flame className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span>{flameResponseStatus}</span>
        </div>
      </div>

      {/* 4 Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* =================================================================== */}
        {/* SLIDER 1: OXYGEN CONCENTRATION (O2) */}
        {/* =================================================================== */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex flex-col justify-between gap-2 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Oxygen (O₂)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {o2.toFixed(1)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={o2}
            onChange={(e) => onGasChange?.('O2', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Quick Presets for O2 */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            <button
              onClick={() => onGasChange?.('O2', 0)}
              className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800"
              title="0% Vacuum / Anoxia"
            >
              0%
            </button>
            <button
              onClick={() => onGasChange?.('O2', 12)}
              className="px-1.5 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800"
              title="12% Limiting Oxygen Index (Quench Threshold)"
            >
              12% Limit
            </button>
            <button
              onClick={() => onGasChange?.('O2', 21)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                Math.abs(o2 - 21) < 0.5
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              title="21% Earth / ISS Normal"
            >
              21% Earth
            </button>
            <button
              onClick={() => onGasChange?.('O2', 34)}
              className="px-1.5 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800"
              title="34% Apollo Pre-breathe"
            >
              34% Apollo
            </button>
            <button
              onClick={() => onGasChange?.('O2', 100)}
              className="px-1.5 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700"
              title="100% Pure Oxygen"
            >
              100% Max
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400 italic">
            {isHypoxic
              ? 'Flame starved (<12% O₂). Quenches rapidly.'
              : isHyperoxic
              ? 'Hyperoxic: Intense acceleration, bright hot core.'
              : 'Nominal oxidizer supporting steady combustion.'}
          </p>
        </div>

        {/* =================================================================== */}
        {/* SLIDER 2: CARBON DIOXIDE (CO2) */}
        {/* =================================================================== */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col justify-between gap-2 hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Carbon Dioxide (CO₂)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {co2.toFixed(1)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={co2}
            onChange={(e) => onGasChange?.('CO2', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
          />

          {/* Quick Presets for CO2 */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            <button
              onClick={() => onGasChange?.('CO2', 0.04)}
              className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800"
              title="0.04% Ambient Earth"
            >
              0.04%
            </button>
            <button
              onClick={() => onGasChange?.('CO2', 0.4)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                Math.abs(co2 - 0.4) < 0.2
                  ? 'bg-slate-300 text-slate-950 border-white'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
              title="0.4% ISS Cabin Nominal"
            >
              0.4% ISS
            </button>
            <button
              onClick={() => onGasChange?.('CO2', 5)}
              className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800"
              title="5% Toxic Crew Limit"
            >
              5% Toxic
            </button>
            <button
              onClick={() => onGasChange?.('CO2', 15)}
              className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800"
              title="15% Fire Suppression Onset"
            >
              15% Suppress
            </button>
            <button
              onClick={() => onGasChange?.('CO2', 35)}
              className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800"
              title="35% Total Flame Extinguishment"
            >
              35% Smother
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400 italic">
            {co2 > 25
              ? 'CO₂ thermal blanket: Quenches flame completely.'
              : co2 > 10
              ? 'Cooling reaction zone via high heat capacity.'
              : 'Minimal thermal damping (clean burning).'}
          </p>
        </div>

        {/* =================================================================== */}
        {/* SLIDER 3: FORCED AIRFLOW / VENTILATION */}
        {/* =================================================================== */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-blue-500/30 flex flex-col justify-between gap-2 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Airflow Speed
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
              {ventilationSpeed.toFixed(2)} m/s
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={ventilationSpeed}
            onChange={(e) => onVentilationChange?.(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />

          {/* Quick Presets for Airflow */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            <button
              onClick={() => onVentilationChange?.(0.0)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                ventilationSpeed === 0
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="0.00 m/s Stagnant (Suffocates in 0-G)"
            >
              0 m/s (Stagnant)
            </button>
            <button
              onClick={() => onVentilationChange?.(0.08)}
              className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
              title="0.08 m/s Gentle Draft"
            >
              0.08m/s
            </button>
            <button
              onClick={() => onVentilationChange?.(0.15)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                Math.abs(ventilationSpeed - 0.15) < 0.03
                  ? 'bg-blue-500 text-slate-950 border-blue-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
              title="0.15 m/s Standard ISS Cabin Airflow"
            >
              0.15m/s (ISS)
            </button>
            <button
              onClick={() => onVentilationChange?.(0.40)}
              className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800"
              title="0.40 m/s Duct Fan"
            >
              0.40m/s
            </button>
            <button
              onClick={() => onVentilationChange?.(1.00)}
              className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700"
              title="1.00 m/s High Wind"
            >
              1.0m/s Max
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400 italic">
            {ventilationSpeed === 0 && isZeroG
              ? 'Zero airflow in 0G traps smoke; flame starves.'
              : ventilationSpeed > 0.3
              ? 'Strong forced draft stretches downwind torch tail.'
              : 'Gently supplies fresh oxidizer across wick.'}
          </p>
        </div>

        {/* =================================================================== */}
        {/* SLIDER 4: GRAVITATIONAL FORCE (0G TO 10G) */}
        {/* =================================================================== */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex flex-col justify-between gap-2 hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                G-Force Control
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                gravityG === 0
                  ? 'text-cyan-300 bg-cyan-950/80 border-cyan-800'
                  : gravityG >= 8.0
                  ? 'text-rose-300 bg-rose-950/80 border-rose-800 animate-pulse'
                  : 'text-indigo-300 bg-indigo-950/80 border-indigo-800'
              }`}
            >
              {gravityG.toFixed(1)}g
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="10.0"
            step="0.1"
            value={gravityG}
            onChange={(e) => onGravityChange?.(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />

          {/* Quick Presets for Gravity */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            <button
              onClick={() => onGravityChange?.(0.0)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                gravityG === 0
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="0.0G Microgravity (ISS Sphere)"
            >
              0G Null
            </button>
            <button
              onClick={() => onGravityChange?.(0.16)}
              className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
              title="0.16G Moon"
            >
              0.16G
            </button>
            <button
              onClick={() => onGravityChange?.(1.0)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                Math.abs(gravityG - 1.0) < 0.1
                  ? 'bg-indigo-500 text-slate-950 border-indigo-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
              title="1.0G Earth Normal"
            >
              1G Earth
            </button>
            <button
              onClick={() => onGravityChange?.(3.0)}
              className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
              title="3.0G Launch"
            >
              3G
            </button>
            <button
              onClick={() => onGravityChange?.(10.0)}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                Math.abs(gravityG - 10.0) < 0.1
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800'
              }`}
              title="10.0G Extreme Hypergravity Centrifuge"
            >
              10G Hyper
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400 italic">
            {gravityG === 0
              ? 'Zero buoyancy: Spherical diffusion only.'
              : gravityG >= 8.0
              ? 'Extreme chimney buoyancy: violent necking & flutter.'
              : 'Buoyant updraft creates classic teardrop.'}
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* REAL-TIME SIMULATED FLAME RESPONSE FEEDBACK CARD */}
      {/* ===================================================================== */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 uppercase">
              How the Simulated Flame Responds to Current Changes
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Calc Radius: <strong className="text-cyan-300">{effectiveRadiusMm.toFixed(2)} mm</strong>
            </span>
            <span>
              Height: <strong className="text-amber-300">{flameHeightMm.toFixed(2)} mm</strong>
            </span>
            <span>
              Kinetic Rate: <strong className="text-indigo-300">{(reactionRateMultiplier * 100).toFixed(0)}%</strong>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          {flameDescription}
        </p>

        {/* Detailed Reaction Drivers Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">O₂ Oxidizer Response</span>
            <span className={`font-bold mt-0.5 ${isHypoxic ? 'text-rose-400' : isHyperoxic ? 'text-amber-400' : 'text-cyan-400'}`}>
              {isHypoxic ? 'Quenching (<12%)' : isHyperoxic ? 'Hyper-Combustion' : 'Sustained Reaction'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">CO₂ Thermal Heat Sink</span>
            <span className={`font-bold mt-0.5 ${co2 > 25 ? 'text-rose-400' : co2 > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {co2 > 25 ? 'Complete Blanket' : co2 > 5 ? 'Significant Damping' : 'Negligible Drag'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">Forced Air Flow Wake</span>
            <span className={`font-bold mt-0.5 ${ventilationSpeed === 0 ? (isZeroG ? 'text-rose-400' : 'text-slate-300') : 'text-blue-400'}`}>
              {ventilationSpeed === 0 ? (isZeroG ? 'Stagnant Choke' : 'Pure Buoyant Draft') : `Convective Tilt ${(ventilationSpeed * 28).toFixed(0)}°`}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">Gravitational Morphology</span>
            <span className={`font-bold mt-0.5 ${isZeroG ? 'text-cyan-400' : isExtremeHyperG ? 'text-rose-400' : 'text-indigo-400'}`}>
              {isZeroG ? 'Spherical Blue Bubble' : isExtremeHyperG ? '10G Hyper-Chimney' : `${gravityG.toFixed(1)}g Buoyant Teardrop`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
