/**
 * NASA & ISS Spacecraft Fire Emergency Safety Scenarios
 * Grounded in real NASA microgravity combustion physics, ISS Flight Rules (A13-1),
 * FLEX, SAFFIRE, and BASS flight data.
 */

export interface SuppressionAgent {
  id: string;
  name: string;
  formula: string;
  iconName: string;
  type: 'Inert Gas' | 'Clean Agent' | 'Water Mist' | 'Vacuum Vent';
  description: string;
  mechanism: string;
  bestFor: string;
  conductive: boolean;
  crewRisk: string;
  residue: string;
  effectiveness: number; // 0-100 baseline
}

export const SUPPRESSION_AGENTS: SuppressionAgent[] = [
  {
    id: 'co2',
    name: 'Carbon Dioxide Extinguisher',
    formula: 'CO₂',
    iconName: 'Shield',
    type: 'Inert Gas',
    description: 'Standard ISS USOS portable fire extinguisher. Dense gaseous suppressant that rapidly dilutes O₂ and chills target.',
    mechanism: 'Thermal cooling + oxygen displacement below the Limiting Oxygen Index (LOI).',
    bestFor: 'Class B liquids and Class C energized avionics racks. Leaves no conductive residue.',
    conductive: false,
    crewRisk: 'High inhalation hazard (>4% causes hypercapnia; crew must don PBA masks).',
    residue: 'Zero residue (gas sublimates cleanly).',
    effectiveness: 92,
  },
  {
    id: 'n2_flood',
    name: 'Nitrogen Total Flood Purge',
    formula: 'N₂',
    iconName: 'Wind',
    type: 'Inert Gas',
    description: 'Autonomous manifold injection of pure compressed nitrogen into closed science racks (FLEX/CIR/BASS).',
    mechanism: 'Inerts the atmosphere by driving oxygen concentration below 10.5% LOI without thermal shock.',
    bestFor: 'Sealed experiment gloveboxes, high-pressure gas leaks, enclosed payload lockers.',
    conductive: false,
    crewRisk: 'Simple asphyxiant if released into open cabin without breathing apparatus.',
    residue: 'Zero residue.',
    effectiveness: 96,
  },
  {
    id: 'water_mist',
    name: 'Fine Water Mist (PBBA / Russian OK-1)',
    formula: 'H₂O Fine Mist',
    iconName: 'Droplet',
    type: 'Water Mist',
    description: 'Russian Segment portable extinguisher spraying ultra-fine atomized water droplets without heavy flooding.',
    mechanism: 'Immense latent heat of vaporization (2260 kJ/kg) quenches thermal feedback in solid porous fuels.',
    bestFor: 'Class A deep-seated smoldering solids (fabrics, cargo bags, paper, wood simulant).',
    conductive: true,
    crewRisk: 'Non-toxic, but suspended water droplets in 0-G can float into ventilation fans and short circuits.',
    residue: 'Moisture droplets require desiccant scrub.',
    effectiveness: 88,
  },
  {
    id: 'fk5112',
    name: 'FK-5-1-12 Advanced Clean Agent (Novec 1230)',
    formula: 'CF₃CF₂C(=O)CF(CF₃)₂',
    iconName: 'Zap',
    type: 'Clean Agent',
    description: 'Next-generation fluoroketone fire suppression liquid-gas used in modern commercial crew spacecraft.',
    mechanism: 'Rapid heat extraction and gas-phase chemical catalytic inhibition of flame free radicals.',
    bestFor: 'High-density computational hardware, data centers, manned capsules with sensitive optics.',
    conductive: false,
    crewRisk: 'Extremely safe margin for crew; non-ozone-depleting, non-narcotic at design concentrations.',
    residue: 'Zero residue, evaporates instantly.',
    effectiveness: 95,
  },
  {
    id: 'vacuum_dump',
    name: 'Cabin Vacuum Depressurization (Space Vent)',
    formula: '0 kPa (Vacuum)',
    iconName: 'ExternalLink',
    type: 'Vacuum Vent',
    description: 'Emergency venting of module atmosphere directly to space vacuum (<0.01 kPa). Ultimate fail-safe.',
    mechanism: 'Complete removal of all oxidizing gas. Starves combustion instantaneously.',
    bestFor: 'Uncontrollable runaway fires, structural fires, or when crew is safely sealed in Soyuz/Crew Dragon.',
    conductive: false,
    crewRisk: 'Catastrophic death if crew is inside without pressurized EVA spacesuit; destroys air inventory.',
    residue: 'Zero residue (everything outgasses).',
    effectiveness: 99,
  },
  {
    id: 'he_quench',
    name: 'Helium Thermal Siphon Purge',
    formula: 'He',
    iconName: 'FlameKindling',
    type: 'Inert Gas',
    description: 'Experimental suppressant studied in NASA FLEX and DCE; has extremely high thermal conductivity.',
    mechanism: 'Rapidly siphons heat away from droplet/surface faster than chemical reaction kinetics can generate it.',
    bestFor: 'Quenching droplet flames with minimal buoyancy generation; rapid boundary layer cooling.',
    conductive: false,
    crewRisk: 'Asphyxiant, raises vocal pitch, can disrupt acoustic smoke sensors.',
    residue: 'Zero residue.',
    effectiveness: 78,
  },
];

