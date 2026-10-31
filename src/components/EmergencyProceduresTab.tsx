import React, { useState, useEffect, useRef } from 'react';
import {
  EmergencyScenario,
  NASA_EMERGENCY_SCENARIOS,
  SUPPRESSION_AGENTS,
  CONTAINMENT_ACTIONS,
  POST_FIRE_ACTIONS,
  getRandomScenario,
  SuppressionAgent,
} from '../data/emergencyScenarios';
import {
  playKlaxonAlarm,
  playGasDischargeHiss,
  playSuccessChime,
  playFailureBuzz,
} from '../utils/emergencyAudio';
import {
  AlertTriangle,
  Flame,
  Shield,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Thermometer,
  Wind,
  Zap,
  Radio,
  FileText,
  Activity,
  Award,
  ArrowRight,
  ShieldAlert,
  Siren,
  BookOpen,
} from 'lucide-react';
import { EmergencyInstructionsDashboard } from './EmergencyInstructionsDashboard';

interface EmergencyProceduresTabProps {
  onSimulateInChamber: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa: number;
  }) => void;
}

interface EvaluationResult {
  score: number;
  isExtinguished: boolean;
  status: 'SUCCESS' | 'SUBOPTIMAL' | 'CATASTROPHIC_FAILURE';
  containmentFeedback: { pass: boolean; note: string };
  agentFeedback: { pass: boolean; isLethal: boolean; note: string };
  postActionFeedback: { pass: boolean; note: string };
  summary: string;
}

