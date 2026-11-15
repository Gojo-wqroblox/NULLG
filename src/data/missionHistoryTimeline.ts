/**
 * Chronological Fire-Safety Mission History Timeline
 * Covers Apollo 1 (1967), Apollo 13 (1970), and Space Station Mir (1997),
 * linking each historical incident & engineering reform directly to empirical
 * NASA combustion datasets in `NASA_EXPERIMENTS`.
 */

export type MissionId = 'apollo_1' | 'apollo_13' | 'mir_1997';
export type TimelineCategory = 'incident' | 'investigation' | 'validation';

export interface MissionTimelineDatasetLink {
  experimentId: string;
  viewMode?: 'programs' | 'psi159';
  rationale: string;
}

export interface MissionTimelineEvent {
  id: string;
  missionId: MissionId;
  missionName: string;
  missionYear: number;
  timestampLabel: string;
  category: TimelineCategory;
  title: string;
  locationOrSystem: string;
  summary: string;
  telemetrySnapshot: {
    o2Pct: number;
    pressureKpa: number;
    gravityG: number;
    airflowMs: number;
    hazardSeverity: 'CRITICAL' | 'ELEVATED' | 'REFORM' | 'VALIDATION';
  };
  forensicFinding: string;
  safetyLegacy: string;
  linkedDatasets: MissionTimelineDatasetLink[];
  linkedScenarioId: string;
  chamberPreset: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    pressureKpa: number;
    fuelName: string;
    extraGases?: Record<string, number>;
  };
}

export interface MissionProfileSummary {
  id: MissionId;
  name: string;
  dateLabel: string;
  crew: string;
  atmosphereLabel: string;
  gravityLabel: string;
  ignitionMechanism: string;
  primaryReform: string;
  accentHex: string;
}

export const MISSION_PROFILES: MissionProfileSummary[] = [
  {
    id: 'apollo_1',
    name: 'Apollo 1 (AS-204)',
    dateLabel: 'January 27, 1967',
    crew: 'Grissom, White, Chaffee',
    atmosphereLabel: '100% O₂ · 115.1 kPa (16.7 psi)',
    gravityLabel: '1.00 G (Launch Pad 34)',
    ignitionMechanism: 'Electrical wire arc under couch in pure oxygen',
    primaryReform: '60% O₂ / 40% N₂ pad mix, Beta cloth & NASA-STD-6001',
    accentHex: '#f43f5e',
  },
  {
    id: 'apollo_13',
    name: 'Apollo 13',
    dateLabel: 'April 13, 1970',
    crew: 'Lovell, Swigert, Haise',
    atmosphereLabel: '100% Supercritical O₂ Tank · ~6,200 kPa',
    gravityLabel: '0.00 G (Cislunar Coast)',
    ignitionMechanism: 'Damaged Teflon wire arc during cryo O₂ tank stir',
    primaryReform: 'Removal of internal tank wiring/motors & redundant O₂ tank',
    accentHex: '#f59e0b',
  },
  {
    id: 'mir_1997',
    name: 'Space Station Mir',
    dateLabel: 'February 23, 1997',
    crew: 'Korzun, Kaleri, Linenger + 3',
    atmosphereLabel: '26% O₂ / 65% N₂ / 5% CO₂ / 4% CO · 98.0 kPa',
    gravityLabel: '0.00 G (Low Earth Orbit)',
    ignitionMechanism: 'Vika lithium perchlorate O₂ canister cartridge rupture',
    primaryReform: 'ISS Flight Rule A13-1, dual egress & zero-G smoke filtration',
    accentHex: '#06b6d4',
  },
];

