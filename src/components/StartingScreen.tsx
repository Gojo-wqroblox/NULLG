/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cinematic Starting Screen for NASA Space App Challenge | Flame
 * Inspired directly by the official flight challenge intro:
 * - Holographic 3D Spacecraft Wireframe & Orbit Coordinate Telemetry (00:00 - 00:04)
 * - Zero-G Cockpit Floating Spherical Flame with HUD Targeting & Waveforms (00:05 - 00:08)
 * - Astronaut Console with Log In, Sign Up, and 1-Click Crew Clearance (00:09 - 00:10)
 * - Interactive Tactile Swipe-To-Start "LAUNCH DIAGNOSTICS" Slider (00:09 - 00:11)
 */

import React, { useState, useEffect } from 'react';
import { HolographicSpacecraftCanvas } from './HolographicSpacecraftCanvas';
import { CockpitFloatingFlameCanvas } from './CockpitFloatingFlameCanvas';
import { SwipeToStartSlider } from './SwipeToStartSlider';
import {
  Flame,
  Rocket,
  Shield,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
  Layers,
  Radio,
  Cpu,
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface AstronautProfile {
  id: string;
  name: string;
  email: string;
  callSign: string;
  role: string;
  agency: string;
  stationBadge: string;
}

export const DEMO_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'demo_1',
    name: 'Dr. Jessica Meir',
    email: 'j.meir@nasa.gov',
    callSign: 'Valkyrie-1',
    role: 'ISS Flight Engineer & Combustion Lead',
    agency: 'NASA / Expedition 71',
    stationBadge: 'CIR / ACME RACK',
  },
  {
    id: 'demo_2',
    name: 'Dr. Akihiko Hoshide',
    email: 'a.hoshide@jaxa.jp',
    callSign: 'Kibo-Prime',
    role: 'Payload Operations Specialist',
    agency: 'JAXA / Space Station',
    stationBadge: 'JAXA KIBO LAB',
  },
  {
    id: 'demo_3',
    name: 'Samantha Cristoforetti',
    email: 's.cristoforetti@esa.int',
    callSign: 'Astro-Samantha',
    role: 'ESA Science Lead & Safety Officer',
    agency: 'ESA / Columbus',
    stationBadge: 'ESA COLUMBUS',
  },
];

interface StartingScreenProps {
  onStartSimulation: (astronaut: AstronautProfile) => void;
  initialAstronaut?: AstronautProfile | null;
}

