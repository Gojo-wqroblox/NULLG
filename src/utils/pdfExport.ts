import { jsPDF } from 'jspdf';
import { SIAnalysisResult, FuelDefinition } from '../types';
import { AVAILABLE_GASES } from '../data/gases';

export interface HazardReportExportData {
  analysis: SIAnalysisResult;
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number;
  fuel?: FuelDefinition;
  presetName?: string;
  isBeginnerMode?: boolean;
}

export function generateHazardReportPdf(data: HazardReportExportData): jsPDF {
  const {
    analysis,
    gases,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    fuel,
    presetName,
    isBeginnerMode,
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

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin + 4;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NULL-G AEROSPACE • FLIGHT SAFETY DIRECTIVE & SI HAZARD REPORT', margin, margin);
    doc.text(`CONFIDENTIAL - MISSION FLIGHT DATA`, pageWidth - margin, margin, { align: 'right' });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    y = margin + 8;
  };

  // ---------------------------------------------------------------------------
  // 1. TOP HEADER BANNER (Dark Aerospace Header)
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  // Accent cyan border stripe
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(margin, y, 3, 28, 'F');

  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('NULL-G SPACECRAFT COMBUSTION HAZARD REPORT', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Autonomous Microgravity Fire Kinetics, Atmospheric Threat Matrix & Crew Protocol', margin + 6, y + 14);

  // Metadata line (Date & Mission)
  const reportDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  doc.setFontSize(7.5);
  doc.setTextColor(56, 189, 248); // sky-400
  const missionInfo = presetName ? `Preset: ${presetName.toUpperCase()} | ` : '';
  doc.text(`${missionInfo}Generated: ${reportDate} | DOC ID: NULLG-HAZ-${Math.floor(100000 + Math.random() * 900000)}`, margin + 6, y + 22);

  y += 32;

  // ---------------------------------------------------------------------------
  // 2. EXECUTIVE RISK INDEX & THREAT LEVEL BANNER
  // ---------------------------------------------------------------------------
  let threatColor = [6, 182, 212]; // cyan default
  let threatBg = [236, 254, 255];
  if (analysis.dangerLevel === 'EXTREME') {
    threatColor = [225, 29, 72]; // rose
    threatBg = [255, 241, 242];
  } else if (analysis.dangerLevel === 'HIGH') {
    threatColor = [234, 88, 12]; // orange
    threatBg = [255, 247, 237];
  } else if (analysis.dangerLevel === 'ELEVATED') {
    threatColor = [217, 119, 6]; // amber
    threatBg = [254, 252, 232];
  } else if (analysis.dangerLevel === 'EXTINGUISHED') {
    threatColor = [16, 185, 129]; // emerald
    threatBg = [236, 253, 245];
  }

  doc.setFillColor(threatBg[0], threatBg[1], threatBg[2]);
  doc.setDrawColor(threatColor[0], threatColor[1], threatColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  // Threat badge
  doc.setFillColor(threatColor[0], threatColor[1], threatColor[2]);
  doc.roundedRect(margin + 4, y + 4, 48, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.dangerLevel} THREAT LEVEL`, margin + 28, y + 8.2, { align: 'center' });

  // Risk Score indicator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(threatColor[0], threatColor[1], threatColor[2]);
  doc.text(`Score: ${analysis.riskScore}/100`, contentWidth - 6, y + 8.5, { align: 'right' });

  // Summary statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(analysis.summarySimple, contentWidth - 10);
  doc.text(summaryLines, margin + 4, y + 15);

  y += 26;

  // ---------------------------------------------------------------------------
  // 3. FLIGHT ENVIRONMENT & ATMOSPHERE PARAMETERS STRIP
  // ---------------------------------------------------------------------------
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');

  const colW = contentWidth / 4;
  const envParams = [
    { label: 'CABIN PRESSURE', val: `${pressureKpa.toFixed(1)} kPa` },
    { label: 'GRAVITATIONAL LOAD', val: gravityG === 0 ? '0.00 G (Zero-G)' : `${gravityG.toFixed(2)} G` },
    { label: 'VENTILATION AIRFLOW', val: `${ventilationSpeed.toFixed(2)} m/s` },
    { label: 'COMBUSTION FUEL', val: fuel ? fuel.name : 'Standard Candle Wax' },
  ];

  envParams.forEach((param, i) => {
    const colX = margin + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(param.label, colX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(param.val, colX + 3, y + 9.5);
  });

  y += 16;

  // ---------------------------------------------------------------------------
  // 4. ATMOSPHERIC GAS COMPOSITION TABLE
  // ---------------------------------------------------------------------------
  checkPageBreak(38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CURRENT ATMOSPHERIC GAS COMPOSITION', margin, y);

  y += 3.5;

  // Table header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GAS FORMULA & NAME', margin + 3, y + 4.2);
  doc.text('ROLE / BEHAVIOR', margin + 65, y + 4.2);
  doc.text('PERCENTAGE (% VOL)', margin + 120, y + 4.2);
  doc.text('RELATIVE VISUAL BAR', margin + 152, y + 4.2);

  y += 6;

  // Active gases list
  const activeGases = AVAILABLE_GASES.map((g) => ({
    gas: g,
    pct: gases[g.id] || 0,
  })).filter((item) => item.pct > 0);

  // If no gases set, show default nominal air
  if (activeGases.length === 0) {
    activeGases.push(
      { gas: AVAILABLE_GASES.find((g) => g.id === 'O2')!, pct: 21 },
      { gas: AVAILABLE_GASES.find((g) => g.id === 'N2')!, pct: 78 },
      { gas: AVAILABLE_GASES.find((g) => g.id === 'CO2')!, pct: 0.4 },
      { gas: AVAILABLE_GASES.find((g) => g.id === 'Ar')!, pct: 0.6 }
    );
  }

  activeGases.forEach((item, idx) => {
    checkPageBreak(6);
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, contentWidth, 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.gas.chemicalFormula} ${item.gas.name}`, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(item.gas.role.toUpperCase(), margin + 65, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.gas.id === 'O2' ? 2 : item.pct > 25 ? 180 : 15, item.gas.id === 'O2' ? 132 : 23, item.gas.id === 'O2' ? 199 : 42);
    doc.text(`${item.pct.toFixed(1)}%`, margin + 120, y + 4);

    // Mini bar representation
    const barMaxW = 24;
    const barW = Math.min(barMaxW, (item.pct / 100) * barMaxW);
    doc.setFillColor(226, 232, 240);
    doc.rect(margin + 152, y + 1.8, barMaxW, 2.2, 'F');
    doc.setFillColor(item.gas.id === 'O2' ? 6 : item.gas.role === 'fuel' ? 234 : 99, item.gas.id === 'O2' ? 182 : item.gas.role === 'fuel' ? 88 : 102, item.gas.id === 'O2' ? 212 : item.gas.role === 'fuel' ? 12 : 241);
    doc.rect(margin + 152, y + 1.8, barW, 2.2, 'F');

    y += 5.5;
  });

  // Total summary row
  const totalVolume = activeGases.reduce((acc, curr) => acc + curr.pct, 0);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CHAMBER VOLUME BALANCED', margin + 3, y + 3.7);
  doc.text(`${totalVolume.toFixed(1)}%`, margin + 120, y + 3.7);

  y += 9;

  // ---------------------------------------------------------------------------
  // 5. CORE COMBUSTION DIAGNOSTICS TILES
  // ---------------------------------------------------------------------------
  checkPageBreak(18);

  const tileW = (contentWidth - 9) / 4;
  const diagnostics = [
    { label: 'FLAME CORE TEMP', val: `${analysis.flameTempK || 298} K`, sub: `(~${(analysis.flameTempK || 298) - 273}°C)` },
    { label: '0-G SPHERE DIA', val: `${((analysis.flameRadiusCm || 1.4) * 2).toFixed(1)} cm`, sub: 'Diffusion envelope' },
    { label: 'SPARK QUENCH GAP', val: `${analysis.quenchRadiusMm || 2.5} mm`, sub: 'Flammability mesh' },
    { label: 'COMBUSTION REGIME', val: analysis.dangerLevel === 'EXTINGUISHED' ? 'Quenched' : 'Diffusive 0-G', sub: 'Rayleigh / Lewis' },
  ];

  diagnostics.forEach((diag, i) => {
    const tileX = margin + i * (tileW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(tileX, y, tileW, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(diag.label, tileX + 2.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(diag.val, tileX + 2.5, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(diag.sub, tileX + 2.5, y + 12.5);
  });

  y += 18;

  // ---------------------------------------------------------------------------
  // 6. RANKED SPACEFLIGHT HAZARDS
  // ---------------------------------------------------------------------------
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RANKED SPACEFLIGHT HAZARD MATRIX', margin, y);

  y += 4;

  analysis.rankedHazards.forEach((hazard, idx) => {
    checkPageBreak(16);

    let badgeColor = [225, 29, 72]; // rose
    if (hazard.severity === 'HIGH') badgeColor = [234, 88, 12];
    if (hazard.severity === 'MEDIUM') badgeColor = [217, 119, 6];
    if (hazard.severity === 'LOW') badgeColor = [16, 185, 129];

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    // Index & Severity Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`[0${idx + 1}] ${hazard.title}`, margin + 3, y + 4.5);

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(contentWidth + margin - 24, y + 2, 20, 4, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(hazard.severity, contentWidth + margin - 14, y + 4.9, { align: 'center' });

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const hazardDescLines = doc.splitTextToSize(hazard.description, contentWidth - 8);
    doc.text(hazardDescLines, margin + 3, y + 8.5);

    y += 14;
  });

  y += 2;

  // ---------------------------------------------------------------------------
  // 7. ASTRONAUT EMERGENCY SAFETY PROTOCOL
  // ---------------------------------------------------------------------------
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NULL-G ASTRONAUT EMERGENCY PROTOCOL (CREW CHECKLIST)', margin, y);

  y += 4;

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.setLineWidth(0.5);

  const protocolHeight = 8 + analysis.astronautProtocol.length * 6;
  doc.roundedRect(margin, y, contentWidth, protocolHeight, 2, 2, 'FD');

  analysis.astronautProtocol.forEach((step, idx) => {
    // Step number bubble
    doc.setFillColor(16, 185, 129);
    doc.circle(margin + 6, y + 5 + idx * 6, 2.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, margin + 6, y + 5.7 + idx * 6, { align: 'center' });

    // Step text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59); // emerald-900
    doc.text(step, margin + 11, y + 5.7 + idx * 6);
  });

  y += protocolHeight + 5;

  // ---------------------------------------------------------------------------
  // 8. HISTORICAL SPACEFLIGHT PRECEDENT
  // ---------------------------------------------------------------------------
  if (analysis.historicalPrecedent) {
    checkPageBreak(18);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('HISTORICAL MISSION PRECEDENT & NASA TEST DATA:', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const histLines = doc.splitTextToSize(analysis.historicalPrecedent, contentWidth - 8);
    doc.text(histLines, margin + 3, y + 8.5);

    y += 18;
  }

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
    doc.text('NULL-G Spacecraft Fire Safety Super Intelligence • Grounded in NASA Saffire, BASS, and Apollo mission data', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc;
}

export function downloadHazardReportPdf(data: HazardReportExportData, filename?: string): void {
  const doc = generateHazardReportPdf(data);
  const safeFilename = filename || `NULLG_SI_Hazard_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}

export function getHazardReportPdfBlob(data: HazardReportExportData): Blob {
  const doc = generateHazardReportPdf(data);
  return doc.output('blob');
}