export const MISSION_HISTORY_TIMELINE: MissionTimelineEvent[] = [
  {
    id: 'ap1_ignition',
    missionId: 'apollo_1',
    missionName: 'Apollo 1 (AS-204)',
    missionYear: 1967,
    timestampLabel: '1967-01-27 · 23:31:04 UTC',
    category: 'incident',
    title: 'Wire Arc Ignition Inside Pure-Oxygen Command Module',
    locationOrSystem: 'Launch Complex 34 · CM-012 Lower Equipment Bay',
    summary:
      'During a plugs-out ground test pressurized to 16.7 psi (115.1 kPa) with 100% pure oxygen, an electrical short circuit in vulnerable silver-plated copper wiring ignited nearby nylon Velcro and raschel netting.',
    telemetrySnapshot: {
      o2Pct: 100.0,
      pressureKpa: 115.1,
      gravityG: 1.0,
      airflowMs: 0.3,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'Pure oxygen at 115.1 kPa elevated oxygen partial pressure above 5× sea-level Earth air, cutting ignition energy thresholds by an order of magnitude.',
    safetyLegacy:
      'Eliminated 100% O₂ ground pad pressurization; established strict wire chafing protection and aluminum armor conduit sleeves.',
    linkedDatasets: [
      {
        experimentId: 'psi159_normal',
        viewMode: 'psi159',
        rationale:
          'Compare hyperoxic combustion thresholds up to 39.5%+ O₂ and elevated chamber pressures (2.02 bar) across 179 PSI-159 runs.',
      },
      {
        experimentId: 'sofie_mist',
        viewMode: 'programs',
        rationale:
          'Inspect fabric ignition delays and flame spread sensitivity across variable oxygen concentrations.',
      },
    ],
    linkedScenarioId: 'apollo_1_pad34',
    chamberPreset: {
      gravityG: 1.0,
      o2Pct: 100.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.3,
      pressureKpa: 115.0,
      fuelName: 'Astronaut Nomex / Cotton Flight Suit',
    },
  },
  {
    id: 'ap1_flashover',
    missionId: 'apollo_1',
    missionName: 'Apollo 1 (AS-204)',
    missionYear: 1967,
    timestampLabel: '1967-01-27 · 23:31:19 UTC (+15s)',
    category: 'incident',
    title: 'Cabin Flashover & Inward-Opening Hatch Failure',
    locationOrSystem: 'CM-012 Crew Cabin · 3-Piece Plug Hatch',
    summary:
      'Within 15 seconds of initial fire report, cabin pressure surged past 29 psi, rupturing the pressure hull. The inward-opening three-part hatch was pinned shut by internal overpressure and could not be unbolted in under 90 seconds.',
    telemetrySnapshot: {
      o2Pct: 100.0,
      pressureKpa: 199.9,
      gravityG: 1.0,
      airflowMs: 0.45,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'Over 70 lbs of combustible Velcro, foam pads, and coolant-soaked surfaces fueled near-instantaneous flame spread across the entire cabin.',
    safetyLegacy:
      'Redesigned Apollo Block II with a unified outward-opening quick-release hatch (opens in <5 seconds) and removed exposed combustibles.',
    linkedDatasets: [
      {
        experimentId: 'saffire',
        viewMode: 'programs',
        rationale:
          'Examine large-scale 0.4 m × 1.0 m fabric flame spread velocity and peak thermal heat-release plumes in SAFFIRE I–VI.',
      },
      {
        experimentId: 'sofie_gel',
        viewMode: 'programs',
        rationale:
          'Analyze solid material heat feedback and growth-to-extinction boundaries on thick polymer surfaces.',
      },
    ],
    linkedScenarioId: 'apollo_1_pad34',
    chamberPreset: {
      gravityG: 1.0,
      o2Pct: 100.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.45,
      pressureKpa: 150.0,
      fuelName: 'Astronaut Nomex / Cotton Flight Suit',
    },
  },
  {
    id: 'ap1_reforms',
    missionId: 'apollo_1',
    missionName: 'Apollo 1 (AS-204)',
    missionYear: 1967,
    timestampLabel: '1967-04-05 · AS-204 Review Board',
    category: 'investigation',
    title: '60/40 N₂ Pad Atmosphere, Beta Cloth & NASA-STD-6001',
    locationOrSystem: 'NASA Manned Spacecraft Center · Block II Fleet',
    summary:
      'The AS-204 Review Board mandated a 60% O₂ / 40% N₂ launch-pad gas mixture, replaced nylon suits and Velcro with woven fiberglass Beta cloth (and later PBI fibers), and instituted mandatory material flammability screening.',
    telemetrySnapshot: {
      o2Pct: 60.0,
      pressureKpa: 101.3,
      gravityG: 1.0,
      airflowMs: 0.15,
      hazardSeverity: 'REFORM',
    },
    forensicFinding:
      'Adding 40% inert nitrogen diluent absorbed thermal energy and slowed radical reaction rates enough to prevent flashover at pad pressure.',
    safetyLegacy:
      'Paved the way for 1980s firefighter PBI turnout gear and became the foundational flammability standard for Shuttle, ISS, and Orion.',
    linkedDatasets: [
      {
        experimentId: 'sofie_mist',
        viewMode: 'programs',
        rationale:
          'Verify how nitrogen dilution and oxygen reduction below 19% O₂ suppress thin cellulose/fabric flame spread.',
      },
      {
        experimentId: 'acme_bre',
        viewMode: 'programs',
        rationale:
          'Review Burning Rate Emulator gaseous benchmarks used to screen spacecraft materials under NASA-STD-6001.',
      },
    ],
    linkedScenarioId: 'apollo_1_pad34',
    chamberPreset: {
      gravityG: 1.0,
      o2Pct: 60.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.15,
      pressureKpa: 101.3,
      fuelName: 'Astronaut Nomex / Cotton Flight Suit',
    },
  },
  {
    id: 'ap13_cryo_arc',
    missionId: 'apollo_13',
    missionName: 'Apollo 13',
    missionYear: 1970,
    timestampLabel: '1970-04-13 · MET 55:54:53',
    category: 'incident',
    title: 'Teflon Insulation Ignition Inside Cryo O₂ Tank No. 2',
    locationOrSystem: 'Service Module SM-109 · Bay 4 Oxygen Tank #2',
    summary:
      'At 321,860 km from Earth, Mission Control requested a routine cryogenic tank stir. Damaged Teflon wiring—previously overheated when 65V ground power welded 28V thermostatic switches during pad detanking—arced inside supercritical liquid/gas O₂.',
    telemetrySnapshot: {
      o2Pct: 100.0,
      pressureKpa: 6205.0,
      gravityG: 0.0,
      airflowMs: 0.25,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'Even flame-retardant fluoropolymers like Teflon burn violently when energized by an electrical fault inside pure high-pressure oxygen.',
    safetyLegacy:
      'Proved that material flammability tests at 1 bar air cannot certify hardware exposed to enriched or high-pressure oxygen systems.',
    linkedDatasets: [
      {
        experimentId: 'psi159_inverse',
        viewMode: 'psi159',
        rationale:
          'Inspect high-pressure inverse diffusion flames (up to 3.31 bar & 85% O₂ in PSI-159 Run 21202-H3) where oxygen feeds directly into the reaction core.',
      },
      {
        experimentId: 'flex_2',
        viewMode: 'programs',
        rationale:
          'Study sub-buoyant convective stirring and wake-enhanced flame acceleration in microgravity.',
      },
    ],
    linkedScenarioId: 'apollo_13_cryo_o2',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 98.0,
      co2Pct: 0.2,
      ventilationSpeed: 0.25,
      pressureKpa: 105.0,
      fuelName: 'Kapton / Tefzel Wiring Bundle',
    },
  },
  {
    id: 'ap13_rupture',
    missionId: 'apollo_13',
    missionName: 'Apollo 13',
    missionYear: 1970,
    timestampLabel: '1970-04-13 · MET 55:55:20 (+27s)',
    category: 'incident',
    title: 'Supercritical Pressure Spike & Service Module Rupture',
    locationOrSystem: 'Apollo 13 Service Module · Bay 4 Hull Panel',
    summary:
      'Rapid combustion inside the 100% O₂ tank heated the supercritical oxygen past its 1,000+ psi burst boundary in 27 seconds, blowing the Bay 4 aluminum cover panel into space and knocking both Tank 2 and Tank 1 offline.',
    telemetrySnapshot: {
      o2Pct: 98.0,
      pressureKpa: 202.6,
      gravityG: 0.0,
      airflowMs: 0.35,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'Combustion in confined pure-O₂ manifolds turns wiring insulation and aluminum/stainless fittings into self-sustaining explosive propellant.',
    safetyLegacy:
      'Cortright Commission removed all motors, fans, and thermostatic switches from inside oxygen tanks and added a third isolated O₂ tank.',
    linkedDatasets: [
      {
        experimentId: 'psi159_normal',
        viewMode: 'psi159',
        rationale:
          'Analyze elevated-pressure 2.02 bar oxygen-enriched flame intensity and burner heat loads in PSI-159.',
      },
      {
        experimentId: 'bass',
        viewMode: 'programs',
        rationale:
          'Evaluate solid polymer burning rates and how flow surges drive thermal runaway in 0-G enclosures.',
      },
    ],
    linkedScenarioId: 'apollo_13_cryo_o2',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 98.0,
      co2Pct: 0.2,
      ventilationSpeed: 0.35,
      pressureKpa: 202.6,
      fuelName: 'Kapton / Tefzel Wiring Bundle',
    },
  },
  {
    id: 'ap13_lifeboat',
    missionId: 'apollo_13',
    missionName: 'Apollo 13',
    missionYear: 1970,
    timestampLabel: '1970-04-15 · MET 88:00:00 (Lunar Lifeboat)',
    category: 'investigation',
    title: 'LM "Lifeboat" CO₂ Scrubbing & Cryo Architecture Redesign',
    locationOrSystem: 'Lunar Module Aquarius (LM-7) · Crew Quarters',
    summary:
      'With Odyssey powered down to 12 amps, the crew relied on Aquarius as a lifeboat while fabricating the iconic "mailbox" adapter to fit square Command Module LiOH canisters onto round LM CO₂ hoses as CO₂ crept above 15 mmHg.',
    telemetrySnapshot: {
      o2Pct: 34.0,
      pressureKpa: 34.5,
      gravityG: 0.0,
      airflowMs: 0.08,
      hazardSeverity: 'REFORM',
    },
    forensicFinding:
      'Demonstrated tight coupling between spacecraft fire/electrical failure, life-support O₂/CO₂ balance, and inert diluent behavior.',
    safetyLegacy:
      'Standardized cross-module LiOH cartridge compatibility on ISS/Orion and inspired high-pressure composite pressure-vessel standards.',
    linkedDatasets: [
      {
        experimentId: 'flex',
        viewMode: 'programs',
        rationale:
          'Inspect how CO₂ concentration shifts Limiting Oxygen Index (LOI) and radiative flame quenching in microgravity.',
      },
      {
        experimentId: 'acme_cfm',
        viewMode: 'programs',
        rationale:
          'Observe closed-enclosure zero-G diffusion flames depleting oxygen and self-quenching under accumulating CO₂.',
      },
    ],
    linkedScenarioId: 'apollo_13_cryo_o2',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 34.0,
      co2Pct: 2.0,
      ventilationSpeed: 0.08,
      pressureKpa: 34.5,
      fuelName: 'Kapton / Tefzel Wiring Bundle',
    },
  },
  {
    id: 'mir_vika_rupture',
    missionId: 'mir_1997',
    missionName: 'Space Station Mir',
    missionYear: 1997,
    timestampLabel: '1997-02-23 · 22:35 UTC',
    category: 'incident',
    title: 'Vika Solid-Fuel Oxygen Generator (SFOG) Canister Eruption',
    locationOrSystem: 'Mir Kvant-1 Module · Elektron/Vika Panel',
    summary:
      'During six-crew NASA–Mir joint operations, a defective lithium perchlorate oxygen candle ("Vika") ruptured upon ignition in Kvant-1, shooting a fierce 1-meter blowtorch flame across the module for ~14 minutes.',
    telemetrySnapshot: {
      o2Pct: 26.0,
      pressureKpa: 98.0,
      gravityG: 0.0,
      airflowMs: 0.4,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'Because lithium perchlorate chemically liberates its own pure oxygen while burning, water and foam extinguishers failed to smother the core jet until the canister expended its reactant.',
    safetyLegacy:
      'Prohibited chemical SFOG candles as primary O₂ supply on U.S. ISS segments in favor of water-electrolysis OGS/Elektron units.',
    linkedDatasets: [
      {
        experimentId: 'saffire',
        viewMode: 'programs',
        rationale:
          'View SAFFIRE full-scale spacecraft fire growth proving 0-G fires under 0.20+ m/s cabin airflow grow rapidly rather than self-extinguishing.',
      },
      {
        experimentId: 'bass',
        viewMode: 'programs',
        rationale:
          'Compare solid material combustion in ISS Glovebox airflow vs. rapid fan cut-off suppression.',
      },
    ],
    linkedScenarioId: 'mir_1997_vika',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 26.0,
      co2Pct: 5.0,
      ventilationSpeed: 0.4,
      pressureKpa: 98.0,
      fuelName: 'Spacecraft Li-Ion Battery Cell',
      extraGases: { O2: 26, N2: 65, CO: 4, CO2: 5 },
    },
  },
  {
    id: 'mir_smoke_trap',
    missionId: 'mir_1997',
    missionName: 'Space Station Mir',
    missionYear: 1997,
    timestampLabel: '1997-02-23 · 22:49 UTC (+14m)',
    category: 'incident',
    title: 'Zero-G Smoke Stagnation & Soyuz Escape Path Blockage',
    locationOrSystem: 'Mir Base Block & Kvant-1 Inter-module Hatchway',
    summary:
      'With flames blocking access to one of the two docked Soyuz return craft, dense toxic smoke suspended uniformly in zero-G without rising or settling. Crewmembers fought zero visibility and CO spikes in respirators for over 18 hours.',
    telemetrySnapshot: {
      o2Pct: 21.0,
      pressureKpa: 97.5,
      gravityG: 0.0,
      airflowMs: 0.02,
      hazardSeverity: 'CRITICAL',
    },
    forensicFinding:
      'In 0.00 G, smoke particulates do not stratify near the ceiling; they form opaque, lingering aerosols that blind crews and foul optical sensors.',
    safetyLegacy:
      'Established the strict ISS "Two-Fault / Dual-Egress" rule ensuring every crewmember has an unobstructed path to a return vehicle at all times.',
    linkedDatasets: [
      {
        experimentId: 'sofie_gel',
        viewMode: 'programs',
        rationale:
          'Examine stagnant zero-airflow boundary quenching (Run 302) vs. persistent low-velocity smoldering hazards.',
      },
      {
        experimentId: 'acme_bre',
        viewMode: 'programs',
        rationale:
          'Analyze reduced zero-G surface heat feedback that drives prolonged smoldering and toxic CO emission.',
      },
    ],
    linkedScenarioId: 'mir_1997_vika',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 4.5,
      ventilationSpeed: 0.02,
      pressureKpa: 97.5,
      fuelName: 'Spacecraft Li-Ion Battery Cell',
      extraGases: { O2: 21, N2: 71.5, CO: 3, CO2: 4.5 },
    },
  },
  {
    id: 'iss_rule_validation',
    missionId: 'mir_1997',
    missionName: 'Space Station Mir → ISS',
    missionYear: 2018,
    timestampLabel: '2000–2024 · ISS Fire Safety & PSI Validation',
    category: 'validation',
    title: 'ISS Flight Rule A13-1, Smoke Discrimination & Cool-Flame Diagnostics',
    locationOrSystem: 'ISS Destiny Lab · CIR / MDCA / ACME Racks',
    summary:
      'Lessons from Apollo 1, Apollo 13, and Mir culminated in ISS Flight Rule A13-1 (instant HVAC fan kill + mask donning + module isolation), Shuttle dust-discriminating smoke detectors, and PSI microgravity experiments uncovering invisible 500–800 K Cool Flames.',
    telemetrySnapshot: {
      o2Pct: 21.0,
      pressureKpa: 101.3,
      gravityG: 0.0,
      airflowMs: 0.0,
      hazardSeverity: 'VALIDATION',
    },
    forensicFinding:
      'FLEX & PSI-159 proved visibly extinguished flames can continue reacting invisibly at 600–800 K, demanding IR, CO, and sub-micron scatter sensors.',
    safetyLegacy:
      'Forms the active baseline for Orion, Lunar Gateway, and Mars transit habitat flammability limits (70.3 kPa / 26.5%–34% O₂ exploration atmospheres).',
    linkedDatasets: [
      {
        experimentId: 'flex',
        viewMode: 'programs',
        rationale:
          'Explore the FLEX Cool Flame dataset (Run 201) showing invisible low-temperature oxidation after hot flame extinction.',
      },
      {
        experimentId: 'psi159_normal',
        viewMode: 'psi159',
        rationale:
          'Inspect PSI-159 Run 21291-C1 recording 5 oscillatory transitions between visible hot flames and invisible cool flames.',
      },
    ],
    linkedScenarioId: 'iss_electrical',
    chamberPreset: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationSpeed: 0.0,
      pressureKpa: 101.3,
      fuelName: 'Paraffin Wax Candle (NASA Microgravity CFM Specimen)',
    },
  },
];
