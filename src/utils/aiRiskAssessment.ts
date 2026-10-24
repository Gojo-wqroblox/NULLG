/**
 * AI Risk Assessment Engine for Microgravity & Terrestrial Combustion Chambers
 * Simulates NASA-STD-6001B and ISS Spaceflight Fire Safety heuristics.
 */

export type SafetyRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface HazardFactor {
  id: string;
  name: string;
  score: number; // 0 - 100
  status: 'safe' | 'caution' | 'warning' | 'danger';
  detail: string;
  metric: string;
}

export interface AiRiskAssessmentResult {
  level: SafetyRiskLevel;
  overallScore: number; // 0 (safest) to 100 (most dangerous)
  headline: string;
  textualJustification: string;
  recommendations: string[];
  factors: HazardFactor[];
  isExplosivePremix: boolean;
  isHyperOxidant: boolean;
  isToxicAtmosphere: boolean;
  isQuiescentStarvation: boolean;
  nasaStandardCompliance: {
    standard: string;
    compliant: boolean;
    notes: string;
  }[];
}

export interface ChamberAtmosphereState {
  gases: Record<string, number>;
  gravityG: number;
  ventilationSpeed: number;
  pressureKpa: number;
  fuelName: string;
  isIgnited: boolean;
  flameTempK: number;
}

