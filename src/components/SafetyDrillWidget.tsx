import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Siren,
  Timer,
  Shuffle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Trophy,
  Play,
  FileDown,
  Info,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Repeat,
} from 'lucide-react';
import { playKlaxonAlarm, playSuccessChime, playFailureBuzz } from '../utils/emergencyAudio';
import {
  downloadAfterActionReportPdf,
  type LatestDrillOutcomeSnapshot,
} from '../utils/afterActionPdf';
import {
  loadDrillHighScores,
  saveDrillHighScore,
  clearDrillHighScores,
  type DrillHighScoreEntry,
} from './DrillHighScores';
import { DrillLeaderboard } from './DrillLeaderboard';

export type SafetyDrillHighScoreEntry = DrillHighScoreEntry;

export interface LiveSafetyDrillEvent {
  id: string;
  code: string;
  title: string;
  severity: 'CRITICAL' | 'SEVERE';
  timeLimitSec: number;
  briefing: string;
  /** Initial chamber conditions injected when this anomaly strikes */
  injectState: {
    o2Pct: number;
    n2Pct: number;
    co2Pct: number;
    ch4Pct?: number;
    coPct?: number;
    pressureKpa: number;
    gravityG: number;
    ventilationSpeed: number;
    isIgnited: boolean;
  };
  targets: {
    maxO2Pct: number;
    altMinCo2Pct: number;
    maxVentilationMs: number;
    requireExtinguished?: boolean;
  };
  hint: string;
}

interface SafetyDrillPersistedStats {
  cleared: number;
  failed: number;
}

const STATS_STORAGE_KEY = 'nullg_safety_drill_stats_v1';

function loadPersistedStats(): SafetyDrillPersistedStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { cleared: 0, failed: 0 };
    const parsed = JSON.parse(raw) as Partial<SafetyDrillPersistedStats>;
    return {
      cleared: typeof parsed.cleared === 'number' && Number.isFinite(parsed.cleared) && parsed.cleared >= 0 ? parsed.cleared : 0,
      failed: typeof parsed.failed === 'number' && Number.isFinite(parsed.failed) && parsed.failed >= 0 ? parsed.failed : 0,
    };
  } catch {
    return { cleared: 0, failed: 0 };
  }
}

function savePersistedStats(stats: SafetyDrillPersistedStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

const ONBOARDING_STORAGE_KEY = 'nullg_safety_drill_onboarding_done_v1';

function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
  } catch {
    // Ignore storage errors
  }
}

export type DrillDifficulty = 'easy' | 'normal' | 'hard';

interface DrillDifficultyConfig {
  id: DrillDifficulty;
  label: string;
  timeScale: number;
  surpriseMinSec: number;
  surpriseMaxSec: number;
  summary: string;
}

export const DRILL_DIFFICULTY_CONFIGS: Record<DrillDifficulty, DrillDifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    timeScale: 1.35,
    surpriseMinSec: 16,
    surpriseMaxSec: 26,
    summary: '1.35× time limit · 16–26s anomaly interval',
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    timeScale: 1.0,
    surpriseMinSec: 8,
    surpriseMaxSec: 16,
    summary: '1.0× time limit · 8–16s anomaly interval',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    timeScale: 0.65,
    surpriseMinSec: 4,
    surpriseMaxSec: 8,
    summary: '0.65× time limit · 4–8s anomaly interval',
  },
};

const DIFFICULTY_STORAGE_KEY = 'nullg_safety_drill_difficulty_v1';

function loadPersistedDifficulty(): DrillDifficulty {
  try {
    const raw = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (raw === 'easy' || raw === 'normal' || raw === 'hard') return raw;
    return 'normal';
  } catch {
    return 'normal';
  }
}

function savePersistedDifficulty(difficulty: DrillDifficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficulty);
  } catch {
    // Ignore storage errors
  }
}

function getScaledTimeLimit(baseTimeLimitSec: number, difficulty: DrillDifficulty): number {
  return Math.max(12, Math.round(baseTimeLimitSec * DRILL_DIFFICULTY_CONFIGS[difficulty].timeScale));
}

function rollSurpriseDelaySec(difficulty: DrillDifficulty): number {
  const { surpriseMinSec, surpriseMaxSec } = DRILL_DIFFICULTY_CONFIGS[difficulty];
  return Math.floor(surpriseMinSec + Math.random() * (surpriseMaxSec - surpriseMinSec + 1));
}

interface GettingStartedStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  actionCue: string;
  targetSummary: string;
}

