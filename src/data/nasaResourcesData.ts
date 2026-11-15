/**
 * Official NASA Data, Research Guides, Historic Spaceflight Fire Investigations,
 * and Terrestrial Fire-Safety Spinoffs integrated into NULLG.
 */

export type NasaResourceCategory = 'psi_science' | 'historic_fires' | 'earth_spinoffs';

export interface NasaResourceEntry {
  id: string;
  category: NasaResourceCategory;
  title: string;
  eraOrYear: string;
  sourceProgram: string;
  summary: string;
  keyFacts: string[];
  engineeringLessons: string[];
  chamberPreset?: {
    label: string;
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    pressureKpa: number;
    fuelName: string;
    extraGases?: Record<string, number>;
  };
  linkedScenarioId?: string;
  linkedExperimentId?: string;
}

export const NASA_RESOURCES_DATA: NasaResourceEntry[] = [
  // 1. PSI Data Repository: Combustion Science
  {
    id: 'psi_data_repository',
    category: 'psi_science',
    title: 'PSI Data Repository: Combustion Science',
    eraOrYear: 'Active Open Science Archive',
    sourceProgram: 'NASA Physical Sciences Informatics (PSI)',
    summary:
      'The Physical Sciences Informatics (PSI) repository is NASA’s open-science data system preserving raw telemetry, high-speed optical video, radiometer logs, and CSV flame measurements from International Space Station combustion racks.',
    keyFacts: [
      'Serves as the primary empirical foundation for NULLG’s dataset explorer and scatter verification.',
      'Hosts complete flight campaigns including ACME (PSI-159), FLEX, FLEX-2, BASS, and SOFIE.',
      'Stores multi-channel radiometry, pressure, O₂/N₂/CO₂ mole fractions, and burner temperatures.',
    ],
    engineeringLessons: [
      'Enables researchers worldwide to validate microgravity CFD and reaction-kinetic models without new flight launches.',
      'Standardizes Limiting Oxygen Index (LOI) and radiant extinction metrics across dozens of fuels.',
    ],
    linkedExperimentId: 'psi159_normal',
  },
  // 2. NASA Combustion Science
  {
    id: 'nasa_combustion_science',
    category: 'psi_science',
    title: 'NASA Combustion Science Program',
    eraOrYear: 'Shuttle / ISS / Artemis Era',
    sourceProgram: 'NASA Glenn Research Center',
    summary:
      'Investigates fundamental droplet, gaseous, and solid-material combustion in microgravity to improve both spacecraft fire safety and clean-burning terrestrial energy systems.',
    keyFacts: [
      'Removes gravity-driven buoyancy so subtle diffusive, radiative, and chemical kinetic phenomena become measurable.',
      'Covers the Combustion Integrated Rack (CIR), Multi-user Droplet Combustion Apparatus (MDCA), and Microgravity Science Glovebox (MSG).',
      'Directly informs NASA-STD-6001B flammability certification for Orion, Lunar Gateway, and Mars habitats.',
    ],
    engineeringLessons: [
      'Demonstrated that soot residence time increases in zero-G, altering radiative heat loss and flame extinction.',
      'Established how inert diluents (N₂, CO₂, He) shift flame temperature and quench thresholds.',
    ],
    linkedExperimentId: 'flex',
  },
  // 3. NASA ScienceCasts: The Power of Studying Combustion on the ISS
  {
    id: 'sciencecast_iss_combustion',
    category: 'psi_science',
    title: 'NASA ScienceCasts: The Power of Studying Combustion on the ISS',
    eraOrYear: '2018 (3.6-min Feature)',
    sourceProgram: 'NASA ScienceCasts / ISS National Lab',
    summary:
      'Introduces how studying fire aboard the International Space Station uncovered unexpected low-temperature combustion regimes ("Cool Flames") with major implications for clean engines on Earth.',
    keyFacts: [
      'Without buoyancy, a burning fuel droplet on the ISS forms a calm, symmetrical sphere instead of an elongated teardrop.',
      'During FLEX experiments, after the visible hot flame extinguished, heptane droplets continued burning invisibly in a 500–800 K "Cool Flame" state.',
      'Cool flames produce virtually zero soot and drastically lower nitrogen oxide (NOₓ) pollutants.',
    ],
    engineeringLessons: [
      'Inspires next-generation homogeneous charge compression ignition (HCCI) automotive and aviation engines.',
      'Warns spacecraft crews that an apparently extinguished flame can still react invisibly and re-ignite if disturbed.',
    ],
    chamberPreset: {
      label: 'Simulate FLEX Cool Flame (0-G)',
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.0,
      pressureKpa: 101.3,
      fuelName: 'Paraffin Wax Candle (NASA Microgravity CFM Specimen)',
    },
    linkedExperimentId: 'flex',
  },
  // 4. A Researcher's Guide to ISS Combustion Science
  {
    id: 'researchers_guide_iss',
    category: 'psi_science',
    title: "A Researcher's Guide to International Space Station Combustion Science",
    eraOrYear: '2015 Handbook (50+ Pages)',
    sourceProgram: 'NASA ISS Program Science Office',
    summary:
      'Comprehensive 50+ page technical monograph detailing hardware racks, optical diagnostics, and research roadmaps for microgravity combustion investigations conducted aboard or planned for the ISS.',
    keyFacts: [
      'Documents the Combustion Integrated Rack (CIR) optics bench, UV/OH* chemiluminescence cameras, and LLLTV low-light imaging.',
      'Details the Advanced Combustion via Microgravity Experiments (ACME) modular chamber inserts (BRE, Coflow, Flame Design, E-FIELD, s-Flame).',
      'Explains Solid Fuel Ignition and Extinction (SOFIE) & Spacecraft Fire Experiments (Saffire I–VI) inside departing Cygnus vehicles.',
    ],
    engineeringLessons: [
      'Concurrent low-speed cabin ventilation (0.05–0.25 m/s) can actually cause solid fuels to burn more intensely in 0-G than in 1-G due to reduced convective cooling.',
      'Provides quantitative criteria for spacecraft cabin pressure (70.3–101.3 kPa) and oxygen ceiling (<24–34% O₂) trade-offs.',
    ],
    linkedExperimentId: 'sofie_gel',
  },
  // 5. Apollo 1
  {
    id: 'apollo_1',
    category: 'historic_fires',
    title: 'Apollo 1: Pre-Launch Pure-Oxygen Fire Investigation',
    eraOrYear: 'January 27, 1967',
    sourceProgram: 'NASA Apollo Program / AS-204 Review Board',
    summary:
      'During a plugs-out launch rehearsal on Pad 34, an electrical arc ignited combustibles inside the Command Module pressurized with 100% pure oxygen at 16.7 psi (115 kPa), claiming the lives of Gus Grissom, Ed White, and Roger Chaffee.',
    keyFacts: [
      'Crew: Virgil "Gus" Grissom, Edward H. White II, and Roger B. Chaffee.',
      'Atmosphere: 100% O₂ at 16.7 psi (115.1 kPa) — exceeding sea-level oxygen partial pressure by more than 5×.',
      'Over 70 lbs of combustible nylon netting, polyurethane foam, and hook-and-loop Velcro lined the cabin; inward-opening hatch required ~90 seconds to unbolt.',
    ],
    engineeringLessons: [
      'Replaced 100% pure O₂ on the launch pad with a 60% O₂ / 40% N₂ mixture, transitioning to pure O₂ at reduced 5 psi pressure only in vacuum.',
      'Replaced flammable nylon/Velcro with fireproof glass-fiber Beta cloth and engineered a single-motion outward-opening quick-release hatch.',
      'Instituted NASA-STD-6001 material flammability screening and protected spacecraft wire harness routing.',
    ],
    chamberPreset: {
      label: 'Simulate Apollo 1 (100% O₂, 115 kPa)',
      gravityG: 1.0,
      o2Pct: 100.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.3,
      pressureKpa: 115.0,
      fuelName: 'Astronaut Nomex / Cotton Flight Suit',
    },
    linkedScenarioId: 'apollo_1_pad34',
  },
  // 6. Apollo 13
  {
    id: 'apollo_13',
    category: 'historic_fires',
    title: 'Apollo 13: Cryogenic Oxygen Tank Explosion & Survival',
    eraOrYear: 'April 13, 1970',
    sourceProgram: 'NASA Apollo 13 Review Board (Cortright Commission)',
    summary:
      'At 55 hours 54 minutes into flight (321,860 km from Earth), a cryo stir command energized damaged Teflon wire insulation inside Supercritical Oxygen Tank No. 2, igniting a rapid internal pure-oxygen fire that ruptured the tank and crippled Odyssey.',
    keyFacts: [
      'Crew: James A. Lovell Jr., John L. "Jack" Swigert Jr., and Fred W. Haise Jr.',
      'During pre-flight tank detanking tests, 65V ground power fused thermostatic switches closed (rated only for 28V), overheating and cracking Teflon insulation on internal fan wires.',
      'Upon cryo stir in space, exposed wires arced in 100% supercritical oxygen, spiking pressure past burst limits and blowing off Service Module Bay 4 panel.',
    ],
    engineeringLessons: [
      'Eliminated Teflon insulation, electrical motors, and unprotected thermostatic switches from inside all cryogenic pure-oxygen tanks.',
      'Added an isolated third Command Module oxygen tank and external auxiliary battery reserves.',
      'Proved the Lunar Module "lifeboat" power/water rationing and improvised square-to-round LiOH CO₂ scrubber protocols.',
    ],
    chamberPreset: {
      label: 'Simulate Apollo 13 O₂ Surge (0-G)',
      gravityG: 0.0,
      o2Pct: 98.0,
      co2Pct: 0.2,
      ventilationSpeed: 0.25,
      pressureKpa: 105.0,
      fuelName: 'Kapton / Tefzel Wiring Bundle',
    },
    linkedScenarioId: 'apollo_13_cryo_o2',
  },
  // 7. Fire Aboard Space Station Mir (1997)
  {
    id: 'mir_1997_fire',
    category: 'historic_fires',
    title: '25 Years Ago: Fire Aboard Space Station Mir',
    eraOrYear: 'February 23, 1997',
    sourceProgram: 'NASA–Mir Phase 1 Joint Operations',
    summary:
      'A defective solid-fuel lithium perchlorate oxygen generator ("Vika" SFOG canister) ruptured in Mir’s Kvant-1 module, erupting into a 14-minute blowtorch-like fire that filled the station with dense smoke and blocked access to one Soyuz lifeboat.',
    keyFacts: [
      'Six crewmembers aboard including NASA Astronaut Jerry Linenger and Commander Valery Korzun.',
      'Self-oxidizing perchlorate cartridge generated its own O₂, resisting initial foam/water extinguishers until it burned through.',
      'Thick smoke lingered in microgravity for hours because buoyancy did not settle particulates; crew wore respirators for >18 hours.',
    ],
    engineeringLessons: [
      'Mandated dual egress paths on the ISS so a single module fire can never trap crew away from Soyuz/Crew Dragon return vehicles.',
      'Standardized ISS Flight Rule A13-1: immediate ventilation shutdown + Portable Breathing Apparatus (PBA) masks + Trace Contaminant Control scrubbing.',
      'Replaced chemical oxygen candles on U.S. segments with electrolysis Elektron/OGS systems and multi-wavelength smoke discrimination.',
    ],
    chamberPreset: {
      label: 'Simulate Mir 1997 SFOG Fire (0-G)',
      gravityG: 0.0,
      o2Pct: 26.0,
      co2Pct: 5.0,
      ventilationSpeed: 0.4,
      pressureKpa: 98.0,
      fuelName: 'Spacecraft Li-Ion Battery Cell',
      extraGases: { O2: 26, N2: 65, CO: 4, CO2: 5 },
    },
    linkedScenarioId: 'mir_1997_vika',
  },
  // 8. Fireman's Air Tanks (1970s Spinoff)
  {
    id: 'spinoff_air_tanks',
    category: 'earth_spinoffs',
    title: "Fireman's Air Tanks (NASA Composite SCBA Spinoff)",
    eraOrYear: '1970s NASA Spinoff',
    sourceProgram: 'NASA Johnson Space Center / Pressure Systems',
    summary:
      'Adapted Apollo lunar spacesuit Portable Life Support System (PLSS) and filament-wound composite pressure vessel engineering to replace heavy steel firefighter breathing tanks.',
    keyFacts: [
      'Replaced 33-lb steel Self-Contained Breathing Apparatus (SCBA) cylinders with fiberglass/composite-wrapped aluminum-lined tanks.',
      'Reduced total firefighter back-pack weight by ~30% (cutting ~13 lbs) while increasing operating pressure up to 4,500 psi.',
      'Added lighter ergonomic harness frames and quick-disconnect facepiece masks derived from astronaut EVA helmets.',
    ],
    engineeringLessons: [
      'Dramatically reduced firefighter musculoskeletal strain, back injuries, and air-depletion exhaustion inside burning structures.',
      'Established the modern composite SCBA cylinder architecture still used by municipal fire departments worldwide.',
    ],
  },
  // 9. Fire Detector (1970s Spinoff)
  {
    id: 'spinoff_fire_detector',
    category: 'earth_spinoffs',
    title: 'Fire Detector (Space Shuttle Aerosol Discriminator)',
    eraOrYear: '1970s NASA Spinoff',
    sourceProgram: 'NASA Space Shuttle / Brunswick & Mine Safety',
    summary:
      'Space Shuttle smoke detection required zero false alarms from cabin dust or payload grit. NASA-sponsored sensor innovations discriminated combustion smoke from nuisance dust particles.',
    keyFacts: [
      'Combines ionization chamber physics and optical light-scattering discrimination tuned to sub-micron smoke particulates (0.05–1.0 µm).',
      'Rejects larger non-combustion dust, lint, and mineral aerosols (>2.0 µm) that routinely triggered industrial false alarms.',
      'Deployed widely in underground coal/metal mines, aircraft cargo bays, and commercial high-rises.',
    ],
    engineeringLessons: [
      'Eliminated "cry-wolf" nuisance alarms in dusty mining tunnels so workers evacuate immediately when real smoke alerts sound.',
      'Direct ancestor of multi-criteria photoelectric + CO spacecraft fire detectors flying on the ISS and Orion.',
    ],
  },
  // 10. New Technology for the Fire Attire (1980s Spinoff)
  {
    id: 'spinoff_fire_attire',
    category: 'earth_spinoffs',
    title: 'New Technology for the Fire Attire (PBI Thermal Turnout Gear)',
    eraOrYear: '1980s NASA Spinoff',
    sourceProgram: 'NASA Spacesuit Materials / Celanese PBI',
    summary:
      'Following Apollo 1’s materials overhaul, NASA and industrial chemists developed Polybenzimidazole (PBI) and aluminized radiant-barrier fabrics for astronaut flight suits and EVA garments — later adopted into firefighter turnout attire.',
    keyFacts: [
      'PBI polymer fiber has no melting point, will not drip onto skin, and retains structural integrity up to 540–700 °C short-term flame exposure.',
      'Low thermal shrinkage prevents the outer shell from tightening against a firefighter’s body during flashover events.',
      'Adopted across firefighter proximity suits, protective flash hoods, racing suits, and commercial aircraft seat fire-blocking layers.',
    ],
    engineeringLessons: [
      'Materials engineered to survive spacecraft oxygen hazards created an entire generation of breathable, lighter, heat-resistant protective clothing on Earth.',
      'Dual thermal-barrier + moisture-barrier layering mirrors the EVA Thermal Micrometeoroid Garment (TMG) architecture.',
    ],
  },
];