export const StartingScreen: React.FC<StartingScreenProps> = ({
  onStartSimulation,
  initialAstronaut,
}) => {
  // Visual scene mode: Holographic Shuttle Wireframe vs Cockpit Zero-G Flame
  const [sceneMode, setSceneMode] = useState<'shuttle' | 'flame'>('shuttle');

  // Authentication mode: Login vs Sign Up vs Demo Roster
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'demo'>('login');

  const [activeAstronaut, setActiveAstronaut] = useState<AstronautProfile>(() => {
    if (initialAstronaut) return initialAstronaut;
    try {
      const saved = localStorage.getItem('nullg_active_astronaut');
      return saved ? JSON.parse(saved) : DEMO_ASTRONAUTS[0];
    } catch {
      return DEMO_ASTRONAUTS[0];
    }
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('j.meir@nasa.gov');
  const [loginPassword, setLoginPassword] = useState<string>('expedition-71');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sign up form state
  const [signupName, setSignupName] = useState<string>('');
  const [signupCallSign, setSignupCallSign] = useState<string>('');
  const [signupRole, setSignupRole] = useState<string>('Combustion Scientist');
  const [signupAgency, setSignupAgency] = useState<string>('NASA');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirm, setSignupConfirm] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live oscillating waveforms simulation for HUD
  const [waveformOffset, setWaveformOffset] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformOffset((prev) => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Handle Login submission
  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both astronaut email and station clearance key.' });
      return;
    }

    let users: (AstronautProfile & { password?: string })[] = [];
    try {
      const stored = localStorage.getItem('nullg_registered_astronauts');
      users = stored ? JSON.parse(stored) : [];
    } catch {
      users = [];
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    const matchedDemo = DEMO_ASTRONAUTS.find((d) => d.email.toLowerCase() === loginEmail.trim().toLowerCase());

    const loggedInUser: AstronautProfile = matchedUser || matchedDemo || {
      id: `astro_${Date.now()}`,
      name: loginEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
      email: loginEmail.trim(),
      callSign: 'CREW-SPECIALIST',
      role: 'Visiting Combustion Researcher',
      agency: 'NASA Open Science',
      stationBadge: 'CIR GUEST',
    };

    setActiveAstronaut(loggedInUser);
    try {
      localStorage.setItem('nullg_active_astronaut', JSON.stringify(loggedInUser));
    } catch {
      // Ignore
    }

    setFeedback({
      type: 'success',
      message: `Cleared for flight: Welcome, ${loggedInUser.name}! Swipe below to Launch Diagnostics.`,
    });
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setFeedback({ type: 'error', message: 'Name, mission email, and clearance key are required.' });
      return;
    }

    if (signupPassword !== signupConfirm) {
      setFeedback({ type: 'error', message: 'Clearance keys do not match. Please re-enter password.' });
      return;
    }

    const newAstro: AstronautProfile = {
      id: `astro_${Date.now()}`,
      name: signupName.trim(),
      email: signupEmail.trim(),
      callSign: signupCallSign.trim() || `ASTRO-${Math.floor(100 + Math.random() * 900)}`,
      role: signupRole,
      agency: signupAgency,
      stationBadge: `${signupAgency} EXP-71`,
    };

    try {
      const stored = localStorage.getItem('nullg_registered_astronauts');
      const users = stored ? JSON.parse(stored) : [];
      users.push({ ...newAstro, password: signupPassword });
      localStorage.setItem('nullg_registered_astronauts', JSON.stringify(users));
      localStorage.setItem('nullg_active_astronaut', JSON.stringify(newAstro));
    } catch {
      // Ignore
    }

    setActiveAstronaut(newAstro);
    setFeedback({
      type: 'success',
      message: `Crew registered! Welcome, ${newAstro.name}. Swipe below to launch!`,
    });
    setAuthMode('login');
  };

  const handleSelectDemoAstronaut = (astro: AstronautProfile) => {
    setActiveAstronaut(astro);
    setLoginEmail(astro.email);
    setLoginPassword('expedition-71');
    try {
      localStorage.setItem('nullg_active_astronaut', JSON.stringify(astro));
    } catch {
      // Ignore
    }
    setFeedback({
      type: 'success',
      message: `Crew Selected: ${astro.name} (${astro.role}). Swipe slider below to enter!`,
    });
  };

  const handleLaunchApp = () => {
    const finalUser = activeAstronaut || DEMO_ASTRONAUTS[0];
    onStartSimulation(finalUser);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: NASA Space App Challenge | Flame */}
      {/* ========================================================================= */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <img
              src="/assets/aistudio/nullg_680a0fbc.jpg"
              alt="NULLG Logo"
              className="w-10 h-10 rounded-xl object-cover border border-cyan-500/50 shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform bg-black"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-wider text-white">
                  NASA Space App Challenge <span className="text-cyan-400">|</span> Flame
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold hidden md:inline-block">
                  EXP-71
                </span>
              </div>
              <span className="text-[10px] text-cyan-400/80 tracking-widest hidden sm:block font-bold">
                NULLG ZERO-GRAVITY COMBUSTION INITIATIVE
              </span>
            </div>
          </div>
        </div>

        {/* Live Recording Indicator (matching video top right!) */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping shrink-0" />
            <span className="font-bold text-yellow-300">Recording has started</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            10.13.1C
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CINEMATIC WORKSPACE (2-COLUMN VIDEO HUD & ASTRONAUT TERMINAL) */}
      {/* ========================================================================= */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5 items-stretch justify-center my-auto">
        {/* --------------------------------------------------------------------- */}
        {/* LEFT / CENTER: HOLOGRAPHIC COCKPIT HUD & 3D STAGE (00:00 - 00:08)     */}
        {/* --------------------------------------------------------------------- */}
        <div className="flex-1 bg-slate-950/90 border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          {/* Subtle curved holographic HUD screen outline */}
          <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded-3xl" />
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

          {/* Top Stage Navigation & Telemetry Mode */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80 z-10">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSceneMode('shuttle')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    sceneMode === 'shuttle'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Holographic Orbit (0:00)</span>
                </button>
                <button
                  onClick={() => setSceneMode('flame')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    sceneMode === 'flame'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Zero-G Cockpit Flame (0:06)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold">HUD ACTIVE • DATA STREAMING</span>
            </div>
          </div>

          {/* 3D Visualizer Canvas Stage */}
          <div className="relative w-full h-[320px] sm:h-[390px] flex items-center justify-center my-2 overflow-hidden rounded-2xl bg-gradient-to-b from-[#060e1d]/80 to-[#02050c]/90 border border-slate-800/60">
            {sceneMode === 'shuttle' ? (
              <>
                <HolographicSpacecraftCanvas />

                {/* Left Telemetry Card: "NASA COMBUSTION DATA" (matching 00:00) */}
                <div className="absolute top-3 left-3 pointer-events-none p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md flex flex-col gap-2 max-w-[190px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                      NASA COMBUSTION DATA
                    </span>
                  </div>

                  {/* SVG Multi-Color Oscilloscope Curves (green, cyan, magenta) */}
                  <div className="w-full h-14 bg-slate-900/60 rounded border border-slate-800 p-1 relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      {/* Gridlines */}
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.5" />
                      {/* Green Curve */}
                      <path
                        d="M0,25 Q25,8 50,22 T100,12"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      {/* Cyan Curve */}
                      <path
                        d="M0,32 Q25,18 50,30 T100,5"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      {/* Magenta Curve */}
                      <path
                        d="M0,15 Q30,35 60,18 T100,28"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* 3 Metric Pills: 662km, 19.8km/s, 28° */}
                  <div className="grid grid-cols-3 gap-1 text-center font-mono">
                    <div className="p-1 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-[8px] text-slate-400 block">ALT</span>
                      <span className="text-[10px] font-bold text-white">662</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-[8px] text-slate-400 block">SPD</span>
                      <span className="text-[10px] font-bold text-cyan-300">19.8</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-[8px] text-slate-400 block">ANG</span>
                      <span className="text-[10px] font-bold text-amber-300">28°</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>12X WARP</span>
                    <span className="text-cyan-400 font-bold">10.13.1C</span>
                  </div>
                </div>

                {/* Right Flight Telemetry: Altitude & Velocity (matching 00:03) */}
                <div className="absolute top-3 right-3 pointer-events-none p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md flex flex-col gap-1 text-right max-w-[160px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ALTITUDE</span>
                  <span className="text-sm font-bold text-white font-mono">5003 M/C</span>
                  <div className="h-px w-full bg-slate-800 my-1" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">VELOCITY</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">288 M/S</span>
                  <span className="text-[9px] text-slate-500">PAYLOAD: 1.66T</span>
                </div>
              </>
            ) : (
              <>
                <CockpitFloatingFlameCanvas />

                {/* Tactical HUD Targeting Reticle around Flame (matching 00:06 - 00:08) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-cyan-400/60 flex items-center justify-center animate-pulse">
                    {/* Targeting Crosshairs & Reticle Brackets */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-[10px] text-cyan-300 font-bold">
                      FLAME TARGET ACQUIRED
                    </div>
                    <Crosshair className="w-10 h-10 text-cyan-400/40" />

                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-px bg-cyan-400" />
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-px bg-cyan-400" />
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-px h-6 bg-cyan-400" />
                    <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-px h-6 bg-cyan-400" />
                  </div>
                </div>

                {/* Left O2 Readout: 20.9% (exact match from video 00:06) */}
                <div className="absolute bottom-4 left-4 pointer-events-none p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 backdrop-blur-md flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold">ATMOSPHERE</span>
                    <span className="text-sm font-black text-white font-mono">O₂: 20.9%</span>
                  </div>
                  {/* Mini dial 128 */}
                  <div className="w-8 h-8 rounded-full border border-cyan-400/60 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                    128
                  </div>
                </div>

                {/* Right O2 Readout: 20.9% (exact match from video 00:06) */}
                <div className="absolute bottom-4 right-4 pointer-events-none p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 backdrop-blur-md flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/60 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                    64
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-400 font-bold">OXIDIZER FLOW</span>
                    <span className="text-sm font-black text-cyan-300 font-mono">O₂: 20.9%</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 text-slate-400 font-mono flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span>FACILITY: <strong className="text-slate-300">ISS CIR / ACME</strong></span>
              <span>•</span>
              <span>GRAVITY: <strong className="text-cyan-300">0.00 G</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE ORBITAL DOWNLINK ESTABLISHED</span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT: TACTICAL ASTRONAUT CONSOLE & SWIPE CONTROLLER (00:09 - 00:11) */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full lg:w-[440px] bg-slate-950/95 border border-red-500/40 lg:border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col justify-between gap-4 backdrop-blur-xl relative">
          {/* Header & Astronaut Clearance Badge */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/aistudio/nullg_680a0fbc.jpg"
                  alt="NULLG"
                  className="w-7 h-7 rounded-lg object-cover border border-cyan-500/50 shadow-sm bg-black"
                />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Tactical Crew Terminal
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                NULLG AUTH
              </span>
            </div>

            {/* Authenticated Astronaut Badge Preview */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-inner flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-base shadow-sm">
                  👨‍🚀
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {activeAstronaut.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {activeAstronaut.callSign}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {activeAstronaut.role} • {activeAstronaut.agency}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> CLEARED
                </span>
                <span className="text-[9px] text-slate-500">{activeAstronaut.stationBadge}</span>
              </div>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="text-[11px]">{feedback.message}</span>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setFeedback(null);
                }}
                className={`flex-1 py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'login'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setFeedback(null);
                }}
                className={`flex-1 py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
              <button
                onClick={() => {
                  setAuthMode('demo');
                  setFeedback(null);
                }}
                className={`flex-1 py-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'demo'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Demo Crew</span>
              </button>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Astronaut Mission Email:</span>
                    <span className="text-cyan-400">e.g. j.meir@nasa.gov</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="astronaut@nasa.gov"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Clearance Key / Password:</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold transition-all border border-slate-700 hover:border-cyan-400 flex items-center justify-center gap-1.5"
                  >
                    <span>Authorize Credentials</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Name:</label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Dr. Chris Cassidy"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Call Sign:</label>
                    <input
                      type="text"
                      value={signupCallSign}
                      onChange={(e) => setSignupCallSign(e.target.value)}
                      placeholder="Astro-Eagle"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Role:</label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Flight Engineer">Flight Engineer</option>
                      <option value="Combustion Scientist">Combustion Scientist</option>
                      <option value="ACME Payload Lead">ACME Payload Lead</option>
                      <option value="Safety Officer">Safety Officer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Agency:</label>
                    <select
                      value={signupAgency}
                      onChange={(e) => setSignupAgency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="NASA">NASA</option>
                      <option value="ESA">ESA</option>
                      <option value="JAXA">JAXA</option>
                      <option value="CSA">CSA</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] text-slate-400">Mission Email:</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="your.name@nasa.gov"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Key:</label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-slate-400">Confirm:</label>
                    <input
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repeat key"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register Astronaut Account</span>
                </button>
              </form>
            )}

            {/* TAB 3: 1-CLICK DEMO CREW ROSTER */}
            {authMode === 'demo' && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400">
                  Select an active Expedition 71 crew profile for 1-click clearance:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {DEMO_ASTRONAUTS.map((astro) => (
                    <button
                      key={astro.id}
                      onClick={() => handleSelectDemoAstronaut(astro)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                        activeAstronaut?.id === astro.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👨‍🚀</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{astro.name}</span>
                          <span className="text-[9px] text-slate-400">
                            {astro.role}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                        {astro.callSign}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* TACTILE "SWIPE TO START" CONTROLLER (Matching video 00:09 - 00:11)*/}
          {/* ================================================================= */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>LAUNCH AI DIAGNOSTICS:</span>
              </span>
              <span className="text-[10px] text-slate-400">Swipe puck right</span>
            </div>

            {/* Tactile Swipe To Start Slider */}
            <SwipeToStartSlider
              onSwipeComplete={handleLaunchApp}
              label="SWIPE TO ENTER LAB"
              subLabel="Press & drag puck across track to initialize chamber"
            />
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER TELEMETRY STATUS                                                */}
      {/* ========================================================================= */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 py-2.5 text-xs text-slate-500 font-mono flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>NASA Physical Sciences Informatics • PSI-159</span>
          <span>•</span>
          <span>ISS Combustion Integrated Rack</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-cyan-400">
          <span>SECURITY CLEARANCE: LEVEL 2</span>
          <span>•</span>
          <span>TOUCH & MOUSE ENABLED</span>
        </div>
      </footer>
    </div>
  );
};