const GETTING_STARTED_STEPS: GettingStartedStep[] = [
  {
    id: 'trigger',
    badge: 'Getting Started · Overview',
    title: '1. Launch or Arm a Live Chamber Emergency',
    description:
      'Clicking "Trigger Random Emergency" injects an instant spacecraft fire anomaly—such as cabin pressure loss, hyperoxic O₂ surge, or a methane leak—with a countdown timer.',
    actionCue: 'Use "Arm Surprise Anomaly" if you want an unexpected failure mid-simulation.',
    targetSummary: 'Time Window: 40s – 50s depending on scenario',
  },
  {
    id: 'o2',
    badge: 'Getting Started · Oxidizer Control',
    title: '2. Starve the Flame by Lowering O₂ Levels',
    description:
      'High oxygen accelerates combustion spread. Drag the O₂ Concentration slider below the drill bar (or use Purge N₂ in the chamber) to drop oxygen below the Limiting Oxygen Index.',
    actionCue: 'Lower O₂ to ≤ 12.0% – 16.0% to suffocate gas-phase oxidation.',
    targetSummary: 'Primary Target: O₂ ≤ 14% (typical LOI threshold)',
  },
  {
    id: 'co2_airflow',
    badge: 'Getting Started · Inerting & Ventilation',
    title: '3. Flood CO₂ & Cut Ventilation Airflow',
    description:
      'Raising CO₂ (≥ 22% – 25%) absorbs flame heat and displaces oxygen. You must also cut Ventilation Airflow near zero so forced convection stops feeding fresh oxidizer to the flame.',
    actionCue: 'Both atmosphere quenching (O₂ or CO₂) AND airflow isolation must turn green.',
    targetSummary: 'Alt Target: CO₂ ≥ 22–25% + Airflow ≤ 0.05 m/s',
  },
  {
    id: 'rankings',
    badge: 'Getting Started · Scoring & Debrief',
    title: '4. Set Top-5 Leaderboard Times & Export PDF',
    description:
      'Once both safety checks turn green before time runs out, your fastest elapsed time is saved to the Top-5 Drill Leaderboard and can be exported as a PDF After-Action Report.',
    actionCue: 'Hover or click "Why O₂?" / "Why CO₂?" anytime during a drill for live physics help.',
    targetSummary: 'Ready for your first emergency response drill',
  },
];

interface ParameterTooltipProps {
  id: string;
  label: string;
  title: string;
  currentReadout: string;
  mechanism: string;
  mitigationImpact: string;
  align?: 'left' | 'right';
}

