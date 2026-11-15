import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, FileDown, ChevronUp } from 'lucide-react';

export interface DrillHighScoreEntry {
  id: string;
  scenarioId: string;
  scenarioCode: string;
  scenarioTitle: string;
  responseTimeSec: number;
  timeLimitSec: number;
  quenchMethod: string;
  operatorName: string;
  recordedAtIso: string;
}

export const DRILL_HIGH_SCORES_STORAGE_KEY = 'nullg_safety_drill_highscores_v1';
export const MAX_TOP_DRILL_SCORES = 5;

export function loadDrillHighScores(): DrillHighScoreEntry[] {
  try {
    const raw = localStorage.getItem(DRILL_HIGH_SCORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is DrillHighScoreEntry => {
        if (!item || typeof item !== 'object') return false;
        const candidate = item as Record<string, unknown>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.scenarioId === 'string' &&
          typeof candidate.scenarioCode === 'string' &&
          typeof candidate.scenarioTitle === 'string' &&
          typeof candidate.responseTimeSec === 'number' &&
          Number.isFinite(candidate.responseTimeSec) &&
          candidate.responseTimeSec > 0 &&
          typeof candidate.timeLimitSec === 'number' &&
          Number.isFinite(candidate.timeLimitSec) &&
          candidate.timeLimitSec > 0 &&
          typeof candidate.quenchMethod === 'string' &&
          typeof candidate.operatorName === 'string' &&
          typeof candidate.recordedAtIso === 'string'
        );
      })
      .sort((a, b) => a.responseTimeSec - b.responseTimeSec)
      .slice(0, MAX_TOP_DRILL_SCORES);
  } catch {
    return [];
  }
}

export function saveDrillHighScore(
  entry: Omit<DrillHighScoreEntry, 'id' | 'recordedAtIso'> & {
    id?: string;
    recordedAtIso?: string;
  }
): {
  entries: DrillHighScoreEntry[];
  savedEntry: DrillHighScoreEntry;
  rank: number | null;
  recordType: 'overall' | 'scenario' | null;
} {
  const existing = loadDrillHighScores();
  const prevOverallBest = existing.length > 0 ? existing[0].responseTimeSec : null;
  const prevScenarioBest = existing
    .filter((e) => e.scenarioId === entry.scenarioId)
    .reduce<number | null>(
      (min, e) => (min === null || e.responseTimeSec < min ? e.responseTimeSec : min),
      null
    );

  let recordType: 'overall' | 'scenario' | null = null;
  if (prevOverallBest === null || entry.responseTimeSec < prevOverallBest) {
    recordType = 'overall';
  } else if (prevScenarioBest === null || entry.responseTimeSec < prevScenarioBest) {
    recordType = 'scenario';
  }

  const savedEntry: DrillHighScoreEntry = {
    id: entry.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scenarioId: entry.scenarioId,
    scenarioCode: entry.scenarioCode,
    scenarioTitle: entry.scenarioTitle,
    responseTimeSec: entry.responseTimeSec,
    timeLimitSec: entry.timeLimitSec,
    quenchMethod: entry.quenchMethod,
    operatorName: entry.operatorName.trim() || 'Crew',
    recordedAtIso: entry.recordedAtIso || new Date().toISOString(),
  };

  const nextEntries = [...existing, savedEntry]
    .sort((a, b) => a.responseTimeSec - b.responseTimeSec)
    .slice(0, MAX_TOP_DRILL_SCORES);

  try {
    localStorage.setItem(DRILL_HIGH_SCORES_STORAGE_KEY, JSON.stringify(nextEntries));
  } catch {
    // Ignore storage quota or private mode errors
  }

  const rankIndex = nextEntries.findIndex((e) => e.id === savedEntry.id);
  return {
    entries: nextEntries,
    savedEntry,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    recordType,
  };
}

export function clearDrillHighScores(): DrillHighScoreEntry[] {
  try {
    localStorage.removeItem(DRILL_HIGH_SCORES_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  return [];
}

function formatRecordedDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Saved';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Saved';
  }
}

