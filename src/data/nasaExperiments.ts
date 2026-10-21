import { FlameMeasurement } from './flameExperimentDataset';

export interface NasaExperiment {
  id: string;
  code: string;
  name: string;
  fullName: string;
  facility: string;
  agency: string;
  principalInvestigator: string;
  description: string;
  scientificDiscovery: string;
  chamberConditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa: number;
    fuelType?: string;
  };
  sampleRows: FlameMeasurement[];
  runs: {
    run_id: number;
    name: string;
    description: string;
    extinctionTimestampSec: number | null;
    peakRadiusMm: number;
    color: string;
  }[];
}

export const NASA_EXPERIMENTS: NasaExperiment[] = [
  {
    id: 'sample_101_102',
    code: 'SAMPLE',
    name: 'Sample Runs 101 & 102',
    fullName: 'Baseline Combustion Table Dataset',
    facility: 'Microgravity Drop Facility & Ground Lab',
    agency: 'NASA / ESA Research Collaboration',
    principalInvestigator: 'Dr. C. Dietrich & Combustion Science Team',
    description:
      'Comparison between microgravity dim blue spherical envelope (Run 101) and normal gravity luminous sooty expansion (Run 102).',
    scientificDiscovery:
      'Run 101 verifies complete boundary layer diffusive extinction at exactly t = 2.000s when oxygen diffusion falls below the critical reaction limit.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationSpeed: 0.15,
      fuelName: 'Candle Wax',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 101,
        name: 'Run 101 (Microgravity Spherical Quench)',
        description: '0.00G microgravity flame, expanding to 6.30mm before diffusive oxygen exhaustion at 2.000s.',
        extinctionTimestampSec: 2.0,
        peakRadiusMm: 6.3,
        color: 'Dim Blue spherical',
      },
      {
        run_id: 102,
        name: 'Run 102 (1-G Sooty Convective Expansion)',
        description: '1.00G buoyant candle flame, rapid soot luminosity and steady upward convective transport.',
        extinctionTimestampSec: null,
        peakRadiusMm: 7.8,
        color: 'Sooty Yellow',
      },
    ],
    sampleRows: [
      { metric_id: 1, run_id: 101, timestamp_sec: 0.1, flame_radius_mm: 2.5, flame_color: 'Bright Blue', is_extinguished: false },
      { metric_id: 2, run_id: 101, timestamp_sec: 0.5, flame_radius_mm: 5.1, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 3, run_id: 101, timestamp_sec: 1.2, flame_radius_mm: 6.3, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 4, run_id: 101, timestamp_sec: 2.0, flame_radius_mm: 0.0, flame_color: 'None', is_extinguished: true },
      { metric_id: 5, run_id: 102, timestamp_sec: 0.1, flame_radius_mm: 3.1, flame_color: 'Bright Yellow', is_extinguished: false },
      { metric_id: 6, run_id: 102, timestamp_sec: 0.4, flame_radius_mm: 7.8, flame_color: 'Sooty Yellow', is_extinguished: false },
    ],
  },
  {
    id: 'flex',
    code: 'FLEX',
    name: 'NASA FLEX',
    fullName: 'Flame Extinguishment Experiment (FLEX & FLEX-2)',
    facility: 'ISS Combustion Integrated Rack (CIR) / MDCA',
    agency: 'NASA Glenn Research Center',
    principalInvestigator: 'Prof. Forman A. Williams (UC San Diego) & Dr. Vedha Nayagam',
    description:
      'Conducted aboard the International Space Station inside the Combustion Integrated Rack. Investigates isolated fuel droplets burning in microgravity without buoyant convection.',
    scientificDiscovery:
      'Pioneered the historic discovery of "Cool Flames": after the visible hot flame extinguishes due to radiative loss, the droplet continues burning invisibly via low-temperature chemical kinetics until fuel is consumed!',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.0,
      ventilationSpeed: 0.0,
      fuelName: 'Heptane Droplet',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 201,
        name: 'FLEX Run 201 (Heptane Droplet in Air)',
        description: 'Isolated 3.0mm heptane droplet burning in 21% O2 / 79% N2. Spherical blue halo with hot radiative extinction at t = 3.600s.',
        extinctionTimestampSec: 3.6,
        peakRadiusMm: 7.2,
        color: 'Symmetric Blue Shell',
      },
      {
        run_id: 202,
        name: 'FLEX Run 202 (Hypoxic Droplet in 16% O2)',
        description: 'Low-oxygen test investigating limiting oxygen concentration. Premature radiative quench at t = 2.100s.',
        extinctionTimestampSec: 2.1,
        peakRadiusMm: 5.4,
        color: 'Dim Chemiluminescent Blue',
      },
    ],
    sampleRows: [
      { metric_id: 101, run_id: 201, timestamp_sec: 0.2, flame_radius_mm: 2.8, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 102, run_id: 201, timestamp_sec: 0.8, flame_radius_mm: 5.4, flame_color: 'Symmetric Blue Shell', is_extinguished: false },
      { metric_id: 103, run_id: 201, timestamp_sec: 1.8, flame_radius_mm: 7.2, flame_color: 'Symmetric Blue Shell', is_extinguished: false },
      { metric_id: 104, run_id: 201, timestamp_sec: 2.8, flame_radius_mm: 6.8, flame_color: 'Dim Chemiluminescent Blue', is_extinguished: false },
      { metric_id: 105, run_id: 201, timestamp_sec: 3.6, flame_radius_mm: 0.0, flame_color: 'Invisible Cool Flame', is_extinguished: true },
      { metric_id: 106, run_id: 202, timestamp_sec: 0.2, flame_radius_mm: 2.2, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 107, run_id: 202, timestamp_sec: 0.9, flame_radius_mm: 4.6, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 108, run_id: 202, timestamp_sec: 1.6, flame_radius_mm: 5.4, flame_color: 'Faint Blue Shell', is_extinguished: false },
      { metric_id: 109, run_id: 202, timestamp_sec: 2.1, flame_radius_mm: 0.0, flame_color: 'None', is_extinguished: true },
    ],
  },
  {
    id: 'sofie_gel',
    code: 'SOPHIA-GEL',
    name: 'NASA SOFIE / SOPHIA GEL',
    fullName: 'Solid Fuel Ignition and Extinction - Growth and Extinction Limit (GEL)',
    facility: 'ISS Combustion Integrated Rack (CIR) / ACME',
    agency: 'NASA Glenn Research Center',
    principalInvestigator: 'Prof. James S. T’ien (Case Western Reserve University)',
    description:
      'Investigates the flammability limits of thick solid materials (PMMA/Plexiglas) in microgravity aboard the ISS to establish fire safety design criteria for the Moon (Artemis Gateway) and Mars.',
    scientificDiscovery:
      'Revealed that thick solid fuels self-extinguish at much lower air velocities in microgravity because radiative heat loss from the solid surface chills the flame below sustainable reaction thresholds without buoyant replenishment.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 18.5,
      co2Pct: 0.4,
      ventilationSpeed: 0.05,
      fuelName: 'PMMA Solid Fuel',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 301,
        name: 'SOPHIA-GEL Run 301 (Slow Concurrent Airflow 0.05 m/s)',
        description: 'Thick PMMA slab ignited in low-speed forced airflow. Flame establishes an elongated hemispherical diffusion front before steady propagation.',
        extinctionTimestampSec: null,
        peakRadiusMm: 9.6,
        color: 'Azure Blue & Amber Tip',
      },
      {
        run_id: 302,
        name: 'SOPHIA-GEL Run 302 (Stagnant Boundary Quench 0.00 m/s)',
        description: 'Fans turned off. Diffusion boundary starvation causes radiative heat loss to overwhelm reaction kinetics, leading to complete extinction at t = 4.200s.',
        extinctionTimestampSec: 4.2,
        peakRadiusMm: 6.1,
        color: 'Dim Blue Chemiluminescence',
      },
    ],
    sampleRows: [
      { metric_id: 201, run_id: 301, timestamp_sec: 0.5, flame_radius_mm: 3.4, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 202, run_id: 301, timestamp_sec: 1.5, flame_radius_mm: 6.2, flame_color: 'Azure Blue & Amber Tip', is_extinguished: false },
      { metric_id: 203, run_id: 301, timestamp_sec: 3.0, flame_radius_mm: 8.4, flame_color: 'Azure Blue & Amber Tip', is_extinguished: false },
      { metric_id: 204, run_id: 301, timestamp_sec: 5.0, flame_radius_mm: 9.6, flame_color: 'Azure Blue & Amber Tip', is_extinguished: false },
      { metric_id: 205, run_id: 302, timestamp_sec: 0.5, flame_radius_mm: 3.0, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 206, run_id: 302, timestamp_sec: 1.8, flame_radius_mm: 5.8, flame_color: 'Dim Blue Chemiluminescence', is_extinguished: false },
      { metric_id: 207, run_id: 302, timestamp_sec: 3.2, flame_radius_mm: 6.1, flame_color: 'Dim Blue Chemiluminescence', is_extinguished: false },
      { metric_id: 208, run_id: 302, timestamp_sec: 4.2, flame_radius_mm: 0.0, flame_color: 'Extinguished', is_extinguished: true },
    ],
  },
  {
    id: 'sofie_mist',
    code: 'SOPHIA-MIST',
    name: 'NASA SOFIE / SOPHIA MIST',
    fullName: 'Solid Fuel Ignition and Extinction - Material Ignition & Suppression Test (MIST)',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    agency: 'NASA Glenn Research Center',
    principalInvestigator: 'Dr. Sandra L. Olson & Prof. Paul V. Ferkul',
    description:
      'Examines ignition delays, flame spread rates, and radiation-induced extinction limits of thin fabric materials and cellulose sheets in microgravity at variable cabin oxygen fractions.',
    scientificDiscovery:
      'Identified the critical minimum airflow speed (0.02 m/s) below which thermal choking and oxygen starvation completely suppress flame spread along fabric sheets in zero-G.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 19.0,
      co2Pct: 0.4,
      ventilationSpeed: 0.04,
      fuelName: 'Cellulose Fabric',
      pressureKpa: 70.3,
    },
    runs: [
      {
        run_id: 701,
        name: 'SOPHIA-MIST Run 701 (Concurrent Flow 0.04 m/s)',
        description: 'Cotton fabric ignited in gentle draft. Upward diffusion envelope burns steadily with reduced flame tip temperature.',
        extinctionTimestampSec: null,
        peakRadiusMm: 8.9,
        color: 'Pale Blue & Amber Tip',
      },
      {
        run_id: 702,
        name: 'SOPHIA-MIST Run 702 (Low Oxygen Quench at 15% O2)',
        description: 'Oxygen reduced to 15.0%. Flame shrinks into faint chemiluminescent hemispherical front and quenches at t = 3.500s.',
        extinctionTimestampSec: 3.5,
        peakRadiusMm: 4.8,
        color: 'Faint Blue Shell',
      },
    ],
    sampleRows: [
      { metric_id: 601, run_id: 701, timestamp_sec: 0.3, flame_radius_mm: 2.8, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 602, run_id: 701, timestamp_sec: 1.2, flame_radius_mm: 5.9, flame_color: 'Pale Blue & Amber Tip', is_extinguished: false },
      { metric_id: 603, run_id: 701, timestamp_sec: 2.8, flame_radius_mm: 8.9, flame_color: 'Pale Blue & Amber Tip', is_extinguished: false },
      { metric_id: 604, run_id: 702, timestamp_sec: 0.3, flame_radius_mm: 2.1, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 605, run_id: 702, timestamp_sec: 1.5, flame_radius_mm: 4.8, flame_color: 'Faint Blue Shell', is_extinguished: false },
      { metric_id: 606, run_id: 702, timestamp_sec: 3.5, flame_radius_mm: 0.0, flame_color: 'Suppressed / None', is_extinguished: true },
    ],
  },
  {
    id: 'saffire',
    code: 'SAFFIRE',
    name: 'NASA SAFFIRE',
    fullName: 'Spacecraft Fire Safety Demonstration (Saffire I - VI)',
    facility: 'Cygnus Autonomous Cargo Vehicle (Post-ISS Departure)',
    agency: 'NASA Glenn Research Center & Advanced Exploration Systems',
    principalInvestigator: 'Dr. David L. Urban & Gary A. Ruff',
    description:
      'Historic large-scale fire safety tests conducted inside uncrewed Cygnus cargo resupply spacecraft after departing the ISS, burning realistic large-format fabrics, acrylics, and Nomex in microgravity.',
    scientificDiscovery:
      'Disproved the long-standing belief that zero-gravity fires are always small and self-limiting: demonstrated that spacecraft ventilation fans supply enough fresh oxidizer to sustain massive flame fronts and heavy toxic gas plumes.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.5,
      ventilationSpeed: 0.20,
      fuelName: 'Cotton-Fiberglass Blend',
      pressureKpa: 70.3,
    },
    runs: [
      {
        run_id: 401,
        name: 'SAFFIRE-I Run 401 (0.20 m/s Concurrent Airflow)',
        description: 'Large-scale cotton-fiberglass blend sample (0.4m x 1.0m) ignited in 0.20 m/s forced airflow. Robust flame propagation with trailing soot trail.',
        extinctionTimestampSec: null,
        peakRadiusMm: 14.5,
        color: 'Golden Orange Wake',
      },
      {
        run_id: 402,
        name: 'SAFFIRE-II Run 402 (Hypoxic Cabin Air 18% O2)',
        description: 'Combustion suppression test at reduced oxygen concentration. Reduced burning speed with boundary quenching at t = 6.500s.',
        extinctionTimestampSec: 6.5,
        peakRadiusMm: 9.2,
        color: 'Dim Orange Flame',
      },
    ],
    sampleRows: [
      { metric_id: 301, run_id: 401, timestamp_sec: 0.5, flame_radius_mm: 4.5, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 302, run_id: 401, timestamp_sec: 1.5, flame_radius_mm: 8.8, flame_color: 'Golden Orange Wake', is_extinguished: false },
      { metric_id: 303, run_id: 401, timestamp_sec: 3.5, flame_radius_mm: 12.4, flame_color: 'Golden Orange Wake', is_extinguished: false },
      { metric_id: 304, run_id: 401, timestamp_sec: 6.0, flame_radius_mm: 14.5, flame_color: 'Golden Orange Wake', is_extinguished: false },
      { metric_id: 305, run_id: 402, timestamp_sec: 0.5, flame_radius_mm: 3.8, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 306, run_id: 402, timestamp_sec: 2.0, flame_radius_mm: 7.5, flame_color: 'Dim Orange Flame', is_extinguished: false },
      { metric_id: 307, run_id: 402, timestamp_sec: 4.5, flame_radius_mm: 9.2, flame_color: 'Dim Orange Flame', is_extinguished: false },
      { metric_id: 308, run_id: 402, timestamp_sec: 6.5, flame_radius_mm: 0.0, flame_color: 'Suppressed / None', is_extinguished: true },
    ],
  },
  {
    id: 'bass',
    code: 'BASS',
    name: 'NASA BASS',
    fullName: 'Burning and Suppression of Solids (BASS & BASS-II)',
    facility: 'ISS Microgravity Science Glovebox (MSG)',
    agency: 'NASA Glenn Research Center',
    principalInvestigator: 'Dr. Paul V. Ferkul & Sandra L. Olson',
    description:
      'Astronaut-tended combustion experiment in the ISS Microgravity Science Glovebox studying burning of cast acrylic cylinders and flat slabs in varying airflow and oxygen mixtures.',
    scientificDiscovery:
      'Mapped the exact critical flow speed boundary required for fire suppression: discovered that cutting ventilation fans rapidly chokes flames in zero-G, but low residual drafts can sustain hazardous smoldering.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 20.9,
      co2Pct: 0.4,
      ventilationSpeed: 0.08,
      fuelName: 'Acrylic PMMA Rod',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 501,
        name: 'BASS Run 501 (Acrylic Cylinder in Glovebox)',
        description: 'Cast acrylic rod in 0.08 m/s airflow. Steady blue base with yellow luminous plume.',
        extinctionTimestampSec: null,
        peakRadiusMm: 8.2,
        color: 'Blue Base & Yellow Tip',
      },
      {
        run_id: 502,
        name: 'BASS Run 502 (Glovebox Fan Depressurization)',
        description: 'Forced flow reduced to 0.01 m/s to test extinction limit. Flame contracts into faint blue shell and extinguishes at t = 3.800s.',
        extinctionTimestampSec: 3.8,
        peakRadiusMm: 5.6,
        color: 'Dim Blue spherical',
      },
    ],
    sampleRows: [
      { metric_id: 401, run_id: 501, timestamp_sec: 0.3, flame_radius_mm: 2.9, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 402, run_id: 501, timestamp_sec: 1.2, flame_radius_mm: 5.7, flame_color: 'Blue Base & Yellow Tip', is_extinguished: false },
      { metric_id: 403, run_id: 501, timestamp_sec: 2.8, flame_radius_mm: 8.2, flame_color: 'Blue Base & Yellow Tip', is_extinguished: false },
      { metric_id: 404, run_id: 502, timestamp_sec: 0.3, flame_radius_mm: 2.7, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 405, run_id: 502, timestamp_sec: 1.5, flame_radius_mm: 5.6, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 406, run_id: 502, timestamp_sec: 2.8, flame_radius_mm: 4.1, flame_color: 'Faint Blue Shell', is_extinguished: false },
      { metric_id: 407, run_id: 502, timestamp_sec: 3.8, flame_radius_mm: 0.0, flame_color: 'Extinguished', is_extinguished: true },
    ],
  },
  {
    id: 'acme_cfm',
    code: 'ACME/CFM',
    name: 'NASA ACME / CFM',
    fullName: 'Candle Flames in Microgravity (CFM) & ACME Series',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    agency: 'NASA Glenn Research Center',
    principalInvestigator: 'Dr. Daniel L. Dietrich (NASA Glenn)',
    description:
      'The foundational space candle experiment that proved stationary diffusion flames in zero-G burn as dim blue spheres without buoyant flickering, with oscillatory extinction behavior.',
    scientificDiscovery:
      'Proved that candle flames burn longer in zero gravity than on Earth when placed in a closed container, because lower burning rate and reduced heat loss offset the lack of buoyancy.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationSpeed: 0.0,
      fuelName: 'Hydrocarbon Paraffin',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 601,
        name: 'CFM Run 601 (Microgravity Spherical Diffusion)',
        description: 'Paraffin candle in quiescent 0-G air. Pure isotropic spherical blue flame envelope lasting until oxygen boundary exhaustion at t = 5.200s.',
        extinctionTimestampSec: 5.2,
        peakRadiusMm: 6.8,
        color: 'Pure Spherical Blue',
      },
      {
        run_id: 602,
        name: 'CFM Run 602 (Oscillatory Extinction Flame)',
        description: 'Candle flame nearing limiting oxygen concentration displaying periodic spherical diameter oscillations before final quench at t = 4.000s.',
        extinctionTimestampSec: 4.0,
        peakRadiusMm: 5.9,
        color: 'Oscillating Blue Shell',
      },
    ],
    sampleRows: [
      { metric_id: 501, run_id: 601, timestamp_sec: 0.4, flame_radius_mm: 2.6, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 502, run_id: 601, timestamp_sec: 1.5, flame_radius_mm: 5.2, flame_color: 'Pure Spherical Blue', is_extinguished: false },
      { metric_id: 503, run_id: 601, timestamp_sec: 3.2, flame_radius_mm: 6.8, flame_color: 'Pure Spherical Blue', is_extinguished: false },
      { metric_id: 504, run_id: 601, timestamp_sec: 4.8, flame_radius_mm: 4.9, flame_color: 'Dim Blue spherical', is_extinguished: false },
      { metric_id: 505, run_id: 601, timestamp_sec: 5.2, flame_radius_mm: 0.0, flame_color: 'Quenched', is_extinguished: true },
      { metric_id: 506, run_id: 602, timestamp_sec: 0.4, flame_radius_mm: 2.4, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 507, run_id: 602, timestamp_sec: 1.8, flame_radius_mm: 5.9, flame_color: 'Oscillating Blue Shell', is_extinguished: false },
      { metric_id: 508, run_id: 602, timestamp_sec: 3.2, flame_radius_mm: 4.2, flame_color: 'Oscillating Blue Shell', is_extinguished: false },
      { metric_id: 509, run_id: 602, timestamp_sec: 4.0, flame_radius_mm: 0.0, flame_color: 'Extinguished', is_extinguished: true },
    ],
  },
  {
    id: 'acme_bre',
    code: 'ACME/BRE',
    name: 'NASA ACME / BRE',
    fullName: 'Burning Rate Emulator (BRE) Microgravity Flammability Investigation',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    agency: 'NASA Glenn Research Center & University of Maryland',
    principalInvestigator: 'Prof. James G. Quintiere & Dr. Peter B. Sunderland',
    description:
      'Uses a flat porous burner to emulate solid and liquid fuel burning rates with variable gaseous fuels, systematically mapping how microgravity alters heat feedback to materials.',
    scientificDiscovery:
      'Proved that zero-G flames transfer heat back to surfaces much slower than on Earth, causing prolonged smoldering and delayed visible flames that can ignite explosively once fresh airflow is introduced.',
    chamberConditions: {
      gravityG: 0.0,
      o2Pct: 21.0,
      co2Pct: 0.4,
      ventilationSpeed: 0.10,
      fuelName: 'Ethene Emulation Burner',
      pressureKpa: 101.3,
    },
    runs: [
      {
        run_id: 801,
        name: 'BRE Run 801 (Porous Flat Burner Steady Diffusion)',
        description: 'Microgravity flat flame emulation. Blue disc with low-temperature reaction zone hovering 2mm above the porous surface.',
        extinctionTimestampSec: null,
        peakRadiusMm: 7.6,
        color: 'Symmetric Blue Disc',
      },
      {
        run_id: 802,
        name: 'BRE Run 802 (Critical Flow Quench Test)',
        description: 'Ventilation reduced to near-zero to determine standoff quench distance. Flame lifts and extinguishes at t = 3.900s.',
        extinctionTimestampSec: 3.9,
        peakRadiusMm: 5.1,
        color: 'Lifted Faint Blue Disc',
      },
    ],
    sampleRows: [
      { metric_id: 701, run_id: 801, timestamp_sec: 0.4, flame_radius_mm: 3.1, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 702, run_id: 801, timestamp_sec: 1.6, flame_radius_mm: 6.4, flame_color: 'Symmetric Blue Disc', is_extinguished: false },
      { metric_id: 703, run_id: 801, timestamp_sec: 3.5, flame_radius_mm: 7.6, flame_color: 'Symmetric Blue Disc', is_extinguished: false },
      { metric_id: 704, run_id: 802, timestamp_sec: 0.4, flame_radius_mm: 2.8, flame_color: 'Bright Azure Blue', is_extinguished: false },
      { metric_id: 705, run_id: 802, timestamp_sec: 1.8, flame_radius_mm: 5.1, flame_color: 'Lifted Faint Blue Disc', is_extinguished: false },
      { metric_id: 706, run_id: 802, timestamp_sec: 3.9, flame_radius_mm: 0.0, flame_color: 'Quenched', is_extinguished: true },
    ],
  },
];
