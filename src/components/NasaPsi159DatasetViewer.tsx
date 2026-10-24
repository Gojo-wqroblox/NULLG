import React, { useState, useMemo } from 'react';
import {
  PSI_159_METADATA,
  PSI_159_NORMAL_FLAMES,
  PSI_159_INVERSE_FLAMES,
  Psi159NormalMeasurement,
  Psi159InverseMeasurement,
} from '../data/psi159Experiments';
import {
  Table,
  Download,
  Filter,
  Search,
  Flame,
  Sparkles,
  Info,
  Rocket,
  CheckCircle2,
  Clock,
  Layers,
  Thermometer,
  Gauge,
  ExternalLink,
} from 'lucide-react';

interface NasaPsi159DatasetViewerProps {
  onApplyConditionsToChamber?: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa: number;
    targetTempK?: number;
    testId?: string;
  }) => void;
  onDownloadSimulationReport?: () => void;
}

export const NasaPsi159DatasetViewer: React.FC<NasaPsi159DatasetViewerProps> = ({
  onApplyConditionsToChamber,
  onDownloadSimulationReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'normal' | 'inverse'>('normal');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [onlyCoolFlames, setOnlyCoolFlames] = useState<boolean>(false);
  const [extinctionFilter, setExtinctionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Normal data filtering
  const filteredNormal = useMemo(() => {
    return PSI_159_NORMAL_FLAMES.filter((item) => {
      if (fuelFilter !== 'all' && !item.fuel.toLowerCase().includes(fuelFilter.toLowerCase())) {
        return false;
      }
      if (onlyCoolFlames && !item.hasCoolFlame) {
        return false;
      }
      if (extinctionFilter !== 'all' && item.extinctionMode !== extinctionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.test.toLowerCase().includes(q) ||
          item.fuel.toLowerCase().includes(q) ||
          item.comments.toLowerCase().includes(q) ||
          item.coolFlame.toLowerCase().includes(q) ||
          String(item.day).includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [fuelFilter, onlyCoolFlames, extinctionFilter, searchQuery]);

  // Inverse data filtering
  const filteredInverse = useMemo(() => {
    return PSI_159_INVERSE_FLAMES.filter((item) => {
      if (fuelFilter !== 'all' && !item.fuel.toLowerCase().includes(fuelFilter.toLowerCase())) {
        return false;
      }
      if (extinctionFilter !== 'all' && item.extinctionMode !== extinctionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.test.toLowerCase().includes(q) ||
          item.fuel.toLowerCase().includes(q) ||
          item.comments.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          String(item.day).includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [fuelFilter, extinctionFilter, searchQuery]);

  // Overall statistics
  const normalCoolCount = PSI_159_NORMAL_FLAMES.filter((d) => d.hasCoolFlame).length;
  const maxNormalBurnTime = Math.max(...PSI_159_NORMAL_FLAMES.map((d) => d.burnTimeSec));
  const maxInverseBurnTime = Math.max(...PSI_159_INVERSE_FLAMES.map((d) => d.burnTimeSec));

  const handleApplyNormalRow = (row: Psi159NormalMeasurement) => {
    setSelectedRowId(row.id);
    if (!onApplyConditionsToChamber) return;

    // Fuel mapping
    let fuelLabel = 'Paraffin Wax';
    const fLower = row.fuel.toLowerCase();
    if (fLower.includes('ethane')) fuelLabel = 'Ethane Gas (C₂H₆)';
    else if (fLower.includes('propane')) fuelLabel = 'Propane Gas (C₃H₈)';
    else if (fLower.includes('butane')) fuelLabel = 'Butane Gas (C₄H₁₀)';

    const o2Val = Math.round((row.xo2Before || 0.21) * 100 * 10) / 10;
    onApplyConditionsToChamber({
      gravityG: 0.0,
      o2Pct: o2Val,
      co2Pct: 0.2,
      ventilationSpeed: 0.08,
      fuelName: fuelLabel,
      pressureKpa: row.pressureKpa,
      targetTempK: row.tadK || 2100,
      testId: `Normal ${row.test}`,
    });
  };

  const handleApplyInverseRow = (row: Psi159InverseMeasurement) => {
    setSelectedRowId(row.id);
    if (!onApplyConditionsToChamber) return;

    let fuelLabel = 'Paraffin Wax';
    const fLower = row.fuel.toLowerCase();
    if (fLower.includes('ethane')) fuelLabel = 'Ethane Gas (C₂H₆)';
    else if (fLower.includes('propane')) fuelLabel = 'Propane Gas (C₃H₈)';
    else if (fLower.includes('butane')) fuelLabel = 'Butane Gas (C₄H₁₀)';

    const o2Val = Math.round((row.xo2 || 0.21) * 100 * 10) / 10;
    onApplyConditionsToChamber({
      gravityG: 0.0,
      o2Pct: o2Val,
      co2Pct: 0.2,
      ventilationSpeed: 0.05,
      fuelName: fuelLabel,
      pressureKpa: row.pressureKpa,
      targetTempK: row.tadK || 2200,
      testId: `Inverse ${row.test}`,
    });
  };

  const handleDownloadTableCsv = () => {
    const isNormal = activeSubTab === 'normal';
    const rows = isNormal ? filteredNormal : filteredInverse;

    if (rows.length === 0) return;

    let csvContent = '';
    if (isNormal) {
      const header = 'id,day,test,fuel,pressureBar,pressureKpa,xo2Before,xo2After,mhcMgS,tadK,burnTimeSec,extinctionMode,coolFlame,hasCoolFlame,peakBurnerTempC,comments\n';
      const dataLines = (filteredNormal as Psi159NormalMeasurement[]).map((r) => {
        return `"${r.id}",${r.day},"${r.test}","${r.fuel}",${r.pressureBar},${r.pressureKpa},${r.xo2Before},${r.xo2After},${r.mhcMgS},${r.tadK},${r.burnTimeSec},"${r.extinctionMode}","${(r.coolFlame || '').replace(/"/g, '""')}",${r.hasCoolFlame},${r.peakBurnerTempC},"${(r.comments || '').replace(/"/g, '""')}"`;
      });
      csvContent = header + dataLines.join('\n');
    } else {
      const header = 'id,day,test,fuel,pressureBar,pressureKpa,xo2,hcBurnrateMgS,o2FlowRateMgS,tadK,burnTimeSec,extinctionMode,color,peakBurnerTempC,comments\n';
      const dataLines = (filteredInverse as Psi159InverseMeasurement[]).map((r) => {
        return `"${r.id}",${r.day},"${r.test}","${r.fuel}",${r.pressureBar},${r.pressureKpa},${r.xo2},${r.hcBurnrateMgS},${r.o2FlowRateMgS},${r.tadK},${r.burnTimeSec},"${r.extinctionMode}","${r.color}",${r.peakBurnerTempC},"${(r.comments || '').replace(/"/g, '""')}"`;
      });
      csvContent = header + dataLines.join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `nasa_psi159_${activeSubTab}_flames_table_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-slate-100">
      {/* Header & NASA Open Science Badge */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-500/30 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-cyan-400" />
                {PSI_159_METADATA.fullTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                NASA Open Science • {PSI_159_METADATA.experimentId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Facility: <strong className="text-slate-300">{PSI_159_METADATA.facility}</strong> • PI: <strong className="text-cyan-300">{PSI_159_METADATA.principalInvestigators}</strong>
            </p>
          </div>

          {/* Direct CSV Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onDownloadSimulationReport && (
              <button
                onClick={onDownloadSimulationReport}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                title="Download formatted CSV report of current live chamber simulation state, gases, and flame temperature"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            )}
            <a
              href={PSI_159_METADATA.normalCsvUrl}
              download="PSI-159_Experimental_table_CFI-G_Normal_Flames.csv"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs border border-cyan-800/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download original Normal Flames CSV attachment"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Normal Flames CSV (179 tests)</span>
            </a>
            <a
              href={PSI_159_METADATA.inverseCsvUrl}
              download="PSI-159_Experimental_table_CFI-G_Inverse_Flames.csv"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs border border-amber-800/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download original Inverse Flames CSV attachment"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Inverse Flames CSV (154 tests)</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed text-[11px]">
          {PSI_159_METADATA.description}
        </p>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400">Total Flight Runs</span>
            <span className="text-base font-bold text-white">
              {PSI_159_NORMAL_FLAMES.length + PSI_159_INVERSE_FLAMES.length} Tests
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-cyan-900/50 flex flex-col">
            <span className="text-[10px] text-cyan-400">Cool Flame Regimes</span>
            <span className="text-base font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {normalCoolCount} Detected
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400">Pressure Range</span>
            <span className="text-base font-bold text-indigo-300">
              0.50 - 3.31 bar
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400">Longest Flame Burn</span>
            <span className="text-base font-bold text-emerald-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {Math.max(maxNormalBurnTime, maxInverseBurnTime)}s
            </span>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tab Switcher: Normal Co-flow vs Inverse Diffusion */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setActiveSubTab('normal');
              setSelectedRowId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              activeSubTab === 'normal'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Normal Co-Flow Flames ({PSI_159_NORMAL_FLAMES.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('inverse');
              setSelectedRowId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              activeSubTab === 'inverse'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inverse Diffusion Flames ({PSI_159_INVERSE_FLAMES.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 px-2 hidden md:block">
          {activeSubTab === 'normal'
            ? 'Fuel jet into co-flowing oxidizer ambient'
            : 'Oxidizer jet surrounded by fuel stream'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px]">Fuel:</span>
          {['all', 'ethane', 'propane', 'butane'].map((fuel) => (
            <button
              key={fuel}
              onClick={() => setFuelFilter(fuel)}
              className={`px-2.5 py-1 rounded-lg border capitalize transition-all ${
                fuelFilter === fuel
                  ? 'bg-indigo-600 text-white font-bold border-indigo-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {fuel}
            </button>
          ))}

          {activeSubTab === 'normal' && (
            <button
              onClick={() => setOnlyCoolFlames(!onlyCoolFlames)}
              className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                onlyCoolFlames
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-900 text-cyan-400 border-cyan-900/60 hover:border-cyan-500'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Cool Flames Only ({normalCoolCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1 ml-2">
            <span className="text-slate-400 text-[11px]">Extinction:</span>
            <select
              value={extinctionFilter}
              onChange={(e) => setExtinctionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs outline-none focus:border-cyan-500"
            >
              <option value="all">All Modes</option>
              <option value="SE">Self-Extinguished (SE)</option>
              <option value="FT">Flow Terminated (FT)</option>
            </select>
          </div>
        </div>

        {/* Search & Download */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search test, day, comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleDownloadTableCsv}
            className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all border border-cyan-400 flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            title="Download current experimental data table as CSV for offline analysis"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({activeSubTab === 'normal' ? filteredNormal.length : filteredInverse.length})</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 shadow-inner">
        {activeSubTab === 'normal' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3">Test</th>
                <th className="py-2 px-2">Day</th>
                <th className="py-2 px-3">Fuel</th>
                <th className="py-2 px-2">Cool Flame?</th>
                <th className="py-2 px-2">XO₂</th>
                <th className="py-2 px-2">p (bar)</th>
                <th className="py-2 px-2">mHC (mg/s)</th>
                <th className="py-2 px-2">Tad (K)</th>
                <th className="py-2 px-2">Burn Time</th>
                <th className="py-2 px-2">Ext.</th>
                <th className="py-2 px-2">Peak T (°C)</th>
                <th className="py-2 px-3">Comments</th>
                <th className="py-2 px-3 text-right">Chamber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNormal.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500">
                    No normal flame tests match the active filters.
                  </td>
                </tr>
              ) : (
                filteredNormal.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      selectedRowId === row.id ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                      {row.test}
                    </td>
                    <td className="py-2 px-2 text-slate-400">{row.day}</td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold capitalize whitespace-nowrap">
                      {row.fuel}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {row.hasCoolFlame ? (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold flex items-center gap-1 w-max">
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          {row.coolFlame}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {(row.xo2Before * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.pressureBar.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.mhcMgS}
                    </td>
                    <td className="py-2 px-2 text-amber-300 font-semibold">
                      {row.tadK ? Math.round(row.tadK) : '-'}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.burnTimeSec > 0 ? `${row.burnTimeSec}s` : '0s'}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {row.extinctionMode === 'SE' ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60 text-[10px]">
                          Self-Ext
                        </span>
                      ) : row.extinctionMode === 'FT' ? (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                          Flow Term
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.peakBurnerTempC ? `${Math.round(row.peakBurnerTempC)}°C` : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] max-w-[200px] truncate" title={row.comments}>
                      {row.comments || '-'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleApplyNormalRow(row)}
                        className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold border border-cyan-500/40 transition-all text-[11px] flex items-center gap-1 ml-auto active:scale-95"
                        title="Load test conditions into live flame chamber"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>Simulate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3">Test</th>
                <th className="py-2 px-2">Day</th>
                <th className="py-2 px-3">Fuel</th>
                <th className="py-2 px-2">Color</th>
                <th className="py-2 px-2">XO₂</th>
                <th className="py-2 px-2">p (bar)</th>
                <th className="py-2 px-2">HC Burn (mg/s)</th>
                <th className="py-2 px-2">O₂ Flow (mg/s)</th>
                <th className="py-2 px-2">Tad (K)</th>
                <th className="py-2 px-2">Burn Time</th>
                <th className="py-2 px-2">Ext.</th>
                <th className="py-2 px-2">Peak T (°C)</th>
                <th className="py-2 px-3">Comments</th>
                <th className="py-2 px-3 text-right">Chamber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInverse.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    No inverse flame tests match the active filters.
                  </td>
                </tr>
              ) : (
                filteredInverse.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      selectedRowId === row.id ? 'bg-amber-950/30' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                      {row.test}
                    </td>
                    <td className="py-2 px-2 text-slate-400">{row.day}</td>
                    <td className="py-2 px-3 text-amber-300 font-semibold capitalize whitespace-nowrap">
                      {row.fuel}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize">
                        {row.color}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {(row.xo2 * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.pressureBar.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.hcBurnrateMgS}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.o2FlowRateMgS ? row.o2FlowRateMgS.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-2 text-amber-300 font-semibold">
                      {row.tadK ? Math.round(row.tadK) : '-'}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.burnTimeSec > 0 ? `${row.burnTimeSec}s` : '0s'}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {row.extinctionMode === 'SE' ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60 text-[10px]">
                          Self-Ext
                        </span>
                      ) : row.extinctionMode === 'FT' ? (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                          Flow Term
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {row.peakBurnerTempC ? `${Math.round(row.peakBurnerTempC)}°C` : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] max-w-[200px] truncate" title={row.comments}>
                      {row.comments || '-'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleApplyInverseRow(row)}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold border border-amber-500/40 transition-all text-[11px] flex items-center gap-1 ml-auto active:scale-95"
                        title="Load test conditions into live flame chamber"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>Simulate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
