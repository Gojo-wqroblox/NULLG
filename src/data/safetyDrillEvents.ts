import { GasDefinition } from '../types';

export interface DrillTarget {
  id: string;
  label: string;
  check: (params: {
    gases: Record<string, number>;
    pressureKpa: number;
    ventilationSpeed: number;
    fuelId: string;
  }) => boolean;
  getCurrentValueString: (params: {
    gases: Record<string, number>;
    pressureKpa: number;
    ventilationSpeed: number;
  }) => string;
}

export interface SafetyDrillEvent {
  id: string;
  title: string;
  badge: string;
  historicalContext: string;
  description: string;
  durationSeconds: number;
  initialState: {
    gases: Record<string, number>;
    pressureKpa: number;
    ventilationSpeed: number;
    fuelId: string;
  };
  targets: DrillTarget[];
  tacticalHint: string;
}

export const SAFETY_DRILL_EVENTS: SafetyDrillEvent[] = [
  {
    id: 'mir_o2_generator',
    title: 'Mir Space Station Solid-O₂ Generator Flash',
    badge: 'HYPEROXIC FLASH',
    historicalContext: 'Mir 1997: Kvant-1 oxygen candle ignited, torching molten metal into the cabin.',
    description: 'Oxygen generator runaway has flooded the compartment with 44% O₂ at elevated 116 kPa pressure!',
    durationSeconds: 22,
    initialState: {
      gases: { O2: 44, N2: 46, CO2: 10, Novec: 0, H2: 0, CH4: 0, SF6: 0, N2O: 0, SiH4: 0, NH3: 0, C3H8: 0, C2H4: 0 },
      pressureKpa: 116,
      ventilationSpeed: 0.8,
      fuelId: 'nomex_suit',
    },
    targets: [
      {
        id: 'o2_safe',
        label: 'Dilute O₂ below 23.5%',
        check: ({ gases }) => (gases.O2 || 0) < 23.5,
        getCurrentValueString: ({ gases }) => `O₂: ${(gases.O2 || 0).toFixed(1)}%`,
      },
      {
        id: 'suppression_agent',
        label: 'Inject Novec (≥ 5%) or Purge N₂ (≥ 74%)',
        check: ({ gases }) => (gases.Novec || 0) >= 5 || (gases.N2 || 0) >= 74,
        getCurrentValueString: ({ gases }) => `Novec: ${(gases.Novec || 0).toFixed(1)}% | N₂: ${(gases.N2 || 0).toFixed(0)}%`,
      },
      {
        id: 'pressure_norm',
        label: 'Vent Cabin Pressure < 105 kPa',
        check: ({ pressureKpa }) => pressureKpa <= 105,
        getCurrentValueString: ({ pressureKpa }) => `${pressureKpa.toFixed(1)} kPa`,
      },
    ],
    tacticalHint: 'Inject Nitrogen or Novec suppressant, and vent pressure down to 101.3 kPa.',
  },
  {
    id: 'silane_chemical_leak',
    title: 'Pyrophoric Silane Chemical Line Rupture',
    badge: 'PYROPHORIC RUNAWAY',
    historicalContext: 'Semiconductor crystal lab experiment breached delivery manifold.',
    description: 'Pyrophoric Silane (SiH₄) is auto-igniting on contact with air! Toxic SiO₂ powder forming!',
    durationSeconds: 20,
    initialState: {
      gases: { O2: 28, N2: 60, SiH4: 7.5, Novec: 0, CO2: 4.5, H2: 0, CH4: 0, SF6: 0, N2O: 0, NH3: 0, C3H8: 0, C2H4: 0 },
      pressureKpa: 103,
      ventilationSpeed: 0.6,
      fuelId: 'silane_leak',
    },
    targets: [
      {
        id: 'scrub_sih4',
        label: 'Scrub SiH₄ down to ≤ 0.5%',
        check: ({ gases }) => (gases.SiH4 || 0) <= 0.5,
        getCurrentValueString: ({ gases }) => `SiH₄: ${(gases.SiH4 || 0).toFixed(1)}%`,
      },
      {
        id: 'inert_flood',
        label: 'Inert Compartment (N₂ ≥ 76% or Novec ≥ 4%)',
        check: ({ gases }) => (gases.N2 || 0) >= 76 || (gases.Novec || 0) >= 4,
        getCurrentValueString: ({ gases }) => `N₂: ${(gases.N2 || 0).toFixed(0)}%`,
      },
    ],
    tacticalHint: 'Pull SiH₄ slider to 0% and flood with Nitrogen or Novec clean agent to prevent re-ignition.',
  },
  {
    id: 'avionics_convective_blast',
    title: 'Avionics Bay Forced-Ventilation Fire Flare',
    badge: 'VENT DRAFT SPREAD',
    historicalContext: 'High-speed cooling fans feeding fresh oxidizer directly into flaming circuit boards.',
    description: 'Ventilation fans are blowing 1.0 m/s draft, rapidly spreading flame across the substrate!',
    durationSeconds: 18,
    initialState: {
      gases: { O2: 32, N2: 68, Novec: 0, CO2: 0, H2: 0, CH4: 0, SF6: 0, N2O: 0, SiH4: 0, NH3: 0, C3H8: 0, C2H4: 0 },
      pressureKpa: 101.3,
      ventilationSpeed: 1.0,
      fuelId: 'pmma_circuit',
    },
    targets: [
      {
        id: 'cut_fans',
        label: 'Cut Ventilation Fans to 0.0 m/s',
        check: ({ ventilationSpeed }) => ventilationSpeed <= 0.05,
        getCurrentValueString: ({ ventilationSpeed }) => `Fans: ${ventilationSpeed.toFixed(1)} m/s`,
      },
      {
        id: 'discharge_novec',
        label: 'Discharge Novec Clean Agent ≥ 6%',
        check: ({ gases }) => (gases.Novec || 0) >= 6,
        getCurrentValueString: ({ gases }) => `Novec: ${(gases.Novec || 0).toFixed(1)}%`,
      },
    ],
    tacticalHint: 'Click "Cut Fans" (or slider to 0 m/s) to isolate draft, then inject Novec extinguisher agent.',
  },
  {
    id: 'toxic_ammonia_rupture',
    title: 'External Toxic Ammonia (NH₃) Coolant Ingress',
    badge: 'TOXIC VAPOR',
    historicalContext: 'ISS 2015 Precautionary evacuation: Ammonia thermal loop valve isolation alarm.',
    description: 'Corrosive ammonia vapor (NH₃) injected at 16%! Lethal inhalation and flammable vapor cloud!',
    durationSeconds: 22,
    initialState: {
      gases: { O2: 21, N2: 63, NH3: 16, Novec: 0, CO2: 0, H2: 0, CH4: 0, SF6: 0, N2O: 0, SiH4: 0, C3H8: 0, C2H4: 0 },
      pressureKpa: 106,
      ventilationSpeed: 0.7,
      fuelId: 'ammonia_coolant',
    },
    targets: [
      {
        id: 'scrub_nh3',
        label: 'Scrub Toxic NH₃ below 2.0%',
        check: ({ gases }) => (gases.NH3 || 0) <= 2.0,
        getCurrentValueString: ({ gases }) => `NH₃: ${(gases.NH3 || 0).toFixed(1)}%`,
      },
      {
        id: 'restore_n2',
        label: 'Purge with Nitrogen (N₂ ≥ 75%)',
        check: ({ gases }) => (gases.N2 || 0) >= 75,
        getCurrentValueString: ({ gases }) => `N₂: ${(gases.N2 || 0).toFixed(0)}%`,
      },
    ],
    tacticalHint: 'Set NH₃ to 0% and purge with 100% N₂ to restore breathable inert equilibrium.',
  },
  {
    id: 'ch4_thruster_backfeed',
    title: 'Methane (CH₄) Propulsion Manifold Back-Leak',
    badge: 'EXPLOSIVE AIR POCKET',
    historicalContext: 'Reusable rocket orbital refueling transfer line stoichiometric leak.',
    description: 'Flammable hydrocarbon fuel gas CH₄ has surged to 12% in cabin air with 29% O₂!',
    durationSeconds: 20,
    initialState: {
      gases: { O2: 29, N2: 59, CH4: 12, Novec: 0, CO2: 0, H2: 0, SF6: 0, N2O: 0, SiH4: 0, NH3: 0, C3H8: 0, C2H4: 0 },
      pressureKpa: 107,
      ventilationSpeed: 0.5,
      fuelId: 'candle_paraffin',
    },
    targets: [
      {
        id: 'scrub_ch4',
        label: 'Scrub CH₄ below 2.0%',
        check: ({ gases }) => (gases.CH4 || 0) <= 2.0,
        getCurrentValueString: ({ gases }) => `CH₄: ${(gases.CH4 || 0).toFixed(1)}%`,
      },
      {
        id: 'lower_o2',
        label: 'Drop O₂ below 21.0%',
        check: ({ gases }) => (gases.O2 || 0) <= 21.0,
        getCurrentValueString: ({ gases }) => `O₂: ${(gases.O2 || 0).toFixed(1)}%`,
      },
      {
        id: 'add_suppressant',
        label: 'Inject Novec (≥ 4%) or SF₆ (≥ 5%)',
        check: ({ gases }) => (gases.Novec || 0) >= 4 || (gases.SF6 || 0) >= 5,
        getCurrentValueString: ({ gases }) => `Novec: ${(gases.Novec || 0).toFixed(1)}% | SF₆: ${(gases.SF6 || 0).toFixed(1)}%`,
      },
    ],
    tacticalHint: 'Scrub CH₄, drop O₂ back to standard atmospheric level, and inject Novec or SF₆.',
  },
];