export interface ContainmentOption {
  id: string;
  label: string;
  desc: string;
  cutsAirflow: boolean;
  isolatesPower: boolean;
  ventsCabin: boolean;
}

export const CONTAINMENT_ACTIONS: ContainmentOption[] = [
  {
    id: 'cut_vent_and_power',
    label: 'Cut Ventilation & Isolate Power Bus',
    desc: 'Immediately kill recirc and inter-module ventilation fans + trip electrical breakers to the affected rack.',
    cutsAirflow: true,
    isolatesPower: true,
    ventsCabin: false,
  },
  {
    id: 'cut_vent_only',
    label: 'Cut Ventilation Fans Only',
    desc: 'Halt all forced convection air circulation across the module to stop feeding oxygen to the flame.',
    cutsAirflow: true,
    isolatesPower: false,
    ventsCabin: false,
  },
  {
    id: 'power_only',
    label: 'Isolate Electrical Power Only',
    desc: 'Trip the main remote power controller (RPC) to the rack while leaving cabin airflow active.',
    cutsAirflow: false,
    isolatesPower: true,
    ventsCabin: false,
  },
  {
    id: 'leave_vent_on',
    label: 'Maintain Full Ventilation (Purge Smoke)',
    desc: 'Keep high-speed cabin ventilation fans running to push smoke toward HEPA/charcoal scrubber intakes.',
    cutsAirflow: false,
    isolatesPower: false,
    ventsCabin: false,
  },
  {
    id: 'hatch_seal_vacuum',
    label: 'Seal Module Hatches & Vent to Vacuum',
    desc: 'Evacuate crew, close pressure hatches, and open the emergency depressurization valve to the vacuum of space.',
    cutsAirflow: true,
    isolatesPower: true,
    ventsCabin: true,
  },
];

export interface PostActionOption {
  id: string;
  label: string;
  desc: string;
}

export const POST_FIRE_ACTIONS: PostActionOption[] = [
  {
    id: 'pba_tccs',
    label: 'Don PBA Masks & Initiate TCCS/LiOH Scrub',
    desc: 'Crew wears Portable Breathing Apparatus while activating Trace Contaminant Control and CO₂ scrubbers.',
  },
  {
    id: 'open_hatch_immediately',
    label: 'Open Module Hatches Immediately to Ventilate',
    desc: 'Quickly open adjoining module hatches to let fresh air dilute remaining smoke without wearing masks.',
  },
  {
    id: 'vacuum_dump_repress',
    label: 'Overboard Dump & Repressurize from N₂/O₂ Reserves',
    desc: 'Purge contaminated smoke atmosphere to vacuum, then backfill the module with clean nitrogen and oxygen.',
  },
];