export function evaluateChamberSafety(state: ChamberAtmosphereState): AiRiskAssessmentResult {
  const { gases, gravityG, ventilationSpeed, pressureKpa, fuelName, isIgnited, flameTempK } = state;

  const o2 = gases['O2'] ?? 21;
  const n2 = gases['N2'] ?? 78;
  const co2 = gases['CO2'] ?? 0.4;
  const ch4 = gases['CH4'] ?? 0;
  const kr = gases['Kr'] ?? 0;
  const h2 = gases['H2'] ?? 0;
  const he = gases['He'] ?? 0;
  const ar = gases['Ar'] ?? 0;
  const co = gases['CO'] ?? 0;
  const c3h8 = gases['C3H8'] ?? 0;

  // 1. Check Flammable Gas Premixes (Lower Flammability Limits in air)
  // H2: 4.0%, CH4: 5.0%, C3H8: 2.1%, CO: 12.5%
  const h2Ratio = h2 / 4.0;
  const ch4Ratio = ch4 / 5.0;
  const c3h8Ratio = c3h8 / 2.1;
  const coRatio = co / 12.5;
  const totalCombustiblePct = h2 + ch4 + c3h8 + co;
  const combustibleIndex = Math.max(h2Ratio, ch4Ratio, c3h8Ratio, coRatio);
  const isExplosivePremix = (combustibleIndex >= 0.8 || totalCombustiblePct >= 4.0) && o2 >= 9.0;

  // 2. Oxygen & Oxidizer Partial Pressure Analysis
  // Standard atmospheric pO2 = 101.3 * 0.21 = 21.3 kPa
  const pO2 = (pressureKpa * (o2 / 100));
  const isHyperOxidant = o2 >= 30 || pO2 >= 32;
  const isExtremeOxygen = o2 >= 50 || pO2 >= 55;
  const isHypoxicSuppression = o2 < 12.5 || (o2 < 14.5 && gravityG === 0 && ventilationSpeed < 0.05);

  // 3. Toxic Gas Accumulation (Carbon Monoxide)
  const isToxicAtmosphere = co >= 0.05; // 500 ppm threshold for rapid human toxicity
  const isLethalCO = co >= 0.5; // 5,000 ppm lethal concentration

  // 4. Convective / Microgravity Regime
  // In 0-G without ventilation: soot and combustion products form a spherical blanket causing self-starvation
  const isQuiescentStarvation = gravityG === 0 && ventilationSpeed < 0.03 && isIgnited;
  const isHighVentDraft = ventilationSpeed >= 0.25;
  const isHypergravity = gravityG >= 3.0;

  // 5. Thermal Quench Sinks
  const isHighCO2Smother = co2 >= 20;
  const isHighHeliumQuench = he >= 18;

  // Compute Factor Scores (0 = safe, 100 = extreme danger)
  // Factor A: Combustible Premix Score
  let premixScore = Math.min(100, Math.round(combustibleIndex * 85 + (totalCombustiblePct > 0 ? 15 : 0)));
  if (!isIgnited && premixScore > 0) {
    // If not ignited, it's still an unignited explosive hazard primed for spark
    premixScore = Math.min(95, premixScore * 0.9);
  }

  // Factor B: Oxidizer Hazard Score
  let oxidizerScore = 20;
  if (isExtremeOxygen) oxidizerScore = 100;
  else if (isHyperOxidant) oxidizerScore = 75 + (o2 - 30) * 1.25;
  else if (o2 > 23) oxidizerScore = 40 + (o2 - 23) * 5;
  else if (o2 >= 16) oxidizerScore = 18;
  else if (o2 >= 12) oxidizerScore = 10;
  else oxidizerScore = 5;

  // Factor C: Aerodynamic & Buoyancy Flame Propagation Score
  let aeroScore = 25;
  if (gravityG === 0) {
    if (ventilationSpeed < 0.03) aeroScore = 10; // Quiescent microgravity self-extinguishes
    else if (ventilationSpeed < 0.12) aeroScore = 35;
    else aeroScore = 65; // Forced airflow in 0-G supplies continuous oxidizer (SAFFIRE effect)
  } else if (gravityG <= 1.2) {
    aeroScore = 40 + ventilationSpeed * 30;
  } else {
    // Hypergravity accelerates buoyant chimney velocity
    aeroScore = Math.min(95, 55 + gravityG * 4 + ventilationSpeed * 25);
  }

  // Factor D: Inert Diluent Suppression Capacity (Inverted: higher score = worse suppression / higher hazard)
  let inertScore = 70;
  if (isHighCO2Smother || isHighHeliumQuench) {
    inertScore = 12;
  } else if (co2 > 10 || he > 10 || kr > 20) {
    inertScore = 30;
  } else if (n2 > 70) {
    inertScore = 45;
  } else {
    inertScore = 80; // Insufficient inert cushion
  }

  // Factor E: Toxic Crew Hazard
  let toxicScore = 5;
  if (isLethalCO) toxicScore = 100;
  else if (isToxicAtmosphere) toxicScore = 60 + co * 30;

  // Aggregate Overall Risk Score (0 - 100)
  let overallScore = 0;

  if (isExplosivePremix && isIgnited) {
    overallScore = Math.max(92, Math.round(premixScore));
  } else if (isExplosivePremix && !isIgnited) {
    overallScore = Math.max(82, Math.round(premixScore * 0.88));
  } else if (isExtremeOxygen && isIgnited) {
    overallScore = Math.max(90, Math.round(oxidizerScore));
  } else if (isLethalCO) {
    overallScore = Math.max(88, Math.round(toxicScore));
  } else if (!isIgnited) {
    overallScore = Math.round(premixScore * 0.5 + oxidizerScore * 0.2 + (isToxicAtmosphere ? 40 : 0));
    overallScore = Math.min(overallScore, 48); // Unignited without explosive mixture is Low or Medium at worst
  } else {
    // Active flame combustion
    let base = 30;
    base += (oxidizerScore - 20) * 0.45;
    base += (aeroScore - 25) * 0.35;
    base += (inertScore - 40) * 0.25;
    base += premixScore * 0.4;
    base += toxicScore * 0.2;

    if (isHighCO2Smother || isHighHeliumQuench || isHypoxicSuppression) {
      base *= 0.4; // Heavily quenched
    }

    if (isQuiescentStarvation) {
      base *= 0.5; // Suffocating in its own combustion sphere
    }

    overallScore = Math.round(Math.min(100, Math.max(0, base)));
  }

  // Determine Safety Risk Level Tier
  let level: SafetyRiskLevel = 'Low';
  if (overallScore >= 80 || (isExplosivePremix && isIgnited) || (isExtremeOxygen && isIgnited)) {
    level = 'Critical';
  } else if (overallScore >= 55 || isHyperOxidant || isExplosivePremix || isHighVentDraft && o2 > 25) {
    level = 'High';
  } else if (overallScore >= 30 || (isIgnited && !isHypoxicSuppression && !isHighCO2Smother)) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  // Generate Scientific Headline & Textual Justification
  let headline = '';
  let justificationParagraphs: string[] = [];
  const recommendations: string[] = [];

  if (level === 'Critical') {
    if (isExplosivePremix) {
      headline = 'CRITICAL HAZARD: Premixed Combustible Atmosphere Detected Within Flammability Envelope';
      justificationParagraphs.push(
        `The current atmospheric mixture contains ${totalCombustiblePct.toFixed(1)}% volatile fuel gases ` +
        `(${[
          h2 > 0 ? `${h2.toFixed(1)}% H₂ (LFL: 4.0%)` : '',
          ch4 > 0 ? `${ch4.toFixed(1)}% CH₄ (LFL: 5.0%)` : '',
          c3h8 > 0 ? `${c3h8.toFixed(1)}% C₃H₈ (LFL: 2.1%)` : '',
          co > 0 ? `${co.toFixed(1)}% CO (LFL: 12.5%)` : '',
        ].filter(Boolean).join(', ')}) with ${o2.toFixed(1)}% oxidizer O₂. This enters the explosive deflagration regime.`
      );
      justificationParagraphs.push(
        `Under active ignition or electrostatic discharge, volumetric flame speed will rapidly transition from laminar deflagration to catastrophic overpressurization, exceeding the structural design margins of closed spacecraft modules.`
      );
      recommendations.push('Immediate emergency chamber purge with inert Nitrogen (N₂) or Argon (Ar).');
      recommendations.push('De-energize all igniters and spark sources immediately.');
      recommendations.push('Vent chamber to vacuum or exhaust scrubber.');
    } else if (isExtremeOxygen) {
      headline = 'CRITICAL HAZARD: Extreme Hyper-Oxidant Atmosphere (Apollo 1 Analogue)';
      justificationParagraphs.push(
        `Oxygen concentration is at an extreme ${o2.toFixed(1)}% with an oxidizer partial pressure of ${pO2.toFixed(1)} kPa. ` +
        `At this elevated oxygen index, the limiting oxygen threshold for normally fire-resistant polymers, gaskets, and clothing is surpassed, causing virtually all organic materials to combust instantaneously.`
      );
      justificationParagraphs.push(
        `The combustion heat release rate increases exponentially with (pO₂)¹.⁵. High-temperature flame fronts (${flameTempK} K) will initiate rapid flashover across adjacent structural hardware without thermal standoff.`
      );
      recommendations.push('Dilute chamber atmosphere immediately with Nitrogen (N₂) to bring O₂ below 21%.');
      recommendations.push('Depressurize chamber if structural containment temperature rises.');
    } else if (isLethalCO) {
      headline = 'CRITICAL HAZARD: Lethal Toxic Plume (Carbon Monoxide Accumulation)';
      justificationParagraphs.push(
        `Carbon monoxide concentration has climbed to ${co.toFixed(2)}% (${(co * 10000).toFixed(0)} ppm). In a closed life support volume, CO concentrations above 500 ppm cause fatal carboxyhemoglobin saturation within minutes.`
      );
      recommendations.push('Activate environmental control and life support system (ECLSS) catalytic oxidizers.');
      recommendations.push('Isolate habitat volume from crew breathing compartments.');
    } else {
      headline = 'CRITICAL HAZARD: Uncontrolled High-Energy Combustion Instability';
      justificationParagraphs.push(
        `Multiple compounding risk factors have converged: elevated oxygen (${o2.toFixed(1)}%), hypergravity or forced ventilation (${ventilationSpeed.toFixed(2)} m/s), and active flame core temperature reaching ${flameTempK} K.`
      );
      recommendations.push('Cut ventilation flow to starve flame of fresh convective oxidizer.');
      recommendations.push('Inject CO₂ suppressant blanket.');
    }
  } else if (level === 'High') {
    headline = 'HIGH RISK: Accelerated Flame Spread & Elevated Thermal Standoff Hazard';
    if (isHyperOxidant) {
      justificationParagraphs.push(
        `Oxygen concentration of ${o2.toFixed(1)}% exceeds the nominal NASA spacecraft safety threshold of 24.1% O₂ (NASA-STD-6001B). Elevated oxygen shortens chemical reaction induction time and drastically widens material flammability limits.`
      );
    }
    if (ventilationSpeed >= 0.20) {
      justificationParagraphs.push(
        `Forced ventilation at ${ventilationSpeed.toFixed(2)} m/s provides continuous forced-convection boundary layer replenishment. In microgravity (0-G), this prevents natural combustion product smothering and sustains steady surface fire propagation along fuel wicks, mirroring the findings of the NASA SAFFIRE spaceflight campaign.`
      );
    }
    if (gravityG >= 2.0) {
      justificationParagraphs.push(
        `Elevated gravity (${gravityG.toFixed(1)}G) generates vigorous buoyant chimney plumes with upward convective velocities, increasing local Reynolds number and turbulent air entrainment.`
      );
    }
    if (justificationParagraphs.length === 0) {
      justificationParagraphs.push(
        `Active combustion with fuel '${fuelName}' at ${flameTempK} K is operating in a boundary zone with reduced inert buffer (${n2.toFixed(1)}% N₂) and sustained oxidizer delivery.`
      );
    }
    recommendations.push('Throttle ventilation velocity below 0.10 m/s to limit boundary layer oxygen transport.');
    recommendations.push('Introduce inert buffer gases (CO₂ or N₂) to increase thermal capacity of the ambient.');
    recommendations.push('Monitor chamber temperature history for thermal runaway.');
  } else if (level === 'Medium') {
    headline = 'MEDIUM RISK: Controlled Steady-State Combustion with Nominal Safeguards';
    justificationParagraphs.push(
      `The combustion chamber is operating in a controlled, steady-state diffusion flame regime. Oxygen level (${o2.toFixed(1)}%) is within standard terrestrial and ISS cabin atmospheric envelopes (19.5% - 23.5% O₂).`
    );
    if (gravityG === 0) {
      justificationParagraphs.push(
        `In microgravity (0.0G) with moderate ventilation (${ventilationSpeed.toFixed(2)} m/s), diffusion-controlled transport governs droplet vapor evaporation. While the flame produces steady heat (${flameTempK} K), the absence of buoyant chimney draft keeps thermal radiation localized.`
      );
    } else {
      justificationParagraphs.push(
        `At ${gravityG.toFixed(1)}G gravity, standard buoyant updrafts shape the tear-drop flame geometry. Heat transfer occurs predominantly through natural convection.`
      );
    }
    recommendations.push('Maintain active monitoring of temperature stabilization graph.');
    recommendations.push('Ensure chamber ventilation fans maintain laminar flow without localized stagnation.');
  } else {
    // Low
    headline = 'LOW RISK: Quiescent, Hypoxic, or Passivated Safe Environment';
    if (!isIgnited) {
      justificationParagraphs.push(
        `Combustion source is currently unignited (cold state). Chamber temperature rests at ambient equilibrium (~298 K). No volatile combustible gases have exceeded their lower flammability limit.`
      );
    } else if (isQuiescentStarvation) {
      justificationParagraphs.push(
        `Microgravity conditions (0.0G) combined with near-zero convective ventilation (${ventilationSpeed.toFixed(2)} m/s) induce self-extinguishing diffusive choke. As discovered in NASA FLEX and ACME/CFM experiments, the accumulation of combustion products (CO₂ and H₂O) around the spherical reaction zone starves the flame of incoming O₂, driving it toward radiant extinction or cool flame cessation.`
      );
    } else if (isHighCO2Smother) {
      justificationParagraphs.push(
        `High concentration of Carbon Dioxide (${co2.toFixed(1)}% CO₂) provides significant molar heat capacity and radiative cooling, siphoning thermal energy from the flame sheet faster than chemical kinetics can replenish it.`
      );
    } else if (isHighHeliumQuench) {
      justificationParagraphs.push(
        `Helium concentration (${he.toFixed(1)}% He) acts as an intense thermal conduction siphon, dispersing thermal enthalpy away from the droplet reaction zone and preventing thermal runaway.`
      );
    } else if (isHypoxicSuppression) {
      justificationParagraphs.push(
        `Oxygen concentration (${o2.toFixed(1)}% O₂) is below the Limiting Oxygen Index (LOI) required for steady hydrocarbon combustion. Diffusion kinetics cannot sustain self-propagating flame reactions.`
      );
    } else {
      justificationParagraphs.push(
        `Atmosphere parameters are passivated with adequate inert diluent buffer (${n2.toFixed(1)}% N₂) and minimal convective propagation vectors.`
      );
    }
    recommendations.push('Nominal environment. Safe for extended scientific data collection.');
    recommendations.push('Standard sensors sufficient; no automated suppression intervention required.');
  }

  // Hazard Factors Breakdown for UI
  const factors: HazardFactor[] = [
    {
      id: 'premix',
      name: 'Combustible Vapor & Explosion Potential',
      score: premixScore,
      status: premixScore > 75 ? 'danger' : premixScore > 35 ? 'warning' : premixScore > 10 ? 'caution' : 'safe',
      detail: totalCombustiblePct > 0 
        ? `${totalCombustiblePct.toFixed(1)}% volatile fuel premix (${[
            h2 > 0 ? `${h2.toFixed(1)}% H₂` : '',
            ch4 > 0 ? `${ch4.toFixed(1)}% CH₄` : '',
            c3h8 > 0 ? `${c3h8.toFixed(1)}% C₃H₈` : '',
            co > 0 ? `${co.toFixed(1)}% CO` : ''
          ].filter(Boolean).join(', ')})`
        : 'Zero volatile flammable gas premix detected',
      metric: `${totalCombustiblePct.toFixed(1)}% Combustibles`,
    },
    {
      id: 'oxidizer',
      name: 'Oxidizer Flammability & Oxygen Index',
      score: oxidizerScore,
      status: oxidizerScore > 75 ? 'danger' : oxidizerScore > 40 ? 'warning' : oxidizerScore > 20 ? 'caution' : 'safe',
      detail: `pO₂ = ${pO2.toFixed(1)} kPa (${o2.toFixed(1)}% mol fraction). ${
        o2 > 30 ? 'Severe hyper-oxidant combustion acceleration' : o2 < 13 ? 'Hypoxic suppression limit reached' : 'Nominal breathable oxidizer buffer'
      }`,
      metric: `${o2.toFixed(1)}% O₂ (${pO2.toFixed(1)} kPa)`,
    },
    {
      id: 'convection',
      name: 'Buoyancy & Convective Flow Vector',
      score: aeroScore,
      status: aeroScore > 70 ? 'danger' : aeroScore > 45 ? 'warning' : aeroScore > 25 ? 'caution' : 'safe',
      detail: gravityG === 0 
        ? ventilationSpeed < 0.03 
          ? '0-G quiescent state: Spherical diffusion flame self-starves' 
          : `0-G forced draft (${ventilationSpeed.toFixed(2)} m/s): Continuous oxidizer delivery (SAFFIRE effect)`
        : `${gravityG.toFixed(1)}G buoyancy: Natural upward chimney draft drives turbulent air entrainment`,
      metric: `${gravityG.toFixed(1)}G • ${ventilationSpeed.toFixed(2)} m/s`,
    },
    {
      id: 'inert',
      name: 'Inert Buffer & Thermal Siphon Efficacy',
      score: 100 - inertScore, // Higher score = better protection
      status: inertScore < 25 ? 'safe' : inertScore < 50 ? 'caution' : inertScore < 75 ? 'warning' : 'danger',
      detail: `${n2.toFixed(0)}% N₂, ${co2.toFixed(1)}% CO₂, ${he.toFixed(1)}% He, ${kr.toFixed(1)}% Kr. ${
        co2 >= 15 ? 'High CO₂ molar heat capacity quenches flame' : he >= 15 ? 'Helium thermal conductivity draws heat rapidly' : 'Standard inert buffer'
      }`,
      metric: `${(100 - o2 - totalCombustiblePct).toFixed(1)}% Inerts`,
    },
    {
      id: 'toxicity',
      name: 'Life Support & Atmospheric Toxicity (CO)',
      score: toxicScore,
      status: toxicScore > 60 ? 'danger' : toxicScore > 25 ? 'warning' : toxicScore > 10 ? 'caution' : 'safe',
      detail: co > 0.05 
        ? `${(co * 10000).toFixed(0)} ppm CO: Hazardous crew asphyxiation threat` 
        : 'CO concentrations within acceptable spacecraft trace levels (< 50 ppm)',
      metric: `${(co * 10000).toFixed(0)} ppm CO`,
    },
  ];

  // NASA Flight Rules Compliance Checks
  const nasaStandardCompliance = [
    {
      standard: 'NASA-STD-6001B Test 1 (Upward Flame Propagation)',
      compliant: o2 <= 24.1 && !isExplosivePremix,
      notes: o2 > 24.1 ? `Exceeds max allowable 24.1% O₂ limit (${o2.toFixed(1)}%)` : 'Within approved microgravity flight envelope',
    },
    {
      standard: 'ISS Flight Rule B13-101 (Cabin Atmospheric O₂ Margin)',
      compliant: o2 >= 19.5 && o2 <= 23.5 && co < 0.005,
      notes: o2 < 19.5 ? 'Hypoxic crew warning' : o2 > 23.5 ? 'High fire hazard flight warning' : 'Nominal cabin atmospheric range',
    },
    {
      standard: 'ACME/FLEX Suppressant & Extinction Criteria',
      compliant: isHighCO2Smother || isHighHeliumQuench || isHypoxicSuppression || !isIgnited,
      notes: isHighCO2Smother ? 'CO₂ radiative heat-sink limit reached' : isHighHeliumQuench ? 'Helium conductive quench active' : 'Combustion sustained without suppressant quench',
    },
  ];

  return {
    level,
    overallScore,
    headline,
    textualJustification: justificationParagraphs.join('\n\n'),
    recommendations,
    factors,
    isExplosivePremix,
    isHyperOxidant,
    isToxicAtmosphere,
    isQuiescentStarvation,
    nasaStandardCompliance,
  };
}
