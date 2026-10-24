/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FuelDefinition } from '../types';

export interface SimulationSharePayload {
  app: string;
  version: string;
  exportedAt: string;
  title: string;
  description: string;
  environment: {
    gravityG: number;
    gravityDescription: string;
    pressureKpa: number;
    ventilationSpeed: number; // m/s
    ventilationDescription: string;
  };
  fuel: {
    id: string;
    name: string;
    category: string;
    material: string;
    ignitionTempC: number;
    sootIndex: number;
    toxicity: string;
  };
  gasComposition: Record<string, number>;
  flameState: {
    isIgnited: boolean;
    estimatedFlameTempK: number;
    activePresetId?: string;
  };
}

/**
 * Generate a shareable simulation configuration JSON object
 */
export function buildSimulationSharePayload(params: {
  gravityG: number;
  pressureKpa: number;
  ventilationSpeed: number;
  fuel: FuelDefinition;
  gases: Record<string, number>;
  isIgnited: boolean;
  flameTempK: number;
  currentPresetId?: string;
}): SimulationSharePayload {
  const {
    gravityG,
    pressureKpa,
    ventilationSpeed,
    fuel,
    gases,
    isIgnited,
    flameTempK,
    currentPresetId,
  } = params;

  // Filter gas composition to omit gases with 0% for cleaner JSON, but keep major components
  const cleanedGases: Record<string, number> = {};
  Object.entries(gases).forEach(([gas, pct]) => {
    if (pct > 0 || gas === 'O2' || gas === 'N2' || gas === 'CO2') {
      cleanedGases[gas] = Number(pct.toFixed(2));
    }
  });

  const gravDesc =
    gravityG === 0
      ? '0.00 G (Microgravity / Free-Fall Orbital Environment)'
      : gravityG === 1
      ? '1.00 G (Standard Earth Terrestrial Gravity)'
      : gravityG < 0.2
      ? `${gravityG.toFixed(2)} G (Lunar Equivalent)`
      : gravityG < 0.45
      ? `${gravityG.toFixed(2)} G (Martian Equivalent)`
      : `${gravityG.toFixed(2)} G (Centrifuge / Hypergravity)`;

  const ventDesc =
    ventilationSpeed === 0
      ? 'Quiescent atmosphere (0.0 m/s - zero forced ventilation)'
      : ventilationSpeed <= 0.15
      ? `${ventilationSpeed.toFixed(2)} m/s (Nominal ISS Cabin Fan Airflow)`
      : `${ventilationSpeed.toFixed(2)} m/s (High-Speed Forced Convection Duct)`;

  return {
    app: 'IgnisAstra: NASA Microgravity Flame Simulator',
    version: '2.4.0',
    exportedAt: new Date().toISOString(),
    title: `${fuel.name} at ${gravityG === 0 ? '0-G Microgravity' : `${gravityG.toFixed(2)}G`}`,
    description: `Combustion environment with ${(cleanedGases['O2'] ?? 21).toFixed(1)}% O₂, ${(cleanedGases['CO2'] ?? 0.4).toFixed(1)}% CO₂ at ${pressureKpa.toFixed(1)} kPa.`,
    environment: {
      gravityG: Number(gravityG.toFixed(3)),
      gravityDescription: gravDesc,
      pressureKpa: Number(pressureKpa.toFixed(2)),
      ventilationSpeed: Number(ventilationSpeed.toFixed(3)),
      ventilationDescription: ventDesc,
    },
    fuel: {
      id: fuel.id,
      name: fuel.name,
      category: fuel.category,
      material: fuel.material,
      ignitionTempC: fuel.ignitionTempC,
      sootIndex: fuel.sootIndex,
      toxicity: fuel.toxicity,
    },
    gasComposition: cleanedGases,
    flameState: {
      isIgnited,
      estimatedFlameTempK: flameTempK,
      activePresetId: currentPresetId || undefined,
    },
  };
}

/**
 * Format payload into pretty or compact JSON string
 */
export function formatSimulationShareJson(
  payload: SimulationSharePayload,
  pretty = true
): string {
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

/**
 * Robust copy to clipboard utility with fallback for restricted iframe contexts
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback to textarea element selection + execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback clipboard copy failed:', err);
    return false;
  }
}

/**
 * Parse and validate an imported simulation JSON string
 */
export function parseSimulationShareJson(jsonStr: string): {
  success: boolean;
  data?: Partial<SimulationSharePayload>;
  error?: string;
} {
  try {
    const trimmed = jsonStr.trim();
    if (!trimmed) {
      return { success: false, error: 'Empty JSON string provided.' };
    }

    const parsed = JSON.parse(trimmed);

    // Validate essential fields
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Parsed content is not an object.' };
    }

    // Check if parameters are directly nested under environment or root
    const gravity =
      parsed.environment?.gravityG ??
      parsed.gravityG ??
      parsed.gravity ??
      (typeof parsed.gravity === 'number' ? parsed.gravity : undefined);

    const gases =
      parsed.gasComposition ??
      parsed.gases ??
      parsed.atmosphere ??
      (parsed.environment?.gases || undefined);

    if (gravity === undefined && !gases && !parsed.fuel) {
      return {
        success: false,
        error:
          'JSON does not contain recognized simulation environment parameters (gravity, gases, or fuel).',
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (e: any) {
    return {
      success: false,
      error: `Invalid JSON syntax: ${e.message || 'Syntax error'}`,
    };
  }
}
