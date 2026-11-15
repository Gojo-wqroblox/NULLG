import { jsPDF } from 'jspdf';
import type {
  LiveSafetyDrillEvent,
  SafetyDrillHighScoreEntry,
} from '../components/SafetyDrillWidget';

export interface LatestDrillOutcomeSnapshot {
  scenario: LiveSafetyDrillEvent;
  outcome: 'extinguished' | 'failed';
  responseTimeSec: number | null;
  quenchMethod: string;
  recordType: 'overall' | 'scenario' | null;
  rank: number | null;
  operatorName: string;
  recordedAtIso: string;
  chamberTelemetry: {
    o2Pct: number;
    co2Pct: number;
    pressureKpa: number;
    gravityG: number;
    ventilationSpeed: number;
    flameTempK: number;
    isIgnited: boolean;
  };
}

export interface AfterActionReportData {
  operatorName: string;
  stats: {
    cleared: number;
    failed: number;
  };
  highScores: SafetyDrillHighScoreEntry[];
  scenarios: LiveSafetyDrillEvent[];
  latestOutcome: LatestDrillOutcomeSnapshot | null;
  currentTelemetry: {
    o2Pct: number;
    co2Pct: number;
    pressureKpa: number;
    gravityG: number;
    ventilationSpeed: number;
    flameTempK: number;
    isIgnited: boolean;
  };
}

/**
 * Sanitize subscripts and Unicode math symbols so built-in jsPDF Helvetica
 * renders cleanly without encoding glitches.
 */
function sanitizePdfText(input: string): string {
  return input
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/·/g, '|')
    .replace(/★/g, '*')
    .replace(/●/g, '*')
    .replace(/▲/g, '!')
    .replace(/✖/g, 'X')
    .replace(/—|–/g, '-');
}