export const EmergencyProceduresTab: React.FC<EmergencyProceduresTabProps> = ({
  onSimulateInChamber,
}) => {
  // Scenario state
  const [currentScenario, setCurrentScenario] = useState<EmergencyScenario>(
    NASA_EMERGENCY_SCENARIOS[0]
  );
  const [selectedContainment, setSelectedContainment] = useState<string>('cut_vent_and_power');
  const [selectedAgent, setSelectedAgent] = useState<string>('co2');
  const [selectedPostAction, setSelectedPostAction] = useState<string>('pba_tccs');

  // Execution & feedback state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isDischarging, setIsDischarging] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Sound & Timer
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(currentScenario.timeLimitSec);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [isInstructionsDashboardOpen, setIsInstructionsDashboardOpen] = useState<boolean>(false);

  // Astronaut Career Stats
  const [stats, setStats] = useState({
    attempts: 0,
    successes: 0,
    streak: 0,
    highScore: 0,
  });

  // Countdown timer effect
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(currentScenario.timeLimitSec);
    setTimerRunning(true);
    setIsSubmitted(false);
    setEvaluation(null);
    setSelectedContainment('cut_vent_and_power');
    setSelectedAgent('co2');
    setSelectedPostAction('pba_tccs');
  }, [currentScenario]);

  useEffect(() => {
    if (!timerRunning || isSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, isSubmitted, currentScenario]);

  // When time runs out before action
  const handleAutoTimeout = () => {
    if (isSubmitted) return;
    executeAction(true);
  };

  // Switch to a new randomized scenario
  const handleNewRandomScenario = () => {
    const next = getRandomScenario(currentScenario.id);
    setCurrentScenario(next);
    if (!isMuted) {
      playKlaxonAlarm();
    }
  };

  // Select specific scenario from dropdown
  const handleSelectScenario = (id: string) => {
    const found = NASA_EMERGENCY_SCENARIOS.find((s) => s.id === id);
    if (found) {
      setCurrentScenario(found);
      if (!isMuted) {
        playKlaxonAlarm();
      }
    }
  };

  // Evaluate the astronaut's emergency response
  const executeAction = (isTimeout: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setIsDischarging(true);

    if (!isMuted) {
      playGasDischargeHiss();
    }

    setTimeout(() => {
      setIsDischarging(false);
      setIsSubmitted(true);

      if (isTimeout) {
        const timeoutEval: EvaluationResult = {
          score: 15,
          isExtinguished: false,
          status: 'CATASTROPHIC_FAILURE',
          containmentFeedback: {
            pass: false,
            note: 'Time Expired! In microgravity, delayed action allowed flame spread through ventilation ducts.',
          },
          agentFeedback: {
            pass: false,
            isLethal: false,
            note: 'No suppressant was discharged before fire breached the rack enclosure.',
          },
          postActionFeedback: {
            pass: false,
            note: 'Atmosphere contaminated with dense carbon monoxide and toxic pyrolysis volatiles.',
          },
          summary: 'Critical Station Emergency: Containment was delayed, triggering automated module isolation.',
        };
        setEvaluation(timeoutEval);
        if (!isMuted) playFailureBuzz();
        setStats((prev) => ({
          ...prev,
          attempts: prev.attempts + 1,
          streak: 0,
        }));
        return;
      }

      // Check containment
      const containmentPassed = currentScenario.correctContainmentIds.includes(selectedContainment);
      let containmentNote = '';
      if (containmentPassed) {
        containmentNote = 'Excellent: Ventilation cut eliminated forced convective oxygen flow to the flame front.';
      } else if (selectedContainment === 'leave_vent_on') {
        containmentNote = 'Major Error: Leaving ventilation ON fed fresh O₂ to the 0-G flame and pumped toxic smoke across the station!';
      } else {
        containmentNote = 'Partial: Cutting ventilation was critical, but electrical isolation should be paired to prevent continuous Joule heating.';
      }

      // Check suppressant agent
      const isRecommended = selectedAgent === currentScenario.recommendedAgentId;
      const isAcceptable = currentScenario.acceptableAgentIds.includes(selectedAgent);
      const lethalRecord = currentScenario.lethalAgentIds.find((l) => l.agentId === selectedAgent);

      let agentNote = '';
      let isLethal = false;
      let agentPassed = false;

      if (lethalRecord) {
        isLethal = true;
        agentPassed = false;
        agentNote = `CRITICAL HAZARD: ${lethalRecord.reason}`;
      } else if (isRecommended) {
        agentPassed = true;
        agentNote = `Optimal Choice: ${
          SUPPRESSION_AGENTS.find((a) => a.id === selectedAgent)?.name
        } is the exact recommended flight protocol for this fire class.`;
      } else if (isAcceptable) {
        agentPassed = true;
        agentNote = `Effective, but Suboptimal: ${
          SUPPRESSION_AGENTS.find((a) => a.id === selectedAgent)?.name
        } will quench the flame, but is less suitable than the primary standard.`;
      } else {
        agentPassed = false;
        agentNote = `Ineffective Suppressant: Does not match the combustion physics of this fuel/oxidizer configuration.`;
      }

      // Check post-fire action
      const postActionPassed = selectedPostAction === currentScenario.correctPostActionId;
      let postNote = '';
      if (postActionPassed) {
        postNote = 'Correct: Crew preserved lung safety and utilized TCCS/LiOH scrubbers to clear combustion toxins.';
      } else if (selectedPostAction === 'open_hatch_immediately') {
        postNote = 'Safety Breach: Opening hatches without testing atmosphere exposes adjoining module crew to lethal CO & HF.';
      } else {
        postNote = 'Unnecessary overboard dump: Cabin atmosphere could have been reclaimed via scrubbers.';
      }

      // Calculate score & status
      let score = 0;
      if (containmentPassed) score += 35;
      else if (selectedContainment !== 'leave_vent_on') score += 15;

      if (isRecommended) score += 45;
      else if (isAcceptable) score += 30;

      if (postActionPassed) score += 20;

      if (isLethal) score = Math.min(score, 15);

      const isExtinguished = !isLethal && (isRecommended || isAcceptable) && containmentPassed;
      const status: 'SUCCESS' | 'SUBOPTIMAL' | 'CATASTROPHIC_FAILURE' = isLethal
        ? 'CATASTROPHIC_FAILURE'
        : isExtinguished && score >= 80
        ? 'SUCCESS'
        : 'SUBOPTIMAL';

      const result: EvaluationResult = {
        score,
        isExtinguished,
        status,
        containmentFeedback: { pass: containmentPassed, note: containmentNote },
        agentFeedback: { pass: agentPassed, isLethal, note: agentNote },
        postActionFeedback: { pass: postActionPassed, note: postNote },
        summary:
          status === 'SUCCESS'
            ? `Fire successfully suppressed! Station atmosphere stabilized with ${score}% flight rating.`
            : status === 'SUBOPTIMAL'
            ? `Fire extinguished with warnings. Residual damage or post-procedure contamination detected.`
            : `Catastrophic Incident: Incorrect suppression procedure caused secondary escalation.`,
      };

      setEvaluation(result);

      if (status === 'SUCCESS') {
        if (!isMuted) playSuccessChime();
        setStats((prev) => ({
          attempts: prev.attempts + 1,
          successes: prev.successes + 1,
          streak: prev.streak + 1,
          highScore: Math.max(prev.highScore, score),
        }));
      } else {
        if (!isMuted) playFailureBuzz();
        setStats((prev) => ({
          attempts: prev.attempts + 1,
          successes: prev.successes,
          streak: 0,
          highScore: prev.highScore,
        }));
      }
    }, 900);
  };

  // Rank title based on streak / successes
  const getAstronautRank = () => {
    if (stats.successes >= 10 && stats.streak >= 5) return 'ISS Station Commander';
    if (stats.successes >= 6) return 'Senior Fire Safety Specialist';
    if (stats.successes >= 3) return 'Flight Engineer 1';
    if (stats.successes >= 1) return 'Astronaut Candidate';
    return 'Trainee';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner: Emergency Command & Stats Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900/90 to-amber-950/30 border border-red-900/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                SPACECRAFT FIRE EMERGENCY PROCEDURES
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-red-900/60 text-red-300 border border-red-700 animate-pulse">
                DRILL ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive NASA Flight Rule A13-1 fire response trainer & suppression gas challenge
            </p>
          </div>
        </div>

        {/* Drill Controls & Sound */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
              isMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:border-cyan-500'
            }`}
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio ON'}</span>
          </button>

          <button
            onClick={() => playKlaxonAlarm()}
            className="p-2 px-3 rounded-xl border border-red-500/50 bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Test High-Power Emergency Siren"
          >
            <Siren className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Test Siren</span>
          </button>

          <button
            onClick={handleNewRandomScenario}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random Scenario</span>
          </button>

          {/* Instructions & Safety Dashboard Trigger Button */}
          <button
            onClick={() => setIsInstructionsDashboardOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-400/70 hover:border-cyan-300 text-cyan-200 hover:text-white text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-2 group ring-1 ring-cyan-500/30"
            title="Open Astronaut Safety & Simulator Instructions Dashboard"
          >
            <BookOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Instructions &amp; Safety Dashboard</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          </button>

          {/* Scenario Selector Dropdown */}
          <select
            value={currentScenario.id}
            onChange={(e) => handleSelectScenario(e.target.value)}
            className="bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 cursor-pointer focus:outline-none transition-all"
          >
            {NASA_EMERGENCY_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Instructions & Safety Dashboard Modal */}
      <EmergencyInstructionsDashboard
        isOpen={isInstructionsDashboardOpen}
        onClose={() => setIsInstructionsDashboardOpen(false)}
        onSimulateInChamber={onSimulateInChamber}
        onTestAudio={playKlaxonAlarm}
        onTriggerRandomScenario={handleNewRandomScenario}
      />

      {/* Main Grid: Scenario Telemetry (Left) + Interactive Procedure Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Tactical Scenario Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Scenario Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                {currentScenario.moduleName}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  currentScenario.urgency === 'EXTREME'
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : currentScenario.urgency === 'CRITICAL'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-blue-950 text-blue-300 border-blue-700'
                }`}
              >
                URGENCY: {currentScenario.urgency}
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-mono leading-snug">
              {currentScenario.title}
            </h3>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              {currentScenario.incidentSummary}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>Fire Classification:</span>
              <span className="font-bold text-amber-400">{currentScenario.fireClass}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Fuel Source:</span>
              <span className="font-semibold text-slate-200">{currentScenario.environment.fuelName}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Compartment Location:</span>
              <span className="font-semibold text-slate-200">{currentScenario.location}</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Unsure of proper protocol?</span>
              <button
                onClick={() => setIsInstructionsDashboardOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                title="View full safety procedures and instructions dashboard"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Instructions Dashboard</span>
              </button>
            </div>
          </div>

          {/* Sensor Readout Telemetry Panel */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                CABIN ENVIRONMENT & SENSOR READOUTS
              </span>
              <span className="text-[10px] font-mono text-emerald-400">TELEMETRY STREAMING</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" /> Oxygen (O₂)
                </span>
                <span className={`text-base font-bold ${currentScenario.environment.o2Pct > 25 ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {currentScenario.environment.o2Pct.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500">
                  {currentScenario.environment.o2Pct > 25 ? 'Hyperoxic Hazard!' : 'Nominal Cabin O₂'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-indigo-400" /> Airflow Draft
                </span>
                <span className="text-base font-bold text-indigo-300">
                  {currentScenario.environment.ventilationMps.toFixed(2)} m/s
                </span>
                <span className="text-[9px] text-slate-500">
                  {currentScenario.environment.ventilationMps > 0 ? 'Forced Recirc Fan Active' : 'Stagnant (0 Draft)'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" /> Core Rack Temp
                </span>
                <span className="text-base font-bold text-amber-300">
                  {currentScenario.sensorData.tempC}°C
                </span>
                <span className="text-[9px] text-slate-500">
                  {currentScenario.sensorData.tempC > 200 ? 'Exothermic Thermal Spike' : 'Elevated Pyrolysis'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex flex-col">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-400" /> CO & Smoke Obsc.
                </span>
                <span className="text-base font-bold text-rose-300">
                  {currentScenario.sensorData.coPpm} ppm
                </span>
                <span className="text-[9px] text-slate-500">
                  {currentScenario.sensorData.obscurationPct}% Optical Obscuration
                </span>
              </div>
            </div>

            {/* Gravity & Pressure */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Gravitational Vector:</span>
              <span className="text-white font-bold">
                {currentScenario.environment.gravityG === 0
                  ? '0.00 G (Zero-G Microgravity)'
                  : `${currentScenario.environment.gravityG} G (Partial Thrust)`}
              </span>
            </div>

            {/* Thermal Camera Note */}
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1 font-mono">
              <span className="text-cyan-400 font-semibold">IR Thermal Camera:</span>
              <span>{currentScenario.sensorData.thermalCamera}</span>
              <span className="text-slate-500 text-[10px]">
                Spectral: {currentScenario.sensorData.spectralPeak}
              </span>
            </div>
          </div>

          {/* Career Stats & Rank */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-bold">{getAstronautRank()}</div>
                <div className="text-[10px] text-slate-400">
                  Solved: {stats.successes}/{stats.attempts} • Streak: {stats.streak}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onSimulateInChamber({
                  gravityG: currentScenario.environment.gravityG,
                  o2Pct: currentScenario.environment.o2Pct,
                  co2Pct: currentScenario.environment.co2Pct,
                  ventilationSpeed: currentScenario.environment.ventilationMps,
                  fuelName: currentScenario.environment.fuelName,
                  pressureKpa: currentScenario.environment.pressureKpa,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
              title="Load these environmental conditions into the 3D Flame Chamber"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Test in 3D Sim</span>
            </button>
          </div>
        </div>

        {/* Right Column: Step-by-Step Interactive Action Console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl flex flex-col gap-4">
            {/* Header with countdown timer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                  FL
                </span>
                <h3 className="text-sm font-bold text-white font-mono">
                  EMERGENCY ACTION CONSOLE (FLIGHT RULE A13-1)
                </h3>
              </div>

              {/* Urgency countdown indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold border transition-all ${
                  timeLeft <= 10
                    ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>RESPONSE WINDOW: {timeLeft}s</span>
              </div>
            </div>

            {/* STEP 1: AIRFLOW & POWER ISOLATION */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  STEP 1: HAZARD ISOLATION & AIRFLOW CONTROL
                </span>
                <span className="text-[10px] text-slate-400">Critical in Microgravity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CONTAINMENT_ACTIONS.map((action) => {
                  const isSelected = selectedContainment === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedContainment(action.id)}
                      disabled={isSubmitted || isDischarging}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                          : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      } ${isSubmitted ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold">{action.label}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{action.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: SELECT SUPPRESSION AGENT */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  STEP 2: SELECT THE CORRECT SUPPRESSION GAS / AGENT
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  Match Agent to Fire Chemistry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SUPPRESSION_AGENTS.map((agent: SuppressionAgent) => {
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      disabled={isSubmitted || isDischarging}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-950/80 to-indigo-950/70 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                          : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      } ${isSubmitted ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold leading-tight flex items-center gap-1">
                            {agent.name}
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {agent.formula} • {agent.type}
                          </span>
                        </div>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-0.5 ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-snug">{agent.mechanism}</p>

                      <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-slate-800 text-slate-400">
                        <span className={agent.conductive ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {agent.conductive ? 'Conductive (Shock)' : 'Non-conductive'}
                        </span>
                        <span className="text-slate-500">{agent.residue}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: POST-FIRE CREW & ATMOSPHERE SAFETY */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    3
                  </span>
                  STEP 3: POST-EXTINGUISHMENT PROTOCOL
                </span>
                <span className="text-[10px] text-slate-400">Crew Toxicity Defense</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {POST_FIRE_ACTIONS.map((action) => {
                  const isSelected = selectedPostAction === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedPostAction(action.id)}
                      disabled={isSubmitted || isDischarging}
                      className={`text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                          : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      } ${isSubmitted ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold leading-tight">
                          {action.label}
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1 h-1 rounded-full bg-slate-950" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">{action.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EXECUTE / SUBMIT BUTTON */}
            {!isSubmitted && (
              <div className="pt-2">
                <button
                  onClick={() => executeAction(false)}
                  disabled={isDischarging}
                  className={`w-full py-3.5 px-4 rounded-xl font-mono text-sm font-bold tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 active:scale-98 ${
                    isDischarging
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-400 text-white shadow-red-600/30'
                  }`}
                >
                  {isDischarging ? (
                    <>
                      <Wind className="w-4 h-4 animate-spin" />
                      <span>DISCHARGING SUPPRESSANT GAS INTO MODULE...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>EXECUTE FIRE SUPPRESSION COMMAND</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* RESULTS & FLIGHT DIRECTOR DEBRIEF */}
            {isSubmitted && evaluation && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3.5 transition-all animate-fadeIn ${
                  evaluation.status === 'SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40'
                    : evaluation.status === 'SUBOPTIMAL'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-amber-950/40'
                    : 'bg-rose-950/50 border-rose-500/60 text-rose-100 shadow-rose-950/40'
                }`}
              >
                {/* Result Headline */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {evaluation.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                    <div>
                      <h4 className="font-mono font-bold text-sm text-white">
                        {evaluation.status === 'SUCCESS'
                          ? 'MISSION SUCCESS: FIRE FULLY SUPPRESSED'
                          : evaluation.status === 'SUBOPTIMAL'
                          ? 'MISSION CAUTION: FIRE SUPPRESSED WITH ADVERSE CONSEQUENCES'
                          : 'MISSION CRITICAL FAILURE: CATASTROPHIC ESCALATION'}
                      </h4>
                      <p className="text-xs text-slate-300">{evaluation.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">Score:</span>
                    <span
                      className={`text-base font-bold ${
                        evaluation.score >= 80
                          ? 'text-emerald-400'
                          : evaluation.score >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {evaluation.score}/100
                    </span>
                  </div>
                </div>

                {/* Granular Feedback Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>Airflow / Power</span>
                      {evaluation.containmentFeedback.pass ? (
                        <span className="text-emerald-400">PASS</span>
                      ) : (
                        <span className="text-rose-400">FAIL</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans leading-tight">
                      {evaluation.containmentFeedback.note}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>Suppressant Choice</span>
                      {evaluation.agentFeedback.isLethal ? (
                        <span className="text-rose-400 font-bold">LETHAL</span>
                      ) : evaluation.agentFeedback.pass ? (
                        <span className="text-emerald-400">EFFECTIVE</span>
                      ) : (
                        <span className="text-rose-400">INADEQUATE</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans leading-tight">
                      {evaluation.agentFeedback.note}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>Post-Fire Safety</span>
                      {evaluation.postActionFeedback.pass ? (
                        <span className="text-emerald-400">CORRECT</span>
                      ) : (
                        <span className="text-amber-400">IMPROVABLE</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans leading-tight">
                      {evaluation.postActionFeedback.note}
                    </p>
                  </div>
                </div>

                {/* NASA Physics Insight & Flight Rule citation */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      FLIGHT RULE & COMBUSTION KINETICS
                    </span>
                    <span className="text-slate-500">{currentScenario.flightRuleRef}</span>
                  </div>
                  <p className="font-sans leading-relaxed text-slate-300 text-[11px]">
                    {currentScenario.physicsInsight}
                  </p>
                </div>

                {/* Action Buttons for Next Drill */}
                <div className="flex items-center justify-end gap-2.5 pt-1 flex-wrap">
                  <button
                    onClick={() => {
                      setTimeLeft(currentScenario.timeLimitSec);
                      setTimerRunning(true);
                      setIsSubmitted(false);
                      setEvaluation(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Scenario</span>
                  </button>

                  <button
                    onClick={handleNewRandomScenario}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Next Random Emergency</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
