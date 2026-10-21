import React, { useState, useRef, useMemo } from 'react';
import {
  FlameMeasurement,
  INITIAL_SAMPLE_FLAME_DATASET,
  getFlameColorStyle,
  parseFlameDatasetCSV,
  exportFlameDatasetToCSV,
} from '../data/flameExperimentDataset';
import { NASA_EXPERIMENTS, NasaExperiment } from '../data/nasaExperiments';
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
  Rocket,
  Compass,
} from 'lucide-react';

interface FlameExperimentDatasetViewProps {
  onApplyMeasurementToChamber?: (measurement: FlameMeasurement) => void;
  onApplyExperimentConditions?: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa?: number;
  }) => void;
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
  onApplyExperimentConditions,
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
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('sample_101_102');
  const [dataset, setDataset] = useState<FlameMeasurement[]>(INITIAL_SAMPLE_FLAME_DATASET);
  const [selectedRunFilter, setSelectedRunFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [pasteCsvText, setPasteCsvText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<FlameMeasurement | null>(null);
  const [graphViewMode, setGraphViewMode] = useState<'split' | 'overlay'>('split');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active NASA Experiment Profile
  const activeExp: NasaExperiment = useMemo(() => {
    return (
      NASA_EXPERIMENTS.find((e) => e.id === selectedExperimentId) ||
      NASA_EXPERIMENTS[0]
    );
  }, [selectedExperimentId]);

  // Check if currently on sample data
  const isSampleData =
    selectedExperimentId === 'sample_101_102' &&
    dataset.length === INITIAL_SAMPLE_FLAME_DATASET.length &&
    dataset.every((d, i) => d.metric_id === INITIAL_SAMPLE_FLAME_DATASET[i].metric_id);

  // Handle Switching NASA Experiment
  const handleSelectNasaExperiment = (expId: string) => {
    setSelectedExperimentId(expId);
    const exp = NASA_EXPERIMENTS.find((e) => e.id === expId);
    if (exp) {
      setDataset(exp.sampleRows);
      setSelectedRunFilter('all');
      setImportFeedback({
        type: 'success',
        message: `Loaded dataset for ${exp.name}: ${exp.fullName}`,
      });
      setTimeout(() => setImportFeedback(null), 4000);
    }
  };

  // Extract unique run IDs from active dataset
  const uniqueRuns = Array.from(new Set(dataset.map((d) => String(d.run_id))));

  // Filtered dataset for table
  const filteredData =
    selectedRunFilter === 'all'
      ? dataset
      : dataset.filter((d) => String(d.run_id) === selectedRunFilter);

  // Identify Run A and Run B for the 2 dedicated graphs
  const runA_Id = activeExp.runs[0] ? String(activeExp.runs[0].run_id) : uniqueRuns[0] || '101';
  const runB_Id = activeExp.runs[1] ? String(activeExp.runs[1].run_id) : uniqueRuns[1] || '102';

  const runA_Info = activeExp.runs[0] || {
    name: `Run ${runA_Id}`,
    description: `Experimental Run ${runA_Id}`,
    extinctionTimestampSec: null,
    peakRadiusMm: 6.3,
  };
  const runB_Info = activeExp.runs[1] || {
    name: `Run ${runB_Id}`,
    description: `Experimental Run ${runB_Id}`,
    extinctionTimestampSec: null,
    peakRadiusMm: 7.8,
  };

  const runAData = dataset.filter((d) => String(d.run_id) === runA_Id);
  const runBData = dataset.filter((d) => String(d.run_id) === runB_Id);

  const runAExtinction = runAData.find((d) => d.is_extinguished || d.flame_radius_mm === 0);
  const runBExtinction = runBData.find((d) => d.is_extinguished || d.flame_radius_mm === 0);

  // Maximum scales for Run A & B
  const maxTimeA = Math.max(...runAData.map((d) => d.timestamp_sec), 2.0);
  const maxRadiusA = Math.max(...runAData.map((d) => d.flame_radius_mm), 7.0);

  const maxTimeB = Math.max(...runBData.map((d) => d.timestamp_sec), 2.0);
  const maxRadiusB = Math.max(...runBData.map((d) => d.flame_radius_mm), 8.0);

  // Global Stats
  const totalMeasurements = dataset.length;
  const extinguishedCount = dataset.filter((d) => d.is_extinguished).length;
  const maxRadius = Math.max(...dataset.map((d) => d.flame_radius_mm), 0);

  // CSV File Upload Handler
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
    setSelectedExperimentId('custom');
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
    link.setAttribute('download', `nasa_experiment_${selectedExperimentId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSample = () => {
    setSelectedExperimentId('sample_101_102');
    setDataset(INITIAL_SAMPLE_FLAME_DATASET);
    setSelectedRunFilter('all');
    setImportFeedback({
      type: 'success',
      message: 'Reset to the 6 initial visible sample rows from the table image.',
    });
    setTimeout(() => setImportFeedback(null), 4000);
  };

  return (
    <div className={`flex flex-col gap-4 text-slate-100 ${isEmbedded ? '' : 'p-4 sm:p-6 max-w-5xl mx-auto w-full'}`}>
      {/* ========================================================================= */}
      {/* NASA EXPERIMENT SELECTION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2 bg-slate-950/95 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Select NASA Experiment Dataset
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ISS CIR, Cygnus & Glovebox empirical microgravity datasets
          </span>
        </div>

        {/* Experiment Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {NASA_EXPERIMENTS.map((exp) => (
            <button
              key={exp.id}
              onClick={() => handleSelectNasaExperiment(exp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                selectedExperimentId === exp.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-semibold uppercase">
                {exp.code}
              </span>
              <span>{exp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE EXPERIMENT BRIEFING CARD */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-white">
                {activeExp.fullName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {activeExp.agency}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Facility: <strong className="text-slate-300">{activeExp.facility}</strong> • PI: <strong className="text-cyan-300">{activeExp.principalInvestigator}</strong>
            </p>
          </div>

          {/* Quick Apply Conditions to Live Chamber */}
          {onApplyExperimentConditions && (
            <button
              onClick={() => onApplyExperimentConditions(activeExp.chamberConditions)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
              title="Apply exact gravity, oxygen %, CO2 %, and airflow to the live chamber"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Simulate in Chamber</span>
            </button>
          )}
        </div>

        {/* Scientific Discovery & Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-300 font-bold block mb-1">Experiment Overview:</span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeExp.description}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-amber-300 font-bold block mb-1">Scientific Discovery / Physics:</span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeExp.scientificDiscovery}
            </p>
          </div>
        </div>
      </div>

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

      {/* CSV Replacement & Import Modal / Accordion */}
      {isImporting && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-2xl flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold font-mono text-white">
                Replace Sample Data with Full CSV
              </h4>
            </div>
            <button
              onClick={() => setIsImporting(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Upload File */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-slate-300">
                Option A: Upload .csv or .txt file:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-upload"
              />
              <label
                htmlFor="csv-file-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer bg-slate-900/50 transition-all text-center gap-2"
              >
                <Upload className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-mono text-slate-300">
                  Click to select CSV from your computer
                </span>
                <span className="text-[10px] text-slate-500">
                  Expected columns: metric_id, run_id, timestamp_sec, flame_radius_mm, flame_color, is_extinguished
                </span>
              </label>
            </div>

            {/* Option B: Direct CSV Paste */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>Option B: Paste Raw CSV Content:</span>
                <span className="text-[10px] text-slate-500">Auto-detects commas & tabs</span>
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
      {/* 2 DEDICATED GRAPHS: PLOTTING FLAME RADIUS AGAINST TIME */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              {activeExp.name} Radius vs Time: {runA_Info.name} & {runB_Info.name}
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
                2 Dedicated Graphs ({runA_Id} & {runB_Id})
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

            {/* Extinction Alert Flag */}
            {runAExtinction && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>Run {runA_Id} Extinction: t = {runAExtinction.timestamp_sec.toFixed(3)}s</span>
              </div>
            )}
          </div>
        </div>

        {/* SPLIT 2-GRAPH MODE */}
        {graphViewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ----------------------------------------------------------------- */}
            {/* GRAPH 1: RUN A */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex flex-col gap-3 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span className="font-bold font-mono text-sm text-cyan-300">
                    GRAPH 1: RUN {runA_Id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {runA_Info.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {runAData.length} Points
                </span>
              </div>

              {/* Flame Goes Out Banner for Run A */}
              {runAExtinction ? (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/50 border border-rose-500/50 text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2 text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold text-white block sm:inline mr-1">
                        RECORDED FLAME EXTINCTION:
                      </span>
                      <span>
                        t = <strong className="text-rose-400 text-sm">{runAExtinction.timestamp_sec.toFixed(3)}s</strong> (0.00 mm)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/60 animate-pulse">
                    GOES OUT
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-300">Combustion Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sustained Reaction Front
                  </span>
                </div>
              )}

              {/* SVG Plot for RUN A */}
              <div className="relative w-full h-48 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 360 130">
                  {/* Grid Lines */}
                  <line x1="35" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                  <text x="5" y="23" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {(maxRadiusA * 0.85).toFixed(1)}mm
                  </text>

                  <line x1="35" y1="58" x2="350" y2="58" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                  <text x="5" y="61" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {(maxRadiusA * 0.45).toFixed(1)}mm
                  </text>

                  <line x1="35" y1="100" x2="350" y2="100" stroke="#475569" strokeWidth="1" />
                  <text x="5" y="103" fill="#64748b" fontSize="9" fontFamily="monospace">0.0mm</text>

                  {/* Dynamic Curve */}
                  {(() => {
                    if (runAData.length === 0) return null;
                    const getCoords = (d: FlameMeasurement) => {
                      const x = 45 + (d.timestamp_sec / Math.max(0.1, maxTimeA)) * 285;
                      const y = 100 - (d.flame_radius_mm / Math.max(0.1, maxRadiusA * 1.15)) * 85;
                      return { x, y };
                    };

                    const coords = runAData.map(getCoords);
                    const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

                    return (
                      <>
                        <polygon
                          points={`45,100 ${polylinePoints} ${coords[coords.length - 1].x},100`}
                          fill="url(#runAGrad)"
                          opacity="0.25"
                        />
                        <defs>
                          <linearGradient id="runAGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />

                        {runAData.map((d) => {
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
                                  r={4.5}
                                  fill="#38bdf8"
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:scale-150 transition-all"
                                  onMouseEnter={() => setHoveredPoint(d)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                              )}
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

              <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-cyan-300 font-bold block mb-0.5">Run {runA_Id} Summary:</span>
                {runA_Info.description}
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* GRAPH 2: RUN B */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col gap-3 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <span className="font-bold font-mono text-sm text-amber-300">
                    GRAPH 2: RUN {runB_Id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {runB_Info.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {runBData.length} Points
                </span>
              </div>

              {/* Flame Goes Out Banner for Run B */}
              {runBExtinction ? (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/50 border border-rose-500/50 text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2 text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold text-white block sm:inline mr-1">
                        RECORDED FLAME EXTINCTION:
                      </span>
                      <span>
                        t = <strong className="text-rose-400 text-sm">{runBExtinction.timestamp_sec.toFixed(3)}s</strong> (0.00 mm)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/60 animate-pulse">
                    GOES OUT
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-300">Combustion Status:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Luminous Propagation
                  </span>
                </div>
              )}

              {/* SVG Plot for RUN B */}
              <div className="relative w-full h-48 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 360 130">
                  <line x1="35" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                  <text x="5" y="23" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {(maxRadiusB * 0.85).toFixed(1)}mm
                  </text>

                  <line x1="35" y1="58" x2="350" y2="58" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                  <text x="5" y="61" fill="#64748b" fontSize="9" fontFamily="monospace">
                    {(maxRadiusB * 0.45).toFixed(1)}mm
                  </text>

                  <line x1="35" y1="100" x2="350" y2="100" stroke="#475569" strokeWidth="1" />
                  <text x="5" y="103" fill="#64748b" fontSize="9" fontFamily="monospace">0.0mm</text>

                  {/* Dynamic Curve */}
                  {(() => {
                    if (runBData.length === 0) return null;
                    const getCoords = (d: FlameMeasurement) => {
                      const x = 45 + (d.timestamp_sec / Math.max(0.1, maxTimeB)) * 285;
                      const y = 100 - (d.flame_radius_mm / Math.max(0.1, maxRadiusB * 1.15)) * 85;
                      return { x, y };
                    };

                    const coords = runBData.map(getCoords);
                    const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

                    return (
                      <>
                        <polygon
                          points={`45,100 ${polylinePoints} ${coords[coords.length - 1].x},100`}
                          fill="url(#runBGrad)"
                          opacity="0.25"
                        />
                        <defs>
                          <linearGradient id="runBGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />

                        {runBData.map((d) => {
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
                                  r={4.5}
                                  fill="#f59e0b"
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:scale-150 transition-all"
                                  onMouseEnter={() => setHoveredPoint(d)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                              )}
                              <text
                                x={x}
                                y={y - 8}
                                textAnchor="middle"
                                fill={isExt ? '#f43f5e' : '#f59e0b'}
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

              <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-amber-300 font-bold block mb-0.5">Run {runB_Id} Summary:</span>
                {runB_Info.description}
              </div>
            </div>
          </div>
        ) : (
          /* OVERLAY COMPARISON MODE */
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/40 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold font-mono text-sm text-indigo-300">
                OVERLAY COMPARISON: RUN {runA_Id} vs RUN {runB_Id}
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-cyan-400">● Run {runA_Id}</span>
                <span className="text-amber-400">● Run {runB_Id}</span>
              </div>
            </div>

            <div className="relative w-full h-56 bg-slate-900/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 460 140">
                <line x1="35" y1="20" x2="450" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="35" y1="60" x2="450" y2="60" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="35" y1="110" x2="450" y2="110" stroke="#475569" strokeWidth="1" />

                {(() => {
                  const maxTime = Math.max(maxTimeA, maxTimeB);
                  const maxRad = Math.max(maxRadiusA, maxRadiusB) * 1.15;

                  const getCoords = (d: FlameMeasurement) => ({
                    x: 45 + (d.timestamp_sec / maxTime) * 390,
                    y: 110 - (d.flame_radius_mm / maxRad) * 90,
                  });

                  const coordsA = runAData.map(getCoords);
                  const coordsB = runBData.map(getCoords);

                  return (
                    <>
                      {coordsA.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          points={coordsA.map((c) => `${c.x},${c.y}`).join(' ')}
                        />
                      )}
                      {coordsB.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          points={coordsB.map((c) => `${c.x},${c.y}`).join(' ')}
                        />
                      )}
                      {runAData.map((d) => {
                        const { x, y } = getCoords(d);
                        return (
                          <circle
                            key={d.metric_id}
                            cx={x}
                            cy={y}
                            r={d.is_extinguished ? 5.5 : 4}
                            fill={d.is_extinguished ? '#f43f5e' : '#38bdf8'}
                          />
                        );
                      })}
                      {runBData.map((d) => {
                        const { x, y } = getCoords(d);
                        return (
                          <circle
                            key={d.metric_id}
                            cx={x}
                            cy={y}
                            r={d.is_extinguished ? 5.5 : 4}
                            fill={d.is_extinguished ? '#f43f5e' : '#f59e0b'}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        )}
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

      {/* ========================================================================= */}
      {/* CSV EXPERIMENT DATASET TABLE */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
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
                    ? 'bg-indigo-500 text-white font-bold border-indigo-400 shadow-sm'
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
            onClick={() => setIsImporting(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all border border-slate-700 flex items-center gap-1.5"
            title="Import custom CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all border border-slate-700 flex items-center gap-1.5"
            title="Export to CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleResetSample}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            title="Reset to 6-row sample"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* The CSV Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-inner">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">metric_id</th>
              <th className="py-2.5 px-3">run_id</th>
              <th className="py-2.5 px-3">timestamp_sec</th>
              <th className="py-2.5 px-3">flame_radius_mm</th>
              <th className="py-2.5 px-3">flame_color</th>
              <th className="py-2.5 px-3">is_extinguished</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredData.map((row) => {
              const colorStyle = getFlameColorStyle(row.flame_color);
              return (
                <tr
                  key={row.metric_id}
                  className={`hover:bg-slate-900/80 transition-colors ${
                    row.is_extinguished ? 'bg-rose-950/15' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-400">#{row.metric_id}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        String(row.run_id) === runA_Id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Run {row.run_id}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white">
                    {row.timestamp_sec.toFixed(3)}s
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`font-bold ${row.flame_radius_mm === 0 ? 'text-slate-500' : 'text-cyan-300'}`}>
                      {row.flame_radius_mm.toFixed(2)} mm
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                      {row.flame_color}
                    </span>
                  </td>
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
                  <td className="py-2.5 px-3 text-right">
                    {onApplyMeasurementToChamber && (
                      <button
                        onClick={() => onApplyMeasurementToChamber(row)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-mono transition-all border border-slate-700 hover:border-cyan-400 flex items-center gap-1 ml-auto active:scale-95"
                        title="Replay in live chamber"
                      >
                        <Flame className="w-3 h-3" />
                        <span>Replay</span>
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
  );
};
