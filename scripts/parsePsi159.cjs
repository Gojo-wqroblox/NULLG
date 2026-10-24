const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cells.push(cur.trim());
    if (cells.some((cell) => cell.length > 0)) {
      rows.push(cells);
    }
  }
  return rows;
}

const normalPath = path.resolve('public/assets/aistudio/PSI-159_Experimental_table_CFI-G_Normal_Flames_d95a621c.csv');
const inversePath = path.resolve('public/assets/aistudio/PSI-159_Experimental_table_CFI-G_Inverse_Flames_d4d44f8b.csv');

const normalRows = parseCSV(fs.readFileSync(normalPath, 'utf8'));
const inverseRows = parseCSV(fs.readFileSync(inversePath, 'utf8'));

console.log('Normal header:', normalRows[0]);
console.log('Normal count:', normalRows.length - 1);
console.log('Inverse header:', inverseRows[0]);
console.log('Inverse count:', inverseRows.length - 1);

// Normal headers:
// 0: Flame Type, 1: Day, 2: Fuel, 3: Test, 4: Cool flame?, 5: XO2 before test, 6: XO2 after test, 7: approx p (bar), 8: Xf, 9: mHC (mg/s), 10: TFP, 11: Tad (K), 12: Zst, 13: Hot ignition, 14: burn time (sec), 15: Self-ext or flow term, 16: Peak burner T (C ), 17: Comments

const parsedNormal = [];
for (let i = 1; i < normalRows.length; i++) {
  const r = normalRows[i];
  if (!r[0] && !r[2] && !r[3]) continue;
  parsedNormal.push({
    id: `normal_${i}`,
    flameType: r[0] || 'Normal',
    day: parseInt(r[1], 10) || 1,
    fuel: r[2] || 'ethane',
    test: r[3] || '',
    coolFlame: r[4] || '',
    hasCoolFlame: Boolean(r[4] && r[4].toLowerCase().includes('yes')),
    xo2Before: parseFloat(r[5]) || 0,
    xo2After: parseFloat(r[6]) || 0,
    pressureBar: parseFloat(r[7]) || 1.0,
    pressureKpa: Math.round((parseFloat(r[7]) || 1.0) * 100 * 10) / 10,
    xf: parseFloat(r[8]) || 0,
    mhcMgS: parseFloat(r[9]) || 0,
    tfp: r[10] || 'No',
    tadK: parseFloat(r[11]) || 0,
    zst: parseFloat(r[12]) || 0,
    hotIgnition: r[13] || 'No',
    burnTimeSec: parseFloat(r[14]) || 0,
    extinctionMode: r[15] || '-',
    peakBurnerTempC: parseFloat(r[16]) || 0,
    peakBurnerTempK: Math.round(((parseFloat(r[16]) || 0) + 273.15) * 10) / 10,
    comments: r[17] || '',
  });
}

// Inverse headers:
// 0: Flame Type, 1: Day, 2: Fuel, 3: Test, 4: Xf before test, 5: Xf after test, 6: approx p (bar), 7: XO2, 8: HC burnrate (mg/s), 9: O2 flow rate (mg/s), 10: TFP, 11: Tad (K), 12: Zst, 13: Hot ignition, 14: burn time (sec), 15: Self -ext or flow term, 16: Peak burner Temp (C), 17: Peak burner temp (K), 18: Color, 19: Comments

const parsedInverse = [];
for (let i = 1; i < inverseRows.length; i++) {
  const r = inverseRows[i];
  if (!r[0] && !r[2] && !r[3]) continue;
  if (r.every((c) => !c || c === '-')) continue;
  parsedInverse.push({
    id: `inverse_${i}`,
    flameType: r[0] || 'Inverse',
    day: parseInt(r[1], 10) || 1,
    fuel: r[2] || 'ethane',
    test: r[3] || '',
    xfBefore: parseFloat(r[4]) || 0,
    xfAfter: parseFloat(r[5]) || 0,
    pressureBar: parseFloat(r[6]) || 1.0,
    pressureKpa: Math.round((parseFloat(r[6]) || 1.0) * 100 * 10) / 10,
    xo2: parseFloat(r[7]) || 0,
    hcBurnrateMgS: parseFloat(r[8]) || 0,
    o2FlowRateMgS: parseFloat(r[9]) || 0,
    tfp: r[10] || 'No',
    tadK: parseFloat(r[11]) || 0,
    zst: parseFloat(r[12]) || 0,
    hotIgnition: r[13] || 'No',
    burnTimeSec: parseFloat(r[14]) || 0,
    extinctionMode: r[15] || '-',
    peakBurnerTempC: parseFloat(r[16]) || 0,
    peakBurnerTempK: parseFloat(r[17]) || (parseFloat(r[16]) ? Math.round((parseFloat(r[16]) + 273.15) * 10) / 10 : 0),
    color: r[18] || 'none',
    comments: r[19] || '',
  });
}