export interface DrillHighScoresProps {
  /** Optional externally managed sorted top-5 entries; defaults to localStorage state when omitted */
  scores?: DrillHighScoreEntry[];
  /** Optional ID of the latest recorded score to highlight in the table */
  highlightedEntryId?: string | null;
  /** Optional aggregate drill stats displayed as quiet metadata */
  stats?: { cleared: number; failed: number };
  /** Callback triggered after clearing scores */
  onClearScores?: () => void;
  /** Optional PDF After-Action Report export handler */
  onExportPdf?: () => void;
  pdfSavedRecently?: boolean;
  /** Optional collapse handler */
  onHide?: () => void;
  title?: string;
}

export const DrillHighScores: React.FC<DrillHighScoresProps> = ({
  scores,
  highlightedEntryId = null,
  stats,
  onClearScores,
  onExportPdf,
  pdfSavedRecently = false,
  onHide,
  title = 'Top 5 Fastest Emergency Response Times',
}) => {
  const [internalScores, setInternalScores] = useState<DrillHighScoreEntry[]>(() =>
    loadDrillHighScores()
  );

  // Sync internal state when storage updates across components/tabs
  useEffect(() => {
    if (scores !== undefined) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DRILL_HIGH_SCORES_STORAGE_KEY || e.key === null) {
        setInternalScores(loadDrillHighScores());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [scores]);

  const topFiveScores = [...(scores ?? internalScores)]
    .sort((a, b) => a.responseTimeSec - b.responseTimeSec)
    .slice(0, MAX_TOP_DRILL_SCORES);

  const bestOverallSec =
    topFiveScores.length > 0 ? topFiveScores[0].responseTimeSec : null;

  const handleClearScores = () => {
    const cleared = clearDrillHighScores();
    if (scores === undefined) {
      setInternalScores(cleared);
    }
    onClearScores?.();
  };

  return (
    <div
      aria-label="Top 5 Emergency Drill High Scores"
      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 font-mono text-xs flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
            Top {MAX_TOP_DRILL_SCORES} saved locally
            {stats ? ` · Cleared: ${stats.cleared} · Timed out: ${stats.failed}` : ''}
            {bestOverallSec !== null ? ` · Best: ${bestOverallSec.toFixed(1)}s` : ''}
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
            onClick={handleClearScores}
            disabled={topFiveScores.length === 0}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              topFiveScores.length === 0
                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border-slate-700 hover:border-rose-500/50'
            }`}
            title="Clear all saved high scores from localStorage"
          >
            <Trash2 className={`w-3.5 h-3.5 ${topFiveScores.length === 0 ? 'text-slate-600' : 'text-rose-400'}`} />
            <span>Clear Scores</span>
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

      {/* Top 5 Ranked Table */}
      {topFiveScores.length === 0 ? (
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 text-center text-slate-400 text-[11px]">
          No cleared emergency drill times recorded yet. Complete an emergency scenario before the timer expires to save a top-5 performance time.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left border-collapse text-[11px] tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                <th className="py-2 px-3 font-semibold">Rank</th>
                <th className="py-2 px-3 font-semibold">Scenario</th>
                <th className="py-2 px-3 font-semibold">Operator</th>
                <th className="py-2 px-3 font-semibold">Method</th>
                <th className="py-2 px-3 font-semibold text-right">Time Left</th>
                <th className="py-2 px-3 font-semibold text-right">Response</th>
                <th className="py-2 px-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {topFiveScores.map((entry, idx) => {
                const isLatest = highlightedEntryId === entry.id;
                const marginSec = Math.max(0, entry.timeLimitSec - entry.responseTimeSec);
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
                    <td className="py-2 px-3">
                      <span className="text-cyan-300 font-bold">{entry.scenarioCode}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-200">{entry.scenarioTitle}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{entry.operatorName}</td>
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{entry.quenchMethod}</td>
                    <td className="py-2 px-3 text-right text-slate-400 whitespace-nowrap">
                      +{marginSec.toFixed(1)}s
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-300 whitespace-nowrap">
                      {entry.responseTimeSec.toFixed(1)}s
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 whitespace-nowrap">
                      {isLatest ? 'Just now' : formatRecordedDate(entry.recordedAtIso)}
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
