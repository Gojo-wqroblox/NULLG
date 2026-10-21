import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafetyDrillEvent,
  SAFETY_DRILL_EVENTS,
} from '../data/safetyDrillEvents';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  Award,
  RotateCcw,
  X,
  Wind,
  Flame,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { FuelDefinition } from '../types';

export interface RoundResult {
  event: SafetyDrillEvent;
  cleared: boolean;
  reactionTimeSeconds: number;
}

interface SafetyDrillHUDProps {
  isActive: boolean;
  onClose: () => void;
  gases: Record<string, number>;
  onGasChange: (gasId: string, val: number) => void;
  pressureKpa: number;
  onPressureChange: (val: number) => void;
  ventilationSpeed: number;
  onVentilationChange: (val: number) => void;
  selectedFuel: FuelDefinition;
  onFuelChange: (fuel: FuelDefinition) => void;
  onPurgeN2: () => void;
  onCutFans: () => void;
  onIgniteFlame: () => void;
  allFuels: FuelDefinition[];
}

export const SafetyDrillHUD: React.FC<SafetyDrillHUDProps> = ({
  isActive,
  onClose,
  gases,
  onGasChange,
  pressureKpa,
  onPressureChange,
  ventilationSpeed,
  onVentilationChange,
  selectedFuel,
  onFuelChange,
  onPurgeN2,
  onCutFans,
  onIgniteFlame,
  allFuels,
}) => {
  // Drill State
  const [drillRounds, setDrillRounds] = useState<SafetyDrillEvent[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [drillFinished, setDrillFinished] = useState<boolean>(false);
  const [roundCompletedStatus, setRoundCompletedStatus] = useState<'cleared' | 'failed' | null>(null);

  // Timers and stopwatch
  const roundStartTimeRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);
  const hasTriggeredResultRef = useRef<boolean>(false);

  // Sound chimes using Web Audio API
  const playChime = useCallback((type: 'success' | 'fail' | 'start' | 'tick') => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.56);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(240, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.41);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.31);
      }
    } catch {
      // Audio autoplay safe
    }
  }, []);

  // Initialize a new randomized drill session
  const startNewDrill = useCallback(() => {
    // Shuffle and pick 4 distinct events
    const shuffled = [...SAFETY_DRILL_EVENTS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    setDrillRounds(selected);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setDrillFinished(false);
    setRoundCompletedStatus(null);
    hasTriggeredResultRef.current = false;

    // Start round 0
    loadRound(selected[0]);
    playChime('start');
  }, [playChime]);

  // Load a specific round event
  const loadRound = useCallback((event: SafetyDrillEvent) => {
    hasTriggeredResultRef.current = false;
    setRoundCompletedStatus(null);
    setTimeLeft(event.durationSeconds);
    setIsRoundActive(true);
    roundStartTimeRef.current = performance.now();

    // Inject initial emergency state into main simulation
    Object.entries(event.initialState.gases).forEach(([gasId, val]) => {
      onGasChange(gasId, val);
    });
    onPressureChange(event.initialState.pressureKpa);
    onVentilationChange(event.initialState.ventilationSpeed);

    // Set appropriate fuel if defined
    if (event.initialState.fuelId) {
      const matchFuel = allFuels.find((f) => f.id === event.initialState.fuelId);
      if (matchFuel) onFuelChange(matchFuel);
    }

    // Ensure flame is ignited so fire dynamics respond immediately
    onIgniteFlame();
  }, [onGasChange, onPressureChange, onVentilationChange, onFuelChange, onIgniteFlame, allFuels]);

  // Start drill when component mounts or isActive becomes true
  useEffect(() => {
    if (isActive) {
      startNewDrill();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRoundActive(false);
    }
  }, [isActive]);

  // Active round countdown interval
  useEffect(() => {
    if (!isRoundActive || drillFinished || !drillRounds[currentRoundIndex]) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time expired -> Round Failed
          handleRoundFinish(false);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRoundActive, drillFinished, currentRoundIndex, drillRounds]);

  // Check target conditions continuously as user changes gas sliders
  const currentEvent = drillRounds[currentRoundIndex];

  useEffect(() => {
    if (!isRoundActive || drillFinished || !currentEvent || hasTriggeredResultRef.current) return;

    const allPassed = currentEvent.targets.every((t) =>
      t.check({ gases, pressureKpa, ventilationSpeed, fuelId: selectedFuel.id })
    );

    if (allPassed) {
      handleRoundFinish(true);
    }
  }, [gases, pressureKpa, ventilationSpeed, selectedFuel.id, isRoundActive, drillFinished, currentEvent]);

  // Finish a round (either cleared or failed)
  const handleRoundFinish = (cleared: boolean) => {
    if (hasTriggeredResultRef.current) return;
    hasTriggeredResultRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const elapsed = (performance.now() - roundStartTimeRef.current) / 1000;
    const finalReactionTime = cleared ? Number(elapsed.toFixed(2)) : currentEvent.durationSeconds;

    setRoundCompletedStatus(cleared ? 'cleared' : 'failed');
    playChime(cleared ? 'success' : 'fail');

    const result: RoundResult = {
      event: currentEvent,
      cleared,
      reactionTimeSeconds: finalReactionTime,
    };

    setRoundResults((prev) => [...prev, result]);

    // Delay briefly to show victory/fail banner, then advance to next round
    setTimeout(() => {
      if (currentRoundIndex + 1 < drillRounds.length) {
        setCurrentRoundIndex((prev) => prev + 1);
        loadRound(drillRounds[currentRoundIndex + 1]);
      } else {
        // All rounds complete -> Display final scorecard
        setDrillFinished(true);
        setIsRoundActive(false);
      }
    }, 1800);
  };

  if (!isActive) return null;

  // Calculate Debrief Metrics
  const totalRounds = drillRounds.length || 4;
  const clearedCount = roundResults.filter((r) => r.cleared).length;
  const successRatePct = Math.round((clearedCount / (totalRounds || 1)) * 100);

  const clearedTimes = roundResults.filter((r) => r.cleared).map((r) => r.reactionTimeSeconds);
  const avgReactionTime =
    clearedTimes.length > 0
      ? Number((clearedTimes.reduce((a, b) => a + b, 0) / clearedTimes.length).toFixed(2))
      : 0;

  const bestReactionTime =
    clearedTimes.length > 0 ? Number(Math.min(...clearedTimes).toFixed(2)) : 0;

  // Astronaut Performance Grade
  let grade = 'B';
  let gradeColor = 'text-cyan-400';
  let gradeTitle = 'Certified Space Station Crew';
  let gradeBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

  if (successRatePct === 100 && avgReactionTime > 0 && avgReactionTime <= 8.5) {
    grade = 'S';
    gradeColor = 'text-amber-300';
    gradeTitle = 'Elite Flight Commander';
    gradeBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20';
  } else if (successRatePct >= 75 && avgReactionTime <= 13.0) {
    grade = 'A';
    gradeColor = 'text-emerald-400';
    gradeTitle = 'Senior Flight Specialist';
    gradeBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20';
  } else if (successRatePct >= 50) {
    grade = 'C';
    gradeColor = 'text-yellow-400';
    gradeTitle = 'Cadet In Training';
    gradeBadge = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  } else {
    grade = 'D';
    gradeColor = 'text-rose-400';
    gradeTitle = 'Cabin Evacuation Required';
    gradeBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }

  // Quick Action Helpers
  const handleQuickNovec = () => {
    onGasChange('Novec', Math.min(25, (gases.Novec || 0) + 7));
  };

  const handleQuickPurgeN2 = () => {
    onPurgeN2();
  };

  const handleQuickCutFans = () => {
    onCutFans();
  };

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* DOCKED ACTIVE DRILL HUD BANNER (Full user access to Gas Mixer below) */}
      {/* ------------------------------------------------------------------- */}
      {!drillFinished && currentEvent && (
        <aside aria-label="Active emergency drill monitor" className="w-full rounded-2xl bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-2 border-rose-500/70 p-3.5 sm:p-4 shadow-2xl shadow-rose-950/60 backdrop-blur-xl animate-fadeIn transition-all">
          {/* Top Bar: Emergency Indicator, Round Counter, and Countdown Timer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-900/50">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-rose-300 font-mono uppercase">
                  🚨 SAFETY DRILL ACTIVE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-200 border border-rose-700/60">
                  ROUND {currentRoundIndex + 1} OF {totalRounds}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {currentEvent.badge}
                </span>
              </div>
            </div>

            {/* Countdown Timer with Animated Radial/Linear Bar */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-rose-900/60">
                <Timer className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span className="text-xs font-mono text-slate-300">Countdown:</span>
                <span
                  className={`text-sm font-mono font-black ${
                    timeLeft <= 6 ? 'text-rose-400 animate-pulse' : timeLeft <= 12 ? 'text-amber-300' : 'text-emerald-400'
                  }`}
                >
                  {timeLeft.toFixed(1)}s
                </span>
              </div>

              {/* Abort button */}
              <button
                onClick={onClose}
                title="Abort Safety Drill"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scenario Details & Live Objective Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-3">
            {/* Left: Event Narrative & Tactical Tip (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  {currentEvent.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {currentEvent.description}
                </p>
                <p className="text-[10px] text-slate-400 italic mt-1 border-l-2 border-slate-700 pl-2">
                  📜 {currentEvent.historicalContext}
                </p>
              </div>

              {/* Tactical Hint */}
              <div className="p-2 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                <span className="text-cyan-400 font-bold mr-1">💡 PROTOCOL:</span>
                {currentEvent.tacticalHint}
              </div>
            </div>

            {/* Right: Live Targets Checklist & Quick Actions (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between gap-2.5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  ACTION OBJECTIVES (Correct via Gas Mixer below):
                </span>
                {currentEvent.targets.map((target) => {
                  const isPassed = target.check({ gases, pressureKpa, ventilationSpeed, fuelId: selectedFuel.id });
                  const currentVal = target.getCurrentValueString({ gases, pressureKpa, ventilationSpeed });

                  return (
                    <div
                      key={target.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs font-mono transition-all ${
                        isPassed
                          ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex items-center justify-center shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          </div>
                        )}
                        <span className={isPassed ? 'line-through text-slate-400 font-normal' : 'font-medium'}>
                          {target.label}
                        </span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded ${isPassed ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-amber-300 font-bold'}`}>
                        {currentVal}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Action Emergency Shortcuts */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-slate-400">Quick Extinguish:</span>
                <button
                  onClick={handleQuickPurgeN2}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[10px] font-mono font-medium transition-all active:scale-95 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Purge N₂
                </button>
                <button
                  onClick={handleQuickNovec}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[10px] font-mono font-medium transition-all active:scale-95 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" /> Inject Novec (+7%)
                </button>
                <button
                  onClick={handleQuickCutFans}
                  disabled={ventilationSpeed === 0}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 disabled:opacity-40 text-amber-200 border border-amber-500/40 text-[10px] font-mono font-medium transition-all active:scale-95 flex items-center gap-1"
                >
                  <Wind className="w-3 h-3" /> Cut Fans (0 m/s)
                </button>
              </div>
            </div>
          </div>

          {/* Round Clear / Fail Overlay Message */}
          {roundCompletedStatus && (
            <div
              className={`mt-3 p-3 rounded-xl border text-center font-mono font-bold text-sm animate-bounce flex items-center justify-center gap-2 ${
                roundCompletedStatus === 'cleared'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500 text-rose-200'
              }`}
            >
              {roundCompletedStatus === 'cleared' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>EMERGENCY NEUTRALIZED! Next event incoming...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>ATMOSPHERE BREACH! Proceeding to next round...</span>
                </>
              )}
            </div>
          )}
        </aside>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FINAL DRILL DEBRIEF & SCORECARD MODAL                                */}
      {/* ------------------------------------------------------------------- */}
      {drillFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl shadow-cyan-950/50 flex flex-col gap-5 overflow-hidden relative">
            {/* Ambient Corner Flare */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono text-white tracking-wide flex items-center gap-2">
                    SAFETY DRILL DEBRIEF
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    NASA Subsystem Fire Response Evaluation Card
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Astronaut Flight Rating Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black font-mono text-4xl shadow-lg ${gradeBadge}`}>
                  {grade}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                    ASTRONAUT READINESS RATING
                  </span>
                  <h4 className={`text-lg font-bold font-mono ${gradeColor}`}>
                    {gradeTitle}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {grade === 'S'
                      ? 'Flawless lightning-fast atmosphere stabilization! Mission Commander qualified.'
                      : grade === 'A'
                      ? 'Exceptional chemical mitigation and aerodynamic convection handling.'
                      : grade === 'B'
                      ? 'Solid recovery performance under dangerous spacecraft fire scenarios.'
                      : 'Atmosphere breach occurred. Practice gas scrub protocols to improve reaction time.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Success Rate</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                  {successRatePct}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {clearedCount} of {totalRounds} Cleared
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Avg Reaction</span>
                <span className="text-xl font-bold font-mono text-cyan-300 mt-0.5 block">
                  {avgReactionTime > 0 ? `${avgReactionTime}s` : 'N/A'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Response speed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Fastest Clear</span>
                <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block">
                  {bestReactionTime > 0 ? `${bestReactionTime}s` : 'N/A'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Personal best
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Drill Score</span>
                <span className="text-xl font-bold font-mono text-indigo-300 mt-0.5 block">
                  {clearedCount * 100} PTS
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Max: {totalRounds * 100}
                </span>
              </div>
            </div>

            {/* Round-by-Round Log */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                MISSION DRILL LOG:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {roundResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      {r.cleared ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-white block">
                          R{idx + 1}: {r.event.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.event.badge}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold block ${r.cleared ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r.cleared ? 'NEUTRALIZED' : 'EXPIRED'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r.reactionTimeSeconds.toFixed(2)}s reaction
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold transition-all"
              >
                Return to Console
              </button>
              <button
                onClick={startNewDrill}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Run New Safety Drill
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