console.log(`Parsed ${parsedNormal.length} normal tests, ${parsedInverse.length} inverse tests.`);

const outputTs = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Physical Sciences Informatics (PSI) Open Science Dataset:
 * Investigation: PSI-159 CFI-G (Co-flow Flame Investigation - Gaseous / Cool Flame Investigation)
 * Facility: ISS Combustion Integrated Rack (CIR) / ACME
 * Original Data Files:
 * - /public/assets/aistudio/PSI-159_Experimental_table_CFI-G_Normal_Flames_d95a621c.csv
 * - /public/assets/aistudio/PSI-159_Experimental_table_CFI-G_Inverse_Flames_d4d44f8b.csv
 */

export interface Psi159NormalMeasurement {
  id: string;
  flameType: string;
  day: number;
  fuel: string;
  test: string;
  coolFlame: string;
  hasCoolFlame: boolean;
  xo2Before: number;
  xo2After: number;
  pressureBar: number;
  pressureKpa: number;
  xf: number;
  mhcMgS: number;
  tfp: string;
  tadK: number;
  zst: number;
  hotIgnition: string;
  burnTimeSec: number;
  extinctionMode: string;
  peakBurnerTempC: number;
  peakBurnerTempK: number;
  comments: string;
}

export interface Psi159InverseMeasurement {
  id: string;
  flameType: string;
  day: number;
  fuel: string;
  test: string;
  xfBefore: number;
  xfAfter: number;
  pressureBar: number;
  pressureKpa: number;
  xo2: number;
  hcBurnrateMgS: number;
  o2FlowRateMgS: number;
  tfp: string;
  tadK: number;
  zst: number;
  hotIgnition: string;
  burnTimeSec: number;
  extinctionMode: string;
  peakBurnerTempC: number;
  peakBurnerTempK: number;
  color: string;
  comments: string;
}

export const PSI_159_METADATA = {
  experimentId: 'PSI-159',
  investigation: 'CFI-G (Co-Flow Flame Investigation - Gaseous)',
  fullTitle: 'NASA ACME CFI-G: Normal & Inverse Microgravity Co-flow Flames & Cool Flame Transitions',
  facility: 'ISS Combustion Integrated Rack (CIR)',
  agency: 'NASA Glenn Research Center & Physical Sciences Informatics (PSI)',
  principalInvestigators: 'Prof. Ishwar K. Puri (McMaster/USC) & Dr. Daniel L. Dietrich (NASA Glenn)',
  description: 'Flight data from the ACME CFI-G experiment aboard the International Space Station, studying both normal co-flow diffusion flames and inverse diffusion flames across hydrocarbon fuels (ethane, propane, butane) and varying oxygen/diluent concentrations. Notably captured multi-mode transitions from high-temperature flames to low-temperature cool flames.',
  normalCsvUrl: '/assets/aistudio/PSI-159_Experimental_table_CFI-G_Normal_Flames_d95a621c.csv',
  inverseCsvUrl: '/assets/aistudio/PSI-159_Experimental_table_CFI-G_Inverse_Flames_d4d44f8b.csv',
  totalNormalRuns: ${parsedNormal.length},
  totalInverseRuns: ${parsedInverse.length},
};

export const PSI_159_NORMAL_FLAMES: Psi159NormalMeasurement[] = ${JSON.stringify(parsedNormal, null, 2)};

export const PSI_159_INVERSE_FLAMES: Psi159InverseMeasurement[] = ${JSON.stringify(parsedInverse, null, 2)};
`;

fs.writeFileSync('src/data/psi159Experiments.ts', outputTs, 'utf8');
console.log('Successfully wrote src/data/psi159Experiments.ts!');
