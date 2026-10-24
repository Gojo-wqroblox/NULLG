/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AVAILABLE_GASES, AVAILABLE_FUELS } from '../data/gases';
import { FuelDefinition } from '../types';
import { evaluateChamberSafety } from './aiRiskAssessment';

export interface SimulationReportParams {
  gases: Record<string, number>;
  flameTempK: number;
  gravityG: number;
  pressureKpa: number;
  ventilationSpeed?: number;
  fuel?: FuelDefinition;
  isIgnited: boolean;
  currentPresetId?: string;
  activeExperimentName?: string;
  activeExperimentCode?: string;
}

/**
 * Escapes a cell value for RFC-4180 CSV compliance
 */
function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Compiles current simulation state, active gas composition, and flame temperature into a formatted CSV report string
 */
export function generateSimulationReportCSV(params: SimulationReportParams): string {
  const {
    gases,
    flameTempK,
    gravityG,
    pressureKpa,
    ventilationSpeed = 0.15,
    fuel = AVAILABLE_FUELS[0],
    isIgnited,
    currentPresetId = 'custom',
    activeExperimentName = 'NASA Combustion Integrated Rack (CIR)',
    activeExperimentCode = 'ISS-FLEX/PSI-159',
  } = params;

  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampLocal = now.toLocaleString();
  const flameTempC = Math.round(flameTempK - 273.15);
  const pressureAtm = (pressureKpa / 101.325).toFixed(4);

  // Safety & Flammability analysis
  const safetyAssessment = evaluateChamberSafety({
    gases,
    gravityG,
    ventilationSpeed,
    pressureKpa,
    fuelName: fuel.name,
    isIgnited,
    flameTempK,
  });

  const o2Pct = gases['O2'] ?? 20.9;
  const co2Pct = gases['CO2'] ?? 0.04;
  const n2Pct = gases['N2'] ?? 78.0;

  // Calculate sum of active gases
  const totalVolumePct = Object.values(gases).reduce((sum, val) => sum + (val || 0), 0);

  // Determine flame regime
  let flameRegime = 'Quenched / Extinguished';
  if (isIgnited) {
    if (gravityG === 0) {
      flameRegime = ventilationSpeed === 0
        ? 'Spherical Quiescent Diffusion Mantle (Zero-G)'
        : 'Spherical Convective Diffusion Mantle (Sub-buoyant Forced Flow)';
    } else if (gravityG < 0.5) {
      flameRegime = 'Sub-buoyant Low-Gravity Diffusion Flame';
    } else if (gravityG <= 1.0) {
      flameRegime = 'Standard Buoyant Tear-Drop Plume (1-G)';
    } else {
      flameRegime = 'Hyper-Gravity Accelerated Buoyant Jet';
    }
  }

  // Estimated flame radius / standoff distance in mm
  let estimatedRadiusMm = 0;
  if (isIgnited) {
    if (gravityG === 0) {
      estimatedRadiusMm = Math.max(1.5, Math.min(12.0, (o2Pct / 21) * 6.5 - (co2Pct / 15) * 1.5));
    } else {
      estimatedRadiusMm = Math.max(1.0, Math.min(8.0, 4.0 / Math.sqrt(Math.max(0.2, gravityG))));
    }
  }

  const lines: string[] = [];

  // =========================================================================
  // SECTION 1: REPORT HEADER & METADATA
  // =========================================================================
  lines.push('# NASA MICROGRAVITY COMBUSTION CHAMBER SIMULATION REPORT');
  lines.push('# COMPILED BY NASA ISS EXPERIMENT SUITE');
  lines.push('');
  lines.push('SECTION,EXECUTIVE_SUMMARY');
  lines.push('Parameter,Value,Unit,Notes');
  lines.push(`Report Generated (UTC),${escapeCsvCell(timestampIso)},UTC,"Automated sensor log snapshot"`);
  lines.push(`Report Generated (Local),${escapeCsvCell(timestampLocal)},Local Time,"Station local timestamp"`);
  lines.push(`Combustion Status,${isIgnited ? 'ACTIVE_IGNITED' : 'EXTINGUISHED'},State,"Primary burner status"`);
  lines.push(`Flame Temperature (Kelvin),${flameTempK},K,"Calculated flame temperature"`);
  lines.push(`Flame Temperature (Celsius),${flameTempC},°C,"Calculated flame temperature in Celsius"`);
  lines.push(`Gravity Level,${gravityG.toFixed(2)},G,"${gravityG === 0 ? 'Microgravity 0-G (ISS)' : `${gravityG.toFixed(2)}G gravitational acceleration`}"`);
  lines.push(`Chamber Total Pressure,${pressureKpa.toFixed(2)},kPa,"Standard atmospheric datum is 101.325 kPa"`);
  lines.push(`Chamber Total Pressure (atm),${pressureAtm},atm,"Standard atmospheres"`);
  lines.push(`Forced Ventilation Airflow,${ventilationSpeed.toFixed(2)},m/s,"Sub-buoyant co-flow velocity"`);
  lines.push(`Selected Fuel Name,${escapeCsvCell(fuel.name)},Text,"Combustion fuel source"`);
  lines.push(`Fuel Category,${escapeCsvCell(fuel.category)},Category,"Fuel classification"`);
  lines.push(`Fuel Material Composition,${escapeCsvCell(fuel.material)},Material,"Chemical formulation"`);
  lines.push(`Fuel Autoignition Temp,${fuel.ignitionTempC},°C,"Standard atmospheric ignition temperature"`);
  lines.push(`Fuel Soot Index,${fuel.sootIndex},Score / 10,"NASA soot agglomeration index"`);
  lines.push(`Fuel Pyrolysis Toxicity,${escapeCsvCell(fuel.toxicity)},Toxicity,"Combustion offgas hazard"`);
  lines.push(`Active Simulation Preset,${escapeCsvCell(currentPresetId || 'User Custom')},Preset ID,"Preset environment tag"`);
  lines.push(`NASA Experiment Baseline,${escapeCsvCell(activeExperimentName)},Program,"${activeExperimentCode}"`);
  lines.push(`Flame Geometry Regime,${escapeCsvCell(flameRegime)},Regime,"Morphology under current G and airflow"`);
  lines.push(`Estimated Flame Radius / Standoff,${estimatedRadiusMm.toFixed(2)},mm,"Estimated flame boundary standoff"`);
  lines.push(`AI Safety Risk Level,${escapeCsvCell(safetyAssessment.level)},Safety Level,"NASA-STD-6001B assessment"`);
  lines.push(`AI Risk Score,${safetyAssessment.overallScore},Score / 100,"0 = inert, 100 = extreme hazard"`);
  lines.push(`AI Risk Headline,${escapeCsvCell(safetyAssessment.headline)},Summary,"Risk headline assessment"`);
  lines.push('');

  // =========================================================================
  // SECTION 2: ACTIVE GAS ATMOSPHERE COMPOSITION
  // =========================================================================
  lines.push('SECTION,ACTIVE_GAS_ATMOSPHERE_COMPOSITION');
  lines.push('Gas_ID,Gas_Name,Chemical_Formula,Role,Volume_Fraction_Pct,Partial_Pressure_kPa,Partial_Pressure_atm,Mole_Fraction,Molecular_Weight_g_mol,Status');

  // List all defined gases with current concentration
  AVAILABLE_GASES.forEach((gasDef) => {
    const volPct = gases[gasDef.id] ?? 0;
    const partialPressureKpa = (volPct / 100) * pressureKpa;
    const partialPressureAtmVal = (partialPressureKpa / 101.325);
    const moleFraction = volPct / 100;
    const statusNote = volPct > 0 ? (volPct >= 20 ? 'Dominant Component' : 'Trace / Active Gas') : 'Not Present';

    lines.push([
      escapeCsvCell(gasDef.id),
      escapeCsvCell(gasDef.name),
      escapeCsvCell(gasDef.chemicalFormula),
      escapeCsvCell(gasDef.role),
      volPct.toFixed(3),
      partialPressureKpa.toFixed(3),
      partialPressureAtmVal.toFixed(4),
      moleFraction.toFixed(4),
      gasDef.molecularWeight.toFixed(3),
      escapeCsvCell(statusNote),
    ].join(','));
  });

  // Total summary row for gas composition
  lines.push([
    'TOTAL',
    'Chamber Atmosphere Mixture',
    'Mixture',
    'Bulk Atmosphere',
    totalVolumePct.toFixed(2),
    pressureKpa.toFixed(2),
    pressureAtm,
    (totalVolumePct / 100).toFixed(4),
    '-',
    escapeCsvCell(Math.abs(totalVolumePct - 100) < 0.5 ? 'Normalized 100% Balanced' : `Total sum is ${totalVolumePct.toFixed(1)}%`),
  ].join(','));
  lines.push('');

  // =========================================================================
  // SECTION 3: FLAMMABILITY, LIMITING OXYGEN INDEX & EXTINCTION ANALYSIS
  // =========================================================================
  lines.push('SECTION,COMBUSTION_KINETICS_AND_EXTINCTION_ANALYSIS');
  lines.push('Metric,Current_Value,Benchmark_Limit,Safety_Evaluation');
  
  // Limiting Oxygen Index (LOI)
  const isHypoxic = o2Pct < 12;
  const isHyperOxic = o2Pct > 24;
  lines.push([
    'Oxygen Mole Fraction (XO2)',
    `${(o2Pct / 100).toFixed(3)} (${o2Pct.toFixed(1)}%)`,
    'LOI = 0.120 (12.0%)',
    escapeCsvCell(
      isHypoxic
        ? 'BELOW Limiting Oxygen Index (LOI): Diffusion flame will self-quench / extinguish'
        : isHyperOxic
        ? 'HYPER-OXIC: Accelerated flame front deflagration risk exceeding standard spacecraft limits'
        : 'NOMINAL FLAMMABILITY: Within sustainable microgravity diffusion envelope'
    ),
  ].join(','));

  // CO2 Suppressant Fraction
  const isCo2Suppressed = co2Pct > 15;
  lines.push([
    'Carbon Dioxide Suppressant (CO2)',
    `${(co2Pct / 100).toFixed(3)} (${co2Pct.toFixed(1)}%)`,
    'Suppression Threshold = 15.0 - 25.0%',
    escapeCsvCell(
      isCo2Suppressed
        ? 'ACTIVE SUPPRESSION: High molar heat capacity dampens chemical kinetics and quenches flame'
        : 'BASELINE: Inert concentration below active extinguishing boundary'
    ),
  ].join(','));

  // Gravity-Induced Buoyancy vs Diffusion
  lines.push([
    'Buoyancy Grashof Regime',
    `${gravityG.toFixed(2)} G`,
    'Microgravity Criterion: G < 1e-3',
    escapeCsvCell(
      gravityG === 0
        ? 'PURE DIFFUSION / QUASI-STEADY: NASA FLEX spherical symmetry achieved; zero natural convection'
        : 'BUOYANCY-DOMINATED: Natural convective upward flow stretches flame into buoyant tear-drop'
    ),
  ].join(','));

  // Ventilation Reynolds / Peclet Regime
  lines.push([
    'Convective Airflow Velocity',
    `${ventilationSpeed.toFixed(2)} m/s`,
    'Sub-buoyant Limit: < 0.20 m/s',
    escapeCsvCell(
      ventilationSpeed === 0
        ? 'QUIESCENT: Flame will suffocate in its own combustion products (CO2/H2O mantle) if unventilated'
        : ventilationSpeed < 0.25
        ? 'CONTROLLED SUB-BUOYANT FLOW: Replenishes oxygen boundary layer while preserving near-spherical mantle'
        : 'FORCED CONVECTION: Strong wake flow creates trailing flame tail'
    ),
  ].join(','));

  // Soot Formation & Radiative Loss
  const isHighSoot = fuel.sootIndex >= 6;
  lines.push([
    'Soot Formation & Radiation',
    isHighSoot ? `High Soot Radiative Loss (Index ${fuel.sootIndex}/10)` : `Low Soot / Clean Flame (Index ${fuel.sootIndex}/10)`,
    'Radiative Extinction Limit',
    escapeCsvCell(
      isHighSoot
        ? `${fuel.name} generates luminous soot agglomerates in 0-G that radiate heat outward`
        : `${fuel.name} burns with high blue-band chemiluminescence (CH* and C2* radicals) and low radiative loss`
    ),
  ].join(','));
  lines.push('');

  // =========================================================================
  // SECTION 4: APPLIED NASA EXPERIMENT FLIGHT PROGRAM BENCHMARKS
  // =========================================================================
  lines.push('SECTION,NASA_RESEARCH_BENCHMARKS');
  lines.push('Experiment_Code,Full_Name,Primary_Investigation,Key_Insight');
  lines.push('FLEX,"Flame Extinguishment Experiment","Inert-gas suppressant efficacy and droplet burning in microgravity","Discovered cool flame phenomenon and quantified Limiting Oxygen Index (LOI)"');
  lines.push('FLEX-2,"Flame Extinguishment Experiment-2","Multi-component bi-component fuels and soot formation in 0-G","Demonstrated sub-buoyant convective interaction and droplet-droplet array combustion"');
  lines.push('PSI-159 CFI-G,"Co-Flow Diffusion Flame in Glovebox","Normal and inverse diffusion flames in reduced gravity","Mapped soot stand-off distance and flame stability across 333 experimental flight tests"');
  lines.push('ACME CIR,"Advanced Combustion via Microgravity Experiments","Modular multi-gas combustion burner in ISS CIR","Extensive mapping of electric field flame deflection, spherical soot, and low-temperature chemistry"');
  lines.push('SOPHIA,"Solid Influent Flame Ignition Assessment","Fabric and spacecraft solid material flammability in varying O2/pressure","Established NASA-STD-6001B pass/fail flammability thresholds"');
  lines.push('');

  // =========================================================================
  // SECTION 5: SAFETY RISK JUSTIFICATION & RECOMMENDATIONS
  // =========================================================================
  lines.push('SECTION,SAFETY_EVALUATION_DETAILS');
  lines.push('Category,Detail');
  lines.push(`Risk Level,${escapeCsvCell(safetyAssessment.level)}`);
  lines.push(`Justification,${escapeCsvCell(safetyAssessment.textualJustification)}`);
  safetyAssessment.recommendations.forEach((rec, idx) => {
    lines.push(`Recommendation_${idx + 1},${escapeCsvCell(rec)}`);
  });

  return lines.join('\r\n');
}

/**
 * Triggers client-side browser download of the formatted CSV report
 */
export function downloadSimulationReportCSV(params: SimulationReportParams): void {
  const csvContent = generateSimulationReportCSV(params);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const fuelCode = (params.fuel?.id || 'sample_fuel').replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `nasa_combustion_report_${fuelCode}_${params.gravityG.toFixed(1)}G_${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