export interface ResearchersGuideChapter {
  chapterNum: string;
  title: string;
  facility: string;
  keyFinding: string;
  safetyImpact: string;
}

export const RESEARCHERS_GUIDE_CHAPTERS: ResearchersGuideChapter[] = [
  {
    chapterNum: 'Ch. 01',
    title: 'CIR & MDCA Experimental Infrastructure',
    facility: 'ISS Destiny Lab — Combustion Integrated Rack',
    keyFinding:
      'Provides isolated 98-liter pressurized chamber capable of 0.5–3.0 bar operation with custom N₂/O₂/CO₂/He gas blending and high-speed OH* optical diagnostics.',
    safetyImpact:
      'Allows testing hazardous fuels, hyperoxic mixes, and soot plumes inside double containment with zero cabin contamination.',
  },
  {
    chapterNum: 'Ch. 02',
    title: 'Droplet Combustion & Cool Flame Discovery',
    facility: 'FLEX / FLEX-2 / FLEX-ICE-GA (MDCA)',
    keyFinding:
      'Discovered two-stage radiative extinction where hot droplet flames quench, then transition to invisible low-temperature (~600–800 K) cool flames.',
    safetyImpact:
      'Proved optical fire cameras alone miss smoldering/cool-flame hazards; infrared and chemical CO/aldehyde sensors are mandatory.',
  },
  {
    chapterNum: 'Ch. 03',
    title: 'Gaseous Diffusion & Porous Burners',
    facility: 'ACME (BRE, Coflow, Flame Design, s-Flame)',
    keyFinding:
      'Mapped spherical flame standoff, inverse diffusion flames (PSI-159), and burner heat feedback across 300+ ISS test runs.',
    safetyImpact:
      'Quantified solid-fuel burning rates using gaseous emulation so spacecraft materials can be ranked safely.',
  },
  {
    chapterNum: 'Ch. 04',
    title: 'Solid Fuel Ignition & Suppression (SOFIE & BASS)',
    facility: 'ISS Microgravity Science Glovebox & CIR',
    keyFinding:
      'Low-speed concurrent airflow (0.04–0.20 m/s) dramatically lowers the oxygen percentage needed to sustain flame spread over cotton & PMMA.',
    safetyImpact:
      'Establishes the exact minimum cabin airflow cutoff criteria in ISS Flight Rule A13-1 and Artemis Gateway exploration atmospheres.',
  },
  {
    chapterNum: 'Ch. 05',
    title: 'Large-Scale Spacecraft Fires (SAFFIRE)',
    facility: 'Uncrewed Cygnus Resupply Spacecraft',
    keyFinding:
      'Full-scale 0.4 m × 1.0 m fabric burns proved 0-G spacecraft fires can grow aggressively in standard cabin ventilation.',
    safetyImpact:
      'Validated real spacecraft smoke detectors, scrubber loads, and depressurization recovery tolerances for Orion and Lunar Gateway.',
  },
];