const ParameterTooltip: React.FC<ParameterTooltipProps> = ({
  id,
  label,
  title,
  currentReadout,
  mechanism,
  mitigationImpact,
  align = 'left',
}) => {
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOpen = isPinned || isHovered;

  useEffect(() => {
    if (!isPinned) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPinned(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinned]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        aria-label={`Explain ${label}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setIsPinned((prev) => !prev);
        }}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          isOpen
            ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-200'
            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
        }`}
      >
        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <div
          id={id}
          role="tooltip"
          className={`absolute bottom-full mb-2 z-40 w-72 sm:w-80 rounded-xl bg-slate-950 border border-cyan-500/60 p-3 shadow-2xl text-left font-sans text-[11px] leading-relaxed text-slate-200 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-start justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800">
            <div>
              <div className="font-mono font-bold text-cyan-300 text-[11px]">{title}</div>
              <div className="font-mono text-[10px] text-slate-400 tabular-nums mt-0.5">
                {currentReadout}
              </div>
            </div>
            {isPinned && (
              <button
                type="button"
                aria-label="Close parameter explanation"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPinned(false);
                  setIsHovered(false);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-slate-300">
            <strong className="text-white">Physics:</strong> {mechanism}
          </p>
          <p className="text-emerald-200 mt-1.5">
            <strong className="text-emerald-300">Mitigation Impact:</strong> {mitigationImpact}
          </p>
        </div>
      )}
    </div>
  );
};

export const LIVE_SAFETY_DRILL_EVENTS: LiveSafetyDrillEvent[] = [
  {
    id: 'pressure_loss_o2_boiloff',
    code: 'ANOMALY-01',
    title: 'Unexpected Cabin Pressure Loss & O₂ Regulator Surge',
    severity: 'CRITICAL',
    timeLimitSec: 45,
    briefing:
      'Micrometeoroid seal leak dropped cabin pressure to 48.5 kPa while a stuck backup O₂ regulator spiked oxygen to 42.0%, accelerating flame spread.',
    injectState: {
      o2Pct: 42.0,
      n2Pct: 57.6,
      co2Pct: 0.4,
      pressureKpa: 48.5,
      gravityG: 0.0,
      ventilationSpeed: 0.35,
      isIgnited: true,
    },
    targets: {
      maxO2Pct: 14.0,
      altMinCo2Pct: 22.0,
      maxVentilationMs: 0.05,
    },
    hint: 'Reduce O₂ below 14.0% (or flood CO₂ ≥ 22.0%) AND cut airflow fans ≤ 0.05 m/s.',
  },
  {
    id: 'hyperoxic_avionics_arc',
    code: 'ANOMALY-02',
    title: 'Hyperoxic Avionics Bus Arc (68% O₂ Flash Hazard)',
    severity: 'CRITICAL',
    timeLimitSec: 40,
    briefing:
      'Oxygen supply valve jammed open inside the test bay: chamber O₂ surged to 68.0% at 128 kPa, triggering an intense hyperoxic electrical arc.',
    injectState: {
      o2Pct: 68.0,
      n2Pct: 31.6,
      co2Pct: 0.4,
      pressureKpa: 128.0,
      gravityG: 0.0,
      ventilationSpeed: 0.25,
      isIgnited: true,
    },
    targets: {
      maxO2Pct: 16.0,
      altMinCo2Pct: 25.0,
      maxVentilationMs: 0.05,
    },
    hint: 'Slam O₂ below 16.0% (or purge/flood CO₂ ≥ 25.0%) and cut ventilation ≤ 0.05 m/s.',
  },
  {
    id: 'methane_line_rupture',
    code: 'ANOMALY-03',
    title: 'Propellant Methane (CH₄) Manifold Leak & Ignition',
    severity: 'CRITICAL',
    timeLimitSec: 45,
    briefing:
      'Sabatier fuel line rupture injected 14.0% CH₄ into a 28.0% O₂ bay under 0.30 m/s circulation draft, creating a volatile flare.',
    injectState: {
      o2Pct: 28.0,
      n2Pct: 57.6,
      co2Pct: 0.4,
      ch4Pct: 14.0,
      pressureKpa: 112.0,
      gravityG: 0.0,
      ventilationSpeed: 0.30,
      isIgnited: true,
    },
    targets: {
      maxO2Pct: 12.0,
      altMinCo2Pct: 25.0,
      maxVentilationMs: 0.05,
    },
    hint: 'Starve oxidizer below 12.0% O₂ Limiting Oxygen Index (or CO₂ ≥ 25%) and stop fans.',
  },
  {
    id: 'hypergravity_chimney_flare',
    code: 'ANOMALY-04',
    title: 'Centrifuge 6.0G Hypergravity Chimney Excursion',
    severity: 'SEVERE',
    timeLimitSec: 40,
    briefing:
      'Centrifuge spin anomaly elevated effective acceleration to 6.0 G with 38.0% O₂ and 0.40 m/s crossflow, pulling a violent buoyant torch.',
    injectState: {
      o2Pct: 38.0,
      n2Pct: 61.6,
      co2Pct: 0.4,
      pressureKpa: 101.3,
      gravityG: 6.0,
      ventilationSpeed: 0.40,
      isIgnited: true,
    },
    targets: {
      maxO2Pct: 14.0,
      altMinCo2Pct: 22.0,
      maxVentilationMs: 0.05,
    },
    hint: 'Drop O₂ ≤ 14.0% (or inject CO₂ ≥ 22.0%) and reduce airflow ≤ 0.05 m/s.',
  },
  {
    id: 'mir_sfog_smoke_surge',
    code: 'ANOMALY-05',
    title: 'Oxygen Candle Rupture & Toxic CO Surge',
    severity: 'CRITICAL',
    timeLimitSec: 50,
    briefing:
      'Solid-fuel O₂ generator breached containment: O₂ rose to 32.0%, CO hit 4.0%, and 0.40 m/s fans are spreading hot aerosols through the rack.',
    injectState: {
      o2Pct: 32.0,
      n2Pct: 61.0,
      co2Pct: 3.0,
      coPct: 4.0,
      pressureKpa: 96.5,
      gravityG: 0.0,
      ventilationSpeed: 0.40,
      isIgnited: true,
    },
    targets: {
      maxO2Pct: 13.0,
      altMinCo2Pct: 24.0,
      maxVentilationMs: 0.02,
    },
    hint: 'Cut HVAC fans near zero (≤ 0.02 m/s) and drive O₂ ≤ 13.0% or CO₂ ≥ 24.0%.',
  },
];

interface SafetyDrillWidgetProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number;
  isIgnited: boolean;
  flameTempK: number;
  operatorName?: string;
  onInjectEmergency: (state: LiveSafetyDrillEvent['injectState']) => void;
  onRestoreNominal: () => void;
}

type DrillPhase = 'standby' | 'active' | 'extinguished' | 'failed';

export const SafetyDrillWidget: React.FC<SafetyDrillWidgetProps> = ({
  gases,
  pressureKpa,
  gravityG,
  ventilationSpeed,
  isIgnited,
  flameTempK,
  operatorName = 'Crew',
  onInjectEmergency,
  onRestoreNominal,
}) => {
  const [phase, setPhase] = useState<DrillPhase>('standby');
  const [difficulty, setDifficulty] = useState<DrillDifficulty>(() => loadPersistedDifficulty());
  const [autoChainEnabled, setAutoChainEnabled] = useState<boolean>(false);
  const [activeEvent, setActiveEvent] = useState<LiveSafetyDrillEvent | null>(null);
  const [activeTimeLimitSec, setActiveTimeLimitSec] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [autoTriggerArmed, setAutoTriggerArmed] = useState<boolean>(false);
  const [autoCountdown, setAutoCountdown] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Persisted high scores & drill stats
  const [highScores, setHighScores] = useState<SafetyDrillHighScoreEntry[]>(() => loadDrillHighScores());
  const [stats, setStats] = useState<SafetyDrillPersistedStats>(() => loadPersistedStats());
  const [isHighScoresOpen, setIsHighScoresOpen] = useState<boolean>(false);
  const [lastClearSummary, setLastClearSummary] = useState<{
    entryId: string;
    responseTimeSec: number;
    rank: number | null;
    recordType: 'overall' | 'scenario' | null;
  } | null>(null);
  const [latestOutcome, setLatestOutcome] = useState<LatestDrillOutcomeSnapshot | null>(null);
  const [pdfSavedRecently, setPdfSavedRecently] = useState<boolean>(false);
  const [showGettingStarted, setShowGettingStarted] = useState<boolean>(() => {
    const initialStats = loadPersistedStats();
    return initialStats.cleared === 0 && initialStats.failed === 0 && !hasCompletedOnboarding();
  });
  const [gettingStartedStep, setGettingStartedStep] = useState<number>(0);

  const lastEventIdRef = useRef<string | null>(null);
  const drillStartedAtRef = useRef<number | null>(null);
  const recordedCurrentRunRef = useRef<boolean>(false);
  const latestTelemetryRef = useRef({
    o2Pct: 21,
    co2Pct: 0.4,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    flameTempK,
    isIgnited,
  });

  const o2 = gases['O2'] ?? 21;
  const co2 = gases['CO2'] ?? 0.4;
  latestTelemetryRef.current = {
    o2Pct: o2,
    co2Pct: co2,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    flameTempK,
    isIgnited,
  };

  // Derived overall best and per-scenario best lookup
  const bestOverallSec = highScores.length > 0 ? highScores[0].responseTimeSec : null;

  const bestByScenario = useMemo(() => {
    const map = new Map<string, SafetyDrillHighScoreEntry>();
    for (const entry of highScores) {
      const existing = map.get(entry.scenarioId);
      if (!existing || entry.responseTimeSec < existing.responseTimeSec) {
        map.set(entry.scenarioId, entry);
      }
    }
    return map;
  }, [highScores]);

  // Live mitigation criteria check against current chamber parameters
  const atmosQuenched = activeEvent
    ? o2 <= activeEvent.targets.maxO2Pct || co2 >= activeEvent.targets.altMinCo2Pct || !isIgnited
    : false;
  const airflowIsolated = activeEvent
    ? ventilationSpeed <= activeEvent.targets.maxVentilationMs
    : false;
  const riskExtinguishedNow = Boolean(activeEvent && atmosQuenched && airflowIsolated);

  const triggerRandomDrill = useCallback(
    (specificId?: string) => {
      const pool = specificId
        ? LIVE_SAFETY_DRILL_EVENTS
        : LIVE_SAFETY_DRILL_EVENTS.filter((e) => e.id !== lastEventIdRef.current);
      const chosen = specificId
        ? pool.find((e) => e.id === specificId) || LIVE_SAFETY_DRILL_EVENTS[0]
        : pool[Math.floor(Math.random() * pool.length)];

      const scaledLimit = getScaledTimeLimit(chosen.timeLimitSec, difficulty);

      lastEventIdRef.current = chosen.id;
      drillStartedAtRef.current = performance.now();
      recordedCurrentRunRef.current = false;
      setLastClearSummary(null);
      setActiveEvent(chosen);
      setActiveTimeLimitSec(scaledLimit);
      setTimeLeft(scaledLimit);
      setElapsedSec(0);
      setPhase('active');
      setAutoTriggerArmed(false);
      setAutoCountdown(0);
      setShowGettingStarted(false);
      markOnboardingCompleted();

      onInjectEmergency(chosen.injectState);

      if (!isAudioMuted) {
        playKlaxonAlarm();
      }
    },
    [difficulty, isAudioMuted, onInjectEmergency]
  );

  // Auto-trigger random emergency mid-simulation when armed (or auto-chained in standby)
  useEffect(() => {
    if (!autoTriggerArmed || phase !== 'standby') return;

    const timer = setInterval(() => {
      setAutoCountdown((prev) => {
        if (prev <= 1) {
          triggerRandomDrill();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoTriggerArmed, phase, triggerRandomDrill]);

  // Active drill countdown clock
  useEffect(() => {
    if (phase !== 'active' || !activeEvent) return;

    const interval = setInterval(() => {
      setElapsedSec((e) => e + 0.25);
      setTimeLeft((prev) => {
        if (prev <= 0.25) {
          if (!recordedCurrentRunRef.current) {
            recordedCurrentRunRef.current = true;
            setStats((prevStats) => {
              const nextStats = { cleared: prevStats.cleared, failed: prevStats.failed + 1 };
              savePersistedStats(nextStats);
              return nextStats;
            });
            setLatestOutcome({
              scenario: { ...activeEvent, timeLimitSec: activeTimeLimitSec },
              outcome: 'failed',
              responseTimeSec: null,
              quenchMethod: 'Uncontained (Time Expired)',
              recordType: null,
              rank: null,
              operatorName: operatorName.trim() || 'Crew',
              recordedAtIso: new Date().toISOString(),
              chamberTelemetry: { ...latestTelemetryRef.current },
            });
          }
          setPhase('failed');
          if (!isAudioMuted) playFailureBuzz();
          return 0;
        }
        return Number((prev - 0.25).toFixed(2));
      });
    }, 250);

    return () => clearInterval(interval);
  }, [phase, activeEvent, activeTimeLimitSec, isAudioMuted, operatorName]);

  // Monitor live parameter adjustments for instant victory & record leaderboard score
  useEffect(() => {
    if (phase !== 'active' || !activeEvent || !riskExtinguishedNow) return;
    if (recordedCurrentRunRef.current) return;
    recordedCurrentRunRef.current = true;

    const rawElapsed =
      drillStartedAtRef.current !== null
        ? (performance.now() - drillStartedAtRef.current) / 1000
        : elapsedSec;
    const clearTimeSec = Math.max(
      0.2,
      Math.min(activeTimeLimitSec, Number(rawElapsed.toFixed(1)))
    );

    const quenchMethod = !isIgnited
      ? 'Manual Cutoff'
      : o2 <= activeEvent.targets.maxO2Pct && co2 >= activeEvent.targets.altMinCo2Pct
      ? 'O₂ + CO₂ Purge'
      : co2 >= activeEvent.targets.altMinCo2Pct
      ? 'CO₂ Blanket'
      : 'O₂ Starvation';

    const { entries: nextList, savedEntry, rank, recordType } = saveDrillHighScore({
      scenarioId: activeEvent.id,
      scenarioCode: activeEvent.code,
      scenarioTitle: activeEvent.title,
      responseTimeSec: clearTimeSec,
      timeLimitSec: activeTimeLimitSec,
      quenchMethod,
      operatorName: operatorName.trim() || 'Crew',
    });

    setHighScores(nextList);

    setLastClearSummary({
      entryId: savedEntry.id,
      responseTimeSec: clearTimeSec,
      rank,
      recordType,
    });

    setLatestOutcome({
      scenario: { ...activeEvent, timeLimitSec: activeTimeLimitSec },
      outcome: 'extinguished',
      responseTimeSec: clearTimeSec,
      quenchMethod,
      recordType,
      rank,
      operatorName: operatorName.trim() || 'Crew',
      recordedAtIso: savedEntry.recordedAtIso,
      chamberTelemetry: {
        o2Pct: o2,
        co2Pct: co2,
        pressureKpa,
        gravityG,
        ventilationSpeed,
        flameTempK,
        isIgnited,
      },
    });

    setStats((prevStats) => {
      const nextStats = { cleared: prevStats.cleared + 1, failed: prevStats.failed };
      savePersistedStats(nextStats);
      return nextStats;
    });

    setElapsedSec(clearTimeSec);
    setPhase('extinguished');
    if (!isAudioMuted) playSuccessChime();
  }, [
    phase,
    activeEvent,
    activeTimeLimitSec,
    riskExtinguishedNow,
    elapsedSec,
    isAudioMuted,
    isIgnited,
    o2,
    co2,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    flameTempK,
    operatorName,
    highScores,
  ]);

  const handleSelectDifficulty = (nextDifficulty: DrillDifficulty) => {
    setDifficulty(nextDifficulty);
    savePersistedDifficulty(nextDifficulty);
    if (autoTriggerArmed) {
      setAutoCountdown(rollSurpriseDelaySec(nextDifficulty));
    }
  };

  const handleToggleAutoArm = () => {
    if (autoTriggerArmed) {
      setAutoTriggerArmed(false);
      setAutoCountdown(0);
    } else {
      setAutoCountdown(rollSurpriseDelaySec(difficulty));
      setAutoTriggerArmed(true);
    }
  };

  const handleReturnToStandby = useCallback(() => {
    setPhase('standby');
    setActiveEvent(null);
    onRestoreNominal();
    if (autoChainEnabled) {
      setAutoCountdown(rollSurpriseDelaySec(difficulty));
      setAutoTriggerArmed(true);
    }
  }, [autoChainEnabled, difficulty, onRestoreNominal]);

  const handleResetHighScores = () => {
    setHighScores(clearDrillHighScores());
    setStats({ cleared: 0, failed: 0 });
    savePersistedStats({ cleared: 0, failed: 0 });
    setLastClearSummary(null);
    setLatestOutcome(null);
  };

  const handleDownloadAfterActionReport = () => {
    downloadAfterActionReportPdf({
      operatorName: operatorName.trim() || 'Crew',
      stats,
      highScores,
      scenarios: LIVE_SAFETY_DRILL_EVENTS,
      latestOutcome,
      currentTelemetry: {
        o2Pct: o2,
        co2Pct: co2,
        pressureKpa,
        gravityG,
        ventilationSpeed,
        flameTempK,
        isIgnited,
      },
    });
    setPdfSavedRecently(true);
    setTimeout(() => setPdfSavedRecently(false), 2400);
  };

  const handleDismissGettingStarted = useCallback(() => {
    setShowGettingStarted(false);
    markOnboardingCompleted();
  }, []);

  useEffect(() => {
    if (!showGettingStarted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismissGettingStarted();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGettingStarted, handleDismissGettingStarted]);

  const progressPct =
    activeEvent && activeTimeLimitSec > 0
      ? Math.max(0, Math.min(100, (timeLeft / activeTimeLimitSec) * 100))
      : 0;

  const difficultyConfig = DRILL_DIFFICULTY_CONFIGS[difficulty];

  const activeOnboardingStep =
    GETTING_STARTED_STEPS[Math.min(gettingStartedStep, GETTING_STARTED_STEPS.length - 1)];

  return (
    <section
      aria-label="Interactive Chamber Safety Drill"
      className={`relative rounded-2xl border p-3.5 sm:p-4 font-mono text-xs transition-colors ${
        phase === 'active'
          ? 'bg-rose-950/35 border-rose-500/70'
          : phase === 'extinguished'
          ? 'bg-emerald-950/30 border-emerald-500/60'
          : phase === 'failed'
          ? 'bg-slate-950 border-rose-700/70'
          : 'bg-slate-950/90 border-slate-800'
      }`}
    >
      {/* STANDBY HEADER BAR & DIFFICULTY CONTROLS */}
      {phase === 'standby' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 shrink-0">
                <Siren className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">Live Chamber Safety Drill</h3>
                  <span className="text-[11px] text-slate-400">
                    · Cleared: <strong className="text-emerald-400 tabular-nums">{stats.cleared}</strong>
                    {bestOverallSec !== null && (
                      <>
                        {' '}
                        · Fastest: <strong className="text-cyan-300 tabular-nums">{bestOverallSec.toFixed(1)}s</strong>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Injects a random chamber emergency (pressure loss, O₂ surge, CH₄ leak) requiring live O₂/CO₂ &amp; airflow adjustment before the timer expires.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title={isAudioMuted ? 'Unmute Drill Audio Alerts' : 'Mute Drill Audio Alerts'}
                aria-label="Toggle drill audio"
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setGettingStartedStep(0);
                  setShowGettingStarted((prev) => !prev);
                }}
                aria-expanded={showGettingStarted}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  showGettingStarted
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/70'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
                title="Open Getting Started step-by-step guide for emergency drills"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Getting Started</span>
              </button>

              <button
                type="button"
                aria-expanded={isHighScoresOpen}
                onClick={() => setIsHighScoresOpen((o) => !o)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isHighScoresOpen
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
                title="View persisted fastest response rankings"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="tabular-nums">
                  High Scores{highScores.length > 0 ? ` (${highScores.length})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAfterActionReport}
                className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Download PDF After-Action Report summarizing emergency drill performance"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>{pdfSavedRecently ? 'PDF Saved' : 'After-Action Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleAutoArm}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  autoTriggerArmed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={`Arm a random surprise emergency (${difficultyConfig.surpriseMinSec}–${difficultyConfig.surpriseMaxSec}s delay on ${difficultyConfig.label})`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {autoTriggerArmed
                    ? `Surprise Anomaly Armed (${autoCountdown}s)`
                    : 'Arm Surprise Anomaly'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => triggerRandomDrill()}
                className={`px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap ${
                  showGettingStarted && gettingStartedStep === 0
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950'
                    : ''
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Trigger Random Emergency</span>
              </button>
            </div>
          </div>

          {/* Difficulty Selector & Random Event Frequency Bar */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2.5 text-[11px]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Difficulty:</span>
              </span>

              <div
                role="group"
                aria-label="Emergency drill difficulty selector"
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 gap-0.5"
              >
                {(['easy', 'normal', 'hard'] as DrillDifficulty[]).map((tier) => {
                  const cfg = DRILL_DIFFICULTY_CONFIGS[tier];
                  const isSelected = difficulty === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectDifficulty(tier)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                        isSelected
                          ? tier === 'hard'
                            ? 'bg-rose-600 text-white'
                            : tier === 'easy'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-slate-400 tabular-nums">{difficultyConfig.summary}</span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoChainEnabled}
              onClick={() => setAutoChainEnabled((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                autoChainEnabled
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically re-arm the next random emergency after restoring nominal 0-G"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Auto-Chain Events: {autoChainEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* GETTING STARTED OVERLAY TOOLTIP SEQUENCE */}
      {showGettingStarted && phase === 'standby' && (
        <div
          role="dialog"
          aria-label="Getting Started Emergency Drill Guide"
          className="mt-3 relative z-30 rounded-xl bg-slate-950 border border-cyan-500/60 p-3.5 sm:p-4 shadow-2xl"
        >
          {/* Pointer Caret */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -top-2 right-12 w-3.5 h-3.5 rotate-45 bg-slate-950 border-t border-l border-cyan-500/60"
          />

          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-bold tabular-nums">
                <span>{activeOnboardingStep.badge}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Step {gettingStartedStep + 1} of {GETTING_STARTED_STEPS.length}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{activeOnboardingStep.title}</h4>
            </div>

            <button
              type="button"
              onClick={handleDismissGettingStarted}
              aria-label="Close Getting Started guide"
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 flex flex-col gap-2 font-sans text-xs leading-relaxed text-slate-200">
            <p>{activeOnboardingStep.description}</p>
            <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2 flex items-center justify-between flex-wrap gap-2 font-mono text-[11px]">
              <span className="text-emerald-300 font-semibold">{activeOnboardingStep.actionCue}</span>
              <span className="text-cyan-300 tabular-nums">{activeOnboardingStep.targetSummary}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            {/* Step Progress Indicators */}
            <div className="flex items-center gap-1.5" aria-label="Guide progress">
              {GETTING_STARTED_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setGettingStartedStep(idx)}
                  aria-label={`Go to step ${idx + 1}: ${step.title}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === gettingStartedStep
                      ? 'w-6 bg-cyan-400'
                      : idx < gettingStartedStep
                      ? 'w-2.5 bg-emerald-500/80'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleDismissGettingStarted}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] transition-colors whitespace-nowrap"
              >
                Skip Guide
              </button>

              {gettingStartedStep > 0 && (
                <button
                  type="button"
                  onClick={() => setGettingStartedStep((s) => Math.max(0, s - 1))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {gettingStartedStep < GETTING_STARTED_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setGettingStartedStep((s) => Math.min(GETTING_STARTED_STEPS.length - 1, s + 1))
                  }
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDismissGettingStarted}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-[11px] font-bold transition-colors whitespace-nowrap"
                  >
                    Got It
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerRandomDrill()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Start First Drill</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ANOMALY CHALLENGE */}
      {phase === 'active' && activeEvent && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between flex-wrap gap-3 pb-2.5 border-b border-rose-500/30">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs flex-wrap">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {activeEvent.code} · {activeEvent.severity} EMERGENCY IN PROGRESS · {difficultyConfig.label.toUpperCase()} ({activeTimeLimitSec}s LIMIT)
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{activeEvent.title}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {activeEvent.briefing}
              </p>
            </div>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="text-right tabular-nums">
                <span className="block text-[10px] text-rose-300 uppercase">Time Remaining</span>
                <span
                  className={`text-2xl font-black ${
                    timeLeft <= 10 ? 'text-rose-400' : timeLeft <= 20 ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
              <button
                type="button"
                onClick={handleReturnToStandby}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px]"
              >
                Abort Drill
              </button>
            </div>
          </div>

          {/* Visual Remaining-Time Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span
                className={`font-bold ${
                  progressPct > 50
                    ? 'text-cyan-300'
                    : progressPct > 25
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {progressPct > 50
                  ? '● Containment Window Active'
                  : progressPct > 25
                  ? '▲ Caution: Half Time Elapsed'
                  : '✖ Critical: Extinguish Immediately'}
              </span>
              <span className="text-slate-300">
                <strong className="text-white">{timeLeft.toFixed(1)}s</strong> / {activeTimeLimitSec}s{' '}
                <span className="text-slate-400">({Math.round(progressPct)}%)</span>
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Emergency scenario remaining time"
              aria-valuemin={0}
              aria-valuemax={activeTimeLimitSec}
              aria-valuenow={Number(timeLeft.toFixed(1))}
              className="relative w-full h-3.5 rounded-lg bg-slate-900 border border-slate-700/80 overflow-hidden shadow-inner"
            >
              {/* Calibrated Quarter Reference Ticks */}
              <div className="absolute inset-y-0 left-1/4 w-px bg-slate-700/50 z-10 pointer-events-none" aria-hidden="true" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/60 z-10 pointer-events-none" aria-hidden="true" />
              <div className="absolute inset-y-0 left-3/4 w-px bg-slate-700/50 z-10 pointer-events-none" aria-hidden="true" />

              {/* Remaining Time Fill Bar */}
              <div
                className="h-full rounded-l-lg transition-all duration-200"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor:
                    progressPct > 50 ? '#06b6d4' : progressPct > 25 ? '#f59e0b' : '#ef4444',
                  boxShadow:
                    progressPct > 50
                      ? '0 0 10px rgba(6, 182, 212, 0.55)'
                      : progressPct > 25
                      ? '0 0 10px rgba(245, 158, 11, 0.55)'
                      : '0 0 12px rgba(239, 68, 68, 0.7)',
                }}
              />
            </div>
          </div>

          {/* Real-Time Containment Target Checklist with Interactive Gas/Physics Tooltips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs tabular-nums">
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 ${
                atmosQuenched
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900/80 border-rose-500/40 text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="block text-[10px] text-slate-400">Step 1 · Quench Atmosphere</span>
                  <span className="font-bold">
                    O₂ ≤ {activeEvent.targets.maxO2Pct}% or CO₂ ≥ {activeEvent.targets.altMinCo2Pct}%
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Now: O₂ {o2.toFixed(1)}% · CO₂ {co2.toFixed(1)}%
                    {(gases['CH4'] ?? 0) > 0 ? ` · CH₄ ${(gases['CH4'] ?? 0).toFixed(1)}%` : ''}
                    {(gases['CO'] ?? 0) > 0 ? ` · CO ${(gases['CO'] ?? 0).toFixed(1)}%` : ''}
                  </span>
                </div>
                {atmosQuenched ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/70">
                <ParameterTooltip
                  id="drill-tooltip-o2"
                  label="Why O₂?"
                  title="Oxygen (O₂) Oxidizer Concentration"
                  currentReadout={`Current: ${o2.toFixed(1)}% · Target: ≤ ${activeEvent.targets.maxO2Pct}%`}
                  mechanism="Oxygen sustains gas-phase chain reactions and sets the adiabatic flame temperature. Hyperoxic air (>23% O₂) sharply widens flammability limits and accelerates spread."
                  mitigationImpact={`Dropping O₂ to ≤ ${activeEvent.targets.maxO2Pct}% (via slider or N₂ purge) pushes the chamber below the Limiting Oxygen Index (LOI), starving the reaction until combustion collapses.`}
                />
                <ParameterTooltip
                  id="drill-tooltip-co2"
                  label="Why CO₂?"
                  title="Carbon Dioxide (CO₂) Inerting & Heat Sink"
                  currentReadout={`Current: ${co2.toFixed(1)}% · Target: ≥ ${activeEvent.targets.altMinCo2Pct}%`}
                  mechanism="CO₂ is non-combustible with high molar heat capacity, absorbing thermal energy from the reaction zone while physically diluting O₂ and free-radical density."
                  mitigationImpact={`Increasing CO₂ to ≥ ${activeEvent.targets.altMinCo2Pct}% cools the flame sheet below ignition sustainability and blankets the fuel without leaving conductive residue.`}
                />
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 ${
                airflowIsolated
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900/80 border-rose-500/40 text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="block text-[10px] text-slate-400">Step 2 · Isolate Ventilation</span>
                  <span className="font-bold">Airflow ≤ {activeEvent.targets.maxVentilationMs} m/s</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Now: {ventilationSpeed.toFixed(2)} m/s
                  </span>
                </div>
                {airflowIsolated ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/70">
                <ParameterTooltip
                  id="drill-tooltip-airflow"
                  label="Why Airflow?"
                  title="Forced Convection Ventilation Velocity"
                  currentReadout={`Current: ${ventilationSpeed.toFixed(2)} m/s · Target: ≤ ${activeEvent.targets.maxVentilationMs} m/s`}
                  mechanism="Without natural buoyancy in 0-G, HVAC airflow is the primary transport mechanism delivering fresh O₂ to the flame front and sweeping away insulating CO₂ exhaust."
                  mitigationImpact={`Cutting fans to ≤ ${activeEvent.targets.maxVentilationMs} m/s traps combustion products around the flame boundary layer, forcing self-suffocation while halting smoke propagation.`}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Live Chamber Telemetry</span>
                  <span className="text-amber-300 font-bold">{isIgnited ? `${flameTempK} K` : '298 K'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  P: <strong className="text-white">{pressureKpa.toFixed(1)} kPa</strong> ·{' '}
                  G: <strong className="text-white">{gravityG.toFixed(1)}g</strong>
                </div>
                <div className="text-[10px] text-cyan-300 mt-1">
                  Tip: Use the O₂/CO₂/Airflow sliders below or Purge N₂!
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/70">
                <ParameterTooltip
                  id="drill-tooltip-telemetry"
                  label="Pressure / G / Trace Gases"
                  title="Pressure, Gravity & Fuel-Gas Dynamics"
                  currentReadout={`P: ${pressureKpa.toFixed(1)} kPa · G: ${gravityG.toFixed(1)}g · Temp: ${isIgnited ? `${flameTempK} K` : '298 K'}`}
                  mechanism={
                    (gases['CH4'] ?? 0) > 0
                      ? 'Methane (CH₄) is a fast-diffusing gaseous fuel whose wide flammability envelope intensifies when paired with elevated O₂ and cabin airflow.'
                      : (gases['CO'] ?? 0) > 0
                      ? 'Carbon monoxide (CO) is both toxic and flammable; forced cabin drafts disperse hot aerosols and toxic volatiles across adjacent racks.'
                      : 'Partial pressure determines molecular collision frequency at the flame front, while higher G-load drives buoyant chimney drafts that pull fresh O₂ inward.'
                  }
                  mitigationImpact="Displacing oxidizer with N₂ or CO₂ while shutting off fans neutralizes high-pressure, methane, CO, and hypergravity fire plumes alike."
                  align="right"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY: RISK EXTINGUISHED WITHIN TIME LIMIT */}
      {phase === 'extinguished' && activeEvent && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-emerald-400 font-bold text-xs">
                <span>RISK EXTINGUISHED · {activeEvent.code} CONTAINED</span>
                <span className="text-slate-400">·</span>
                <span className="text-white tabular-nums">
                  Resolved in {(lastClearSummary?.responseTimeSec ?? elapsedSec).toFixed(1)}s
                </span>
                {lastClearSummary?.recordType === 'overall' && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-amber-300 font-bold">★ New Overall Fastest Record</span>
                  </>
                )}
                {lastClearSummary?.recordType === 'scenario' && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-cyan-300 font-bold">★ New Scenario Record</span>
                  </>
                )}
                {lastClearSummary?.rank !== null && lastClearSummary?.rank !== undefined && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 tabular-nums">Ranked #{lastClearSummary.rank}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Chamber stabilized ({o2.toFixed(1)}% O₂, {co2.toFixed(1)}% CO₂, {ventilationSpeed.toFixed(2)} m/s airflow). Total cleared: {stats.cleared}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              type="button"
              aria-expanded={isHighScoresOpen}
              onClick={() => setIsHighScoresOpen((o) => !o)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isHighScoresOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">High Scores ({highScores.length})</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAfterActionReport}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Generate and download PDF After-Action Report for this drill"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{pdfSavedRecently ? 'PDF Saved' : 'After-Action Report (PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={() => triggerRandomDrill()}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Next Random Emergency</span>
            </button>
            <button
              type="button"
              onClick={handleReturnToStandby}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restore Nominal 0-G</span>
            </button>
          </div>
        </div>
      )}

      {/* FAILURE: TIME LIMIT EXPIRED */}
      {phase === 'failed' && activeEvent && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span>TIME EXPIRED · {activeEvent.code} UNCONTAINED</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{activeEvent.hint}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              type="button"
              aria-expanded={isHighScoresOpen}
              onClick={() => setIsHighScoresOpen((o) => !o)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isHighScoresOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">High Scores ({highScores.length})</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAfterActionReport}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Generate and download PDF After-Action Report for this drill"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{pdfSavedRecently ? 'PDF Saved' : 'After-Action Report (PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={() => triggerRandomDrill(activeEvent.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Same Anomaly</span>
            </button>
            <button
              type="button"
              onClick={() => triggerRandomDrill()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Try Another</span>
            </button>
            <button
              type="button"
              onClick={handleReturnToStandby}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-colors whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE PERSISTED TOP 5 HIGH SCORES BOARD */}
      {isHighScoresOpen && phase !== 'active' && (
        <div
          aria-label="Emergency Drill High Scores Board"
          className="mt-3.5 pt-3.5 border-t border-slate-800 flex flex-col gap-3.5"
        >
          <DrillLeaderboard
            entries={highScores}
            highlightedEntryId={lastClearSummary?.entryId ?? null}
            stats={stats}
            onClearHistory={handleResetHighScores}
            onExportPdf={handleDownloadAfterActionReport}
            pdfSavedRecently={pdfSavedRecently}
            onHide={() => setIsHighScoresOpen(false)}
          />

          {/* Per-Scenario Fastest Time Benchmarks */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-2">
              Fastest Clear by Anomaly Scenario ({difficultyConfig.label} Limits)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 tabular-nums">
              {LIVE_SAFETY_DRILL_EVENTS.map((ev, idx) => {
                const best = bestByScenario.get(ev.id);
                const scaledScenarioLimit = getScaledTimeLimit(ev.timeLimitSec, difficulty);
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl bg-slate-900/75 border border-slate-800 p-2.5 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-cyan-300 font-bold">{ev.code}</span>
                        <span className="text-slate-400">Limit {scaledScenarioLimit}s</span>
                      </div>
                      <div className="text-[11px] text-slate-200 font-semibold mt-0.5 line-clamp-2 leading-snug">
                        {ev.title}
                      </div>
                      <div className="mt-1.5">
                        <ParameterTooltip
                          id={`scenario-tooltip-${ev.id}`}
                          label="Gas Params"
                          title={`${ev.code} Parameter Mitigation`}
                          currentReadout={`Injects ${ev.injectState.o2Pct}% O₂ · ${ev.injectState.pressureKpa} kPa · ${ev.injectState.ventilationSpeed} m/s`}
                          mechanism={ev.briefing}
                          mitigationImpact={ev.hint}
                          align={idx >= 3 ? 'right' : 'left'}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                      <div>
                        <span className="block text-[10px] text-slate-400">Best</span>
                        <span className={`font-bold text-xs ${best ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {best ? `${best.responseTimeSec.toFixed(1)}s` : '—'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerRandomDrill(ev.id)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                        title={`Launch ${ev.code}`}
                      >
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

