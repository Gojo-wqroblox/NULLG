import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  X,
  ShieldAlert,
  Flame,
  Activity,
  History,
  AlertTriangle,
  Wind,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { SIAnalysisResult, FuelDefinition } from '../types';
import { AVAILABLE_GASES } from '../data/gases';
import { downloadHazardReportPdf } from '../utils/pdfExport';

interface HazardPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: SIAnalysisResult;
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number;
  fuel?: FuelDefinition;
  presetName?: string;
  isBeginnerMode?: boolean;
}

export const HazardPdfModal: React.FC<HazardPdfModalProps> = ({
  isOpen,
  onClose,
  analysis,
  gases,
  pressureKpa,
  gravityG,
  ventilationSpeed,
  fuel,
  presetName,
  isBeginnerMode,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      downloadHazardReportPdf({
        analysis,
        gases,
        pressureKpa,
        gravityG,
        ventilationSpeed,
        fuel,
        presetName,
        isBeginnerMode,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const activeGases = AVAILABLE_GASES.filter((g) => (gases[g.id] || 0) > 0)
      .map((g) => `${g.chemicalFormula} (${g.name}): ${(gases[g.id] || 0).toFixed(1)}%`)
      .join(', ');

    const hazards = analysis.rankedHazards
      .map((h, i) => `${i + 1}. [${h.severity}] ${h.title}: ${h.description}`)
      .join('\n');

    const protocols = analysis.astronautProtocol
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n');

    const summaryText = `========================================================
NULL-G SPACECRAFT COMBUSTION HAZARD REPORT
========================================================
Threat Level: ${analysis.dangerLevel} | Risk Score: ${analysis.riskScore}/100
Cabin Pressure: ${pressureKpa.toFixed(1)} kPa | Gravity: ${gravityG === 0 ? '0-G Microgravity' : `${gravityG}g`}
Ventilation Airflow: ${ventilationSpeed.toFixed(2)} m/s | Fuel: ${fuel ? fuel.name : 'Candle Wax'}

Atmospheric Gas Composition:
${activeGases}

Diagnostics:
- Flame Core Temperature: ${analysis.flameTempK || 298} K (~${(analysis.flameTempK || 298) - 273}°C)
- 0-G Diffusion Sphere Diameter: ${((analysis.flameRadiusCm || 1.4) * 2).toFixed(1)} cm
- Spark Quench Gap: ${analysis.quenchRadiusMm || 2.5} mm

Executive Summary:
${analysis.summarySimple}

Ranked Spaceflight Hazards:
${hazards}

Astronaut Emergency Protocol:
${protocols}

Precedent:
${analysis.historicalPrecedent}
========================================================`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Active gases for preview
  const activeGasesList = AVAILABLE_GASES.filter((g) => (gases[g.id] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Formatted SI Hazard Report PDF Export
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PRINT READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Aerospace-grade vector PDF summary with gas breakdown, physics telemetry & emergency protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
              title="Copy plain-text summary"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Preview */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-900/50">
          <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-slate-200">
            {/* Header Document Memo Banner */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase block mb-1">
                  NULL-G SPACECRAFT COMBUSTION DIAGNOSTICS • FLIGHT SAFETY MEMO
                </span>
                <h2 className="text-lg font-bold font-mono text-white tracking-wide">
                  SI HAZARD EVALUATION & CREW SURVIVABILITY REPORT
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  Autonomous Spaceflight Fire Safety Intelligence • Gemini Grounded
                </span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <div>Date: <strong className="text-slate-200">{new Date().toLocaleDateString()}</strong></div>
                <div>Status: <strong className="text-cyan-400">ACTIVE FLIGHT DIRECTIVE</strong></div>
              </div>
            </div>

            {/* Threat Level & Risk Score Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              analysis.dangerLevel === 'EXTREME'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : analysis.dangerLevel === 'HIGH'
                ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                : analysis.dangerLevel === 'ELEVATED'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            }`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 uppercase">
                      {analysis.dangerLevel} THREAT
                    </span>
                    <span className="text-xs font-mono font-bold">
                      Risk Index: {analysis.riskScore} / 100
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-95">
                    {analysis.summarySimple}
                  </p>
                </div>
              </div>
            </div>

            {/* Flight Parameters Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PRESSURE</span>
                <strong className="text-cyan-300">{pressureKpa.toFixed(1)} kPa</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GRAVITY</span>
                <strong className="text-cyan-300">{gravityG === 0 ? '0.00 G (Zero-G)' : `${gravityG.toFixed(2)} G`}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">VENTILATION</span>
                <strong className="text-cyan-300">{ventilationSpeed.toFixed(2)} m/s</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">FUEL</span>
                <strong className="text-white truncate block">{fuel ? fuel.name : 'Candle Wax'}</strong>
              </div>
            </div>

            {/* Atmospheric Gas Composition Table */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Current Atmospheric Gas Composition:
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Gas & Formula</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Concentration (% Vol)</th>
                      <th className="py-2 px-3">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {activeGasesList.map((g) => {
                      const pct = gases[g.id] || 0;
                      return (
                        <tr key={g.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                            <span>{g.chemicalFormula}</span>
                            <span className="text-slate-400 text-[11px] font-normal">({g.name})</span>
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] text-slate-300">
                            {g.role}
                          </td>
                          <td className="py-2 px-3 font-bold text-cyan-300">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 w-40">
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: g.color }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Combustion Physics Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">FLAME TEMP</span>
                <span className="text-amber-400 font-bold text-sm block">
                  {analysis.flameTempK || 298} K
                </span>
                <span className="text-[10px] text-slate-500">
                  ~{(analysis.flameTempK || 298) - 273}°C
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SPHERE DIA</span>
                <span className="text-cyan-400 font-bold text-sm block">
                  {((analysis.flameRadiusCm || 1.4) * 2).toFixed(1)} cm
                </span>
                <span className="text-[10px] text-slate-500">
                  Diffusion radius
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">QUENCH GAP</span>
                <span className="text-pink-400 font-bold text-sm block">
                  {analysis.quenchRadiusMm || 2.5} mm
                </span>
                <span className="text-[10px] text-slate-500">
                  Mesh ignition limit
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">REGIME</span>
                <span className="text-emerald-400 font-bold text-xs block truncate mt-0.5">
                  {analysis.dangerLevel === 'EXTINGUISHED' ? 'Quenched' : 'Diffusive 0-G'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Rayleigh / Lewis
                </span>
              </div>
            </div>

            {/* Ranked Spaceflight Hazards */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Ranked Spaceflight Hazards:
              </h4>
              <div className="space-y-2">
                {analysis.rankedHazards.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 mt-0.5">0{i + 1}</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{h.title}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          h.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          h.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {h.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-normal">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Astronaut Emergency Action Protocol Checklist */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <h4 className="text-xs font-mono font-bold uppercase text-emerald-300 mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                NULL-G Astronaut Emergency Protocol:
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                {analysis.astronautProtocol.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Precedent */}
            {analysis.historicalPrecedent && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <History className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 block mb-0.5 font-mono">Mission Precedent:</strong>
                  <p>{analysis.historicalPrecedent}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-400">
          <span>Ready to download or print formatted report</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
