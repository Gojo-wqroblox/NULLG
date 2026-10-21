export type GasRole = 'oxidizer' | 'fuel' | 'diluent' | 'suppressant';

export interface GasDefinition {
  id: string;
  name: string;
  chemicalFormula: string;
  role: GasRole;
  molecularWeight: number; // g/mol
  heatCapacityCp: number; // J/(mol·K) at 300K
  flammabilityRange?: [number, number]; // [lower %, upper %]
  description: string;
  beginnerAnalogy: string;
  color: string;
  badgeColor: string;
  isHazardousToInhale?: boolean;
}

export type FuelCategory = 'solid_polymer' | 'flight_suit' | 'gas_leak' | 'battery';

export interface FuelDefinition {
  id: string;
  name: string;
  category: FuelCategory;
  material: string;
  ignitionTempC: number;
  sootIndex: number; // 0 to 10
  toxicity: 'Low' | 'Moderate' | 'High' | 'Lethal';
  beginnerDescription: string;
}

export interface AtmospherePreset {
  id: string;
  name: string;
  subtitle: string;
  missionEra: string;
  badge: string;
  badgeType: 'danger' | 'warning' | 'nominal' | 'historic';
  description: string;
  laypersonNote: string;
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number; // m/s
  fuelType: string;
}

export interface RankedHazard {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface SIAnalysisResult {
  dangerLevel: 'EXTREME' | 'HIGH' | 'ELEVATED' | 'NOMINAL' | 'EXTINGUISHED';
  riskScore: number;
  summarySimple: string;
  scientificInterpretation: string;
  flameBehavior: string;
  rankedHazards: RankedHazard[];
  astronautProtocol: string[];
  historicalPrecedent: string;
  flameTempK?: number;
  quenchRadiusMm?: number;
  flameRadiusCm?: number;
}

export interface PresentationSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  analogyTitle: string;
  analogyContent: string;
  technicalDepth: string;
  points: { title: string; detail: string; tag?: string }[];
  visualHint: 'sphere_vs_teardrop' | 'apollo_mir_history' | 'gas_mixology' | 'invisible_hydrogen' | 'suppression_protocols' | 'artemis_mars';
  takeaway: string;
}