export function generateAfterActionReportPdf(data: AfterActionReportData): jsPDF {
  const {
    operatorName,
    stats,
    highScores,
    scenarios,
    latestOutcome,
    currentTelemetry,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NULLG COMBUSTION LAB - EMERGENCY DRILL AFTER-ACTION REPORT', margin, margin);
    doc.text(sanitizePdfText(`OPERATOR: ${operatorName.toUpperCase()}`), pageWidth - margin, margin, {
      align: 'right',
    });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    y = margin + 8;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      renderRunningHeader();
    }
  };

  // ---------------------------------------------------------------------------
  // 1. HEADER BANNER
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 27, 2.5, 2.5, 'F');

  doc.setFillColor(6, 182, 212);
  doc.rect(margin, y, 2.8, 27, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CHAMBER EMERGENCY DRILL AFTER-ACTION REPORT', margin + 6, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Spacecraft Microgravity Fire Containment Debrief, Telemetry & Response Rankings', margin + 6, y + 14.5);

  const generatedStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const docId = `NULLG-AAR-${Math.floor(100000 + Math.random() * 900000)}`;

  doc.setFontSize(7.5);
  doc.setTextColor(56, 189, 248);
  doc.text(
    sanitizePdfText(`Operator: ${operatorName} | Generated: ${generatedStr} | Ref: ${docId}`),
    margin + 6,
    y + 21.5
  );

  y += 32;

  // ---------------------------------------------------------------------------
  // 2. CUMULATIVE PERFORMANCE METRICS STRIP
  // ---------------------------------------------------------------------------
  const totalRuns = stats.cleared + stats.failed;
  const passRateStr = totalRuns > 0 ? `${Math.round((stats.cleared / totalRuns) * 100)}%` : 'N/A';
  const bestOverallSec = highScores.length > 0 ? highScores[0].responseTimeSec : null;
  const avgTopSec =
    highScores.length > 0
      ? highScores.reduce((sum, entry) => sum + entry.responseTimeSec, 0) / highScores.length
      : null;

  const kpis = [
    { label: 'DRILLS CLEARED', value: `${stats.cleared}`, sub: `${totalRuns} total attempts` },
    { label: 'TIMED OUT / FAILED', value: `${stats.failed}`, sub: 'Expired limit' },
    { label: 'CONTAINMENT RATE', value: passRateStr, sub: 'Cleared / attempts' },
    {
      label: 'FASTEST RESPONSE',
      value: bestOverallSec !== null ? `${bestOverallSec.toFixed(1)} s` : '--',
      sub: avgTopSec !== null ? `Top avg: ${avgTopSec.toFixed(1)} s` : 'No clears yet',
    },
  ];

  const tileW = (contentWidth - 9) / 4;
  kpis.forEach((kpi, idx) => {
    const tileX = margin + idx * (tileW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(tileX, y, tileW, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, tileX + 2.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, tileX + 2.5, y + 10.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, tileX + 2.5, y + 14.2);
  });

  y += 21;

  // ---------------------------------------------------------------------------
  // 3. LATEST DRILL ENGAGEMENT DEBRIEF
  // ---------------------------------------------------------------------------
  checkPageBreak(44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LATEST EMERGENCY DRILL SUMMARY', margin, y);
  y += 3.5;

  if (latestOutcome) {
    const isCleared = latestOutcome.outcome === 'extinguished';
    const borderRgb = isCleared ? [16, 185, 129] : [225, 29, 72];
    const fillRgb = isCleared ? [236, 253, 245] : [255, 241, 242];

    const briefingLines = doc.splitTextToSize(
      sanitizePdfText(latestOutcome.scenario.briefing),
      contentWidth - 8
    );
    const boxHeight = 25 + briefingLines.length * 3.8;

    doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    // Status pill
    doc.setFillColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.roundedRect(margin + 4, y + 3.5, 42, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(isCleared ? 'HAZARD EXTINGUISHED' : 'TIME EXPIRED', margin + 25, y + 7.2, {
      align: 'center',
    });

    // Right-aligned timing metric
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    const timingLabel =
      isCleared && latestOutcome.responseTimeSec !== null
        ? `Cleared in ${latestOutcome.responseTimeSec.toFixed(1)}s / ${latestOutcome.scenario.timeLimitSec}s`
        : `Exceeded ${latestOutcome.scenario.timeLimitSec}s limit`;
    doc.text(timingLabel, margin + contentWidth - 4, y + 7.4, { align: 'right' });

    // Scenario title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      sanitizePdfText(`${latestOutcome.scenario.code} - ${latestOutcome.scenario.title}`),
      margin + 4,
      y + 13.8
    );

    // Briefing paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(briefingLines, margin + 4, y + 18.5);

    // Bottom detail line inside debrief card
    const recordNote =
      latestOutcome.recordType === 'overall'
        ? ' | * New Overall Fastest Record'
        : latestOutcome.recordType === 'scenario'
        ? ' | * New Scenario Record'
        : '';
    const rankNote = latestOutcome.rank !== null ? ` | Leaderboard Rank #${latestOutcome.rank}` : '';
    const methodNote = isCleared ? `Method: ${latestOutcome.quenchMethod}` : `Hint: ${latestOutcome.scenario.hint}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(
      sanitizePdfText(`${methodNote}${rankNote}${recordNote}`),
      margin + 4,
      y + boxHeight - 3.5
    );

    y += boxHeight + 4;

    // Chamber telemetry snapshot row at drill end
    checkPageBreak(15);
    const snap = latestOutcome.chamberTelemetry;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 11.5, 1.5, 1.5, 'F');
    const snapItems = [
      { l: 'POST-DRILL O2', v: `${snap.o2Pct.toFixed(1)}%` },
      { l: 'POST-DRILL CO2', v: `${snap.co2Pct.toFixed(1)}%` },
      { l: 'VENTILATION', v: `${snap.ventilationSpeed.toFixed(2)} m/s` },
      { l: 'PRESSURE / G', v: `${snap.pressureKpa.toFixed(1)} kPa / ${snap.gravityG.toFixed(1)}G` },
      { l: 'CHAMBER TEMP', v: snap.isIgnited ? `${snap.flameTempK} K` : '298 K (Quenched)' },
    ];
    const colW5 = contentWidth / 5;
    snapItems.forEach((item, i) => {
      const cx = margin + i * colW5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(item.l, cx + 2.5, y + 4.2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(item.v, cx + 2.5, y + 9);
    });
    y += 16;
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('STANDBY SESSION REPORT - CURRENT CHAMBER TELEMETRY', margin + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      sanitizePdfText(
        `Current state: O2 ${currentTelemetry.o2Pct.toFixed(1)}% | CO2 ${currentTelemetry.co2Pct.toFixed(
          1
        )}% | Airflow ${currentTelemetry.ventilationSpeed.toFixed(
          2
        )} m/s | Pressure ${currentTelemetry.pressureKpa.toFixed(
          1
        )} kPa | Gravity ${currentTelemetry.gravityG.toFixed(1)}G`
      ),
      margin + 3,
      y + 11.5
    );
    y += 20;
  }

  // ---------------------------------------------------------------------------
  // 4. TOP FASTEST RESPONSE RANKINGS TABLE
  // ---------------------------------------------------------------------------
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('FASTEST RESPONSE LEADERBOARD (PERSISTED TOP RUNS)', margin, y);
  y += 3.5;

  if (highScores.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'No cleared emergency drills recorded yet. Clear an anomaly scenario to populate rankings.',
      margin + 3,
      y + 6.8
    );
    y += 15;
  } else {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('RANK', margin + 2.5, y + 4.2);
    doc.text('SCENARIO', margin + 15, y + 4.2);
    doc.text('OPERATOR', margin + 98, y + 4.2);
    doc.text('METHOD', margin + 122, y + 4.2);
    doc.text('MARGIN', margin + 154, y + 4.2, { align: 'right' });
    doc.text('RESPONSE', margin + 180, y + 4.2, { align: 'right' });
    y += 6;

    highScores.forEach((entry, idx) => {
      checkPageBreak(6.5);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(margin, y, contentWidth, 5.8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(idx === 0 ? 180 : 15, idx === 0 ? 83 : 23, idx === 0 ? 9 : 42);
      doc.text(`#${idx + 1}`, margin + 2.5, y + 4);

      const rawScenario = sanitizePdfText(`${entry.scenarioCode}: ${entry.scenarioTitle}`);
      const shortScenario = rawScenario.length > 48 ? `${rawScenario.slice(0, 46)}...` : rawScenario;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(shortScenario, margin + 15, y + 4);

      doc.setTextColor(71, 85, 105);
      doc.text(sanitizePdfText(entry.operatorName.slice(0, 14)), margin + 98, y + 4);
      doc.text(sanitizePdfText(entry.quenchMethod.slice(0, 16)), margin + 122, y + 4);

      const marginSec = Math.max(0, entry.timeLimitSec - entry.responseTimeSec);
      doc.text(`+${marginSec.toFixed(1)}s`, margin + 154, y + 4, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`${entry.responseTimeSec.toFixed(1)}s`, margin + 180, y + 4, { align: 'right' });

      y += 5.8;
    });

    y += 5;
  }

  // ---------------------------------------------------------------------------
  // 5. PER-SCENARIO BENCHMARK MATRIX
  // ---------------------------------------------------------------------------
  checkPageBreak(42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ANOMALY SCENARIO COVERAGE & CONTAINMENT TARGETS', margin, y);
  y += 3.5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CODE', margin + 2.5, y + 4.2);
  doc.text('ANOMALY SCENARIO', margin + 24, y + 4.2);
  doc.text('CONTAINMENT CRITERIA', margin + 100, y + 4.2);
  doc.text('LIMIT', margin + 158, y + 4.2, { align: 'right' });
  doc.text('BEST CLEAR', margin + 180, y + 4.2, { align: 'right' });
  y += 6;

  const bestMap = new Map<string, number>();
  for (const score of highScores) {
    const cur = bestMap.get(score.scenarioId);
    if (cur === undefined || score.responseTimeSec < cur) {
      bestMap.set(score.scenarioId, score.responseTimeSec);
    }
  }

  scenarios.forEach((sc, idx) => {
    checkPageBreak(6.5);
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(2, 132, 199);
    doc.text(sc.code, margin + 2.5, y + 4.2);

    const scTitle = sanitizePdfText(sc.title);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(scTitle.length > 42 ? `${scTitle.slice(0, 40)}...` : scTitle, margin + 24, y + 4.2);

    const criteria = sanitizePdfText(
      `O2 <= ${sc.targets.maxO2Pct}% or CO2 >= ${sc.targets.altMinCo2Pct}%, Fan <= ${sc.targets.maxVentilationMs} m/s`
    );
    doc.setTextColor(71, 85, 105);
    doc.text(criteria, margin + 100, y + 4.2);

    doc.text(`${sc.timeLimitSec}s`, margin + 158, y + 4.2, { align: 'right' });

    const best = bestMap.get(sc.id);
    doc.setFont('helvetica', 'bold');
    if (best !== undefined) {
      doc.setTextColor(5, 150, 105);
      doc.text(`${best.toFixed(1)}s`, margin + 180, y + 4.2, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('--', margin + 180, y + 4.2, { align: 'right' });
    }

    y += 6;
  });

  y += 6;

  // ---------------------------------------------------------------------------
  // 6. DEBRIEF TAKEAWAYS & SAFETY DIRECTIVES
  // ---------------------------------------------------------------------------
  checkPageBreak(28);
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.4);

  const recommendations = [
    '1. Isolate forced ventilation (<= 0.05 m/s) immediately to halt convective oxygen delivery to the flame front.',
    '2. Starve combustion below the Limiting Oxygen Index (<= 12-16% O2) or flood CO2 (>= 22-25%) for inerting.',
    '3. During hyperoxic or hypergravity excursions, monitor flame core temperature before re-energizing racks.',
  ];

  const recHeight = 10 + recommendations.length * 5.2;
  doc.roundedRect(margin, y, contentWidth, recHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('MISSION SAFETY DEBRIEF & CREW GUIDELINES', margin + 3, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  recommendations.forEach((rec, i) => {
    doc.text(rec, margin + 3, y + 10.5 + i * 5.2);
  });

  // ---------------------------------------------------------------------------
  // RUNNING FOOTER ON ALL PAGES
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'NULLG Zero-G Combustion Simulator - Emergency Drill After-Action Performance Record',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc;
}

export function downloadAfterActionReportPdf(data: AfterActionReportData): void {
  const doc = generateAfterActionReportPdf(data);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const scenarioSuffix = data.latestOutcome ? `_${data.latestOutcome.scenario.code}` : '';
  doc.save(`NULLG_After_Action_Report${scenarioSuffix}_${dateStamp}.pdf`);
}
