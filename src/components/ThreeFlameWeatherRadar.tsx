import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Radar,
  Thermometer,
  Wind,
  ShieldAlert,
  Compass,
  Layers,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  Sparkles,
  Zap,
  RotateCcw,
  Gauge,
  Activity,
  Flame,
} from 'lucide-react';
import { FuelDefinition, GasDefinition } from '../types';

export interface ThreeFlameWeatherRadarProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number; // m/s
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  flameTempK: number;
  dangerLevel: string;
  isGuestMode: boolean;
}

interface SensorProbeData {
  id: string;
  name: string;
  type: 'thermal' | 'oxygen' | 'doppler' | 'radical';
  position: [number, number, number];
  color: string;
  metricLabel: string;
  value: string;
  unit: string;
  weatherInterpretation: string;
  stormAlert: string;
}

export const ThreeFlameWeatherRadar: React.FC<ThreeFlameWeatherRadarProps> = ({
  gases,
  pressureKpa,
  gravityG,
  ventilationSpeed,
  fuel,
  isIgnited,
  onToggleIgnite,
  flameTempK,
  dangerLevel,
  isGuestMode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Audio Context Ref for procedural radar ping
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // 3D Visualization Layer Toggles
  const [showHeatSurfaces, setShowHeatSurfaces] = useState<boolean>(true);
  const [showOxygenIsobars, setShowOxygenIsobars] = useState<boolean>(true);
  const [showDopplerStreamlines, setShowDopplerStreamlines] = useState<boolean>(true);
  const [showRadarSweep, setShowRadarSweep] = useState<boolean>(true);
  const [showSensorBeams, setShowSensorBeams] = useState<boolean>(true);

  // Selected Sensor Probe for Deep Inspection
  const [selectedSensorId, setSelectedSensorId] = useState<string>('sensor_thermal');
  const [activeWeatherPattern, setActiveWeatherPattern] = useState<string>('Calm Stratified 0-G Eye');

  // Dynamic references for mutable animation parameters without remounting scene
  const paramsRef = useRef({
    gases,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    fuel,
    isIgnited,
    flameTempK,
    showHeatSurfaces,
    showOxygenIsobars,
    showDopplerStreamlines,
    showRadarSweep,
    showSensorBeams,
  });

  useEffect(() => {
    paramsRef.current = {
      gases,
      pressureKpa,
      gravityG,
      ventilationSpeed,
      fuel,
      isIgnited,
      flameTempK,
      showHeatSurfaces,
      showOxygenIsobars,
      showDopplerStreamlines,
      showRadarSweep,
      showSensorBeams,
    };
  }, [
    gases,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    fuel,
    isIgnited,
    flameTempK,
    showHeatSurfaces,
    showOxygenIsobars,
    showDopplerStreamlines,
    showRadarSweep,
    showSensorBeams,
  ]);

  // Gas Chemistry & Physical Calculations
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;

  const isSilaneAuto = sih4 > 1.2 && o2 > 10;
  const canCombust = (o2 >= 11 && novec <= 6 && sf6 <= 8 && co2 < 38) || isSilaneAuto;
  const effectivelyBurning = (isIgnited || isSilaneAuto) && canCombust;

  // Real-time Weather Classifications
  useEffect(() => {
    if (!effectivelyBurning) {
      setActiveWeatherPattern('Thermal Quench / Extinguished Void');
    } else if (gravityG === 0 && ventilationSpeed === 0) {
      setActiveWeatherPattern('Micro-Storm Eye: Self-Suffocating Stagnant Diffusion Bubble');
    } else if (gravityG === 0 && ventilationSpeed > 0) {
      setActiveWeatherPattern('Aerodynamic Jet-Stream Squall: Port-to-Starboard Convective Tail');
    } else if (gravityG > 0.5) {
      setActiveWeatherPattern('Thermal Updraft Vortex: High-Buoyancy Vertical Cyclone');
    } else if (sih4 > 1) {
      setActiveWeatherPattern('Pyrophoric Silica Storm: Spontaneous White Ignition Front');
    } else if (h2 > 5) {
      setActiveWeatherPattern('Invisible Violet Flash Front: Low-Quench Kinetic Gale');
    } else {
      setActiveWeatherPattern('Equilibrium Diffusion Cloud');
    }
  }, [effectivelyBurning, gravityG, ventilationSpeed, sih4, h2]);

  // Compute live sensor metrics
  const heatDissipationFlux = effectivelyBurning
    ? Math.round(5.67e-8 * Math.pow(flameTempK, 4) * 0.08)
    : 12; // W/m² Stefan-Boltzmann radiation
  const coreO2Depression = effectivelyBurning
    ? Math.max(0.4, Number((o2 * 0.12).toFixed(1)))
    : Number(o2.toFixed(1));
  const dopplerDriftSpeed = ventilationSpeed > 0
    ? Number((ventilationSpeed * 1.34).toFixed(2))
    : gravityG > 0
    ? Number((gravityG * 0.85).toFixed(2))
    : 0.02;

  const sensorSuite: SensorProbeData[] = [
    {
      id: 'sensor_thermal',
      name: 'Alpha Pyrometer Tower',
      type: 'thermal',
      position: [-2.4, 0.4, 2.2],
      color: '#f97316',
      metricLabel: 'Heat Dissipation Flux',
      value: `${heatDissipationFlux}`,
      unit: 'W/m²',
      weatherInterpretation:
        'Tracks the thermal wavefront radiating into the spacecraft module hull. High flux indicates severe thermal soaking risk.',
      stormAlert: heatDissipationFlux > 800 ? 'Extreme Thermal Front Active' : 'Thermal Dissipation Nominal',
    },
    {
      id: 'sensor_oxygen',
      name: 'Beta Oxygen Isobar Probe',
      type: 'oxygen',
      position: [2.4, 0.4, 2.2],
      color: '#06b6d4',
      metricLabel: 'Core Oxygen Depression',
      value: `${coreO2Depression}%`,
      unit: `(Ambient: ${o2.toFixed(1)}%)`,
      weatherInterpretation:
        'Measures oxygen depletion in the storm center. Low core O₂ creates a "low-pressure hurricane eye" that sucks fresh air inward.',
      stormAlert: coreO2Depression < 3 ? 'Oxygen Starvation Imminent (Eye Choking)' : 'Steady Oxidizer Inflow Stream',
    },
    {
      id: 'sensor_doppler',
      name: 'Gamma Doppler Velocimeter',
      type: 'doppler',
      position: [-2.4, 0.4, -2.2],
      color: '#10b981',
      metricLabel: 'Doppler Convective Drift',
      value: `${dopplerDriftSpeed}`,
      unit: 'm/s',
      weatherInterpretation:
        'Tracks the atmospheric wind vector carrying heated gas radicals, soot particles, and fire propagation momentum.',
      stormAlert: dopplerDriftSpeed > 0.4 ? 'Convective Shear High: Rapid Flame Elongation' : 'Laminar Diffusion Transport',
    },
    {
      id: 'sensor_radical',
      name: 'Delta OH* UV Spectrometer',
      type: 'radical',
      position: [2.4, 0.4, -2.2],
      color: '#8b5cf6',
      metricLabel: 'Excited Radical Ion Front',
      value: effectivelyBurning ? 'ACTIVE' : 'INERT',
      unit: '308 nm UV',
      weatherInterpretation:
        'Monitors high-energy hydroxyl (OH*) radicals at the reaction boundary. Marks the exact perimeter of the microgravity flame storm.',
      stormAlert: effectivelyBurning ? 'Combustion Wavefront Established' : 'Reaction Zone Extinguished',
    },
  ];

  const selectedSensor = sensorSuite.find((s) => s.id === selectedSensorId) || sensorSuite[0];

  // Procedural Web Audio Radar Ping Sound
  const playRadarChirp = useCallback(() => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio not permitted or background
    }
  }, [audioEnabled]);

  // Initialize Three.js 3D Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.06);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 2.8, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Studio Environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 14;
    controls.target.set(0, 1.15, 0);

    // 3. Lighting Rig (Warm Key Light, Cool Fill Light, Rim Backlight)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x06b6d4, 0x0f172a, 1.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // 4. Ground Telemetry Radar Base Grid & Azimuth Markings
    const gridHelper = new THREE.GridHelper(8, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Circular Range Rings (1m, 2m, 3m)
    [1.0, 2.0, 3.0].forEach((radius) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.01, radius + 0.01, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      scene.add(ringMesh);
    });

    // 5. Burner Stage & 3D Candle Pedestal Assembly
    const pedestalGroup = new THREE.Group();
    // Base platform
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.15, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    pedestalGroup.add(baseMesh);

    // Gimbal mounting collar
    const collarGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.2, 32);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.y = 0.17;
    pedestalGroup.add(collarMesh);

    // Realistic 3D Ivory Paraffin Candle Wax Column
    const candleWaxGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.65, 32);
    const candleWaxMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      roughness: 0.35,
      metalness: 0.05,
      emissive: 0xffedd5,
      emissiveIntensity: 0.2,
    });
    const candleWaxMesh = new THREE.Mesh(candleWaxGeo, candleWaxMat);
    candleWaxMesh.position.y = 0.52;
    pedestalGroup.add(candleWaxMesh);

    // Molten liquid wax top dish
    const moltenWaxGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.04, 32);
    const moltenWaxMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
    });
    const moltenWaxMesh = new THREE.Mesh(moltenWaxGeo, moltenWaxMat);
    moltenWaxMesh.position.y = 0.845;
    pedestalGroup.add(moltenWaxMesh);

    // Candle Braided Wick
    const wickGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.14, 16);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 0.92, 0);
    pedestalGroup.add(wickMesh);

    // Glowing Incandescent Wick Tip Ember
    const emberGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff3b00,
      emissiveIntensity: 4.5,
      roughness: 0.1,
    });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.set(0, 0.99, 0);
    pedestalGroup.add(emberMesh);

    scene.add(pedestalGroup);

    // 6. Zero-G Flame Storm Core Group (Magnified & Highly Visible)
    const stormCoreGroup = new THREE.Group();
    stormCoreGroup.position.set(0, 1.35, 0);
    scene.add(stormCoreGroup);

    // Flame Core Point Light (illuminates candle wax and stage!)
    const flamePointLight = new THREE.PointLight(0x38bdf8, 5.0, 12);
    stormCoreGroup.add(flamePointLight);

    // Inner reaction core sphere (enlarged for high visibility)
    const innerCoreGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    stormCoreGroup.add(innerCoreMesh);

    // Outer flame mantle (enlarged for dramatic presence)
    const outerMantleGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const outerMantleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf97316,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const outerMantleMesh = new THREE.Mesh(outerMantleGeo, outerMantleMat);
    stormCoreGroup.add(outerMantleMesh);

    // 7. Thermal Heat Dissipation Iso-surfaces (3 Concentric Atmospheric Fronts)
    const thermalGroup = new THREE.Group();
    thermalGroup.position.copy(stormCoreGroup.position);
    scene.add(thermalGroup);

    // Front 1: 1800K Core Shockwave
    const tFront1Geo = new THREE.SphereGeometry(0.75, 28, 28);
    const tFront1Mat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
    });
    const tFront1Mesh = new THREE.Mesh(tFront1Geo, tFront1Mat);
    thermalGroup.add(tFront1Mesh);

    // Front 2: 1000K Mid-Dissipation Boundary
    const tFront2Geo = new THREE.SphereGeometry(1.2, 28, 28);
    const tFront2Mat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.14,
      wireframe: true,
    });
    const tFront2Mesh = new THREE.Mesh(tFront2Geo, tFront2Mat);
    thermalGroup.add(tFront2Mesh);

    // Front 3: 500K Ambient Dissipation Horizon
    const tFront3Geo = new THREE.SphereGeometry(1.7, 24, 24);
    const tFront3Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
    });
    const tFront3Mesh = new THREE.Mesh(tFront3Geo, tFront3Mat);
    thermalGroup.add(tFront3Mesh);

    // 8. Oxygen Density Isobar Contour Planes
    const oxygenIsobarGroup = new THREE.Group();
    oxygenIsobarGroup.position.copy(stormCoreGroup.position);
    scene.add(oxygenIsobarGroup);

    // 3 Horizontal Isobar Slices at Y = -0.35, 0, +0.35
    [-0.35, 0, 0.35].forEach((yOffset) => {
      const isobarDiscGeo = new THREE.RingGeometry(0.5, 2.2, 32);
      const isobarDiscMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const isobarMesh = new THREE.Mesh(isobarDiscGeo, isobarDiscMat);
      isobarMesh.position.y = yOffset;
      isobarMesh.rotation.x = Math.PI / 2;
      oxygenIsobarGroup.add(isobarMesh);

      // Isobar concentric ring lines
      [0.8, 1.2, 1.6, 2.0].forEach((r) => {
        const contourLineGeo = new THREE.RingGeometry(r - 0.015, r + 0.015, 48);
        const contourLineMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });
        const contourMesh = new THREE.Mesh(contourLineGeo, contourLineMat);
        contourMesh.position.y = yOffset + 0.005;
        contourMesh.rotation.x = Math.PI / 2;
        oxygenIsobarGroup.add(contourMesh);
      });
    });

    // 9. 3D Volumetric Radar Scanning Beam (360-degree sweep fan)
    const radarSweepGroup = new THREE.Group();
    scene.add(radarSweepGroup);

    const radarSweepGeo = new THREE.CylinderGeometry(3.0, 0.05, 0.05, 32, 1, false, 0, Math.PI / 3);
    const radarSweepMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const radarSweepMesh = new THREE.Mesh(radarSweepGeo, radarSweepMat);
    radarSweepMesh.position.y = 0.85;
    radarSweepGroup.add(radarSweepMesh);

    // Vertical sweep blade line
    const sweepBladeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3.0, 0, 0),
    ]);
    const sweepBladeMat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2 });
    const sweepBladeLine = new THREE.Line(sweepBladeGeo, sweepBladeMat);
    sweepBladeLine.position.y = 0.85;
    radarSweepGroup.add(sweepBladeLine);

    // 10. Doppler Wind & Micro-Atmospheric Particle Streamlines
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 4.5;
      particlePositions[i * 3 + 1] = 0.2 + Math.random() * 2.0;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4.5;

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 11. Sensor Suite Array (4 physical procedural towers with targeting laser beams)
    const sensorTowersGroup = new THREE.Group();
    scene.add(sensorTowersGroup);

    const laserLinesGroup = new THREE.Group();
    scene.add(laserLinesGroup);

    sensorSuite.forEach((probe) => {
      const probeGroup = new THREE.Group();
      probeGroup.position.set(...probe.position);

      // Base collar
      const collarGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.12, 16);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      probeGroup.add(collar);

      // Mast
      const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.65, 16);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 0.38;
      probeGroup.add(mast);

      // Sensor gimbal housing
      const gimbalGeo = new THREE.BoxGeometry(0.22, 0.22, 0.26);
      const gimbalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
      const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
      gimbal.position.y = 0.75;
      probeGroup.add(gimbal);

      // Optical emitter lens
      const lensGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const lensMat = new THREE.MeshStandardMaterial({
        color: probe.color,
        emissive: probe.color,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, 0.75, 0.14);
      probeGroup.add(lens);

      sensorTowersGroup.add(probeGroup);

      // Sensor targeting laser line aimed at the flame storm core
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(probe.position[0], probe.position[1] + 0.75, probe.position[2]),
        new THREE.Vector3(0, 1.35, 0),
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: probe.color,
        transparent: true,
        opacity: 0.45,
      });
      const laserLine = new THREE.Line(laserGeo, laserMat);
      laserLinesGroup.add(laserLine);
    });

    // 12. Animation Game Loop
    let clock = new THREE.Clock();
    let sweepAngle = 0;
    let lastPingTime = 0;

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const p = paramsRef.current;

      // Update OrbitControls
      controls.update();

      // Gas-dependent flame chemistry colors
      let coreColorHex = 0x38bdf8;
      let mantleColorHex = 0xf97316;
      let isGhostH2 = (p.gases?.H2 || 0) > 4 && (p.gases?.CH4 || 0) < 4;
      let isPyrophoricSilane = (p.gases?.SiH4 || 0) > 1.2;
      let isPureO2Inferno = (p.gases?.O2 || 0) > 45;

      if (isPyrophoricSilane) {
        coreColorHex = 0xffffff;
        mantleColorHex = 0xa5f3fc;
      } else if (isGhostH2) {
        coreColorHex = 0xc084fc;
        mantleColorHex = 0xf472b6;
      } else if (isPureO2Inferno) {
        coreColorHex = 0xffffff;
        mantleColorHex = 0xfbbf24;
      }

      innerCoreMat.color.setHex(coreColorHex);
      innerCoreMat.emissive.setHex(coreColorHex);
      outerMantleMat.color.setHex(mantleColorHex);
      outerMantleMat.emissive.setHex(mantleColorHex);

      // Flame core visibility and morphology
      if (effectivelyBurning) {
        stormCoreGroup.visible = true;
        flamePointLight.intensity = 5.5 + Math.sin(time * 8) * 0.8;
        flamePointLight.color.setHex(coreColorHex);

        // Breathe pulsation
        const breathe = Math.sin(time * 3.5) * 0.06;
        const scaleBase = 1.0 + breathe;

        // Stretch downwind along X with ventilation speed
        const stretchX = 1.0 + p.ventilationSpeed * 2.2;
        const stretchY = p.gravityG > 0 ? 1.0 + p.gravityG * 1.8 : 1.0;
        const windShiftX = p.ventilationSpeed * 0.7;

        stormCoreGroup.scale.set(scaleBase * stretchX, scaleBase * stretchY, scaleBase);
        stormCoreGroup.position.set(windShiftX, 1.35 + (p.gravityG > 0 ? p.gravityG * 0.25 : 0), 0);
      } else {
        stormCoreGroup.visible = false;
        flamePointLight.intensity = 0;
      }

      // Thermal Iso-surfaces rotation and pulsing
      thermalGroup.visible = p.showHeatSurfaces && effectivelyBurning;
      if (thermalGroup.visible) {
        thermalGroup.position.copy(stormCoreGroup.position);
        thermalGroup.rotation.y = time * 0.15;
        const tPulse = 1.0 + Math.sin(time * 2.0) * 0.04;
        tFront1Mesh.scale.set(tPulse, tPulse, tPulse);
        tFront2Mesh.scale.set(1 / tPulse, 1 / tPulse, 1 / tPulse);
      }

      // Oxygen Isobars visibility
      oxygenIsobarGroup.visible = p.showOxygenIsobars;
      if (oxygenIsobarGroup.visible) {
        oxygenIsobarGroup.position.copy(stormCoreGroup.position);
        oxygenIsobarGroup.rotation.y = -time * 0.08;
      }

      // Radar Sweep Rotation (30 RPM)
      radarSweepGroup.visible = p.showRadarSweep;
      if (radarSweepGroup.visible) {
        sweepAngle = (sweepAngle + delta * 1.6) % (Math.PI * 2);
        radarSweepGroup.rotation.y = sweepAngle;

        // Trigger radar ping chirp every half rotation
        if (time - lastPingTime > 2.0) {
          lastPingTime = time;
          playRadarChirp();
        }
      }

      // Sensor Beams Visibility
      laserLinesGroup.visible = p.showSensorBeams && effectivelyBurning;

      // Doppler Wind Particle Animation
      particleSystem.visible = p.showDopplerStreamlines;
      if (particleSystem.visible) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        const ventSpeed = p.ventilationSpeed * 3.5;
        const gEffect = p.gravityG * 2.8;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // Forced convection wind shifts particles horizontally
          positions[idx] += (ventSpeed > 0 ? ventSpeed : 0.05) * delta + particleVelocities[i].x;

          // Gravity shifts particles vertically
          positions[idx + 1] += (gEffect > 0 ? gEffect * 0.35 : 0) * delta + particleVelocities[i].y;

          // Swirl towards storm center
          const dx = positions[idx] - stormCoreGroup.position.x;
          const dz = positions[idx + 2] - stormCoreGroup.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > 0.4 && dist < 2.5 && effectivelyBurning) {
            positions[idx] -= (dx / dist) * 0.25 * delta;
            positions[idx + 2] -= (dz / dist) * 0.25 * delta;
          }

          // Boundary wrap
          if (positions[idx] > 2.8) positions[idx] = -2.8;
          if (positions[idx + 1] > 3.0) positions[idx + 1] = 0.2;
          if (positions[idx + 1] < 0.1) positions[idx + 1] = 2.8;
          if (positions[idx + 2] > 2.8) positions[idx + 2] = -2.8;
          if (positions[idx + 2] < -2.8) positions[idx + 2] = 2.8;
        }

        particleGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Quick Camera Presets
  const setCameraPreset = (mode: 'orbit' | 'top' | 'cross' | 'sensor') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (mode === 'top') {
      camera.position.set(0, 7.5, 0.01);
      controls.target.set(0, 0.85, 0);
    } else if (mode === 'cross') {
      camera.position.set(0, 1.2, 5.8);
      controls.target.set(0, 0.85, 0);
    } else if (mode === 'sensor') {
      camera.position.set(-3.2, 2.2, 3.2);
      controls.target.set(0, 0.85, 0);
    } else {
      camera.position.set(0, 3.8, 6.2);
      controls.target.set(0, 0.5, 0);
    }
  };

  return (
    <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 overflow-hidden">
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
              NULL-G Flame Weather Radar (3D Doppler)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                REAL-TIME SENSOR SUITE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Tracking zero-gravity combustion micro-storms, heat dissipation isobars & oxygen density depletion
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all ${
              audioEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Radar Sweep Audio Chirp"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioEnabled ? 'Doppler Sound ON' : 'Mute'}</span>
          </button>

          <button
            onClick={onToggleIgnite}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 ${
              isIgnited
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {isIgnited ? 'Extinguish Storm' : 'Ignite Micro-Storm'}
          </button>
        </div>
      </div>

      {/* Real-time Weather Pattern Banner */}
      <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>CURRENT WEATHER PATTERN:</span>
          <strong className="text-white">{activeWeatherPattern}</strong>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Heat Flux: <strong className="text-orange-400">{heatDissipationFlux} W/m²</strong></span>
          <span>Core O₂: <strong className="text-cyan-400">{coreO2Depression}%</strong></span>
          <span>Wind Vector: <strong className="text-emerald-400">{ventilationSpeed} m/s</strong></span>
        </div>
      </div>

      {/* 3D WebGL Scene Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* 3D Viewport Controls Dock (Top-Right Floating HUD) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono backdrop-blur-md">
          <span className="text-[10px] text-slate-500 px-1">CAM:</span>
          <button
            onClick={() => setCameraPreset('orbit')}
            className="px-2 py-1 rounded-lg text-[10px] bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
          >
            Orbit
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className="px-2 py-1 rounded-lg text-[10px] bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraPreset('cross')}
            className="px-2 py-1 rounded-lg text-[10px] bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
          >
            Profile
          </button>
          <button
            onClick={() => setCameraPreset('sensor')}
            className="px-2 py-1 rounded-lg text-[10px] bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
          >
            Sensor Rig
          </button>
        </div>

        {/* 3D Layer Toggles (Bottom-Left Floating HUD) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/85 p-1 rounded-xl border border-slate-800 text-xs font-mono backdrop-blur-md">
          <span className="text-[10px] text-slate-400 px-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            3D LAYERS:
          </span>
          <button
            onClick={() => setShowHeatSurfaces(!showHeatSurfaces)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
              showHeatSurfaces
                ? 'bg-orange-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Heat Fronts
          </button>
          <button
            onClick={() => setShowOxygenIsobars(!showOxygenIsobars)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
              showOxygenIsobars
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Oxygen Isobars
          </button>
          <button
            onClick={() => setShowDopplerStreamlines(!showDopplerStreamlines)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
              showDopplerStreamlines
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Doppler Winds
          </button>
          <button
            onClick={() => setShowRadarSweep(!showRadarSweep)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
              showRadarSweep
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Radar Sweep
          </button>
        </div>
      </div>

      {/* Sensor Suite Array Inspection Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {sensorSuite.map((sensor) => {
          const isSelected = selectedSensorId === sensor.id;
          return (
            <button
              key={sensor.id}
              onClick={() => setSelectedSensorId(sensor.id)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-950 border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate">
                    {sensor.name}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sensor.color }}
                  />
                </div>
                <div className="text-sm font-bold font-mono text-white flex items-baseline gap-1">
                  <span>{sensor.value}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{sensor.unit}</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1 block truncate">
                {sensor.stormAlert}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Sensor Deep Telemetry Inspector */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="p-2 rounded-lg shrink-0 mt-0.5"
            style={{ backgroundColor: `${selectedSensor.color}20`, color: selectedSensor.color }}
          >
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="text-white font-mono">{selectedSensor.name}:</strong>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                {selectedSensor.metricLabel} = {selectedSensor.value} {selectedSensor.unit}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {selectedSensor.weatherInterpretation}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 font-mono text-[11px] text-slate-400 border-l border-slate-800/80 pl-3 hidden sm:block">
          <div>Status: <span className="text-emerald-400 font-bold">ONLINE</span></div>
          <div>Resolution: <span className="text-white">0.01 mm</span></div>
          <div>Telemetry: <span className="text-cyan-400">30 Hz</span></div>
        </div>
      </div>
    </div>
  );
};
