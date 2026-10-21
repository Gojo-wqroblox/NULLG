import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Flame,
  Wind,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldAlert,
  Zap,
  Activity,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Sliders,
} from 'lucide-react';
import { GasDefinition, FuelDefinition } from '../types';
import { flameAudio } from '../services/flameAudioService';

interface ChamberCanvasProps {
  gases: Record<string, number>;
  onGasChange?: (gasId: string, val: number) => void;
  pressureKpa: number;
  gravityG: number;
  onGravityChange?: (g: number) => void;
  ventilationSpeed: number; // m/s
  onVentilationChange?: (speed: number) => void;
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  onCutVentilation: () => void;
  onPurgeChamber: () => void;
  isBeginnerMode?: boolean;
  flameTempK: number;
  dangerLevel: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  type: 'soot' | 'radical' | 'spark' | 'smoke';
}

export const ChamberCanvas: React.FC<ChamberCanvasProps> = ({
  gases,
  onGasChange,
  pressureKpa,
  gravityG,
  onGravityChange,
  ventilationSpeed,
  onVentilationChange,
  fuel,
  isIgnited,
  onToggleIgnite,
  onCutVentilation,
  onPurgeChamber,
  isBeginnerMode,
  flameTempK,
  dangerLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const [sparkAnimation, setSparkAnimation] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Flame & Candle Zoom Scale (defaulted to 0.65x for a comfortable, wide zoomed-out perspective)
  const [flameZoomScale, setFlameZoomScale] = useState<number>(0.65);
  const [flameGlowMode, setFlameGlowMode] = useState<'vivid' | 'ultra'>('ultra');

  // Audio Context & Alarm State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [alarmAudioEnabled, setAlarmAudioEnabled] = useState<boolean>(true);

  // Dynamic Acoustic Flame Feedback (Modulates volume and pitch based on flame temp & ventilation speed)
  const [flameAudioEnabled, setFlameAudioEnabled] = useState<boolean>(true);
  const [flameAudioVolume, setFlameAudioVolume] = useState<number>(0.65);
  const [liveAudioMetrics, setLiveAudioMetrics] = useState<{ pitchHz: number; volumePct: number }>({
    pitchHz: 0,
    volumePct: 0,
  });

  // Oxygen starvation timer when g=0 and vent=0
  const [starvationProgress, setStarvationProgress] = useState<number>(0);
  const [isSuffocated, setIsSuffocated] = useState<boolean>(false);

  // Check if gas mix can burn
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const c3h8 = gases?.C3H8 || 0;
  const c2h4 = gases?.C2H4 || 0;

  // Silane auto-ignites if O2 is present!
  const isSilaneAutoIgnited = sih4 > 1.2 && o2 > 10;
  const canCombust = (o2 >= 11 && novec <= 6 && sf6 <= 8 && co2 < 38) || isSilaneAutoIgnited;
  const effectivelyBurning = (isIgnited || isSilaneAutoIgnited) && canCombust && !isSuffocated;

  // Trigger spark animation effect
  const handleSparkTrigger = () => {
    if (flameAudioEnabled) {
      flameAudio.initAudio();
    }
    setSparkAnimation(25);
    onToggleIgnite();
  };

  // Track mouse coordinates over canvas for interactive sensor probe
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setMousePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Click on canvas to interact / ignite
  const handleCanvasClick = () => {
    if (flameAudioEnabled) {
      flameAudio.initAudio();
    }
    if (!isIgnited && canCombust) {
      handleSparkTrigger();
    }
  };

  // Alarm threshold computation
  const isAlarmActive =
    effectivelyBurning &&
    (dangerLevel === 'CRITICAL' ||
      dangerLevel === 'SEVERE' ||
      dangerLevel === 'HIGH' ||
      flameTempK >= 1650 ||
      isSilaneAutoIgnited ||
      o2 > 35);

  const alarmReason = isSilaneAutoIgnited
    ? 'Pyrophoric Silane Runaway'
    : o2 > 35
    ? 'High-Pressure Oxygen Flash Hazard'
    : flameTempK >= 1650
    ? `Extreme Thermal Excursion (${flameTempK} K)`
    : 'Severe Atmospheric Fire Risk';

  // Sound spacecraft alarm tone via Web Audio API
  const triggerAlarmTone = useCallback(() => {
    if (!alarmAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // European/NASA high-low spacecraft warble klaxon
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      osc.frequency.setValueAtTime(620, now + 0.13);
      osc.frequency.setValueAtTime(620, now + 0.26);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.29);
    } catch {
      // Non-blocking catch
    }
  }, [alarmAudioEnabled]);

  // Periodic alarm audio chime
  useEffect(() => {
    let interval: any = null;
    if (isAlarmActive && alarmAudioEnabled) {
      triggerAlarmTone();
      interval = setInterval(() => {
        triggerAlarmTone();
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAlarmActive, alarmAudioEnabled, triggerAlarmTone]);

  // Dynamic Acoustic Flame Feedback Effect:
  useEffect(() => {
    flameAudio.setEnabled(flameAudioEnabled);
    flameAudio.setVolume(flameAudioVolume);
    flameAudio.update({
      isBurning: effectivelyBurning,
      flameTempK,
      ventilationSpeed,
      gravityG,
      dangerLevel,
    });

    setLiveAudioMetrics({
      pitchHz: flameAudio.currentPitchHz,
      volumePct: Math.round(flameAudio.currentVolumeNorm * 100),
    });
  }, [effectivelyBurning, flameTempK, ventilationSpeed, gravityG, dangerLevel, flameAudioEnabled, flameAudioVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      flameAudio.silence();
    };
  }, []);

  const toggleFlameAudio = () => {
    const nextState = !flameAudioEnabled;
    setFlameAudioEnabled(nextState);
    if (nextState) {
      flameAudio.initAudio();
    }
  };

  // Suffocation simulation in stagnant 0-G
  useEffect(() => {
    let interval: any = null;
    if (isIgnited && gravityG === 0 && ventilationSpeed === 0 && canCombust) {
      interval = setInterval(() => {
        setStarvationProgress((prev) => {
          if (prev >= 100) {
            setIsSuffocated(true);
            return 100;
          }
          return prev + 1.2;
        });
      }, 100);
    } else {
      setStarvationProgress(0);
      setIsSuffocated(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIgnited, gravityG, ventilationSpeed, canCombust]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Chamber Background & Viewport Atmosphere
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Deep Space Chamber Gradient
      const chamberGlow = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.7);
      chamberGlow.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      chamberGlow.addColorStop(0.7, 'rgba(6, 10, 20, 0.88)');
      chamberGlow.addColorStop(1, '#020617');
      ctx.fillStyle = chamberGlow;
      ctx.fillRect(0, 0, width, height);

      // High-Tech Chamber Grid Lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // =========================================================================
      // PURE CANDLE CHAMBER RENDERER (Spacious Zoom-Out + Huge Candle)
      // =========================================================================
      const renderChamberPhysicalFlame = (cyOffset: number, scaleFactor: number) => {
        const cx = width / 2;
        const cy = cyOffset;

        // Concentric chamber calibration circles (framed with generous margin)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.setLineDash([4, 4]);
        [50 * scaleFactor, 100 * scaleFactor, 160 * scaleFactor].forEach((r) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Ventilation Streamlines (Air Flow Vectors)
        if (ventilationSpeed > 0) {
          ctx.lineWidth = 1.4;
          const speedFactor = ventilationSpeed * 40;
          for (let row = 0; row < 5; row++) {
            const y = cy - 80 * scaleFactor + row * (40 * scaleFactor);
            const offset = (time * speedFactor * 14 + row * 40) % width;

            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Glider tracer head
            const px = offset;
            const gradGlider = ctx.createLinearGradient(px - 22, y, px + 4, y);
            gradGlider.addColorStop(0, 'rgba(56, 189, 248, 0)');
            gradGlider.addColorStop(1, 'rgba(56, 189, 248, 0.85)');
            ctx.strokeStyle = gradGlider;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(px - 22, y);
            ctx.lineTo(px, y);
            ctx.stroke();

            // Streamline arrowhead
            ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
            ctx.beginPath();
            ctx.moveTo(px, y - 2.5);
            ctx.lineTo(px + 6, y);
            ctx.lineTo(px, y + 2.5);
            ctx.fill();
          }
        }

        // -------------------------------------------------------------
        // HUGE, MONUMENTAL NASA CFM SPECIMEN CANDLE ASSEMBLY
        // -------------------------------------------------------------
        const candleW = 80 * scaleFactor;
        const candleH = 116 * scaleFactor;
        const candleTopY = cy + 24 * scaleFactor;
        const candleBottomY = candleTopY + candleH;

        // 1. Heavy Stage Platform & Grounding Base
        const collarW = candleW + 40 * scaleFactor;
        const collarH = 20 * scaleFactor;
        const collarY = candleBottomY;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(cx - (collarW + 48) / 2, collarY + collarH, collarW + 48, 16 * scaleFactor, 4);
        ctx.fill();
        ctx.stroke();

        // Knurled titanium gimbal collar ring
        const clampGrad = ctx.createLinearGradient(cx - collarW / 2, collarY, cx + collarW / 2, collarY);
        clampGrad.addColorStop(0, '#1e293b');
        clampGrad.addColorStop(0.3, '#475569');
        clampGrad.addColorStop(0.5, '#64748b');
        clampGrad.addColorStop(0.7, '#475569');
        clampGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = clampGrad;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - collarW / 2, collarY, collarW, collarH, 5);
        ctx.fill();
        ctx.stroke();

        // Brass adjustment knurled thumb screws
        ctx.fillStyle = '#d97706';
        ctx.fillRect(cx - collarW / 2 - 6, collarY + 5, 6, 10);
        ctx.fillRect(cx + collarW / 2, collarY + 5, 6, 10);

        // 2. Huge Candle Paraffin Wax Column (Ivory Paraffin with 3D Light)
        const waxGrad = ctx.createLinearGradient(cx - candleW / 2, candleTopY, cx + candleW / 2, candleTopY);
        waxGrad.addColorStop(0.0, '#94a3b8'); // ambient shadow on left contour
        waxGrad.addColorStop(0.10, '#f8fafc'); // rim specular highlight
        waxGrad.addColorStop(0.35, '#ffffff'); // bright wax center
        waxGrad.addColorStop(0.68, '#fef3c7'); // warm ivory paraffin body
        waxGrad.addColorStop(0.88, '#fde68a'); // warm amber wax reflection
        waxGrad.addColorStop(1.0, '#64748b'); // right shadow edge

        ctx.fillStyle = waxGrad;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(cx - candleW / 2, candleTopY, candleW, candleH, [0, 0, 5, 5]);
        ctx.fill();
        ctx.stroke();

        // Subsurface scattering: warm internal amber glow in top wax
        if (effectivelyBurning) {
          const sssH = Math.min(36 * scaleFactor, candleH * 0.5);
          const sssGrad = ctx.createLinearGradient(cx, candleTopY, cx, candleTopY + sssH);
          const flickerAlpha = 0.5 + Math.sin(time * 9) * 0.15;
          sssGrad.addColorStop(0, `rgba(251, 146, 60, ${flickerAlpha})`);
          sssGrad.addColorStop(0.45, `rgba(254, 215, 170, ${flickerAlpha * 0.6})`);
          sssGrad.addColorStop(1, 'rgba(254, 243, 199, 0)');
          ctx.fillStyle = sssGrad;
          ctx.fillRect(cx - candleW / 2 + 1, candleTopY, candleW - 2, sssH);
        }

        // Realistic wax drips on side
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cx - candleW / 2 + 4, candleTopY + 2, 5 * scaleFactor, 24 * scaleFactor, 2.5);
        ctx.roundRect(cx + candleW / 2 - 11, candleTopY + 2, 6 * scaleFactor, 32 * scaleFactor, 3);
        ctx.fill();

        // Millimeter calibration ticks along left edge (0, 10, 20, 30, 40 mm)
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
        ctx.lineWidth = 1;
        for (let tick = 1; tick <= 6; tick++) {
          const ty = candleTopY + (tick * candleH) / 7;
          ctx.beginPath();
          ctx.moveTo(cx - candleW / 2, ty);
          ctx.lineTo(cx - candleW / 2 + (tick % 2 === 0 ? 8 : 4), ty);
          ctx.stroke();
        }

        // 3. Molten Liquid Wax Pool at Candle Top Rim
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, candleTopY, candleW / 2, 7 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Molten pool inner liquid crater
        const poolGrad = ctx.createRadialGradient(cx, candleTopY, 1, cx, candleTopY, candleW / 2);
        poolGrad.addColorStop(0, '#fef9c3');
        poolGrad.addColorStop(0.5, effectivelyBurning ? '#f59e0b' : '#cbd5e1');
        poolGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.ellipse(cx, candleTopY, candleW / 2 - 2, 5 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Braided Cotton Wick
        const wickBend = ventilationSpeed > 0 ? ventilationSpeed * 10 * scaleFactor : 0;
        const wickTopX = cx + wickBend;
        const wickTopY = cy;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.6 * scaleFactor;
        ctx.beginPath();
        ctx.moveTo(cx, candleTopY);
        ctx.quadraticCurveTo(cx, cy + 12 * scaleFactor, wickTopX, wickTopY);
        ctx.stroke();

        // Wick carbon core highlight
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, candleTopY);
        ctx.quadraticCurveTo(cx, cy + 12 * scaleFactor, wickTopX, wickTopY);
        ctx.stroke();

        // 5. Incandescent Wick Tip Ember
        const emberPulse = 0.8 + Math.sin(time * 10) * 0.2;
        const emberHalo = ctx.createRadialGradient(wickTopX, wickTopY, 0.5, wickTopX, wickTopY, 12 * scaleFactor);
        emberHalo.addColorStop(0, `rgba(255, 255, 255, ${0.98 * emberPulse})`);
        emberHalo.addColorStop(0.35, `rgba(249, 115, 22, ${0.9 * emberPulse})`);
        emberHalo.addColorStop(0.7, `rgba(239, 68, 68, ${0.5 * emberPulse})`);
        emberHalo.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = emberHalo;
        ctx.beginPath();
        ctx.arc(wickTopX, wickTopY, 12 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // White-hot apex of wick
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wickTopX, wickTopY, 2.8 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Candle Specimen High-Contrast Label Plaque
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 44 * scaleFactor, candleBottomY - 18 * scaleFactor, 88 * scaleFactor, 14 * scaleFactor, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${Math.max(8, Math.round(9 * scaleFactor))}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText('NASA CFM CANDLE', cx, candleBottomY - 7 * scaleFactor);

        // Spark arc animation
        if (sparkAnimation > 0) {
          setSparkAnimation((prev) => Math.max(0, prev - 1));
          const intensity = sparkAnimation / 25;
          ctx.fillStyle = `rgba(56, 189, 248, ${intensity * 0.15})`;
          ctx.fillRect(0, 0, width, height);

          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 2.4;
          for (let branch = 0; branch < 3; branch++) {
            ctx.beginPath();
            ctx.moveTo(wickTopX - 24 * scaleFactor, wickTopY + 8 * scaleFactor);
            let currX = wickTopX - 24 * scaleFactor;
            let currY = wickTopY + 8 * scaleFactor;
            const targetX = wickTopX + 24 * scaleFactor;
            const steps = 6;
            const dx = (targetX - currX) / steps;
            for (let s = 1; s <= steps; s++) {
              currX += dx;
              currY = wickTopY + 8 * scaleFactor + (Math.random() - 0.5) * 18;
              ctx.lineTo(currX, currY);
            }
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        }

        // =====================================================================
        // ACTIVE FLAME RENDERING (Zoomed-Out Perspective atop Massive Candle)
        // =====================================================================
        if (effectivelyBurning) {
          let coreColor = 'rgba(56, 189, 248, ';
          let midColor = 'rgba(103, 232, 249, ';
          let outerColor = 'rgba(251, 146, 60, ';
          let isGhostHydrogen = h2 > 4 && ch4 < 4 && c3h8 < 2 && sih4 < 1;
          let isSilaneWhiteFire = sih4 > 1.2;
          let isAmmoniaGreenish = nh3 > 8;
          let isHeavySootHydrocarbon = c3h8 > 2 || c2h4 > 2;

          if (isSilaneWhiteFire) {
            coreColor = 'rgba(255, 255, 255, ';
            midColor = 'rgba(207, 250, 254, ';
            outerColor = 'rgba(165, 243, 252, ';
          } else if (isAmmoniaGreenish) {
            coreColor = 'rgba(190, 242, 100, ';
            midColor = 'rgba(234, 179, 8, ';
            outerColor = 'rgba(202, 138, 4, ';
          } else if (isHeavySootHydrocarbon) {
            coreColor = 'rgba(249, 115, 22, ';
            midColor = 'rgba(251, 146, 60, ';
            outerColor = 'rgba(234, 88, 12, ';
          } else if (isGhostHydrogen) {
            coreColor = 'rgba(192, 132, 252, ';
            midColor = 'rgba(232, 121, 249, ';
            outerColor = 'rgba(244, 114, 182, ';
          }

          // Dynamic chemical shift from O2 and CO2 levels
          if (o2 > 28 && !isGhostHydrogen && !isSilaneWhiteFire) {
            coreColor = 'rgba(255, 255, 255, '; // Hyperoxic white hot core
            midColor = 'rgba(253, 224, 71, ';
            outerColor = 'rgba(249, 115, 22, ';
          } else if (o2 < 15 && !isGhostHydrogen && !isSilaneWhiteFire) {
            coreColor = 'rgba(99, 102, 241, '; // Hypoxic faint blue chemiluminescence
            midColor = 'rgba(59, 130, 246, ';
            outerColor = 'rgba(37, 99, 235, ';
          }

          const starvationFade = 1 - starvationProgress / 100;
          // Dynamic scaling with O2 concentration & CO2 thermal damping
          const o2Factor = Math.max(0.35, Math.min(2.0, 0.45 + (o2 / 21) * 0.55));
          const co2Damping = Math.max(0.2, 1 - (co2 / 38) * 0.7);
          let baseRadius = 32 * scaleFactor * starvationFade * flameZoomScale * o2Factor * co2Damping;
          if (gravityG === 0) baseRadius *= 1.1;

          const windShiftX = ventilationSpeed * 42 * scaleFactor;
          const flameCenterX = wickTopX + windShiftX * 0.55;
          const flameCenterY = wickTopY - (gravityG > 0 ? 8 * scaleFactor : 0);

          // 1. Wide Atmospheric Thermal Radiative Halo
          const haloRadius = baseRadius * (flameGlowMode === 'ultra' ? 2.3 : 1.75);
          const radGradient = ctx.createRadialGradient(
            flameCenterX,
            flameCenterY,
            baseRadius * 0.2,
            flameCenterX,
            flameCenterY,
            haloRadius
          );
          radGradient.addColorStop(0, coreColor + (isGhostHydrogen ? '0.35)' : '0.65)'));
          radGradient.addColorStop(0.35, midColor + (isGhostHydrogen ? '0.22)' : '0.40)'));
          radGradient.addColorStop(0.7, outerColor + (isGhostHydrogen ? '0.10)' : '0.20)'));
          radGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = radGradient;
          ctx.beginPath();
          ctx.arc(flameCenterX, flameCenterY, haloRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Combustion Morphology: Zero-G Blue Sphere vs 1-G Updraft Teardrop
          if (gravityG === 0) {
            const breathePulse = Math.sin(time * 3.5) * 2.0;
            const sphereR = Math.max(10, baseRadius + breathePulse);

            if (ventilationSpeed > 0.05) {
              // Forced Convection: Aerodynamic Tail trailing downwind
              ctx.save();
              ctx.translate(wickTopX, wickTopY);
              ctx.beginPath();
              ctx.moveTo(-sphereR * 0.75, 0);
              ctx.bezierCurveTo(-sphereR * 0.5, -sphereR * 0.95, windShiftX * 0.5, -sphereR * 0.75, windShiftX * 1.6, 0);
              ctx.bezierCurveTo(windShiftX * 0.5, sphereR * 0.75, -sphereR * 0.5, sphereR * 0.95, -sphereR * 0.75, 0);
              ctx.closePath();

              const flameGrad = ctx.createLinearGradient(-sphereR * 0.75, 0, windShiftX * 1.6, 0);
              flameGrad.addColorStop(0, '#ffffff'); // white-hot oxygen collision front
              flameGrad.addColorStop(0.18, coreColor + '0.98)');
              flameGrad.addColorStop(0.55, midColor + '0.85)');
              flameGrad.addColorStop(0.85, outerColor + '0.90)');
              flameGrad.addColorStop(1, outerColor + '0.05)');
              ctx.fillStyle = flameGrad;
              ctx.fill();

              // Inner luminous core
              ctx.beginPath();
              ctx.ellipse(windShiftX * 0.25, 0, sphereR * 0.45, sphereR * 0.35, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
              ctx.fill();

              ctx.restore();
            } else {
              // Quiescent Zero-G Spherical Ball
              const sphereGrad = ctx.createRadialGradient(
                flameCenterX,
                flameCenterY,
                sphereR * 0.1,
                flameCenterX,
                flameCenterY,
                sphereR
              );
              sphereGrad.addColorStop(0, '#ffffff');
              sphereGrad.addColorStop(0.25, coreColor + '0.98)');
              sphereGrad.addColorStop(0.65, midColor + '0.88)');
              sphereGrad.addColorStop(0.92, outerColor + '0.85)');
              sphereGrad.addColorStop(1, outerColor + '0.05)');
              ctx.fillStyle = sphereGrad;
              ctx.beginPath();
              ctx.arc(flameCenterX, flameCenterY, sphereR, 0, Math.PI * 2);
              ctx.fill();

              // White-cyan intense reaction core
              const innerCoreGrad = ctx.createRadialGradient(
                flameCenterX,
                flameCenterY,
                0,
                flameCenterX,
                flameCenterY,
                sphereR * 0.45
              );
              innerCoreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
              innerCoreGrad.addColorStop(0.6, coreColor + '0.90)');
              innerCoreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = innerCoreGrad;
              ctx.beginPath();
              ctx.arc(flameCenterX, flameCenterY, sphereR * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Gravity > 0: Buoyant Flickering Teardrop Flame with 0G-10G Convective Entrainment
            // 1. Flutter frequency scales with sqrt(gravityG)
            const flutterFreq = 11 + Math.sqrt(gravityG) * 8.5;
            const flutterAmp = (2.2 + Math.min(gravityG, 4) * 0.7) * scaleFactor;
            const flicker = Math.sin(time * flutterFreq) * flutterAmp;

            // 2. Buoyant Elongation: power-law scaling g^0.35 keeps flame bounded and realistic up to 10G
            const gBuoyancy = Math.pow(Math.max(0.01, gravityG), 0.35);
            const flameH = (baseRadius * (1.6 + gBuoyancy * 1.35) + flicker);

            // 3. Convective Necking: Base constricts inward at high G due to intense radial air entrainment
            const neckingFactor = 1 / (1 + Math.max(0, gravityG - 1.0) * 0.055);
            const effectiveBaseW = baseRadius * 0.75 * neckingFactor;

            // 4. Buoyant resistance to horizontal ventilation tilt
            const tiltX = windShiftX * (0.65 / (1 + gravityG * 0.35));

            ctx.save();
            ctx.translate(flameCenterX + tiltX, wickTopY);

            // Spawn upward soot particles accelerated by buoyant chimney updraft
            if (Math.random() < 0.28 * (1 + Math.min(gravityG, 6) * 0.25) && particlesRef.current.length < 55) {
              particlesRef.current.push({
                x: flameCenterX + tiltX + (Math.random() - 0.5) * effectiveBaseW * 0.7,
                y: wickTopY - flameH * 0.88,
                vx: (Math.random() - 0.5) * 0.8 + tiltX * 0.04,
                vy: -(1.6 + gravityG * 0.7 + Math.random() * 1.4),
                size: Math.random() * 2 + 1,
                alpha: 0.9,
                maxLife: 28 + Math.random() * 18,
                life: 0,
                color: Math.random() > 0.4 ? '#f97316' : '#fbbf24',
                type: 'soot',
              });
            }

            // A. Blue Basal Flame Cup (Around the wick)
            ctx.beginPath();
            ctx.arc(0, 0, effectiveBaseW * 0.55, 0, Math.PI);
            ctx.fillStyle = gravityG >= 5 ? 'rgba(59, 130, 246, 0.98)' : 'rgba(37, 99, 235, 0.92)';
            ctx.fill();

            // B. Main Luminous Candle Flame Body (Constricted at base, elongated at tip)
            ctx.beginPath();
            ctx.moveTo(-effectiveBaseW, 3 * scaleFactor);
            ctx.quadraticCurveTo(-effectiveBaseW * 0.85, -flameH * 0.45, 0, -flameH);
            ctx.quadraticCurveTo(effectiveBaseW * 0.85, -flameH * 0.45, effectiveBaseW, 3 * scaleFactor);
            ctx.closePath();

            const buoyGrad = ctx.createLinearGradient(0, 3 * scaleFactor, 0, -flameH);
            buoyGrad.addColorStop(0, 'rgba(30, 64, 175, 0.96)');
            buoyGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.98)');
            buoyGrad.addColorStop(0.42, 'rgba(253, 224, 71, 0.98)');
            buoyGrad.addColorStop(0.78, 'rgba(249, 115, 22, 0.94)');
            buoyGrad.addColorStop(1, gravityG >= 4 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.15)');
            ctx.fillStyle = buoyGrad;
            ctx.fill();

            // C. Inner White-Hot Reaction Core
            ctx.beginPath();
            ctx.moveTo(-effectiveBaseW * 0.45, 0);
            ctx.quadraticCurveTo(-effectiveBaseW * 0.35, -flameH * 0.35, 0, -flameH * 0.68);
            ctx.quadraticCurveTo(effectiveBaseW * 0.35, -flameH * 0.35, effectiveBaseW * 0.45, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.fill();

            ctx.restore();
          }
        }
      };

      // Draw particle sparks
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Render the pure NASA CFM Specimen Candle Chamber
      renderChamberPhysicalFlame(height * 0.58, 0.72);

      // Interactive Sensor Crosshair Probe
      if (mousePos) {
        const mx = mousePos.x;
        const my = mousePos.y;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, height);
        ctx.moveTo(0, my);
        ctx.lineTo(width, my);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reticle ring
        ctx.beginPath();
        ctx.arc(mx, my, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mx + 12, my - 24, 135, 24, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`SENSOR: ${Math.round(flameTempK)}K • ${ventilationSpeed}m/s`, mx + 16, my - 9);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [effectivelyBurning, gravityG, ventilationSpeed, fuel, sparkAnimation, starvationProgress, flameZoomScale, flameGlowMode, mousePos, flameTempK]);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
      {/* Top Header: Pure Candle Chamber Indicator & Status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold shadow-sm">
            <span className="text-sm">🕯️</span>
            <span>NASA CFM CANDLE COMBUSTION CHAMBER</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
            SPECIMEN #01
          </span>
        </div>

        {/* Status tag */}
        <div className="flex items-center gap-2">
          {isSuffocated ? (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              SMOTHERED IN CO₂ BUBBLE
            </span>
          ) : isSilaneAutoIgnited ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
              PYROPHORIC AUTO-IGNITION
            </span>
          ) : !canCombust ? (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              NON-FLAMMABLE
            </span>
          ) : isIgnited ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              FLAME ACTIVE
            </span>
          ) : (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Interactive G-Force Controller (0.0G Microgravity to 10.0G Hypergravity) */}
      <div className="flex items-center justify-between pb-2 pt-0.5 text-[11px] font-mono border-b border-slate-800/60 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>G-Control:</span>
          </div>

          {/* Quick Presets: 0G, 0.16G, 0.38G, 1G, 3G, 5G, 10G */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onGravityChange?.(0.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all font-bold ${
                gravityG === 0
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="0.0G Microgravity (Null-G Sphere)"
            >
              0G Null
            </button>
            <button
              onClick={() => onGravityChange?.(0.16)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 0.16) < 0.05
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="0.16G Lunar Surface"
            >
              0.16G Moon
            </button>
            <button
              onClick={() => onGravityChange?.(1.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 1.0) < 0.05
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="1.0G Earth Normal (Classic Teardrop)"
            >
              1G Earth
            </button>
            <button
              onClick={() => onGravityChange?.(3.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 3.0) < 0.1
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="3.0G Rocket Launch Max-Q"
            >
              3G Launch
            </button>
            <button
              onClick={() => onGravityChange?.(5.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                Math.abs(gravityG - 5.0) < 0.1
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="5.0G Fighter Jet Centrifuge"
            >
              5G Jet
            </button>
            <button
              onClick={() => onGravityChange?.(10.0)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all font-bold ${
                Math.abs(gravityG - 10.0) < 0.1
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-950'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
              title="10.0G Hypergravity Extreme"
            >
              10G Hyper
            </button>
          </div>

          {/* Steppers: [-0.5G] [+0.5G] */}
          {onGravityChange && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onGravityChange(Math.max(0, Number((gravityG - 0.5).toFixed(1))))}
                className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                title="Decrease 0.5G"
              >
                -0.5g
              </button>
              <button
                onClick={() => onGravityChange(Math.min(10, Number((gravityG + 0.5).toFixed(1))))}
                className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                title="Increase 0.5G"
              >
                +0.5g
              </button>
            </div>
          )}
        </div>

        {/* Live G Slider & Readout */}
        <div className="flex items-center gap-2 ml-auto">
          {onGravityChange && (
            <div className="flex items-center gap-1.5 w-24 sm:w-32">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={gravityG}
                onChange={(e) => onGravityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                title="Drag to smoothly vary G-force between 0.0g and 10.0g"
              />
            </div>
          )}

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              gravityG === 0
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : gravityG === 1
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : gravityG >= 10
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {gravityG === 0 ? '0.00g (Microgravity)' : gravityG >= 10 ? '10.00g (Hyper-G)' : `${gravityG.toFixed(2)}g`}
          </span>
        </div>
      </div>

      {/* Flame & Candle Visibility Bar (Wide Zoom Out Controls) */}
      <div className="flex items-center justify-between pb-1.5 text-[11px] font-mono text-slate-300 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-amber-300 font-bold flex items-center gap-1.5">
            <span className="text-sm">🕯️</span> Camera & Flame Zoom:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {/* Step Zoom Out button */}
            <button
              onClick={() => setFlameZoomScale((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
              title="Zoom Out Camera"
              className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-all flex items-center justify-center"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom presets */}
            <button
              onClick={() => setFlameZoomScale(0.5)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                flameZoomScale === 0.5
                  ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0.5x (Ultra Wide)
            </button>
            <button
              onClick={() => setFlameZoomScale(0.65)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                flameZoomScale === 0.65
                  ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0.65x (Zoomed Out)
            </button>
            <button
              onClick={() => setFlameZoomScale(0.85)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                flameZoomScale === 0.85
                  ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0.85x (Balanced)
            </button>
            <button
              onClick={() => setFlameZoomScale(1.1)}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                flameZoomScale === 1.1
                  ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1.1x (Focus)
            </button>

            {/* Step Zoom In button */}
            <button
              onClick={() => setFlameZoomScale((prev) => Math.min(1.8, Number((prev + 0.15).toFixed(2))))}
              title="Zoom In"
              className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-all flex items-center justify-center"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Zoom percentage badge */}
            <span className="text-[9px] text-amber-400/90 font-mono px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
              {Math.round(flameZoomScale * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {/* Dynamic Audio Feedback Control */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
            <button
              onClick={toggleFlameAudio}
              title="Toggle Dynamic Thermal Acoustic Feedback"
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                flameAudioEnabled
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {flameAudioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{flameAudioEnabled ? 'Flame Audio' : 'Audio Muted'}</span>

              {/* Pulsing Acoustic Equalizer Bars */}
              {flameAudioEnabled && effectivelyBurning && (
                <div className="flex items-end gap-0.5 h-3 w-3 ml-0.5" title="Acoustic Intensity">
                  <span
                    className="w-0.5 bg-cyan-400 rounded-sm animate-pulse"
                    style={{ height: `${Math.max(25, Math.min(100, liveAudioMetrics.volumePct * 0.9))}%` }}
                  />
                  <span
                    className="w-0.5 bg-amber-400 rounded-sm animate-pulse"
                    style={{
                      height: `${Math.max(35, Math.min(100, (liveAudioMetrics.pitchHz / 200) * 100))}%`,
                      animationDelay: '120ms',
                    }}
                  />
                  <span
                    className="w-0.5 bg-rose-400 rounded-sm animate-pulse"
                    style={{
                      height: `${Math.max(20, Math.min(100, ventilationSpeed * 80 + 20))}%`,
                      animationDelay: '240ms',
                    }}
                  />
                </div>
              )}
            </button>

            {/* Dynamic Pitch & Air Hiss Readout */}
            {flameAudioEnabled && effectivelyBurning && (
              <span className="text-[9px] font-mono text-cyan-300/90 pl-1 border-l border-slate-800">
                {liveAudioMetrics.pitchHz} Hz • {ventilationSpeed > 0 ? `${(ventilationSpeed * 100).toFixed(0)}% hiss` : 'pure hum'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Radiance:</span>
            <button
              onClick={() => setFlameGlowMode(flameGlowMode === 'ultra' ? 'vivid' : 'ultra')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                flameGlowMode === 'ultra'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-900/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {flameGlowMode === 'ultra' ? '✨ HDR Glow' : 'Standard'}
            </button>
          </div>
        </div>
      </div>

      {/* Pure Candle Chamber Viewport */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-inner group">
        <canvas
          ref={canvasRef}
          width={720}
          height={405}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full object-cover block cursor-crosshair"
        />

        {/* Live Telemetry Badge */}
        <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 flex-wrap">
          <span>CFM Candle: <strong className="text-amber-300">Paraffin Pillar (Mass: 100%)</strong></span>
          <span>Chamber Temp: <strong className="text-amber-300">{effectivelyBurning ? `${flameTempK} K` : '298 K'}</strong></span>
          <span>Acoustic Pitch: <strong className="text-cyan-300">{effectivelyBurning ? `${liveAudioMetrics.pitchHz} Hz` : '0 Hz'}</strong></span>
          <span>Ventilation Flow: <strong className="text-slate-300">{ventilationSpeed > 0 ? `${ventilationSpeed.toFixed(1)} m/s` : 'Quiescent'}</strong></span>
          <span>Flame Mode: <strong className={effectivelyBurning ? 'text-emerald-400' : 'text-slate-500'}>{effectivelyBurning ? (gravityG === 0 ? 'Zero-G Blue Sphere' : '1-G Buoyant Flame') : 'Standby'}</strong></span>
        </div>
      </div>

      {/* Atmospheric Chemistry & Airflow Sliders (O2, CO2, Airflow) with Live Flame Response */}
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/30 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Atmospheric Composition & Airflow Controls: Real-Time Flame Response
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            Live Flame Physics Active
          </span>
        </div>

        {/* 3 Interactive Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SLIDER 1: Oxygen Concentration (O2) */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                Oxygen (O₂)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {o2.toFixed(1)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={gases.O2 || 0}
              onChange={(e) => onGasChange?.('O2', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
              <button
                onClick={() => onGasChange?.('O2', 0)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="0% O2: Complete absence of oxidizer"
              >
                0%
              </button>
              <button
                onClick={() => onGasChange?.('O2', 12)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="12% O2: Limiting Oxygen Concentration threshold"
              >
                12% LOC
              </button>
              <button
                onClick={() => onGasChange?.('O2', 21)}
                className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                title="21% O2: Earth Sea-Level Nominal"
              >
                21% Earth
              </button>
              <button
                onClick={() => onGasChange?.('O2', 34)}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                title="34% O2: Elevated Spacecraft Exploration Atmosphere"
              >
                34% High
              </button>
              <button
                onClick={() => onGasChange?.('O2', 100)}
                className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                title="100% O2: Apollo 1 Pure Oxygen Flash Risk"
              >
                100% Apollo
              </button>
            </div>

            {/* Simulated Flame Response */}
            <div className="text-[10px] font-mono text-slate-300 italic pt-1 border-t border-slate-800/80">
              {o2 < 11
                ? '🔴 Flame Response: Oxygen is below LOC (<11%). Candle flame is quenched and cannot burn.'
                : o2 <= 16
                ? '🔵 Flame Response: Hypoxic regime. Faint, sluggish violet-blue chemiluminescent shell with low heat.'
                : o2 <= 25
                ? '🟢 Flame Response: Nominal combustion. Stable balance between vaporized paraffin fuel and oxidizer.'
                : '⚡ Flame Response: Hyperoxia! Expanded reaction volume, diamond-bright core, rapid burning (>2000K).'}
            </div>
          </div>

          {/* SLIDER 2: Carbon Dioxide Concentration (CO2) */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Carbon Dioxide (CO₂)
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {(gases.CO2 || 0).toFixed(1)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="40"
              step="0.2"
              value={gases.CO2 || 0}
              onChange={(e) => onGasChange?.('CO2', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
              <button
                onClick={() => onGasChange?.('CO2', 0.04)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="0.04% CO2: Earth Ambient Atmosphere"
              >
                0.04%
              </button>
              <button
                onClick={() => onGasChange?.('CO2', 0.4)}
                className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                title="0.4% CO2: ISS Nominal Scrubbed Cabin"
              >
                0.4% ISS
              </button>
              <button
                onClick={() => onGasChange?.('CO2', 5)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="5% CO2: Scrubbing Failure / Crew Headache"
              >
                5% Damped
              </button>
              <button
                onClick={() => onGasChange?.('CO2', 15)}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                title="15% CO2: Severe Flame Choking"
              >
                15% Choke
              </button>
              <button
                onClick={() => onGasChange?.('CO2', 35)}
                className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                title="35% CO2: Total Flame Quenching Blanket"
              >
                35% Quench
              </button>
            </div>

            {/* Simulated Flame Response */}
            <div className="text-[10px] font-mono text-slate-300 italic pt-1 border-t border-slate-800/80">
              {co2 < 1
                ? '🟢 Flame Response: Low CO₂. High flame radiance and standard heat transfer.'
                : co2 <= 6
                ? '🟡 Flame Response: Moderate thermal ballast. High molar heat capacity absorbs heat and cools fringe.'
                : co2 <= 20
                ? '🟠 Flame Response: Heavy thermal quenching. Flame shrinks noticeably and luminous soot dims.'
                : '🔴 Flame Response: Extinction blanket (>20% CO₂). Thermal loss exceeds reaction heat; flame dies.'}
            </div>
          </div>

          {/* SLIDER 3: Airflow Velocity */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Airflow Velocity
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {ventilationSpeed.toFixed(2)} m/s
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1.5"
              step="0.02"
              value={ventilationSpeed}
              onChange={(e) => onVentilationChange?.(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
              <button
                onClick={() => onVentilationChange?.(0.0)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="0.0 m/s: Zero forced airflow"
              >
                0.0 (Stagnant)
              </button>
              <button
                onClick={() => onVentilationChange?.(0.15)}
                className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                title="0.15 m/s: Standard ISS Cabin Fans"
              >
                0.15 (ISS)
              </button>
              <button
                onClick={() => onVentilationChange?.(0.5)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="0.50 m/s: Moderate Forced Air Draft"
              >
                0.50 (Draft)
              </button>
              <button
                onClick={() => onVentilationChange?.(1.0)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="1.00 m/s: High-Speed Cabin Wind"
              >
                1.00 (Gale)
              </button>
            </div>

            {/* Simulated Flame Response */}
            <div className="text-[10px] font-mono text-slate-300 italic pt-1 border-t border-slate-800/80">
              {gravityG === 0
                ? ventilationSpeed === 0
                  ? '⚠️ Flame Response: 0-G Stagnant! Flame forms a calm sphere and suffocates in its own CO₂ bubble.'
                  : `💨 Flame Response: Forced convection delivers O₂! Flame stretches into an aerodynamic tail ${(ventilationSpeed * 100).toFixed(0)}cm/s downwind.`
                : ventilationSpeed === 0
                ? '🕯️ Flame Response: Pure natural buoyancy. Flame stands vertically as a classic flickering teardrop.'
                : `🌬️ Flame Response: Crosswind deflection. Horizontal airflow tilts the buoyant teardrop sideways by ${(ventilationSpeed * 28).toFixed(0)}°.'`}
            </div>
          </div>
        </div>

        {/* Live Integrated Flame Physical Response Status Bar */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-cyan-300">Simulated Flame Physical State:</span>
            <span className="text-slate-200">
              {!effectivelyBurning
                ? isSuffocated
                  ? 'Suffocated in CO₂ blanket (Turn on ventilation fans or re-ignite)'
                  : !canCombust
                  ? 'Non-combustible atmosphere (O₂ < 11% or heavy suppressant/CO₂)'
                  : 'Standby on wick (Spark to ignite)'
                : gravityG === 0
                ? ventilationSpeed === 0
                  ? `0-G Quiescent Blue Sphere (Radius: ${(3.2 * Math.max(0.4, (o2 / 21))).toFixed(1)}mm) · Self-smothering in CO₂ (Starvation: ${Math.round(starvationProgress)}%)`
                  : `0-G Aerodynamic Convective Wake · Elongated tail fed by ${ventilationSpeed} m/s airflow streamline`
                : `${gravityG >= 5 ? 'Hypergravity Constricted Torch' : 'Buoyant Flickering Teardrop'} · Height: ${(5.5 * Math.pow(Math.max(0.1, gravityG), 0.35)).toFixed(1)}mm · Necking: ${Math.min(65, Math.round(Math.sqrt(gravityG) * 20))}% · Airflow tilt: ${ventilationSpeed > 0 ? `${(ventilationSpeed * 100).toFixed(0)}cm/s` : 'Zero'}`}
            </span>
          </div>
          {effectivelyBurning && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {flameTempK} K
            </span>
          )}
        </div>
      </div>

      {/* Astronomy Cadet Look-Up */}
      {isBeginnerMode && (
        <div className="mt-1 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs text-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-300 font-mono">Astronomy Cadet Look-Up:</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono ml-auto">
              NASA Candle Flame in Microgravity (CFM)
            </span>
          </div>
          {gravityG === 0 ? (
            ventilationSpeed === 0 ? (
              <p className="leading-relaxed text-slate-300">
                Notice how fire in zero-g forms a <b>calm glowing blue ball</b>! Without gravity, hot air does not rise, so fresh oxygen reaches the candle wick solely through slow molecular diffusion. Without ventilation fans, the flame gently suffocates in its own carbon dioxide bubble!
              </p>
            ) : (
              <p className="leading-relaxed text-slate-300">
                The spaceship air vent is on! Fresh air pushes from left to right at {ventilationSpeed} m/s. The spherical blue flame deforms into an aerodynamic wake oriented downwind along the airflow streamlines!
              </p>
            )
          ) : (
            <p className="leading-relaxed text-slate-300">
              Under {gravityG}g gravity, buoyant hot air rises rapidly like a hot-air balloon, drawing in fresh air at the candle base and shaping the familiar tall flickering yellow teardrop!
            </p>
          )}
        </div>
      )}

      {/* Chamber Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <button
          onClick={handleSparkTrigger}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono transition-all active:scale-95 ${
            isIgnited
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          {isIgnited ? 'Extinguish Flame' : 'Trigger Spark Arc'}
        </button>

        <button
          onClick={onCutVentilation}
          disabled={ventilationSpeed === 0}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono border transition-all active:scale-95 ${
            ventilationSpeed === 0
              ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/40 text-amber-300'
          }`}
        >
          <Wind className="w-4 h-4" />
          Cut Fans (0.0 m/s)
        </button>

        <button
          onClick={onPurgeChamber}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Purge with 100% N₂
        </button>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <div className="flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1.5 text-cyan-400" />
            <span>Threat: <strong className="text-white">{dangerLevel}</strong></span>
          </div>
          {isAlarmActive && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
};
