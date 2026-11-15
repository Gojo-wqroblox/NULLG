import React, { useState, useMemo } from 'react';
import {
  MISSION_PROFILES,
  MISSION_HISTORY_TIMELINE,
  MissionId,
  MissionTimelineEvent,
  TimelineCategory,
} from '../data/missionHistoryTimeline';
import { NASA_EXPERIMENTS, NasaExperiment } from '../data/nasaExperiments';
import {
  History,
  ArrowUpRight,
  Flame,
  Siren,
  Database,
  AlertTriangle,
  ShieldCheck,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';

interface MissionHistoryTabProps {
  onOpenExperimentDataset: (experimentId: string, viewMode?: 'programs' | 'psi159') => void;
  onSimulateConditions: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa: number;
    extraGases?: Record<string, number>;
  }) => void;
  onLaunchEmergencyScenario: (scenarioId: string) => void;
}

const SEVERITY_LABEL: Record<
  MissionTimelineEvent['telemetrySnapshot']['hazardSeverity'],
  { text: string; glyph: string; colorClass: string }
> = {
  CRITICAL: { text: 'Critical Incident', glyph: '✖', colorClass: 'text-rose-400' },
  ELEVATED: { text: 'Elevated Risk', glyph: '▲', colorClass: 'text-amber-400' },
  REFORM: { text: 'Engineering Reform', glyph: '●', colorClass: 'text-cyan-400' },
  VALIDATION: { text: 'ISS Validation', glyph: '●', colorClass: 'text-emerald-400' },
};

const MISSION_ACCENT: Record<MissionId, string> = {
  apollo_1: '#f43f5e',
  apollo_13: '#f59e0b',
  mir_1997: '#06b6d4',
};

