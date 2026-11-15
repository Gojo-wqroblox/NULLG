/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SmoothPlanetaryLoginCanvas.tsx
 * Inspired by CIPHERSLAB "Smooth UI Animation for Modern Website Design"
 * A high-fidelity animated celestial planet rising from the horizon with:
 * - Radiant atmospheric corona and Rayleigh limb scattering
 * - Procedural planetary surface texture with animated orbital cloud rotation
 * - Orbital trajectory arcs with animated glowing satellites / telemetry markers
 * - Multi-destination support (01 VENUS, 02 EARTH, 03 MARS, 04 NULL-G STATION)
 * - Deep space twinkling starfield and cosmic dust nebulae
 * - Interactive mouse parallax tilt
 */

import React, { useRef, useEffect } from 'react';

export interface PlanetaryDestination {
  id: 'venus' | 'earth' | 'mars' | 'nullg';
  number: string;
  name: string;
  tagline: string;
  orbitalAltitude: string;
  gravityText: string;
  atmosphereComposition: string;
  baseColor: string;
  rimColor: string;
  coronaColor: string;
  coronaOuter: string;
}

export const PLANETARY_DESTINATIONS: PlanetaryDestination[] = [
  {
    id: 'venus',
    number: '01',
    name: 'VENUS',
    tagline: 'SUPER-ROTATING SULFURIC ATMOSPHERE • HIGH DENSITY COMBUSTION',
    orbitalAltitude: '320 KM APOGEE',
    gravityText: '0.904 G',
    atmosphereComposition: '96.5% CO₂ • 3.5% N₂ • SO₂ CLOUDS',
    baseColor: '#eab308',
    rimColor: '#fde047',
    coronaColor: 'rgba(234, 179, 8, 0.45)',
    coronaOuter: 'rgba(245, 158, 11, 0)',
  },
  {
    id: 'earth',
    number: '02',
    name: 'EARTH',
    tagline: 'LOW EARTH ORBIT (ISS EXPEDITION 71) • STANDARD 1-G REFERENCE',
    orbitalAltitude: '408 KM LEO',
    gravityText: '1.000 G (SURFACE) / 0-G (ORBIT)',
    atmosphereComposition: '78.1% N₂ • 20.9% O₂ • 0.93% Ar',
    baseColor: '#0284c7',
    rimColor: '#38bdf8',
    coronaColor: 'rgba(56, 189, 248, 0.55)',
    coronaOuter: 'rgba(14, 165, 233, 0)',
  },
  {
    id: 'mars',
    number: '03',
    name: 'MARS',
    tagline: 'THIN DUSTY ATMOSPHERE • LOW-PRESSURE COMBUSTION BOUNDARY',
    orbitalAltitude: '250 KM LMO',
    gravityText: '0.379 G',
    atmosphereComposition: '95.3% CO₂ • 2.6% N₂ • 1.9% Ar',
    baseColor: '#ea580c',
    rimColor: '#fb923c',
    coronaColor: 'rgba(249, 115, 22, 0.45)',
    coronaOuter: 'rgba(194, 65, 12, 0)',
  },
  {
    id: 'nullg',
    number: '04',
    name: 'NULL-G',
    tagline: 'DEEP SPACE EXPERIMENT MODULE • ZERO BUOYANCY COMBUSTION PROTOCOL',
    orbitalAltitude: 'LAGRANGE L2',
    gravityText: '0.000 G (PURE ZERO-G)',
    atmosphereComposition: 'VARIABLE O₂/N₂/SF₆ CHAMBERS',
    baseColor: '#6366f1',
    rimColor: '#818cf8',
    coronaColor: 'rgba(99, 102, 241, 0.50)',
    coronaOuter: 'rgba(79, 70, 229, 0)',
  },
];

interface SmoothPlanetaryLoginCanvasProps {
  activeDestinationId: 'venus' | 'earth' | 'mars' | 'nullg';
  onDestinationChange?: (dest: PlanetaryDestination) => void;
}

