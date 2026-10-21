/**
 * Flame Experiment Dataset for NULLG Combustion Engine
 * Contains measurements imported from experimental runs.
 */

export interface FlameMeasurement {
  metric_id: number | string;
  run_id: number | string;
  timestamp_sec: number;
  flame_radius_mm: number;
  flame_color: string;
  is_extinguished: boolean;
}

/**
 * Initial 6 visible sample rows from the user's uploaded table image.
 * Explicitly labeled as sample data with replacement and import capabilities.
 */
export const INITIAL_SAMPLE_FLAME_DATASET: FlameMeasurement[] = [
  {
    metric_id: 1,
    run_id: 101,
    timestamp_sec: 0.1,
    flame_radius_mm: 2.5,
    flame_color: 'Bright Blue',
    is_extinguished: false,
  },
  {
    metric_id: 2,
    run_id: 101,
    timestamp_sec: 0.5,
    flame_radius_mm: 5.1,
    flame_color: 'Dim Blue spherical',
    is_extinguished: false,
  },
  {
    metric_id: 3,
    run_id: 101,
    timestamp_sec: 1.2,
    flame_radius_mm: 6.3,
    flame_color: 'Dim Blue spherical',
    is_extinguished: false,
  },
  {
    metric_id: 4,
    run_id: 101,
    timestamp_sec: 2.0,
    flame_radius_mm: 0.0,
    flame_color: 'None',
    is_extinguished: true,
  },
  {
    metric_id: 5,
    run_id: 102,
    timestamp_sec: 0.1,
    flame_radius_mm: 3.1,
    flame_color: 'Bright Yellow',
    is_extinguished: false,
  },
  {
    metric_id: 6,
    run_id: 102,
    timestamp_sec: 0.4,
    flame_radius_mm: 7.8,
    flame_color: 'Sooty Yellow',
    is_extinguished: false,
  },
];

/**
 * Color mapper helper for flame visual styling
 */
export function getFlameColorStyle(flameColor: string): {
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  const lower = flameColor.toLowerCase().trim();
  if (lower.includes('bright blue')) {
    return {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-300',
      border: 'border-cyan-500/40',
      dotColor: '#38bdf8',
    };
  }
  if (lower.includes('dim blue')) {
    return {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
      dotColor: '#818cf8',
    };
  }
  if (lower.includes('bright yellow')) {
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      dotColor: '#fbbf24',
    };
  }
  if (lower.includes('sooty yellow')) {
    return {
      bg: 'bg-orange-500/20',
      text: 'text-orange-300',
      border: 'border-orange-500/40',
      dotColor: '#f97316',
    };
  }
  if (lower.includes('none') || lower === '') {
    return {
      bg: 'bg-slate-800/50',
      text: 'text-slate-400',
      border: 'border-slate-700',
      dotColor: '#64748b',
    };
  }
  return {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    dotColor: '#34d399',
  };
}

/**
 * Robust CSV parser for flame experiment datasets
 */
export function parseFlameDatasetCSV(csvText: string): {
  data: FlameMeasurement[];
  errors: string[];
} {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { data: [], errors: ['CSV must contain a header row and at least one data row.'] };
  }

  // Parse header
  const headerCells = lines[0]
    .split(/[,;\t]/)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_'));

  const findColIndex = (candidates: string[]) => {
    return headerCells.findIndex((h) => candidates.includes(h));
  };

  const metricIdIdx = findColIndex(['metric_id', 'metricid', 'id', 'measurement_id']);
  const runIdIdx = findColIndex(['run_id', 'runid', 'experiment_id', 'run']);
  const timestampIdx = findColIndex(['timestamp_sec', 'timestamp', 'time_sec', 'time_s', 'seconds']);
  const radiusIdx = findColIndex(['flame_radius_mm', 'flame_radius', 'radius_mm', 'radius']);
  const colorIdx = findColIndex(['flame_color', 'color', 'appearance', 'flame_appearance']);
  const extinguishedIdx = findColIndex([
    'is_extinguished',
    'extinguished',
    'is_quenched',
    'quenched',
  ]);

  if (radiusIdx === -1 && timestampIdx === -1) {
    return {
      data: [],
      errors: [
        'Could not find required columns. Expected: metric_id, run_id, timestamp_sec, flame_radius_mm, flame_color, is_extinguished',
      ],
    };
  }

  const results: FlameMeasurement[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple split accounting for potential quoted strings
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if ((char === ',' || char === '\t') && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const cleanCell = (idx: number, fallback = '') => {
      if (idx < 0 || idx >= cells.length) return fallback;
      return cells[idx].replace(/^["']|["']$/g, '').trim();
    };

    const metricIdStr = metricIdIdx >= 0 ? cleanCell(metricIdIdx, String(i)) : String(i);
    const metric_id = isNaN(Number(metricIdStr)) ? metricIdStr : Number(metricIdStr);

    const runIdStr = runIdIdx >= 0 ? cleanCell(runIdIdx, '101') : '101';
    const run_id = isNaN(Number(runIdStr)) ? runIdStr : Number(runIdStr);

    const timestampStr = timestampIdx >= 0 ? cleanCell(timestampIdx, '0') : '0';
    const timestamp_sec = parseFloat(timestampStr) || 0;

    const radiusStr = radiusIdx >= 0 ? cleanCell(radiusIdx, '0') : '0';
    const flame_radius_mm = parseFloat(radiusStr) || 0;

    const flame_color = colorIdx >= 0 ? cleanCell(colorIdx, 'Bright Blue') : 'Bright Blue';

    const extStr = (extinguishedIdx >= 0 ? cleanCell(extinguishedIdx, 'false') : 'false').toLowerCase();
    const is_extinguished =
      extStr === 'true' || extStr === '1' || extStr === 'yes' || flame_radius_mm === 0;

    results.push({
      metric_id,
      run_id,
      timestamp_sec,
      flame_radius_mm,
      flame_color,
      is_extinguished,
    });
  }

  return { data: results, errors };
}

/**
 * Export measurements dataset back to formatted CSV
 */
export function exportFlameDatasetToCSV(data: FlameMeasurement[]): string {
  const header = 'metric_id,run_id,timestamp_sec,flame_radius_mm,flame_color,is_extinguished\n';
  const rows = data.map((d) => {
    return `${d.metric_id},${d.run_id},${d.timestamp_sec.toFixed(3)},${d.flame_radius_mm.toFixed(
      2
    )},"${d.flame_color}",${d.is_extinguished ? 'TRUE' : 'FALSE'}`;
  });
  return header + rows.join('\n');
}