export interface EmergencyScenario {
  id: string;
  title: string;
  moduleName: string;
  location: string;
  fireClass: 'Class A - Combustibles' | 'Class B - Liquids' | 'Class C - Electrical' | 'Class D - Lithium Metal' | 'Class E - Gas Leak';
  incidentSummary: string;
  urgency: 'HIGH' | 'CRITICAL' | 'EXTREME';
  timeLimitSec: number;
  environment: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationMps: number;
    pressureKpa: number;
    fuelName: string;
  };
  sensorData: {
    obscurationPct: number;
    coPpm: number;
    tempC: number;
    thermalCamera: string;
    spectralPeak: string;
  };
  correctContainmentIds: string[];
  recommendedAgentId: string;
  acceptableAgentIds: string[];
  lethalAgentIds: { agentId: string; reason: string }[];
  correctPostActionId: string;
  flightRuleRef: string;
  physicsInsight: string;
}

export const NASA_EMERGENCY_SCENARIOS: EmergencyScenario[] = [
  {
    id: 'destiny_avionics_fire',
    title: 'Destiny Lab: Avionics Rack Wire Loom Pyrolysis',
    moduleName: 'U.S. Destiny Laboratory Module',
    location: 'Payload Rack LAB1P4 (High-Voltage Power Distribution)',
    fireClass: 'Class C - Electrical',
    incidentSummary:
      'A short circuit in the 120V DC Remote Power Controller Module (RPCM) has ignited Kapton wire insulation. Dense acrid gray smoke is being sucked into the avionics recirculating duct.',
    urgency: 'CRITICAL',
    timeLimitSec: 45,
    environment: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationMps: 0.22,
      pressureKpa: 101.3,
      fuelName: 'Kapton/PTFE Wire Insulation',
    },
    sensorData: {
      obscurationPct: 18.5,
      coPpm: 120,
      tempC: 185,
      thermalCamera: 'Hot spot concentrated behind LAB1P4 panel (420°C core)',
      spectralPeak: '4.3 µm (CO₂ band) + hydrofluoric acid gas trace',
    },
    correctContainmentIds: ['cut_vent_and_power', 'power_only'],
    recommendedAgentId: 'co2',
    acceptableAgentIds: ['co2', 'n2_flood', 'fk5112'],
    lethalAgentIds: [
      {
        agentId: 'water_mist',
        reason: 'Lethal hazard! Spraying conductive water mist onto live 120V avionics triggers explosive arcing, destroys adjacent bus bars, and creates a lethal electrical shock hazard for the crew in microgravity.',
      },
    ],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'ISS Flight Rule A13-101: Avionics Fire Response',
    physicsInsight:
      'In microgravity, cutting ventilation fans removes the forced oxygen flow that sustains combustion in wire harnesses. CO₂ cleanly displaces oxygen without coating sensitive high-frequency data pins.',
  },
  {
    id: 'columbus_bio_hyperoxic',
    title: 'Columbus Lab: Hyperoxic Bio-Glovebox Flash Flare',
    moduleName: 'ESA Columbus Science Laboratory',
    location: 'Biolab Facility Rack (Microbiology Experiment Loop)',
    fireClass: 'Class A - Combustibles',
    incidentSummary:
      'An oxygen regulator diaphragm ruptured inside the biology experiment container, spiking local O₂ to 38.5%. A heating element ignited sterile cotton batting and acrylic culture trays!',
    urgency: 'EXTREME',
    timeLimitSec: 35,
    environment: {
      gravityG: 0.0,
      o2Pct: 38.5,
      co2Pct: 0.2,
      ventilationMps: 0.12,
      pressureKpa: 102.5,
      fuelName: 'Sterile Cotton & PMMA Acrylic',
    },
    sensorData: {
      obscurationPct: 24.2,
      coPpm: 240,
      tempC: 310,
      thermalCamera: 'Spherical fireball expanding inside glovebox viewport',
      spectralPeak: '760 nm (Atomic Oxygen) + intense C₂ Swan Bands',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'n2_flood',
    acceptableAgentIds: ['n2_flood', 'co2', 'fk5112'],
    lethalAgentIds: [
      {
        agentId: 'he_quench',
        reason: 'Ineffective! Under 38.5% hyperoxic conditions, helium diluent cannot drop the oxygen fraction below the LOI rapidly enough, allowing acrylic fuel to melt through the secondary containment barrier.',
      },
    ],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'NASA SP-2005-557: Enriched Oxygen Fire Protocol',
    physicsInsight:
      'At 38.5% O₂, flame speed is 4× faster than normal air. Rapid nitrogen total flooding is required to dilute O₂ down below 12% LOI to extinguish solid polymer combustion.',
  },
  {
    id: 'harmony_lithium_runaway',
    title: 'Harmony Node 2: Lithium-Ion Battery Thermal Runaway',
    moduleName: 'Node 2 (Harmony)',
    location: 'Crew Recharge Station & Equipment Lockers',
    fireClass: 'Class D - Lithium Metal',
    incidentSummary:
      'A multi-cell 98Wh EVA helmet camera lithium battery pack experienced an internal dendrite separator short. Violent exothermic venting of flammable electrolyte gas and molten sparks detected!',
    urgency: 'EXTREME',
    timeLimitSec: 40,
    environment: {
      gravityG: 0.0,
      o2Pct: 20.8,
      co2Pct: 0.5,
      ventilationMps: 0.18,
      pressureKpa: 101.3,
      fuelName: 'Lithium Cobalt Oxide & Organic Carbonate Electrolyte',
    },
    sensorData: {
      obscurationPct: 32.0,
      coPpm: 380,
      tempC: 640,
      thermalCamera: 'Thermal spike exceeding 700°C within battery containment box',
      spectralPeak: '670 nm (Lithium emission line) + HF & Phosphoryl Fluoride',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'co2',
    acceptableAgentIds: ['co2', 'fk5112', 'n2_flood'],
    lethalAgentIds: [
      {
        agentId: 'water_mist',
        reason: 'Violent chemical reaction! Water mist reacts with hot exposed lithium metal to release hydrogen gas (H₂), creating a serious secondary explosion hazard in the cabin.',
      },
    ],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'ISS Flight Rule A13-205: Portable Li-Ion Thermal Event',
    physicsInsight:
      'Lithium runaway generates internal oxygen as cathode oxides decompose. Rapid CO₂ smothering chills adjacent cells to stop thermal cascade propagation without water-lithium hydrogen generation.',
  },
  {
    id: 'cygnus_cargo_smolder',
    title: 'Cygnus Vehicle: Deep Cargo Bay Cotton Fabric Smolder',
    moduleName: 'Cygnus Pressurized Cargo Module (PCM)',
    location: 'Forward Stowage Bay (Cargo Transfer Bags & Waste Stowage)',
    fireClass: 'Class A - Combustibles',
    incidentSummary:
      'Similar to NASA SAFFIRE experiments: Friction between unfastened cargo straps during berthing sparked a deep-seated smoldering ember inside porous Nomex/cotton cargo bags.',
    urgency: 'HIGH',
    timeLimitSec: 60,
    environment: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationMps: 0.08,
      pressureKpa: 101.3,
      fuelName: 'Cellulose Cotton & Nomex Fabric Weave',
    },
    sensorData: {
      obscurationPct: 14.0,
      coPpm: 180,
      tempC: 98,
      thermalCamera: 'Sub-surface hot core detected inside Cargo Bag #4',
      spectralPeak: 'Broad soot infrared emission + Carbon Monoxide rise',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'water_mist',
    acceptableAgentIds: ['water_mist', 'co2', 'fk5112'],
    lethalAgentIds: [],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'NASA SAFFIRE-IV Flight Investigation Protocol',
    physicsInsight:
      'Deep-seated porous smoldering fires retain trapped heat. Gaseous suppressants (CO₂) may temporarily snuff outer surface flames, but without water mist to penetrate and quench embers, re-ignition occurs as soon as ventilation returns.',
  },
  {
    id: 'kibo_methane_leak',
    title: 'Kibo Module: Methane Propulsion Sensor Micro-Leak & Ghost Flame',
    moduleName: 'JEM Kibo Japanese Experiment Module',
    location: 'Pressurized Module Aft Bulkhead Gas Manifold',
    fireClass: 'Class E - Gas Leak',
    incidentSummary:
      'A test fuel line fitting developed a 0.5 mm hairline fissure, releasing pressurized methane (CH₄) gas into the ventilation return duct. An electrostatic discharge ignited an invisible pale blue ghost flame!',
    urgency: 'CRITICAL',
    timeLimitSec: 40,
    environment: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationMps: 0.25,
      pressureKpa: 101.3,
      fuelName: 'Methane (CH₄) Gas Stream',
    },
    sensorData: {
      obscurationPct: 2.1,
      coPpm: 45,
      tempC: 190,
      thermalCamera: 'Thin pale blue cone flame anchored to bulkhead fitting',
      spectralPeak: '431 nm (CH Radical) + 3.3 µm (Methane C-H stretch)',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'n2_flood',
    acceptableAgentIds: ['n2_flood', 'co2', 'fk5112'],
    lethalAgentIds: [
      {
        agentId: 'water_mist',
        reason: 'Ineffective! Water mist cannot extinguish a pressurized jet diffusion gas flame and causes condensation over bulkhead electrical harnesses.',
      },
    ],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'JAXA Kibo Flight Safety Rule 09-4: Volatile Gas Leak',
    physicsInsight:
      'For pressurized gas leaks, stopping forced convection and delivering an inert nitrogen or CO₂ blast directly at the leak orifice breaks the flame stabilization zone and quenches the reaction.',
  },
  {
    id: 'lunar_gateway_dust_panel',
    title: 'Lunar Gateway HALO: Partial-G Smoldering Composite Panel',
    moduleName: 'Lunar Gateway HALO (Habitation and Logistics Outpost)',
    location: 'Internal Equipment Bay / Docking Adapter Deck',
    fireClass: 'Class A - Combustibles',
    incidentSummary:
      'During cislunar orbit maneuvers under 0.16G artificial thrust, abrasive lunar regolith particles infiltrated a blower fan bearing, overheating an adjacent carbon-fiber epoxy bulkhead panel.',
    urgency: 'HIGH',
    timeLimitSec: 50,
    environment: {
      gravityG: 0.16,
      o2Pct: 23.5,
      co2Pct: 0.3,
      ventilationMps: 0.15,
      pressureKpa: 70.3, // Exploration Atmosphere (8.2 psi)
      fuelName: 'Carbon-Fiber Epoxy Bulkhead Panel',
    },
    sensorData: {
      obscurationPct: 21.0,
      coPpm: 210,
      tempC: 245,
      thermalCamera: 'Upward-tilted flame plume conforming to 0.16G weak buoyancy vector',
      spectralPeak: 'Carbon soot continuum + aromatic hydrocarbon volatiles',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'fk5112',
    acceptableAgentIds: ['fk5112', 'co2', 'n2_flood'],
    lethalAgentIds: [],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'Artemis Exploration Atmosphere Fire Safety Baseline',
    physicsInsight:
      'In Gateway’s 70.3 kPa / 23.5% O₂ exploration atmosphere, weak buoyancy exists. FK-5-1-12 clean agent vaporizes smoothly and quenches combustion radicals without depleting oxygen reserves.',
  },
  {
    id: 'airlock_eva_prebreathe',
    title: 'Quest Airlock: Hyperbaric 100% O₂ Pre-Breathe Flash Fire Hazard',
    moduleName: 'Quest Joint Airlock (Equipment Lock)',
    location: 'EMU Spacesuit Donning Station',
    fireClass: 'Class A - Combustibles',
    incidentSummary:
      'Astronauts were undergoing in-suit pure oxygen pre-breathe prior to an EVA. A quick-disconnect O₂ fitting leaked into the suit donning rack, elevating ambient O₂ to 48%! A suit biometric sensor spark occurred.',
    urgency: 'EXTREME',
    timeLimitSec: 30,
    environment: {
      gravityG: 0.0,
      o2Pct: 48.0,
      co2Pct: 0.1,
      ventilationMps: 0.10,
      pressureKpa: 104.0,
      fuelName: 'EMU Spacesuit Thermal Micrometeoroid Garment (Ortho-Fabric)',
    },
    sensorData: {
      obscurationPct: 28.0,
      coPpm: 290,
      tempC: 380,
      thermalCamera: 'High-intensity flash fire crawling across suit donning fixture',
      spectralPeak: 'Intense 777 nm Atomic Oxygen + rapid radiant heat surge',
    },
    correctContainmentIds: ['cut_vent_and_power', 'hatch_seal_vacuum'],
    recommendedAgentId: 'n2_flood',
    acceptableAgentIds: ['n2_flood', 'co2'],
    lethalAgentIds: [
      {
        agentId: 'he_quench',
        reason: 'Catastrophic failure! Under 48% oxygen, helium dilution is far too sluggish. Flammability boundary cannot be suppressed before spacesuit life support lines burn through.',
      },
    ],
    correctPostActionId: 'vacuum_dump_repress',
    flightRuleRef: 'NASA EVA Flight Rule 14-8: Airlock Hyperoxic Fire Response',
    physicsInsight:
      'In hyperbaric/high-O₂ space, nearly all organic materials burn like flash paper. Nitrogen flood or immediate hatch seal & emergency overboard dump is required.',
  },
  {
    id: 'flex_droplet_glovebox',
    title: 'FLEX Science Chamber: Heptane Droplet Array Ignition Spill',
    moduleName: 'Multi-User Droplet Combustion Apparatus (MDCA/FLEX)',
    location: 'Combustion Integrated Rack (CIR) Core Chamber',
    fireClass: 'Class B - Liquids',
    incidentSummary:
      'During a test on liquid n-heptane droplet combustion in microgravity, droplet dispensing needle jammed, pooling 4mm fuel droplets that ignited into an unanchored spherical flame ball.',
    urgency: 'HIGH',
    timeLimitSec: 45,
    environment: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.0,
      ventilationMps: 0.05,
      pressureKpa: 101.3,
      fuelName: 'n-Heptane (C₇H₁₆) Droplets',
    },
    sensorData: {
      obscurationPct: 12.0,
      coPpm: 95,
      tempC: 220,
      thermalCamera: 'Perfect spherical yellow soot flame standoff at 3.5mm radius',
      spectralPeak: 'C₂ Swan Bands (516 nm) + Broad Soot Glow',
    },
    correctContainmentIds: ['cut_vent_and_power', 'cut_vent_only'],
    recommendedAgentId: 'co2',
    acceptableAgentIds: ['co2', 'n2_flood', 'he_quench'],
    lethalAgentIds: [
      {
        agentId: 'water_mist',
        reason: 'Dangerous! Water mist causes rapid splash disruption of liquid heptane droplets in microgravity, dispersing unburned hot liquid fuel beads throughout the chamber.',
      },
    ],
    correctPostActionId: 'pba_tccs',
    flightRuleRef: 'NASA Glenn CIR-FLEX Payload Operational Safety Document',
    physicsInsight:
      'Droplet flames in 0-G depend purely on spherical oxygen diffusion. Inert gas injection (CO₂ or N₂) pushes the flame standoff distance until radiation losses induce radiative extinction.',
  },
];

/**
 * Returns a random scenario, optionally excluding the previous one
 */
export function getRandomScenario(currentId?: string): EmergencyScenario {
  const filtered = NASA_EMERGENCY_SCENARIOS.filter((s) => s.id !== currentId);
  if (filtered.length === 0) return NASA_EMERGENCY_SCENARIOS[0];
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx];
}