export const SmoothPlanetaryLoginCanvas: React.FC<SmoothPlanetaryLoginCanvasProps> = ({
  activeDestinationId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const activeDest = PLANETARY_DESTINATIONS.find((d) => d.id === activeDestinationId) || PLANETARY_DESTINATIONS[0];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (e.clientX / innerWidth - 0.5) * 40;
      mousePos.current.targetY = (e.clientY / innerHeight - 0.5) * 30;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    // Pre-generate static stars with varying magnitudes
    const starCount = 180;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.8 + 0.4,
      blinkSpeed: 1 + Math.random() * 3,
      alphaBase: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.8 ? '#7dd3fc' : Math.random() > 0.6 ? '#fef08a' : '#ffffff',
    }));

    // Satellites traveling along orbital arcs
    const satellites = [
      { progress: 0.15, speed: 0.0018, size: 2.5, label: 'ISS-EXP71' },
      { progress: 0.62, speed: 0.0012, size: 2.0, label: 'CFM-DRONE' },
      { progress: 0.88, speed: 0.0022, size: 1.8, label: 'ORBITER-B' },
    ];

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.016;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w || !h) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 1. Deep Space Radial Background with Cosmic Nebula Gradient
      const spaceGrad = ctx.createRadialGradient(
        w / 2,
        h * 0.7,
        100,
        w / 2,
        h * 0.7,
        Math.max(w, h)
      );
      spaceGrad.addColorStop(0, '#040b19');
      spaceGrad.addColorStop(0.5, '#020611');
      spaceGrad.addColorStop(1, '#010307');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Twinkling Stars
      stars.forEach((star) => {
        const sx = star.x * w + mousePos.current.x * 0.15;
        const sy = star.y * h * 0.75 + mousePos.current.y * 0.15;
        const twinkle = Math.sin(time * star.blinkSpeed + star.x * 20) * 0.35 + 0.65;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alphaBase * twinkle;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Planetary Horizon Geometry
      // The planet center is situated below the bottom of the canvas so the upper curve forms the horizon
      const planetRadius = Math.min(w * 0.68, 560);
      const planetCenterX = w / 2 + mousePos.current.x * 0.4;
      const planetCenterY = h * 0.94 + planetRadius * 0.68 + mousePos.current.y * 0.4;

      // 4. Volumetric Corona / Atmospheric Rayleigh Outer Glow (Behind Planet)
      const coronaRadius = planetRadius * 1.45;
      const coronaGrad = ctx.createRadialGradient(
        planetCenterX,
        planetCenterY,
        planetRadius * 0.88,
        planetCenterX,
        planetCenterY,
        coronaRadius
      );
      coronaGrad.addColorStop(0, activeDest.coronaColor);
      coronaGrad.addColorStop(0.35, activeDest.coronaColor.replace('0.45', '0.22').replace('0.55', '0.25').replace('0.50', '0.22'));
      coronaGrad.addColorStop(0.75, activeDest.coronaColor.replace('0.45', '0.08').replace('0.55', '0.10').replace('0.50', '0.08'));
      coronaGrad.addColorStop(1, activeDest.coronaOuter);

      ctx.save();
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, coronaRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Planetary Body Surface
      ctx.save();
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, planetRadius, 0, Math.PI * 2);
      ctx.clip();

      // Base planetary fill
      const planetSurfaceGrad = ctx.createRadialGradient(
        planetCenterX - planetRadius * 0.3,
        planetCenterY - planetRadius * 0.6,
        planetRadius * 0.1,
        planetCenterX,
        planetCenterY,
        planetRadius
      );

      if (activeDest.id === 'venus') {
        planetSurfaceGrad.addColorStop(0, '#fef08a');
        planetSurfaceGrad.addColorStop(0.25, '#eab308');
        planetSurfaceGrad.addColorStop(0.65, '#ca8a04');
        planetSurfaceGrad.addColorStop(0.9, '#854d0e');
        planetSurfaceGrad.addColorStop(1, '#422006');
      } else if (activeDest.id === 'earth') {
        planetSurfaceGrad.addColorStop(0, '#bae6fd');
        planetSurfaceGrad.addColorStop(0.2, '#38bdf8');
        planetSurfaceGrad.addColorStop(0.5, '#0284c7');
        planetSurfaceGrad.addColorStop(0.85, '#0f172a');
        planetSurfaceGrad.addColorStop(1, '#020617');
      } else if (activeDest.id === 'mars') {
        planetSurfaceGrad.addColorStop(0, '#fed7aa');
        planetSurfaceGrad.addColorStop(0.25, '#fb923c');
        planetSurfaceGrad.addColorStop(0.6, '#ea580c');
        planetSurfaceGrad.addColorStop(0.85, '#9a3412');
        planetSurfaceGrad.addColorStop(1, '#431407');
      } else {
        // NULL-G Orbital Station
        planetSurfaceGrad.addColorStop(0, '#c7d2fe');
        planetSurfaceGrad.addColorStop(0.25, '#818cf8');
        planetSurfaceGrad.addColorStop(0.6, '#4f46e5');
        planetSurfaceGrad.addColorStop(0.85, '#1e1b4b');
        planetSurfaceGrad.addColorStop(1, '#09090b');
      }

      ctx.fillStyle = planetSurfaceGrad;
      ctx.fill();

      // Animated rotating cloud / atmospheric current bands
      const cloudSpeed = time * 0.05;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 14;
      for (let i = 0; i < 6; i++) {
        const bandY = planetCenterY - planetRadius * (0.85 - i * 0.28);
        const wave = Math.sin(cloudSpeed * 2 + i) * 18;
        ctx.beginPath();
        ctx.moveTo(planetCenterX - planetRadius, bandY + wave);
        ctx.bezierCurveTo(
          planetCenterX - planetRadius * 0.4,
          bandY - 15 + wave,
          planetCenterX + planetRadius * 0.4,
          bandY + 15 + wave,
          planetCenterX + planetRadius,
          bandY + wave
        );
        ctx.stroke();
      }

      // Night-side dark terminator shadow
      const terminatorGrad = ctx.createLinearGradient(
        planetCenterX,
        planetCenterY - planetRadius,
        planetCenterX,
        planetCenterY + planetRadius * 0.5
      );
      terminatorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      terminatorGrad.addColorStop(0.45, 'rgba(2, 6, 23, 0.45)');
      terminatorGrad.addColorStop(0.8, 'rgba(2, 6, 23, 0.95)');
      terminatorGrad.addColorStop(1, '#020617');
      ctx.fillStyle = terminatorGrad;
      ctx.fillRect(planetCenterX - planetRadius, planetCenterY - planetRadius, planetRadius * 2, planetRadius * 2);

      ctx.restore();

      // 6. Radiant Limb / Atmospheric Rim Glow (The bright horizon edge)
      ctx.save();
      ctx.strokeStyle = activeDest.rimColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = activeDest.rimColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, planetRadius, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Secondary fine razor edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, planetRadius, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
      ctx.restore();

      // 7. Orbital Trajectory Ellipses & Animated Satellites
      ctx.save();
      const orbitRx = planetRadius * 1.25;
      const orbitRy = planetRadius * 0.38;
      const orbitTilt = -0.18;

      ctx.translate(planetCenterX, planetCenterY - planetRadius * 0.15);
      ctx.rotate(orbitTilt);

      // Trajectory dashed elliptical ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellites traversing the orbit
      satellites.forEach((sat) => {
        sat.progress = (sat.progress + sat.speed) % 1.0;
        const angle = sat.progress * Math.PI * 2;
        const satX = Math.cos(angle) * orbitRx;
        const satY = Math.sin(angle) * orbitRy;

        // Draw satellite dot with glowing pulse
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(satX, satY, sat.size, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing radar ping
        const pingR = (time * 12 + sat.progress * 40) % 14;
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - pingR / 14) * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(satX, satY, pingR, 0, Math.PI * 2);
        ctx.stroke();

        // Telemetry tag
        ctx.shadowBlur = 0;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.fillText(sat.label, satX + 6, satY - 4);
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [activeDest]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
