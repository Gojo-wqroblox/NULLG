/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  Flame,
  Gauge,
  Wind,
  FileCode,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { FuelDefinition } from '../types';
import { AVAILABLE_FUELS } from '../data/gases';
import {
  buildSimulationSharePayload,
  formatSimulationShareJson,
  copyTextToClipboard,
  parseSimulationShareJson,
  SimulationSharePayload,
} from '../utils/simulationShare';

interface ShareSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gravityG: number;
  pressureKpa: number;
  ventilationSpeed: number;
  fuel: FuelDefinition;
  gases: Record<string, number>;
  isIgnited: boolean;
  flameTempK: number;
  currentPresetId?: string;
  onApplyImportedSimulation: (params: {
    gravityG?: number;
    pressureKpa?: number;
    ventilationSpeed?: number;
    fuel?: FuelDefinition;
    gases?: Record<string, number>;
    isIgnited?: boolean;
  }) => void;
}

export const ShareSimulationModal: React.FC<ShareSimulationModalProps> = ({
  isOpen,
  onClose,
  gravityG,
  pressureKpa,
  ventilationSpeed,
  fuel,
  gases,
  isIgnited,
  flameTempK,
  currentPresetId,
  onApplyImportedSimulation,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPretty, setIsPretty] = useState<boolean>(true);
  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{
    valid: boolean;
    message?: string;
    parsed?: any;
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Generate the current simulation payload
  const payload = useMemo(() => {
    return buildSimulationSharePayload({
      gravityG,
      pressureKpa,
      ventilationSpeed,
      fuel,
      gases,
      isIgnited,
      flameTempK,
      currentPresetId,
    });
  }, [
    gravityG,
    pressureKpa,
    ventilationSpeed,
    fuel,
    gases,
    isIgnited,
    flameTempK,
    currentPresetId,
  ]);

  const jsonString = useMemo(() => {
    return formatSimulationShareJson(payload, isPretty);
  }, [payload, isPretty]);

  if (!isOpen) return null;

  // Handle clipboard copy
  const handleCopy = async () => {
    const success = await copyTextToClipboard(jsonString);
    if (success) {
      setCopied(true);
      setNotification('JSON configuration copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setNotification(null), 3500);
    } else {
      setNotification('Unable to copy automatically. Please select text manually.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Handle file download
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `null-g_simulation_${fuel.id}_${gravityG.toFixed(1)}g_${Date.now()}.json`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification(`Downloaded ${filename}`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle live validation of imported JSON
  const handleImportTextChange = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportStatus(null);
      return;
    }
    const result = parseSimulationShareJson(text);
    if (result.success && result.data) {
      setImportStatus({
        valid: true,
        message: 'Valid simulation configuration detected!',
        parsed: result.data,
      });
    } else {
      setImportStatus({
        valid: false,
        message: result.error || 'Invalid JSON format',
      });
    }
  };

  // Apply parsed simulation to parent app
  const handleApplyImport = () => {
    if (!importStatus?.valid || !importStatus?.parsed) return;
    const data = importStatus.parsed;

    // Extract gravity
    const importedGravity =
      data.environment?.gravityG ??
      data.gravityG ??
      (typeof data.gravity === 'number' ? data.gravity : undefined);

    // Extract pressure
    const importedPressure =
      data.environment?.pressureKpa ??
      data.pressureKpa ??
      data.pressure;

    // Extract ventilation
    const importedVentilation =
      data.environment?.ventilationSpeed ??
      data.ventilationSpeed ??
      data.ventilation;

    // Extract gases
    const importedGases = data.gasComposition ?? data.gases ?? data.atmosphere;

    // Extract fuel
    let importedFuel: FuelDefinition | undefined = undefined;
    if (data.fuel) {
      if (typeof data.fuel === 'string') {
        importedFuel = AVAILABLE_FUELS.find(
          (f) =>
            f.id.toLowerCase() === data.fuel.toLowerCase() ||
            f.name.toLowerCase().includes(data.fuel.toLowerCase())
        );
      } else if (data.fuel.id) {
        importedFuel =
          AVAILABLE_FUELS.find((f) => f.id === data.fuel.id) ||
          AVAILABLE_FUELS.find((f) => f.name.toLowerCase() === (data.fuel.name || '').toLowerCase());
      }
    }

    // Extract ignition state
    const importedIgnition =
      data.flameState?.isIgnited ?? data.isIgnited;

    onApplyImportedSimulation({
      gravityG: typeof importedGravity === 'number' ? importedGravity : undefined,
      pressureKpa: typeof importedPressure === 'number' ? importedPressure : undefined,
      ventilationSpeed: typeof importedVentilation === 'number' ? importedVentilation : undefined,
      fuel: importedFuel,
      gases: importedGases && typeof importedGases === 'object' ? importedGases : undefined,
      isIgnited: typeof importedIgnition === 'boolean' ? importedIgnition : undefined,
    });

    onClose();
  };

  // Load sample configurations into the import tab
  const handleLoadSample = (sampleType: 'iss' | 'lunar' | 'mars' | 'cool') => {
    let sample: SimulationSharePayload;
    if (sampleType === 'iss') {
      sample = buildSimulationSharePayload({
        gravityG: 0.0,
        pressureKpa: 101.3,
        ventilationSpeed: 0.15,
        fuel: AVAILABLE_FUELS[0], // Candle
        gases: { O2: 21, N2: 78, CO2: 0.4, Ar: 0.6 },
        isIgnited: true,
        flameTempK: 1680,
        currentPresetId: 'zero_g',
      });
    } else if (sampleType === 'lunar') {
      sample = buildSimulationSharePayload({
        gravityG: 0.166,
        pressureKpa: 70.3, // NASA Exploration Atmosphere 10.2 psi
        ventilationSpeed: 0.08,
        fuel: AVAILABLE_FUELS[3], // PMMA Acrylic
        gases: { O2: 32, N2: 67.5, CO2: 0.5 },
        isIgnited: true,
        flameTempK: 2120,
      });
    } else if (sampleType === 'mars') {
      sample = buildSimulationSharePayload({
        gravityG: 0.38,
        pressureKpa: 56.0,
        ventilationSpeed: 0.2,
        fuel: AVAILABLE_FUELS[1], // Kapton wire
        gases: { O2: 28, N2: 70, CO2: 2 },
        isIgnited: true,
        flameTempK: 1950,
      });
    } else {
      sample = buildSimulationSharePayload({
        gravityG: 0.0,
        pressureKpa: 101.3,
        ventilationSpeed: 0.05,
        fuel: AVAILABLE_FUELS[0],
        gases: { O2: 39.5, N2: 60.3, CO2: 0.2 },
        isIgnited: true,
        flameTempK: 780,
        currentPresetId: 'nasa_psi159_cool',
      });
    }

    const formatted = JSON.stringify(sample, null, 2);
    setImportText(formatted);
    handleImportTextChange(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        {/* Toast Notification Banner */}
        {notification && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono text-xs font-bold shadow-lg shadow-cyan-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  Share Simulation Configuration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  JSON Export
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export environment parameters or import a saved configuration string
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 px-5 pt-2 bg-slate-950/30 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Export & Copy JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import / Paste JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {activeTab === 'export' ? (
            <>
              {/* Parameter Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                {/* Gravity */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    Gravity Force
                  </span>
                  <span className="text-sm font-bold text-white">
                    {gravityG.toFixed(2)} G
                  </span>
                  <span className="text-[10px] text-cyan-300 truncate">
                    {gravityG === 0
                      ? '0-G Microgravity'
                      : gravityG === 1
                      ? 'Earth Normal'
                      : 'Centrifuge / Moon'}
                  </span>
                </div>

                {/* Fuel */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    Selected Fuel
                  </span>
                  <span className="text-sm font-bold text-white truncate" title={fuel.name}>
                    {fuel.name.split('(')[0]}
                  </span>
                  <span className="text-[10px] text-amber-300">
                    Ignition: {fuel.ignitionTempC}°C
                  </span>
                </div>

                {/* Oxygen & Suppressant */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Gas Atmosphere
                  </span>
                  <span className="text-sm font-bold text-white">
                    {(gases['O2'] ?? 21).toFixed(1)}% O₂
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(gases['CO2'] ?? 0.4).toFixed(1)}% CO₂ / {(gases['N2'] ?? 78).toFixed(1)}% N₂
                  </span>
                </div>

                {/* Pressure & Airflow */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-blue-400" />
                    Chamber Dynamics
                  </span>
                  <span className="text-sm font-bold text-white">
                    {pressureKpa.toFixed(1)} kPa
                  </span>
                  <span className="text-[10px] text-blue-300">
                    Flow: {ventilationSpeed.toFixed(2)} m/s
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-mono">Format:</span>
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <button
                      onClick={() => setIsPretty(true)}
                      className={`px-2.5 py-1 rounded transition-all ${
                        isPretty
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Indented JSON
                    </button>
                    <button
                      onClick={() => setIsPretty(false)}
                      className={`px-2.5 py-1 rounded transition-all ${
                        !isPretty
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({jsonString.length} bytes)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all"
                    title="Download as .json file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy JSON to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON Code Viewer */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400">
                  <span>simulation-config.json</span>
                  <span>UTF-8 • Application/JSON</span>
                </div>
                <textarea
                  readOnly
                  value={jsonString}
                  rows={13}
                  className="w-full bg-slate-950 p-3 text-cyan-300 font-mono text-xs leading-relaxed resize-none focus:outline-none select-all selection:bg-cyan-500 selection:text-slate-950"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                💡 <strong className="text-slate-300">How to use:</strong> Click{' '}
                <span className="text-cyan-300 font-mono">Copy JSON</span> to paste this
                configuration into emails, bug reports, lab notebooks, or share it with
                collaborators who can load it into their simulation via the "Import / Paste JSON"
                tab.
              </p>
            </>
          ) : (
            <>
              {/* Import Tab Content */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Paste Shared Simulation JSON:
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-slate-500">Quick Samples:</span>
                    <button
                      onClick={() => handleLoadSample('iss')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                    >
                      ISS 0-G Candle
                    </button>
                    <button
                      onClick={() => handleLoadSample('cool')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700"
                    >
                      Cool Flame
                    </button>
                    <button
                      onClick={() => handleLoadSample('lunar')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                    >
                      Lunar Acrylic
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                  <textarea
                    value={importText}
                    onChange={(e) => handleImportTextChange(e.target.value)}
                    placeholder='Paste a simulation JSON configuration string here, e.g.:&#10;{&#10;  "app": "IgnisAstra: NASA Microgravity Flame Simulator",&#10;  "environment": { "gravityG": 0.0, "pressureKpa": 101.3, "ventilationSpeed": 0.15 },&#10;  "gasComposition": { "O2": 21.0, "N2": 78.0, "CO2": 0.4 }&#10;}'
                    rows={12}
                    className="w-full bg-slate-950 p-3 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>

                {/* Validation Status Feedback */}
                {importStatus && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 font-mono text-xs ${
                      importStatus.valid
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {importStatus.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">{importStatus.message}</div>
                      {importStatus.valid && importStatus.parsed && (
                        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1 border-t border-emerald-500/20">
                          <div>
                            Gravity:{' '}
                            <strong className="text-white">
                              {importStatus.parsed.environment?.gravityG ??
                                importStatus.parsed.gravityG ??
                                'Preserve current'}
                              G
                            </strong>
                          </div>
                          <div>
                            O₂ Concentration:{' '}
                            <strong className="text-cyan-300">
                              {importStatus.parsed.gasComposition?.O2 ??
                                importStatus.parsed.gases?.O2 ??
                                'Preserve current'}
                              %
                            </strong>
                          </div>
                          <div>
                            Fuel:{' '}
                            <strong className="text-amber-300">
                              {importStatus.parsed.fuel?.name ||
                                importStatus.parsed.fuel?.id ||
                                'Preserve current'}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setImportText('');
                      setImportStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                  >
                    Clear Input
                  </button>
                  <button
                    onClick={handleApplyImport}
                    disabled={!importStatus?.valid}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                      importStatus?.valid
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Apply Simulation to Chamber</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chamber telemetry synchronized</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
