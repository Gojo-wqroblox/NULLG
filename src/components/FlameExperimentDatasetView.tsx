import React, { useState, useRef } from 'react';
import {
  FlameMeasurement,
  INITIAL_SAMPLE_FLAME_DATASET,
  getFlameColorStyle,
  parseFlameDatasetCSV,
  exportFlameDatasetToCSV,
} from '../data/flameExperimentDataset';
import { FuelDefinition } from '../types';
import { OxygenTempScatterPlot } from './OxygenTempScatterPlot';
import {
  Table,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Clock,
  CircleDot,
  Info,
} from 'lucide-react';

interface FlameExperimentDatasetViewProps {
  onApplyMeasurementToChamber?: (measurement: FlameMeasurement) => void;
  onCloseModal?: () => void;
  isEmbedded?: boolean;
  gases?: Record<string, number>;
  flameTempK?: number;
  gravityG?: number;
  pressureKpa?: number;
  fuel?: FuelDefinition;
  isIgnited?: boolean;
  onGasChange?: (gasId: string, val: number) => void;
}

export const FlameExperimentDatasetView: React.FC<FlameExperimentDatasetViewProps> = ({
  onApplyMeasurementToChamber,
  onCloseModal,
  isEmbedded = false,
  gases,
  flameTempK,
  gravityG = 0,
  pressureKpa = 101.3,
  fuel,
  isIgnited = true,
  onGasChange,
}) => {
  const [dataset, setDataset] = useState<FlameMeasurement[]>(INITIAL_SAMPLE_FLAME_DATASET);
  const [selectedRunFilter, setSelectedRunFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [pasteCsvText, setPasteCsvText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<FlameMeasurement | null>(null);
  const [graphViewMode, setGraphViewMode] = useState<'split' | 'overlay'>('split');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSampleData = dataset.length === INITIAL_SAMPLE_FLAME_DATASET.length &&
    dataset.every((d, i) => d.metric_id === INITIAL_SAMPLE_FLAME_DATASET[i].metric_id);

  // Extract unique run IDs
  const uniqueRuns = Array.from(new Set(dataset.map((d) => String(d.run_id))));

  // Filtered dataset
  const filteredData = selectedRunFilter === 'all'
    ? dataset
    : dataset.filter((d) => String(d.run_id) === selectedRunFilter);

  // Stats
  const totalMeasurements = dataset.length;
  const extinguishedCount = dataset.filter((d) => d.is_extinguished).length;
  const maxRadius = Math.max(...dataset.map((d) => d.flame_radius_mm), 0);

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processCsvString(text, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processCsvString = (text: string, sourceName = 'pasted input') => {
    const { data, errors } = parseFlameDatasetCSV(text);
    if (errors.length > 0 || data.length === 0) {
      setImportFeedback({
        type: 'error',
        message: errors[0] || 'No valid rows found in CSV. Check column headers.',
      });
      return;
    }

    setDataset(data);
    setSelectedRunFilter('all');
    setIsImporting(false);
    setPasteCsvText('');
    setImportFeedback({
      type: 'success',
      message: `Successfully loaded ${data.length} measurement rows from ${sourceName}!`,
    });
    setTimeout(() => setImportFeedback(null), 5000);
  };

  const handleDownloadCsv = () => {
    const csvContent = exportFlameDatasetToCSV(dataset);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nullg_flame_experiment_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSample = () => {
    setDataset(INITIAL_SAMPLE_FLAME_DATASET);
    setSelectedRunFilter('all');
    setImportFeedback({
      type: 'success',
      message: 'Reset to the 6 initial visible sample rows from the table image.',
    });
    setTimeout(() => setImportFeedback(null), 4000);
  };

  // Run 101 data & extinction detection
  const run101Data = dataset.filter((d) => String(d.run_id) === '101');
  const run101ExtinctionPoint = run101Data.find((d) => d.is_extinguished || d.flame_radius_mm === 0);

  // Run 102 data
  const run102Data = dataset.filter((d) => String(d.run_id) === '102');

  return (
    <div className={`flex flex-col gap-4 text-slate-100 ${isEmbedded ? '' : 'p-4 sm:p-6 max-w-5xl mx-auto w-full'}`}>
      {/* Top Banner: Sample Data Notice or Custom Data Status */}
      {isSampleData ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 font-mono uppercase tracking-wider">
                  Sample Data Active (6 Visible Image Rows)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  IMAGE SAMPLE ONLY
                </span>
              </div>
              <p className="text-slate-300 mt-0.5">
                These 6 rows are the exact visible sample measurements from your table image. No artificial rows were invented. You can replace them with your complete CSV anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setIsImporting(true)}
              className="w-full sm:w-auto text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              Replace with Full CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 text-xs">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-cyan-300 font-mono">
                Custom Complete CSV Loaded ({dataset.length} Rows)
              </span>
              <p className="text-slate-300 text-[11px]">
                Imported across {uniqueRuns.length} experimental runs.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetSample}
            className="text-xs font-mono px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            Reset to Sample
          </button>
        </div>
      )}

      {/* Import Feedback Banner */}
      {importFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fadeIn ${
            importFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {importFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{importFeedback.message}</span>
        </div>
      )}

      {/* CSV Import Modal / Drawer */}
      {isImporting && (
        <div className="p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                Import Complete Flame Dataset (CSV / TSV)
              </span>
            </div>
            <button
              onClick={() => setIsImporting(false)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: File Picker */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-2 hover:border-cyan-500/40 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center gap-2 py-4 w-full"
              >
                <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  Select CSV File from Computer
                </span>
                <span className="text-[10px] text-slate-400">
                  Supports .csv, .tsv with flame experiment columns
                </span>
              </label>
            </div>

            {/* Option B: Direct CSV Paste */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>Or Paste Raw CSV Content:</span>
                <span className="text-[10px] text-slate-500">Auto-detects delimiters</span>
              </label>
              <textarea
                value={pasteCsvText}
                onChange={(e) => setPasteCsvText(e.target.value)}
                placeholder="metric_id,run_id,timestamp_sec,flame_radius_mm,flame_color,is_extinguished&#10;1,101,0.100,2.50,Bright Blue,FALSE&#10;2,101,0.500,5.10,Dim Blue spherical,FALSE..."
                className="w-full h-24 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
              <button
                disabled={!pasteCsvText.trim()}
                onClick={() => processCsvString(pasteCsvText, 'pasted text')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Parse & Load CSV Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>Measurements</span>
            <Table className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">{totalMeasurements}</span>
            <span className="text-[10px] font-mono text-slate-500">rows</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>Experiment Runs</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-300">{uniqueRuns.length}</span>
            <span className="text-[10px] font-mono text-slate-500">({uniqueRuns.join(', ')})</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>Peak Radius</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-300">{maxRadius.toFixed(2)}</span>
            <span className="text-[10px] font-mono text-slate-500">mm</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>Extinguished</span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-300">{extinguishedCount}</span>
            <span className="text-[10px] font-mono text-slate-500">recorded</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2 DEDICATED GRAPHS: 1 FOR RUN 101 AND 1 FOR RUN 102 */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Experiment Data Viewer: Flame Radius Against Time (Run 101 & Run 102)
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Graph Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setGraphViewMode('split')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  graphViewMode === 'split'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2 Dedicated Graphs (Run 101 & 102)
              </button>
              <button
                onClick={() => setGraphViewMode('overlay')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  graphViewMode === 'overlay'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Overlay Comparison
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>Run 101 Extinction: t = 2.000s</span>
            </div>
          </div>
        </div>

        {graphViewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ------------------------------------------------------------------- */}
          {/* GRAPH 1: RUN 101 (Microgravity Spherical Quenching & Extinction) */}
          {/* ------------------------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex flex-col gap-3 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <span className="font-bold font-mono text-sm text-cyan-300">
                  GRAPH 1: RUN 101
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Microgravity Quench
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">4 Points (0.100s – 2.000s)</span>
            </div>

            {/* Prominent Flame Goes Out Banner */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/50 border border-rose-500/50 text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 text-rose-200">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-white block sm:inline mr-1">
                    RECORDED FLAME EXTINCTION:
                  </span>
                  <span>t = <strong className="text-rose-400 text-sm">2.000s</strong> (Radius = 0.00 mm)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/60 animate-pulse">
                GOES OUT
              </span>
            </div>

            {/* SVG Plot for RUN 101 */}
            <div className="relative w-full h-48 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 360 130">
                {/* Horizontal grid lines & Y labels */}
                <line x1="35" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="23" fill="#64748b" fontSize="9" fontFamily="monospace">6.0mm</text>

                <line x1="35" y1="58" x2="350" y2="58" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="61" fill="#64748b" fontSize="9" fontFamily="monospace">3.0mm</text>

                <line x1="35" y1="100" x2="350" y2="100" stroke="#475569" strokeWidth="1" />
                <text x="5" y="103" fill="#64748b" fontSize="9" fontFamily="monospace">0.0mm</text>

                {/* X-axis labels */}
                <text x="45" y="120" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.100s</text>
                <text x="110" y="120" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.500s</text>
                <text x="205" y="120" fill="#94a3b8" fontSize="9" fontFamily="monospace">1.200s (PEAK)</text>
                <text x="295" y="120" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">2.000s (OUT)</text>

                {/* Vertical extinction guide line at t=2.000s */}
                <line x1="330" y1="10" x2="330" y2="100" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />

                {(() => {
                  if (run101Data.length === 0) return null;
                  const getCoords = (d: FlameMeasurement) => {
                    const x = 45 + (d.timestamp_sec / 2.0) * 285;
                    const y = 100 - (d.flame_radius_mm / 7.2) * 85;
                    return { x, y };
                  };

                  const coords = run101Data.map(getCoords);
                  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

                  return (
                    <>
                      {/* Gradient Area Fill under Curve */}
                      <polygon
                        points={`45,100 ${polylinePoints} 330,100`}
                        fill="url(#run101AreaGrad)"
                        opacity="0.25"
                      />
                      <defs>
                        <linearGradient id="run101AreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Trajectory Line */}
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylinePoints}
                      />

                      {/* Plotted Data Points */}
                      {run101Data.map((d) => {
                        const { x, y } = getCoords(d);
                        const isExt = d.is_extinguished || d.flame_radius_mm === 0;

                        return (
                          <g key={d.metric_id}>
                            {isExt ? (
                              <>
                                <circle cx={x} cy={y} r="10" fill="#f43f5e" opacity="0.3" className="animate-ping" />
                                <circle cx={x} cy={y} r="5.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                              </>
                            ) : (
                              <circle
                                cx={x}
                                cy={y}
                                r={hoveredPoint?.metric_id === d.metric_id ? 6 : 4.5}
                                fill="#38bdf8"
                                stroke="#0f172a"
                                strokeWidth="2"
                                className="cursor-pointer transition-transform hover:scale-150"
                                onMouseEnter={() => setHoveredPoint(d)}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            )}

                            {/* Label atop point */}
                            <text
                              x={x}
                              y={y - 8}
                              textAnchor="middle"
                              fill={isExt ? '#f43f5e' : '#38bdf8'}
                              fontSize="8.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {d.flame_radius_mm.toFixed(2)}mm
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Run 101 Behavior Summary */}
            <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-cyan-300 font-bold block mb-0.5">Run 101 Analysis:</span>
              Ignites at 2.50mm (Bright Blue) and expands to peak 6.30mm (1.200s, Dim Blue spherical). As oxygen in the diffusion shell is exhausted, the flame abruptly quenches at <strong>t = 2.000s (0.00mm)</strong>.
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* GRAPH 2: RUN 102 (Luminous Sooty Yellow Expansion) */}
          {/* ------------------------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col gap-3 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                <span className="font-bold font-mono text-sm text-amber-300">
                  GRAPH 2: RUN 102
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Sooty Expansion
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2 Points (0.100s – 0.400s)</span>
            </div>

            {/* Active Expansion Banner */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/50 border border-emerald-500/50 text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block sm:inline mr-1">
                    VIGOROUS ACTIVE BURNING:
                  </span>
                  <span>Peak Radius = <strong className="text-amber-400 text-sm">7.80 mm</strong> @ 0.400s</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/60">
                NOT EXTINGUISHED
              </span>
            </div>

            {/* SVG Plot for RUN 102 */}
            <div className="relative w-full h-48 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 360 130">
                {/* Horizontal grid lines & Y labels */}
                <line x1="35" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="23" fill="#64748b" fontSize="9" fontFamily="monospace">8.0mm</text>

                <line x1="35" y1="58" x2="350" y2="58" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="61" fill="#64748b" fontSize="9" fontFamily="monospace">4.0mm</text>

                <line x1="35" y1="100" x2="350" y2="100" stroke="#475569" strokeWidth="1" />
                <text x="5" y="103" fill="#64748b" fontSize="9" fontFamily="monospace">0.0mm</text>

                {/* X-axis labels */}
                <text x="80" y="120" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.100s</text>
                <text x="180" y="120" fill="#64748b" fontSize="9" fontFamily="monospace">0.250s</text>
                <text x="275" y="120" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">0.400s (PEAK)</text>

                {(() => {
                  if (run102Data.length === 0) return null;
                  const getCoords = (d: FlameMeasurement) => {
                    const x = 50 + (d.timestamp_sec / 0.45) * 260;
                    const y = 100 - (d.flame_radius_mm / 9.0) * 85;
                    return { x, y };
                  };

                  const coords = run102Data.map(getCoords);
                  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

                  return (
                    <>
                      {/* Gradient Area Fill under Curve */}
                      <polygon
                        points={`50,100 ${polylinePoints} 281,100`}
                        fill="url(#run102AreaGrad)"
                        opacity="0.25"
                      />
                      <defs>
                        <linearGradient id="run102AreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Trajectory Line */}
                      <polyline
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylinePoints}
                      />

                      {/* Plotted Data Points */}
                      {run102Data.map((d) => {
                        const { x, y } = getCoords(d);

                        return (
                          <g key={d.metric_id}>
                            <circle
                              cx={x}
                              cy={y}
                              r={hoveredPoint?.metric_id === d.metric_id ? 6.5 : 5}
                              fill="#fbbf24"
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="cursor-pointer transition-transform hover:scale-150"
                              onMouseEnter={() => setHoveredPoint(d)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />

                            {/* Label */}
                            <text
                              x={x}
                              y={y - 8}
                              textAnchor="middle"
                              fill="#fbbf24"
                              fontSize="8.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {d.flame_radius_mm.toFixed(2)}mm ({d.flame_color})
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Run 102 Behavior Summary */}
            <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-amber-300 font-bold block mb-0.5">Run 102 Analysis:</span>
              Rapid thermal expansion from 3.10mm (Bright Yellow) to 7.80mm (Sooty Yellow) in 0.300 seconds (+15.67 mm/s velocity). Flame remains energetic with high soot luminosity.
            </div>
          </div>
        </div>
        ) : (
          /* ------------------------------------------------------------------- */
          /* COMPARATIVE DIRECT OVERLAY: RUN 101 VS RUN 102 SUPERIMPOSED */
          /* ------------------------------------------------------------------- */
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/40 flex flex-col gap-3 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold font-mono text-sm text-indigo-300">
                  COMPARATIVE OVERLAY PLOT: RUN 101 vs RUN 102
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Synchronized Timeline
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 font-bold">Run 101 (Microgravity Quench)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-amber-300 font-bold">Run 102 (Sooty Expansion)</span>
                </div>
              </div>
            </div>

            {/* Extinction Alert Banner */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/50 border border-rose-500/50 text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 text-rose-200">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-white mr-1">RUN 101 EXTINCTION AT t = 2.000s:</span>
                  <span>Flame radius collapses from 6.30mm peak to 0.00mm, while Run 102 continuously expands to 7.80mm.</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/60">
                RUN 101 EXTINCTION VERIFIED
              </span>
            </div>

            {/* Large Combined SVG Plot */}
            <div className="relative w-full h-64 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 170">
                {/* Horizontal Grid & Y Axis */}
                <line x1="45" y1="20" x2="580" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="23" fill="#64748b" fontSize="9" fontFamily="monospace">8.0mm</text>

                <line x1="45" y1="55" x2="580" y2="55" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="58" fill="#64748b" fontSize="9" fontFamily="monospace">6.0mm</text>

                <line x1="45" y1="90" x2="580" y2="90" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="93" fill="#64748b" fontSize="9" fontFamily="monospace">4.0mm</text>

                <line x1="45" y1="125" x2="580" y2="125" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x="5" y="128" fill="#64748b" fontSize="9" fontFamily="monospace">2.0mm</text>

                <line x1="45" y1="145" x2="580" y2="145" stroke="#475569" strokeWidth="1.2" />
                <text x="5" y="148" fill="#64748b" fontSize="9" fontFamily="monospace">0.0mm</text>

                {/* X Axis Ticks */}
                <text x="65" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.100s</text>
                <text x="140" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.400s</text>
                <text x="165" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">0.500s</text>
                <text x="330" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">1.200s (Run 101 Peak)</text>
                <text x="515" y="162" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">2.000s (Run 101 OUT)</text>

                {/* Vertical Extinction Guideline at t = 2.000s */}
                <line x1="535" y1="15" x2="535" y2="145" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />

                {/* Coordinate mapping helper */}
                {(() => {
                  const getOverlayCoords = (t: number, r: number) => {
                    const x = 50 + (t / 2.1) * 510;
                    const y = 145 - (r / 9.0) * 125;
                    return { x, y };
                  };

                  const r101Coords = run101Data.map((d) => getOverlayCoords(d.timestamp_sec, d.flame_radius_mm));
                  const r102Coords = run102Data.map((d) => getOverlayCoords(d.timestamp_sec, d.flame_radius_mm));

                  return (
                    <>
                      {/* Area Fill for Run 101 */}
                      {r101Coords.length > 0 && (
                        <polygon
                          points={`50,145 ${r101Coords.map((c) => `${c.x},${c.y}`).join(' ')} 535,145`}
                          fill="url(#overlayGrad101)"
                          opacity="0.15"
                        />
                      )}
                      {/* Area Fill for Run 102 */}
                      {r102Coords.length > 0 && (
                        <polygon
                          points={`50,145 ${r102Coords.map((c) => `${c.x},${c.y}`).join(' ')} ${r102Coords[r102Coords.length - 1].x},145`}
                          fill="url(#overlayGrad102)"
                          opacity="0.2"
                        />
                      )}
                      <defs>
                        <linearGradient id="overlayGrad101" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="overlayGrad102" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Polyline for Run 101 */}
                      {r101Coords.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={r101Coords.map((c) => `${c.x},${c.y}`).join(' ')}
                        />
                      )}

                      {/* Polyline for Run 102 */}
                      {r102Coords.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={r102Coords.map((c) => `${c.x},${c.y}`).join(' ')}
                        />
                      )}

                      {/* Run 101 Points */}
                      {run101Data.map((d) => {
                        const { x, y } = getOverlayCoords(d.timestamp_sec, d.flame_radius_mm);
                        const isExt = d.is_extinguished || d.flame_radius_mm === 0;

                        return (
                          <g key={`run101-${d.metric_id}`}>
                            {isExt ? (
                              <>
                                <circle cx={x} cy={y} r="12" fill="#f43f5e" opacity="0.3" className="animate-ping" />
                                <circle cx={x} cy={y} r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                                <text x={x} y={y - 12} textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                  RUN 101 OUT (0.00mm)
                                </text>
                              </>
                            ) : (
                              <>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={hoveredPoint?.metric_id === d.metric_id ? 7 : 5}
                                  fill="#38bdf8"
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredPoint(d)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                                <text x={x} y={y - 8} textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                                  {d.flame_radius_mm.toFixed(2)}mm
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Run 102 Points */}
                      {run102Data.map((d) => {
                        const { x, y } = getOverlayCoords(d.timestamp_sec, d.flame_radius_mm);

                        return (
                          <g key={`run102-${d.metric_id}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r={hoveredPoint?.metric_id === d.metric_id ? 7 : 5}
                              fill="#fbbf24"
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint(d)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            <text x={x} y={y - 8} textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                              {d.flame_radius_mm.toFixed(2)}mm (R102)
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Telemetry Takeaway */}
            <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <strong className="text-indigo-300">Observation:</strong> Run 102 exhibits rapid soot growth (+15.67 mm/s), while Run 101 forms a quiescent microgravity blue shell that quenches as soon as boundary layer O₂ is depleted at <strong className="text-rose-400">t = 2.000s</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparative Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200 uppercase">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Side-by-Side Run Comparison & Extinction Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Peak Radius</span>
              <div className="flex flex-col mt-1 gap-1">
                <span className="text-cyan-400 font-bold">Run 101: 6.30 mm</span>
                <span className="text-amber-400 font-bold">Run 102: 7.80 mm</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Appearance & Chemistry</span>
              <div className="flex flex-col mt-1 gap-1">
                <span className="text-cyan-300 text-[11px]">Run 101: Dim Blue spherical</span>
                <span className="text-amber-300 text-[11px]">Run 102: Sooty Yellow</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Radial Expansion Rate</span>
              <div className="flex flex-col mt-1 gap-1">
                <span className="text-cyan-400 font-bold">Run 101: +3.45 mm/s</span>
                <span className="text-amber-400 font-bold">Run 102: +15.67 mm/s</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/40 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px]">Recorded Extinction</span>
              <div className="flex flex-col mt-1 gap-1">
                <span className="text-rose-400 font-bold">Run 101: YES @ 2.000s</span>
                <span className="text-emerald-400 font-bold">Run 102: NO (Active)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME D3 SCATTER PLOT: OXYGEN CONCENTRATION VS FLAME TEMPERATURE */}
      {/* ========================================================================= */}
      <OxygenTempScatterPlot
        currentO2Pct={gases ? (gases['O2'] ?? 20.9) : 20.9}
        currentFlameTempK={flameTempK ?? 1650}
        isIgnited={isIgnited}
        gravityG={gravityG}
        fuel={fuel}
        onO2Change={onGasChange ? (newVal) => onGasChange('O2', newVal) : undefined}
      />

      {/* Dataset Filter & Action Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Filter Measurements:
          </span>
          <button
            onClick={() => setSelectedRunFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              selectedRunFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Runs ({dataset.length})
          </button>
          {uniqueRuns.map((runId) => {
            const count = dataset.filter((d) => String(d.run_id) === runId).length;
            return (
              <button
                key={runId}
                onClick={() => setSelectedRunFilter(runId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                  selectedRunFilter === runId
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Run {runId} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-all flex items-center gap-1.5 active:scale-95"
            title="Download CSV"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={() => setIsImporting(true)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-mono transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="w-3 h-3 text-cyan-300" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Main Measurements Table adhering exactly to requested schema */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">metric_id</th>
                <th className="py-2.5 px-3">run_id</th>
                <th className="py-2.5 px-3">timestamp_sec</th>
                <th className="py-2.5 px-3">flame_radius_mm</th>
                <th className="py-2.5 px-3">flame_color</th>
                <th className="py-2.5 px-3">is_extinguished</th>
                <th className="py-2.5 px-3 text-right">Chamber Replay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((row) => {
                const colorStyle = getFlameColorStyle(row.flame_color);

                return (
                  <tr
                    key={row.metric_id}
                    className="hover:bg-slate-900/60 transition-colors group"
                  >
                    {/* metric_id */}
                    <td className="py-2.5 px-3 font-bold text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        #{row.metric_id}
                      </span>
                    </td>

                    {/* run_id */}
                    <td className="py-2.5 px-3 font-semibold text-indigo-300">
                      Run {row.run_id}
                    </td>

                    {/* timestamp_sec */}
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {row.timestamp_sec.toFixed(3)} s
                      </span>
                    </td>

                    {/* flame_radius_mm */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${row.flame_radius_mm === 0 ? 'text-slate-500' : 'text-cyan-300'}`}>
                          {row.flame_radius_mm.toFixed(2)} mm
                        </span>
                        {/* Mini bar indicator */}
                        {maxRadius > 0 && row.flame_radius_mm > 0 && (
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${(row.flame_radius_mm / maxRadius) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* flame_color */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: colorStyle.dotColor }}
                        />
                        <span className={`px-2 py-0.5 rounded-md text-[11px] border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                          {row.flame_color}
                        </span>
                      </div>
                    </td>

                    {/* is_extinguished */}
                    <td className="py-2.5 px-3">
                      {row.is_extinguished ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          TRUE (Extinguished)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          FALSE (Burning)
                        </span>
                      )}
                    </td>

                    {/* Chamber Replay Action */}
                    <td className="py-2.5 px-3 text-right">
                      {onApplyMeasurementToChamber && (
                        <button
                          onClick={() => onApplyMeasurementToChamber(row)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-mono transition-all border border-slate-700 hover:border-cyan-400 flex items-center gap-1 ml-auto active:scale-95"
                          title="Apply this exact flame radius & color to the live chamber"
                        >
                          <Flame className="w-3 h-3" />
                          <span className="hidden sm:inline">Replay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
