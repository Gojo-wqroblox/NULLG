import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, FileDown, ChevronUp, Clock, User } from 'lucide-react';
import {
  DRILL_HIGH_SCORES_STORAGE_KEY,
  MAX_TOP_DRILL_SCORES,
  loadDrillHighScores,
  clearDrillHighScores,
  type DrillHighScoreEntry,
} from './DrillHighScores';

export type DrillLeaderboardEntry = DrillHighScoreEntry;

export interface DrillLeaderboardProps {
  /** Optional externally managed sorted top-5 entries; defaults to localStorage state when omitted */
  entries?: DrillLeaderboardEntry[];
  /** Optional ID of the latest recorded completion to highlight */
  highlightedEntryId?: string | null;
  /** Aggregate cleared/failed drill stats shown as quiet metadata */
  stats?: { cleared: number; failed: number };
  /** Callback invoked when the user clicks 'Clear History' */
  onClearHistory?: () => void;
  /** Optional PDF After-Action Report export handler */
  onExportPdf?: () => void;
  pdfSavedRecently?: boolean;
  /** Optional collapse handler */
  onHide?: () => void;
  title?: string;
}

function formatCompletionDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Saved';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Saved';
  }
}

export const DrillLeaderboard: React.FC<DrillLeaderboardProps> = ({
  entries,
  highlightedEntryId = null,
  stats,
  onClearHistory,
  onExportPdf,
  pdfSavedRecently = false,
  onHide,
  title = 'Drill Leaderboard · Top 5 Fastest Completion Times',
}) => {
  const [storedEntries, setStoredEntries] = useState<DrillLeaderboardEntry[]>(() =>
    loadDrillHighScores()
  );

  // Keep standalone localStorage view synchronized across browser tabs/components
  useEffect(() => {
    if (entries !== undefined) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DRILL_HIGH_SCORES_STORAGE_KEY || e.key === null) {
        setStoredEntries(loadDrillHighScores());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [entries]);

  const topFive = [...(entries ?? storedEntries)]
    .sort((a, b) => a.responseTimeSec - b.responseTimeSec)
    .slice(0, MAX_TOP_DRILL_SCORES);

  const fastestTimeSec = topFive.length > 0 ? topFive[0].responseTimeSec : null;

  const handleClearHistory = () => {
    const empty = clearDrillHighScores();
    if (entries === undefined) {
      setStoredEntries(empty);
    }
    onClearHistory?.();
  };

  return (
    <div
      aria-label="Emergency Drill Leaderboard"
      className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5 font-mono text-xs flex flex-col gap-3"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
            Stored in browser localStorage · Showing fastest {MAX_TOP_DRILL_SCORES}
            {stats ? ` · Cleared: ${stats.cleared} · Timed out: ${stats.failed}` : ''}
            {fastestTimeSec !== null ? ` · Best elapsed: ${fastestTimeSec.toFixed(1)}s` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Download PDF After-Action Report"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{pdfSavedRecently ? 'PDF Saved' : 'Export PDF Report'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={topFive.length === 0}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              topFive.length === 0
                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border-slate-700 hover:border-rose-500/50'
            }`}
            title="Clear all saved drill completion history from localStorage"
          >
            <Trash2
              className={`w-3.5 h-3.5 ${
                topFive.length === 0 ? 'text-slate-600' : 'text-rose-400'
              }`}
            />
            <span>Clear History</span>
          </button>

          {onHide && (
            <button
              type="button"
              onClick={onHide}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 5 Rankings Table */}
      {topFive.length === 0 ? (
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 text-center text-slate-400 text-[11px]">
          No drill completion history yet. Resolve an emergency scenario before the timer expires to record your fastest elapsed time.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left border-collapse text-[11px] tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                <th className="py-2 px-3 font-semibold">Rank</th>
                <th className="py-2 px-3 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    User Name
                  </span>
                </th>
                <th className="py-2 px-3 font-semibold">Scenario</th>
                <th className="py-2 px-3 font-semibold">Method</th>
                <th className="py-2 px-3 font-semibold text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Elapsed Time
                  </span>
                </th>
                <th className="py-2 px-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {topFive.map((entry, idx) => {
                const isLatest = highlightedEntryId === entry.id;
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-800/70 last:border-b-0 ${
                      isLatest
                        ? 'bg-emerald-950/35 text-emerald-100'
                        : idx === 0
                        ? 'bg-amber-950/20 text-slate-100'
                        : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold">
                      <span
                        className={
                          idx === 0
                            ? 'text-amber-300'
                            : idx === 1
                            ? 'text-slate-200'
                            : idx === 2
                            ? 'text-amber-500'
                            : 'text-slate-400'
                        }
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                      {entry.operatorName}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-cyan-300 font-bold">{entry.scenarioCode}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-200">{entry.scenarioTitle}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                      {entry.quenchMethod}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-300 whitespace-nowrap">
                      {entry.responseTimeSec.toFixed(1)}s
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 whitespace-nowrap">
                      {isLatest ? 'Just now' : formatCompletionDate(entry.recordedAtIso)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
