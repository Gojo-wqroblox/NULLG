import { SIAnalysisResult } from '../types';

export async function analyzeFireSafetySI(params: {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number;
  fuelType: string;
  isBeginnerMode: boolean;
}): Promise<SIAnalysisResult> {
  try {
    const res = await fetch('/api/si/analyze-fire-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return calculateThermodynamics(params, data);
  } catch (err) {
    console.warn('API call failed or offline, calculating locally:', err);
    return calculateThermodynamics(params, fallbackLocalCalculation(params));
  }
}

import { generateCaptainResponse } from './captainIntelligence';

export async function askCommanderSI(question: string, chamberState: any, isBeginnerMode: boolean): Promise<string> {
  try {
    const res = await fetch('/api/si/ask-commander', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, chamberState, isBeginnerMode }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.answer || generateCaptainResponse(question, chamberState, isBeginnerMode);
  } catch (err) {
    console.warn('Ask Commander network notice, generating local Captain response:', err);
    return generateCaptainResponse(question, chamberState, isBeginnerMode);
  }
}

// Compute adiabatic flame temp and physical sphere dimensions based on thermodynamics
function calculateThermodynamics(params: any, baseResult: any): SIAnalysisResult {
  const o2 = (params.gases?.O2 || 0) + (params.gases?.N2O || 0) * 0.7;
  const h2 = params.gases?.H2 || 0;
  const ch4 = params.gases?.CH4 || 0;
  const c3h8 = params.gases?.C3H8 || 0;
  const c2h4 = params.gases?.C2H4 || 0;
  const sih4 = params.gases?.SiH4 || 0;
  const nh3 = params.gases?.NH3 || 0;
  const novec = params.gases?.Novec || 0;
  const sf6 = params.gases?.SF6 || 0;
  const co2 = params.gases?.CO2 || 0;
  const p = params.pressureKpa || 101.3;
  const g = params.gravityG ?? 0;
  const vent = params.ventilationSpeed || 0;

  // Extinction if suppressant or low O2
  if (novec > 5 || sf6 > 8 || co2 > 35 || o2 < 11) {
    return {
      ...baseResult,
      flameTempK: 298, // ambient room temp
      quenchRadiusMm: 25.0,
      flameRadiusCm: 0.0,
      dangerLevel: 'EXTINGUISHED',
      riskScore: Math.min(baseResult.riskScore, 10),
    };
  }

  // Base flame temperature estimate (Kelvin)
  let baseTemp = 1400; // Kelvin baseline
  if (sih4 > 1) baseTemp += 900; // Silane auto-ignition burns intensely hot ~2300 K
  if (h2 > 5) baseTemp += 700; // Hydrogen ~2400 K
  if (c2h4 > 3) baseTemp += 650; // Ethylene ~2370 K
  if (c3h8 > 3) baseTemp += 550; // Propane ~2250 K
  if (ch4 > 5) baseTemp += 500; // Methane ~2150 K
  if (nh3 > 10) baseTemp += 250; // Ammonia ~1800 K
  if (o2 > 25) baseTemp += (o2 - 21) * 25; // High O2 elevates adiabatic flame temp
  if (p > 100) baseTemp += 50;

  // Suppressants depress temp
  baseTemp -= novec * 40;
  baseTemp -= sf6 * 30;
  baseTemp -= co2 * 12;
  baseTemp = Math.max(300, Math.min(3200, Math.round(baseTemp)));

  // Quench distance (mm): smaller = easier to ignite through tight wire spaces
  let quench = 2.5;
  if (sih4 > 1) quench = 0.3; // Silane auto-ignites even across microscopic clearances
  else if (h2 > 5) quench = 0.6; // Hydrogen slips through tiny mesh!
  else if (c2h4 > 3) quench = 1.1;
  else if (c3h8 > 3) quench = 1.8;
  if (o2 > 35) quench *= 0.6;
  if (p < 60) quench *= 1.4; // Low pressure increases quench distance
  quench = parseFloat(Math.max(0.2, Math.min(25, quench)).toFixed(2));

  // Sphere diameter in 0-G (cm)
  let sphereRadius = 2.4;
  if (g > 0) {
    sphereRadius = 1.2; // Pointed teardrop
  } else {
    // 0-G expansion
    sphereRadius += (o2 / 100) * 2.0;
    if (sih4 > 1) sphereRadius *= 1.5;
    if (vent < 0.05) sphereRadius *= 1.3; // Expands outward as it searches for oxygen before dying
  }
  sphereRadius = parseFloat(sphereRadius.toFixed(1));

  return {
    ...baseResult,
    flameTempK: baseTemp,
    quenchRadiusMm: quench,
    flameRadiusCm: sphereRadius,
  };
}

function fallbackLocalCalculation(params: any) {
  const o2 = params.gases?.O2 || 0;
  const h2 = params.gases?.H2 || 0;
  const novec = params.gases?.Novec || 0;
  const co2 = params.gases?.CO2 || 0;
  const g = params.gravityG ?? 0;
  const vent = params.ventilationSpeed || 0;

  let dangerLevel: SIAnalysisResult['dangerLevel'] = 'NOMINAL';
  let riskScore = 20;
  let summarySimple = 'Chamber conditions are stable. Low fire hazard.';
  let scientificInterpretation = 'Oxygen concentration and thermal diluent levels prevent self-propagating flame front propagation.';
  let flameBehavior = 'No sustained flame.';

  if (novec > 5 || co2 > 35 || o2 < 12) {
    dangerLevel = 'EXTINGUISHED';
    riskScore = 5;
    summarySimple = 'Fire is smothered! The gas soaks up heat like an ice-cold sponge and snuffs out the flame.';
    flameBehavior = 'Zero combustion. Complete flame quenching.';
    scientificInterpretation = 'Diluent heat capacity depresses adiabatic temperature below the radical chain reaction limit (~1400 K).';
  } else if (h2 > 4 && o2 > 14) {
    dangerLevel = 'EXTREME';
    riskScore = 95;
    summarySimple = 'CRITICAL DANGER: Hydrogen leak! Burns with an invisible, super-hot flame that can ignite with the tiniest spark.';
    flameBehavior = 'Invisible, pale UV-blue spherical reaction shell. Blistering thermal output with zero smoke.';
    scientificInterpretation = 'Hydrogen has a massive flammability range (4-75%) and a microscopic quench distance (0.6mm), making spark suppression nearly impossible.';
  } else if (o2 > 30) {
    dangerLevel = 'EXTREME';
    riskScore = 92;
    summarySimple = 'FLASH FIRE RISK: High oxygen makes everyday materials burn furiously fast, just like in the Apollo 1 tragedy.';
    flameBehavior = 'Blinding white-yellow fireball with explosive surface burn speed.';
    scientificInterpretation = 'High partial pressure of O2 sharply accelerates chemical reaction kinetics and material pyrolysis.';
  } else if (o2 >= 18) {
    if (g === 0) {
      if (vent < 0.05) {
        dangerLevel = 'ELEVATED';
        riskScore = 45;
        summarySimple = 'A quiet, glowing blue sphere forms! Without ventilation, it will slowly choke in its own smoke bubble.';
        flameBehavior = 'Symmetric, quiet blue sphere glowing at ~400-900°C with slow radial diffusion.';
        scientificInterpretation = 'Microgravity diffusion flame. Pure molecular diffusion transport limits soot production and creates self-suffocation.';
      } else {
        dangerLevel = 'HIGH';
        riskScore = 72;
        summarySimple = 'Spacecraft fans are feeding the flame! The breeze stretches the sphere into a blowtorch shape.';
        flameBehavior = 'Asymmetric teardrop flame blown downwind by ventilation air current.';
        scientificInterpretation = 'Forced convection continually supplies fresh O2 to the flame front, overcoming zero-g self-extinction.';
      }
    } else {
      dangerLevel = 'ELEVATED';
      riskScore = 55;
      summarySimple = 'Earth-like flame: hot air rises and pulls in fresh oxygen, making the flame pointy and tall.';
      flameBehavior = 'Classic buoyant teardrop flame flickering at 10-15 Hz with a bright yellow soot plume.';
      scientificInterpretation = 'Buoyant natural convection (Grashof number Gr >> 1) drives hot air up and pulls cold oxidizer in.';
    }
  }

  return {
    dangerLevel,
    riskScore,
    summarySimple,
    scientificInterpretation,
    flameBehavior,
    rankedHazards: [
      {
        title: dangerLevel === 'EXTREME' ? 'Flash Deflagration / Explosion' : 'Rapid Cabin Depressurization & Thermal Rupture',
        severity: dangerLevel === 'EXTREME' ? 'CRITICAL' : 'HIGH',
        description: 'High heat release threatens cabin pressure hull integrity and electrical wire bundles.',
      },
      {
        title: 'Toxic Carbon Monoxide & Cyanide Accumulation',
        severity: 'HIGH',
        description: 'Smoke and lethal gases stay suspended inside the cabin indefinitely instead of venting upward.',
      },
      {
        title: 'Sensor Blindness in Zero Gravity',
        severity: 'MEDIUM',
        description: 'Optical and ionization smoke detectors fail to trigger if air fans do not carry the smoke directly to the intake.',
      },
    ],
    astronautProtocol: [
      '1. Cut cabin ventilation and recirculation fans immediately.',
      '2. Don Emergency Breathing Apparatus (EBA) oxygen mask.',
      '3. Seal hatch of the affected module to isolate the compartment.',
      '4. Discharge clean agent FK-5-1-12 or Fine Water Mist extinguisher.',
    ],
    historicalPrecedent: o2 > 30
      ? 'Apollo 1 (1967): Pure 100% O2 cabin atmosphere at 16.7 psi resulted in a fatal flash fire in 15 seconds.'
      : 'Mir Space Station (1997): Solid oxygen candle ignited an emergency 4-foot fire in zero gravity.',
  };
}