export const MissionHistoryTab: React.FC<MissionHistoryTabProps> = ({
  onOpenExperimentDataset,
  onSimulateConditions,
  onLaunchEmergencyScenario,
}) => {
  const [selectedMission, setSelectedMission] = useState<'all' | MissionId>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TimelineCategory>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>(MISSION_HISTORY_TIMELINE[0].id);

  const filteredEvents = useMemo(() => {
    return MISSION_HISTORY_TIMELINE.filter((ev) => {
      const missionMatch = selectedMission === 'all' || ev.missionId === selectedMission;
      const categoryMatch = selectedCategory === 'all' || ev.category === selectedCategory;
      return missionMatch && categoryMatch;
    });
  }, [selectedMission, selectedCategory]);

  const activeEvent = useMemo(() => {
    const found = filteredEvents.find((ev) => ev.id === selectedEventId);
    return found || filteredEvents[0] || MISSION_HISTORY_TIMELINE[0];
  }, [filteredEvents, selectedEventId]);

  const experimentLookup = useMemo(() => {
    const map = new Map<string, NasaExperiment>();
    NASA_EXPERIMENTS.forEach((exp) => map.set(exp.id, exp));
    return map;
  }, []);

  const handleSelectMissionFilter = (mission: 'all' | MissionId) => {
    setSelectedMission(mission);
    const firstMatch = MISSION_HISTORY_TIMELINE.find(
      (ev) =>
        (mission === 'all' || ev.missionId === mission) &&
        (selectedCategory === 'all' || ev.category === selectedCategory)
    );
    if (firstMatch) setSelectedEventId(firstMatch.id);
  };

  return (
    <div className="flex flex-col gap-5 text-slate-100">
      {/* ===================================================================== */}
      {/* HEADER & CHRONOLOGICAL OXYGEN-RISK TIMELINE CHART                     */}
      {/* ===================================================================== */}
      <section className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wide">
              <History className="w-4 h-4 shrink-0" />
              <span>Spacecraft Fire Safety Chronology · 1967 – 2024</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
              Mission History: Apollo 1, Apollo 13 &amp; Mir Fire Timeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Trace how catastrophic spacecraft fire incidents reshaped cabin atmospheres, material flammability testing, and modern microgravity combustion datasets. Select any milestone to inspect telemetry and jump straight to its empirical NASA dataset.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-400 shrink-0">
            <div>
              <span className="block text-[11px] text-slate-500">Timeline Milestones</span>
              <span className="text-lg font-bold text-white">{MISSION_HISTORY_TIMELINE.length} Events</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="block text-[11px] text-slate-500">Linked Datasets</span>
              <span className="text-lg font-bold text-cyan-400">8 PSI / ISS Sets</span>
            </div>
          </div>
        </div>

        {/* SVG Timeline Plot: Oxygen Concentration Across Historic Milestones */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400">
            <span>Atmospheric O₂ Trajectory Across Key Incidents &amp; Reforms (% O₂)</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-rose-400">● Apollo 1 (1967)</span>
              <span className="text-amber-400">● Apollo 13 (1970)</span>
              <span className="text-cyan-400">● Mir / ISS (1997–2024)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-slate-900/50 rounded-lg border border-slate-800 p-3">
            <svg
              viewBox="0 0 900 170"
              className="w-full min-w-[640px] h-40 overflow-visible"
              role="img"
              aria-label="Interactive fire safety timeline plotting oxygen concentration from Apollo 1 to ISS"
            >
              {/* Horizontal Reference Bands */}
              <line x1="56" y1="24" x2="868" y2="24" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <text x="6" y="27" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                100% O₂
              </text>

              <line x1="56" y1="74" x2="868" y2="74" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <text x="6" y="77" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                60% O₂
              </text>

              <line x1="56" y1="122" x2="868" y2="122" stroke="#1e293b" strokeWidth="1" />
              <text x="6" y="125" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                21% O₂
              </text>

              {/* Connecting Trajectory Line */}
              <polyline
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                points={MISSION_HISTORY_TIMELINE.map((ev, idx) => {
                  const x = 80 + idx * 96;
                  const y = 138 - (Math.min(100, Math.max(15, ev.telemetrySnapshot.o2Pct)) / 100) * 114;
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Milestone Nodes */}
              {MISSION_HISTORY_TIMELINE.map((ev, idx) => {
                const x = 80 + idx * 96;
                const y = 138 - (Math.min(100, Math.max(15, ev.telemetrySnapshot.o2Pct)) / 100) * 114;
                const isSelected = activeEvent.id === ev.id;
                const accent = MISSION_ACCENT[ev.missionId];
                const isVisible = filteredEvents.some((f) => f.id === ev.id);

                return (
                  <g
                    key={ev.id}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: isVisible ? 1 : 0.28 }}
                    onClick={() => {
                      if (!isVisible) {
                        setSelectedMission('all');
                        setSelectedCategory('all');
                      }
                      setSelectedEventId(ev.id);
                    }}
                  >
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill={accent}
                        fillOpacity={0.2}
                        stroke={accent}
                        strokeWidth={1.5}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6.5 : 5}
                      fill={isSelected ? accent : '#0f172a'}
                      stroke={accent}
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fill={isSelected ? '#f8fafc' : '#94a3b8'}
                      fontSize="9.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {ev.telemetrySnapshot.o2Pct.toFixed(0)}%
                    </text>
                    <text
                      x={x}
                      y={156}
                      textAnchor="middle"
                      fill={isSelected ? accent : '#64748b'}
                      fontSize="9.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {ev.missionYear === 2018 ? 'ISS/PSI' : ev.missionYear} · #{idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Filter Bar: Mission Selector + Stage Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 flex-wrap">
            <button
              onClick={() => handleSelectMissionFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedMission === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Missions ({MISSION_HISTORY_TIMELINE.length})
            </button>
            <button
              onClick={() => handleSelectMissionFilter('apollo_1')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedMission === 'apollo_1'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Apollo 1 · 1967
            </button>
            <button
              onClick={() => handleSelectMissionFilter('apollo_13')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedMission === 'apollo_13'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Apollo 13 · 1970
            </button>
            <button
              onClick={() => handleSelectMissionFilter('mir_1997')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedMission === 'mir_1997'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Mir Fire · 1997
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 flex-wrap">
            {(
              [
                { id: 'all', label: 'All Stages' },
                { id: 'incident', label: 'Incidents' },
                { id: 'investigation', label: 'Engineering Reforms' },
                { id: 'validation', label: 'ISS Validation' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  const first = MISSION_HISTORY_TIMELINE.find(
                    (ev) =>
                      (selectedMission === 'all' || ev.missionId === selectedMission) &&
                      (cat.id === 'all' || ev.category === cat.id)
                  );
                  if (first) setSelectedEventId(first.id);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3-COLUMN COMPARATIVE MISSION BASELINE STRIP                           */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MISSION_PROFILES.map((m) => {
          const isFocused = selectedMission === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMissionFilter(isFocused ? 'all' : m.id)}
              className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                isFocused
                  ? 'bg-slate-900 border-cyan-500/70'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span>{m.dateLabel}</span>
                  <span style={{ color: m.accentHex }} className="font-semibold">
                    {isFocused ? 'Filtered' : 'Focus Mission'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{m.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Crew: {m.crew}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 text-xs font-mono tabular-nums space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Atmosphere</span>
                  <span className="text-slate-200 text-right">{m.atmosphereLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Gravity</span>
                  <span className="text-slate-200 text-right">{m.gravityLabel}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 leading-snug">
                  Reform: <span className="text-slate-300">{m.primaryReform}</span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* ===================================================================== */}
      {/* ASYMMETRIC SPLIT WORKSPACE: TIMELINE LIST + DATASET LINK INSPECTOR    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Chronological Event Stream */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {filteredEvents.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-sm text-slate-400 font-mono">
              No mission history events match the current filter combination.
            </div>
          ) : (
            <div className="relative pl-6 flex flex-col gap-3">
              {/* Vertical Rail */}
              <div
                className="absolute left-2.5 top-3 bottom-3 w-px bg-slate-800"
                aria-hidden="true"
              />

              {filteredEvents.map((ev) => {
                const isSelected = activeEvent.id === ev.id;
                const sev = SEVERITY_LABEL[ev.telemetrySnapshot.hazardSeverity];
                const accent = MISSION_ACCENT[ev.missionId];

                return (
                  <div key={ev.id} className="relative">
                    {/* Timeline Node Marker */}
                    <span
                      className="absolute -left-[19px] top-5 w-3 h-3 rounded-full border-2 bg-slate-950"
                      style={{
                        borderColor: accent,
                        backgroundColor: isSelected ? accent : '#020617',
                      }}
                      aria-hidden="true"
                    />

                    <div
                      onClick={() => setSelectedEventId(ev.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedEventId(ev.id);
                        }
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500/70'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Clean Unboxed Metadata Line */}
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono tabular-nums">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="font-semibold text-slate-200">{ev.timestampLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.missionName}</span>
                        </div>
                        <span className={`font-semibold ${sev.colorClass}`}>
                          {sev.glyph} {sev.text}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white leading-snug">
                          {ev.title}
                        </h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          {ev.locationOrSystem}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {ev.summary}
                      </p>

                      {/* Inline Telemetry + Linked Dataset Shortcut Chips */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs font-mono tabular-nums">
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>
                            O₂ <strong className="text-slate-100">{ev.telemetrySnapshot.o2Pct.toFixed(1)}%</strong>
                          </span>
                          <span aria-hidden="true">/</span>
                          <span>
                            P <strong className="text-slate-100">{ev.telemetrySnapshot.pressureKpa.toFixed(1)} kPa</strong>
                          </span>
                          <span aria-hidden="true">/</span>
                          <span>
                            G <strong className="text-slate-100">{ev.telemetrySnapshot.gravityG.toFixed(2)} G</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {ev.linkedDatasets.map((link) => {
                            const exp = experimentLookup.get(link.experimentId);
                            if (!exp) return null;
                            return (
                              <button
                                key={link.experimentId}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenExperimentDataset(link.experimentId, link.viewMode);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-700 hover:border-cyan-400 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0"
                                title={`Open ${exp.fullName} dataset`}
                              >
                                <Database className="w-3 h-3" />
                                <span>{exp.code}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Selected Event Telemetry & Dataset Inspector */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <span>{activeEvent.timestampLabel}</span>
              <span className={SEVERITY_LABEL[activeEvent.telemetrySnapshot.hazardSeverity].colorClass}>
                {SEVERITY_LABEL[activeEvent.telemetrySnapshot.hazardSeverity].glyph}{' '}
                {SEVERITY_LABEL[activeEvent.telemetrySnapshot.hazardSeverity].text}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1.5 leading-snug">
              {activeEvent.title}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {activeEvent.missionName} · {activeEvent.locationOrSystem}
            </p>
          </div>

          {/* Calibrated Numeric Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="block text-[11px] text-slate-400">O₂ Fraction</span>
              <span className="text-lg font-bold text-white">
                {activeEvent.telemetrySnapshot.o2Pct.toFixed(1)}
                <span className="text-xs text-slate-400 ml-1">%</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="block text-[11px] text-slate-400">Pressure</span>
              <span className="text-lg font-bold text-white">
                {activeEvent.telemetrySnapshot.pressureKpa.toFixed(1)}
                <span className="text-xs text-slate-400 ml-1">kPa</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="block text-[11px] text-slate-400">Gravity</span>
              <span className="text-lg font-bold text-white">
                {activeEvent.telemetrySnapshot.gravityG.toFixed(2)}
                <span className="text-xs text-slate-400 ml-1">G</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="block text-[11px] text-slate-400">Airflow</span>
              <span className="text-lg font-bold text-white">
                {activeEvent.telemetrySnapshot.airflowMs.toFixed(2)}
                <span className="text-xs text-slate-400 ml-1">m/s</span>
              </span>
            </div>
          </div>

          {/* Forensic Root Cause & Engineering Legacy */}
          <div className="flex flex-col gap-3 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-300 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Combustion Forensics</span>
              </div>
              <p className="text-slate-300">{activeEvent.forensicFinding}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-1.5 font-mono font-semibold text-emerald-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Engineering Safety Reform</span>
              </div>
              <p className="text-slate-300">{activeEvent.safetyLegacy}</p>
            </div>
          </div>

          {/* Direct Experimental Dataset Links */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Linked Empirical NASA Datasets</span>
              </span>
              <span className="text-slate-500">Click to open</span>
            </div>

            {activeEvent.linkedDatasets.map((link) => {
              const exp = experimentLookup.get(link.experimentId);
              if (!exp) return null;
              const peakRadius = Math.max(...exp.runs.map((r) => r.peakRadiusMm), 0);
              const firstExtinction = exp.runs.find((r) => r.extinctionTimestampSec !== null)?.extinctionTimestampSec;

              return (
                <div
                  key={link.experimentId}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        {exp.name} · <span className="text-cyan-400">{exp.code}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {exp.facility}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenExperimentDataset(exp.id, link.viewMode)}
                      className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <span>Open Dataset</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{link.rationale}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400 pt-1 border-t border-slate-800/70">
                    <span>
                      Runs: <strong className="text-slate-200">{exp.runs.length}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Peak Radius: <strong className="text-amber-300">{peakRadius.toFixed(1)} mm</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {firstExtinction != null ? (
                        <>
                          Quench: <strong className="text-rose-300">{firstExtinction.toFixed(1)} s</strong>
                        </>
                      ) : (
                        <strong className="text-emerald-300">Sustained Burn</strong>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Simulation & Drill Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onSimulateConditions(activeEvent.chamberPreset)}
              className="flex-1 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Load in 2D Chamber</span>
            </button>

            <button
              type="button"
              onClick={() => onLaunchEmergencyScenario(activeEvent.linkedScenarioId)}
              className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Run Emergency Drill</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
