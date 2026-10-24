import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Camera,
  Layers,
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sliders,
  Eye,
  Flame,
  Gauge,
  Sun,
  Shield,
  Palette,
  Crosshair,
} from 'lucide-react';
import { FuelDefinition } from '../types';
import { flameAudio } from '../services/flameAudioService';

export interface ThreeFlameChamberProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  onGravityChange?: (g: number) => void;
  ventilationSpeed: number; // m/s
  onVentilationChange?: (speed: number) => void;
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  flameTempK: number;
  dangerLevel: string;
}

// Pre-allocated math helpers to ensure zero GC allocation in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _matrix4 = new THREE.Matrix4();

// Software WebGL detector via context probe
const isSoftwareGl = (() => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : (gl as any).RENDERER;
    const gpu = String((gl as any).getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

export const ThreeFlameChamber: React.FC<ThreeFlameChamberProps> = ({
  gases,
  pressureKpa,
  gravityG,
  onGravityChange,
  ventilationSpeed,
  onVentilationChange,
  fuel,
  isIgnited,
  onToggleIgnite,
  flameTempK,
  dangerLevel,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Animation frame / timer tracking
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Zero-Occlusion HUD State
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'explode' | 'materials' | 'diagnostics'>('camera');

  // Camera animation interpolation state
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 3.6));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.9, 0));
  const isTransitioningCamera = useRef<boolean>(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<'orbit' | 'macro' | 'top' | 'side' | 'injector'>('orbit');

  // Interactive Inspection State
  const [explodedAmount, setExplodedAmount] = useState<number>(0); // 0 to 1
  const targetExplodeAmount = useRef<number>(0);
  const currentExplodeAmount = useRef<number>(0);

  const [glassVisibility, setGlassVisibility] = useState<'clear' | 'wireframe' | 'hidden'>('clear');
  const [rigFinish, setRigFinish] = useState<'titanium' | 'carbon' | 'gold'>('titanium');
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'deepspace' | 'uv'>('studio');
  const [specimenType, setSpecimenType] = useState<'candle' | 'droplet'>('candle');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(true);

  // Gas chemical state helpers
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const kr = gases?.Kr || 0;

  const isSilaneAutoIgnited = sih4 > 1.2 && o2 > 10;
  const canCombust = (o2 >= 11 && novec <= 6 && sf6 <= 8 && co2 < 38) || isSilaneAutoIgnited;
  const effectivelyBurning = (isIgnited || isSilaneAutoIgnited) && canCombust;

  // Mutable dynamic params ref to avoid scene reconstruction
  const simParamsRef = useRef({
    gases,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    fuel,
    isIgnited: effectivelyBurning,
    flameTempK,
    glassVisibility,
    rigFinish,
    lightingPreset,
    specimenType,
  });

  useEffect(() => {
    simParamsRef.current = {
      gases,
      pressureKpa,
      gravityG,
      ventilationSpeed,
      fuel,
      isIgnited: effectivelyBurning,
      flameTempK,
      glassVisibility,
      rigFinish,
      lightingPreset,
      specimenType,
    };
  }, [gases, pressureKpa, gravityG, ventilationSpeed, fuel, effectivelyBurning, flameTempK, glassVisibility, rigFinish, lightingPreset, specimenType]);

  // Audio synchronization with flame state
  useEffect(() => {
    flameAudio.setEnabled(audioFeedbackEnabled);
    flameAudio.update({
      isBurning: effectivelyBurning,
      flameTempK,
      ventilationSpeed,
      gravityG,
      dangerLevel,
    });
  }, [effectivelyBurning, flameTempK, ventilationSpeed, gravityG, dangerLevel, audioFeedbackEnabled]);

  // Camera Preset Handler using silky-smooth exponential damping
  const applyCameraPreset = (preset: 'orbit' | 'macro' | 'top' | 'side' | 'injector') => {
    setActiveCameraPreset(preset);
    isTransitioningCamera.current = true;

    if (preset === 'macro') {
      // Tight focus on the nozzle tip and flame zone
      targetCamPos.current.set(0.0, 1.05, 1.35);
      targetCamLook.current.set(0.0, 0.95, 0.0);
    } else if (preset === 'top') {
      // Orthographic bird's-eye view looking down the quartz cylinder
      targetCamPos.current.set(0.0, 4.2, 0.01);
      targetCamLook.current.set(0.0, 0.85, 0.0);
    } else if (preset === 'side') {
      // Perpendicular side elevation
      targetCamPos.current.set(3.2, 1.1, 0.0);
      targetCamLook.current.set(0.0, 0.95, 0.0);
    } else if (preset === 'injector') {
      // Low-angle perspective looking up at the ceramic injector & electrodes
      targetCamPos.current.set(0.9, 0.65, 1.1);
      targetCamLook.current.set(0.0, 0.85, 0.0);
    } else {
      // Default Studio Orbit perspective
      targetCamPos.current.set(0.0, 1.8, 3.6);
      targetCamLook.current.set(0.0, 0.9, 0.0);
    }
  };

  // Keyboard shortcut: H for Cinema / Zen Mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsControlsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    cameraRef.current = camera;
    camera.position.set(0, 1.8, 3.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.9, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 0.8;
    controls.maxDistance = 10;

    // Cancel automated camera transition on manual user interaction
    controls.addEventListener('start', () => {
      isTransitioningCamera.current = false;
    });

    // 3. Balanced Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(3.5, 5.0, 3.0);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.camera.left = -2.5;
      keyLight.shadow.camera.right = 2.5;
      keyLight.shadow.camera.top = 2.5;
      keyLight.shadow.camera.bottom = -2.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.6);
    rimLight.position.set(-3.5, 3.0, -3.5);
    scene.add(rimLight);

    // 4. Ground Telemetry Grid & Soft Radial Contact Shadow
    const groundGrid = new THREE.GridHelper(10, 24, 0x38bdf8, 0x1e293b);
    groundGrid.position.y = 0.001;
    scene.add(groundGrid);

    // Procedural Radial Contact Shadow Plane
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 256;
    contactCanvas.height = 256;
    const cctx = contactCanvas.getContext('2d')!;
    const cgrad = cctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    cgrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    cgrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    cgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cctx.fillStyle = cgrad;
    cctx.fillRect(0, 0, 256, 256);

    const contactTexture = new THREE.CanvasTexture(contactCanvas);
    contactTexture.colorSpace = THREE.SRGBColorSpace;
    const contactPlaneGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const contactPlaneMat = new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const contactMesh = new THREE.Mesh(contactPlaneGeo, contactPlaneMat);
    contactMesh.rotation.x = -Math.PI / 2;
    contactMesh.position.y = 0.002;
    scene.add(contactMesh);

    // =========================================================================
    // 5. PROCEDURAL 3D COMBUSTION CHAMBER HARDWARE (MULTI-PART THREE.Group HIERARCHY)
    // =========================================================================
    const chamberRigGroup = new THREE.Group();
    scene.add(chamberRigGroup);

    // Dynamic Material References for Finishes
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.32,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.24,
    });

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.08,
      roughness: 0.18,
    });

    // Optical Quartz Glass Cylinder Material
    const quartzGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.93,
      opacity: isSoftwareGl ? 0.32 : 1.0,
      transparent: true,
      roughness: 0.05,
      metalness: 0.05,
      ior: 1.54,
      thickness: 0.6,
      specularIntensity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Sub-assemblies for exploded view separation
    const baseAssemblyGroup = new THREE.Group(); // Stays grounded at Y = 0
    const stageAssemblyGroup = new THREE.Group(); // Stage burner mount
    const specimenAssemblyGroup = new THREE.Group(); // Specimen / Burner nozzle
    const quartzAssemblyGroup = new THREE.Group(); // Quartz cylinder sleeve
    const cowlAssemblyGroup = new THREE.Group(); // Top exhaust baffle & manifold

    chamberRigGroup.add(baseAssemblyGroup);
    chamberRigGroup.add(stageAssemblyGroup);
    chamberRigGroup.add(specimenAssemblyGroup);
    chamberRigGroup.add(quartzAssemblyGroup);
    chamberRigGroup.add(cowlAssemblyGroup);

    // -------------------------------------------------------------
    // PART A: HEAVY ANODIZED HEXAGONAL RIG BASE PLINTH
    // -------------------------------------------------------------
    const basePlinthGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.12, 6);
    const basePlinthMesh = new THREE.Mesh(basePlinthGeo, darkAccentMat);
    basePlinthMesh.position.y = 0.06;
    basePlinthMesh.castShadow = !isSoftwareGl;
    basePlinthMesh.receiveShadow = !isSoftwareGl;
    baseAssemblyGroup.add(basePlinthMesh);

    // Circular gimbal collar base ring
    const collarBaseGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.08, 32);
    const collarBaseMesh = new THREE.Mesh(collarBaseGeo, metalMat);
    collarBaseMesh.position.y = 0.16;
    collarBaseMesh.castShadow = !isSoftwareGl;
    baseAssemblyGroup.add(collarBaseMesh);

    // Instanced Perimeter Allen Cap Bolts (12 perimeter hex bolts)
    const boltGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.05, 12);
    const boltMesh = new THREE.InstancedMesh(boltGeo, brassMat, 12);
    boltMesh.castShadow = !isSoftwareGl;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 0.76;
      _matrix4.makeTranslation(Math.cos(angle) * radius, 0.205, Math.sin(angle) * radius);
      boltMesh.setMatrixAt(i, _matrix4);
    }
    boltMesh.computeBoundingSphere();
    baseAssemblyGroup.add(boltMesh);

    // Sintered Gas Coupler Valves (4 radial ports on base)
    for (let p = 0; p < 4; p++) {
      const portAngle = (p / 4) * Math.PI * 2;
      const portGroup = new THREE.Group();
      portGroup.rotation.y = portAngle;

      const portGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.18, 16);
      const portMesh = new THREE.Mesh(portGeo, brassMat);
      portMesh.rotation.z = Math.PI / 2;
      portMesh.position.set(0.85, 0.12, 0);
      portGroup.add(portMesh);

      // Valve knurled wheel
      const wheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16);
      const wheelMesh = new THREE.Mesh(wheelGeo, darkAccentMat);
      wheelMesh.rotation.z = Math.PI / 2;
      wheelMesh.position.set(0.95, 0.12, 0);
      portGroup.add(wheelMesh);

      baseAssemblyGroup.add(portGroup);
    }

    // -------------------------------------------------------------
    // PART B: STAGE BURNER GIMBAL & LOWER QUARTZ CLAMP
    // -------------------------------------------------------------
    const lowerClampGeo = new THREE.CylinderGeometry(0.58, 0.64, 0.12, 32);
    const lowerClampMesh = new THREE.Mesh(lowerClampGeo, metalMat);
    lowerClampMesh.position.y = 0.26;
    lowerClampMesh.castShadow = !isSoftwareGl;
    stageAssemblyGroup.add(lowerClampMesh);

    // Knurled titanium gimbal ring
    const knurledRingGeo = new THREE.TorusGeometry(0.61, 0.028, 16, 48);
    const knurledRingMesh = new THREE.Mesh(knurledRingGeo, brassMat);
    knurledRingMesh.rotation.x = Math.PI / 2;
    knurledRingMesh.position.y = 0.28;
    stageAssemblyGroup.add(knurledRingMesh);

    // -------------------------------------------------------------
    // PART C: SPECIMEN ASSEMBLY & MICRO-IGNITER ELECTRODES
    // -------------------------------------------------------------
    // Ceramic injector burner nozzle core
    const injectorCoreGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.18, 32);
    const injectorCoreMesh = new THREE.Mesh(injectorCoreGeo, ceramicMat);
    injectorCoreMesh.position.y = 0.38;
    injectorCoreMesh.castShadow = !isSoftwareGl;
    specimenAssemblyGroup.add(injectorCoreMesh);

    // Micro-igniter tungsten electrode pair with ceramic insulators
    [-0.12, 0.12].forEach((xOffset, idx) => {
      const insulatorGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.14, 16);
      const insulatorMesh = new THREE.Mesh(insulatorGeo, ceramicMat);
      insulatorMesh.position.set(xOffset, 0.52, 0);
      specimenAssemblyGroup.add(insulatorMesh);

      // Angled tungsten tip
      const electrodeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12);
      const electrodeMesh = new THREE.Mesh(electrodeGeo, brassMat);
      electrodeMesh.position.set(xOffset * 0.7, 0.61, 0);
      electrodeMesh.rotation.z = idx === 0 ? -0.35 : 0.35;
      specimenAssemblyGroup.add(electrodeMesh);
    });

    // SPECIMEN 1: NASA CFM CANDLE (Ivory wax cylinder + molten pool + cotton wick)
    const candleGroup = new THREE.Group();
    specimenAssemblyGroup.add(candleGroup);

    const candleWaxGeo = new THREE.CylinderGeometry(0.20, 0.21, 0.48, 32);
    const candleWaxMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.38,
      metalness: 0.04,
      emissive: 0xfef08a,
      emissiveIntensity: 0.15,
    });
    const candleWaxMesh = new THREE.Mesh(candleWaxGeo, candleWaxMat);
    candleWaxMesh.position.y = 0.68;
    candleWaxMesh.castShadow = !isSoftwareGl;
    candleGroup.add(candleWaxMesh);

    // Molten wax pool crater
    const waxPoolGeo = new THREE.CylinderGeometry(0.19, 0.17, 0.03, 32);
    const waxPoolMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.12,
      metalness: 0.08,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
    });
    const waxPoolMesh = new THREE.Mesh(waxPoolGeo, waxPoolMat);
    waxPoolMesh.position.y = 0.925;
    candleGroup.add(waxPoolMesh);

    // Braided cotton wick
    const wickGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.10, 16);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.92 });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.y = 0.975;
    candleGroup.add(wickMesh);

    // Incandescent wick tip ember
    const emberGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff3b00,
      emissiveIntensity: 4.8,
      roughness: 0.1,
    });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.y = 1.025;
    candleGroup.add(emberMesh);

    // SPECIMEN 2: NASA FLEX / PSI-159 DROPLET SUSPENSION NEEDLE
    const dropletGroup = new THREE.Group();
    specimenAssemblyGroup.add(dropletGroup);
    dropletGroup.visible = false; // toggled via state

    const needleShaftGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.52, 16);
    const needleShaftMesh = new THREE.Mesh(needleShaftGeo, metalMat);
    needleShaftMesh.position.y = 0.74;
    dropletGroup.add(needleShaftMesh);

    // Fine quartz droplet bead
    const fuelDropletGeo = new THREE.SphereGeometry(0.065, 24, 24);
    const fuelDropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.92,
      roughness: 0.08,
      ior: 1.38,
      transparent: true,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const fuelDropletMesh = new THREE.Mesh(fuelDropletGeo, fuelDropletMat);
    fuelDropletMesh.position.y = 1.025;
    dropletGroup.add(fuelDropletMesh);

    // -------------------------------------------------------------
    // PART D: OPTICAL QUARTZ CYLINDRICAL COMBUSTION CHAMBER
    // -------------------------------------------------------------
    const quartzCylinderGeo = new THREE.CylinderGeometry(0.54, 0.54, 1.45, 48, 1, true);
    const quartzCylinderMesh = new THREE.Mesh(quartzCylinderGeo, quartzGlassMat);
    quartzCylinderMesh.position.y = 1.05;
    quartzAssemblyGroup.add(quartzCylinderMesh);

    // Laser-etched millimeter graduation ring decals on quartz
    [0.55, 0.85, 1.15, 1.45, 1.70].forEach((yMark) => {
      const markRingGeo = new THREE.RingGeometry(0.542, 0.546, 48);
      const markRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      });
      markRingMat.polygonOffset = true;
      markRingMat.polygonOffsetFactor = -1;
      markRingMat.polygonOffsetUnits = -1;

      const markMesh = new THREE.Mesh(markRingGeo, markRingMat);
      markMesh.rotation.x = Math.PI / 2;
      markMesh.position.y = yMark;
      quartzAssemblyGroup.add(markMesh);
    });

    // -------------------------------------------------------------
    // PART E: UPPER EXHAUST BAFFLE, MANIFOLD & COWL ASSEMBLY
    // -------------------------------------------------------------
    // Top collar retention clamp
    const topClampGeo = new THREE.CylinderGeometry(0.60, 0.56, 0.12, 32);
    const topClampMesh = new THREE.Mesh(topClampGeo, metalMat);
    topClampMesh.position.y = 1.84;
    topClampMesh.castShadow = !isSoftwareGl;
    cowlAssemblyGroup.add(topClampMesh);

    // Sintered mesh flame arrester screen
    const screenGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.04, 32);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      wireframe: true,
      roughness: 0.6,
      metalness: 0.8,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.y = 1.91;
    cowlAssemblyGroup.add(screenMesh);

    // Upper exhaust duct manifold
    const ductGeo = new THREE.CylinderGeometry(0.24, 0.38, 0.28, 32);
    const ductMesh = new THREE.Mesh(ductGeo, darkAccentMat);
    ductMesh.position.y = 2.05;
    ductMesh.castShadow = !isSoftwareGl;
    cowlAssemblyGroup.add(ductMesh);

    // Top exhaust flange & sensor connector
    const flangeGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32);
    const flangeMesh = new THREE.Mesh(flangeGeo, brassMat);
    flangeMesh.position.y = 2.22;
    cowlAssemblyGroup.add(flangeMesh);

    // =========================================================================
    // 6. DYNAMIC 3D COMBUSTION FLAME SYSTEM (PBR EMISSIVE CORE & THERMAL MANTLE)
    // =========================================================================
    const flameRootGroup = new THREE.Group();
    flameRootGroup.position.set(0, 1.05, 0);
    chamberRigGroup.add(flameRootGroup);

    // Core Flame Point Light (illuminates quartz interior, wax, and hardware)
    const flameLight = new THREE.PointLight(0x38bdf8, 4.5, 6.0);
    flameLight.castShadow = false; // Skip shadow casting for flame light to protect framerate
    flameRootGroup.add(flameLight);

    // Inner Reaction Core Sphere / Teardrop
    const flameCoreGeo = new THREE.SphereGeometry(0.18, 32, 32);
    const flameCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 0.05,
      transparent: true,
      opacity: 0.96,
    });
    const flameCoreMesh = new THREE.Mesh(flameCoreGeo, flameCoreMat);
    flameRootGroup.add(flameCoreMesh);

    // Outer Thermal Luminescence Mantle
    const flameMantleGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const flameMantleMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.62,
      roughness: 0.1,
      metalness: 0.05,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flameMantleMesh = new THREE.Mesh(flameMantleGeo, flameMantleMat);
    flameRootGroup.add(flameMantleMesh);

    // Basal Blue Chemiluminescence Ring
    const basalRingGeo = new THREE.TorusGeometry(0.14, 0.04, 16, 32);
    const basalRingMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
    });
    const basalRingMesh = new THREE.Mesh(basalRingGeo, basalRingMat);
    basalRingMesh.rotation.x = Math.PI / 2;
    basalRingMesh.position.y = -0.05;
    flameRootGroup.add(basalRingMesh);

    // -------------------------------------------------------------
    // PART F: MICRO SOOT & DOPPLER STREAMLINE PARTICLES
    // -------------------------------------------------------------
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 0.4;
      particlePos[i * 3 + 1] = 0.95 + Math.random() * 0.6;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      particleVel[i * 3] = (Math.random() - 0.5) * 0.05;
      particleVel[i * 3 + 1] = 0.2 + Math.random() * 0.4;
      particleVel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.024,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    chamberRigGroup.add(particlePoints);

    // =========================================================================
    // 7. SILKY SMOOTH ANIMATION LOOP WITH SOFTWARE-WEBGL GUARD
    // =========================================================================
    const clock = clockRef.current;

    function afterDraw(cb: () => void) {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameIdRef.current = window.setTimeout(poll, 5);
          } else {
            gl.deleteSync(sync);
            frameIdRef.current = window.setTimeout(cb, 80);
          }
        };
        frameIdRef.current = window.setTimeout(poll, 5);
      } catch {
        frameIdRef.current = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const p = simParamsRef.current;

      // 1. Smooth Camera Transition using Exponential Damping
      if (isTransitioningCamera.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.current.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.current.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.current.z, 4.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetCamLook.current.x, 4.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetCamLook.current.y, 4.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetCamLook.current.z, 4.5, delta);

        if (camera.position.distanceTo(targetCamPos.current) < 0.04) {
          isTransitioningCamera.current = false;
        }
      }
      controls.update();

      // 2. Smooth Exploded View Layer Separation
      currentExplodeAmount.current = THREE.MathUtils.damp(
        currentExplodeAmount.current,
        targetExplodeAmount.current,
        5.0,
        delta
      );
      const exp = currentExplodeAmount.current;

      // Vertical separation offsets
      cowlAssemblyGroup.position.y = exp * 0.95;
      quartzAssemblyGroup.position.y = exp * 0.48;
      specimenAssemblyGroup.position.y = exp * 0.18;
      stageAssemblyGroup.position.y = exp * 0.06;
      baseAssemblyGroup.position.y = 0;

      // 3. Hardware Material Finish Adaptation
      if (p.rigFinish === 'carbon') {
        metalMat.color.setHex(0x334155);
        metalMat.metalness = 0.85;
        metalMat.roughness = 0.35;
        darkAccentMat.color.setHex(0x0f172a);
      } else if (p.rigFinish === 'gold') {
        metalMat.color.setHex(0xf59e0b);
        metalMat.metalness = 0.94;
        metalMat.roughness = 0.18;
        darkAccentMat.color.setHex(0x78350f);
      } else {
        // Standard Aerospace Titanium
        metalMat.color.setHex(0x94a3b8);
        metalMat.metalness = 0.92;
        metalMat.roughness = 0.22;
        darkAccentMat.color.setHex(0x1e293b);
      }

      // 4. Lighting Rig Mode Adaptation
      if (p.lightingPreset === 'deepspace') {
        if (scene.background instanceof THREE.Color) scene.background.setHex(0x010409);
        keyLight.intensity = 1.4;
        fillLight.intensity = 0.6;
        rimLight.intensity = 2.4;
      } else if (p.lightingPreset === 'uv') {
        if (scene.background instanceof THREE.Color) scene.background.setHex(0x060718);
        keyLight.intensity = 0.8;
        keyLight.color.setHex(0x818cf8);
        fillLight.intensity = 2.2;
        fillLight.color.setHex(0x8b5cf6);
        rimLight.intensity = 3.0;
        rimLight.color.setHex(0xc084fc);
      } else {
        // Studio High-Key
        if (scene.background instanceof THREE.Color) scene.background.setHex(0x030712);
        keyLight.intensity = 2.8;
        keyLight.color.setHex(0xfff7ed);
        fillLight.intensity = 1.4;
        fillLight.color.setHex(0x38bdf8);
        rimLight.intensity = 1.6;
        rimLight.color.setHex(0x06b6d4);
      }

      // 5. Quartz Chamber Transparency Mode
      if (p.glassVisibility === 'wireframe') {
        quartzGlassMat.wireframe = true;
        quartzGlassMat.opacity = 0.45;
        quartzGlassMat.transmission = 0;
        quartzCylinderMesh.visible = true;
      } else if (p.glassVisibility === 'hidden') {
        quartzCylinderMesh.visible = false;
      } else {
        quartzGlassMat.wireframe = false;
        quartzGlassMat.opacity = isSoftwareGl ? 0.32 : 1.0;
        quartzGlassMat.transmission = isSoftwareGl ? 0 : 0.93;
        quartzCylinderMesh.visible = true;
      }

      // 6. Specimen Toggle
      candleGroup.visible = p.specimenType === 'candle';
      dropletGroup.visible = p.specimenType === 'droplet';

      // 7. Flame Morphology & Spectral Emission Dynamics
      if (p.isIgnited) {
        flameRootGroup.visible = true;
        particlePoints.visible = true;

        // Gas-dependent spectral colors
        const o2Pct = (p.gases?.O2 || 0) + (p.gases?.N2O || 0) * 0.7;
        const h2Pct = p.gases?.H2 || 0;
        const sih4Pct = p.gases?.SiH4 || 0;
        const co2Pct = p.gases?.CO2 || 0;

        let coreColor = 0xffffff;
        let mantleColor = 0xf97316;
        let lightColor = 0xf59e0b;

        if (sih4Pct > 1.2) {
          // Brilliant pyrophoric white silane flame
          coreColor = 0xffffff;
          mantleColor = 0xcffafe;
          lightColor = 0xe0f2fe;
        } else if (h2Pct > 4 && (p.gases?.CH4 || 0) < 4) {
          // Ghost violet hydrogen flame
          coreColor = 0xe9d5ff;
          mantleColor = 0xc084fc;
          lightColor = 0xa855f7;
        } else if (o2Pct < 15) {
          // Hypoxic cool blue chemiluminescence
          coreColor = 0x93c5fd;
          mantleColor = 0x3b82f6;
          lightColor = 0x2563eb;
        } else if (o2Pct > 35) {
          // Hyperoxic white-hot incandescent flare
          coreColor = 0xffffff;
          mantleColor = 0xfbbf24;
          lightColor = 0xf59e0b;
        }

        flameCoreMat.emissive.setHex(coreColor);
        flameMantleMat.color.setHex(mantleColor);
        flameMantleMat.emissive.setHex(mantleColor);
        flameLight.color.setHex(lightColor);

        // Flame light flicker
        flameLight.intensity = (4.0 + Math.sin(time * 12) * 0.7) * (1 - Math.min(0.6, co2Pct / 40));

        // Buoyancy vs Zero-G Spherical Dynamics
        const g = p.gravityG;
        const vent = p.ventilationSpeed;

        if (g === 0) {
          // 0-G Null Sphere with radial breathing
          const breathe = Math.sin(time * 3.5) * 0.04;
          const sphereScale = 1.0 + breathe;
          const windShiftX = vent * 0.35;

          // Stretch along wind vector if ventilation active
          flameRootGroup.position.set(windShiftX, 1.05 + exp * 0.18, 0);
          flameCoreMesh.scale.set(sphereScale * (1 + vent * 1.2), sphereScale * 0.9, sphereScale);
          flameMantleMesh.scale.set(sphereScale * (1 + vent * 1.4), sphereScale, sphereScale);
          basalRingMesh.visible = false;
        } else {
          // Gravity > 0: Buoyant flickering teardrop with convective elongation & base necking
          const flutterFreq = 12 + Math.sqrt(g) * 8.0;
          const flutter = Math.sin(time * flutterFreq) * (0.04 + Math.min(g, 4) * 0.015);
          const gBuoyancy = Math.pow(Math.max(0.01, g), 0.35);

          // Elongation & necking
          const elongationY = 1.0 + gBuoyancy * 1.15 + flutter;
          const neckingX = 1 / (1 + Math.max(0, g - 1.0) * 0.08);
          const windTiltX = (vent * 0.22) / (1 + g * 0.4);

          flameRootGroup.position.set(windTiltX, 1.05 + exp * 0.18 + (g > 0 ? 0.02 * gBuoyancy : 0), 0);
          flameCoreMesh.scale.set(neckingX * 0.85, elongationY * 0.95, neckingX * 0.85);
          flameMantleMesh.scale.set(neckingX * 1.1, elongationY * 1.35, neckingX * 1.1);
          basalRingMesh.visible = true;
        }

        // Particle System Animation (Buoyant Soot & Radical Drift)
        const posArr = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          // Upward velocity accelerated by gravity
          const vy = (0.3 + g * 0.35) * delta;
          const vx = (vent * 0.4) * delta + (Math.random() - 0.5) * 0.01;

          posArr[idx] += vx;
          posArr[idx + 1] += vy;

          // Boundary reset
          if (posArr[idx + 1] > 1.85 || Math.abs(posArr[idx]) > 0.45) {
            posArr[idx] = flameRootGroup.position.x + (Math.random() - 0.5) * 0.12;
            posArr[idx + 1] = 1.02 + Math.random() * 0.1;
            posArr[idx + 2] = (Math.random() - 0.5) * 0.12;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      } else {
        flameRootGroup.visible = false;
        particlePoints.visible = false;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameIdRef.current = requestAnimationFrame(tick);
      }
    };

    tick();

    // 8. Viewport Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (isSoftwareGl) {
        clearTimeout(frameIdRef.current);
      } else {
        cancelAnimationFrame(frameIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update exploded slider ref
  const handleExplodeChange = (val: number) => {
    setExplodedAmount(val);
    targetExplodeAmount.current = val;
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#040813] border border-slate-800 shadow-2xl overflow-hidden flex flex-col select-none">
      {/* =========================================================================
          TOP HUD BAR: MINIMAL STATUS BADGES (ZERO OCCLUSION OF CENTER)
          ========================================================================= */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Left Specification Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold">
            <span className="text-sm">🔬</span>
            <span>THREE.JS PBR CHAMBER</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            {specimenType === 'candle' ? 'NASA CFM CANDLE' : 'NASA FLEX DROPLET'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hidden sm:inline-block">
            {gravityG === 0 ? '0.0G NULL' : `${gravityG.toFixed(1)}G DYNAMICS`}
          </span>
        </div>

        {/* Right Status Actions & Zen Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Audio Feedback Toggle */}
          <button
            onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
            className={`p-2 rounded-xl text-xs font-mono border transition-all ${
              audioFeedbackEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950/80 text-slate-400 border-slate-800'
            }`}
            title="Toggle Acoustic Flame Feedback"
          >
            {audioFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Ignite / Extinguish Button */}
          <button
            onClick={onToggleIgnite}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
              effectivelyBurning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{effectivelyBurning ? 'Extinguish' : 'Ignite Chamber'}</span>
          </button>

          {/* Quick Collapse / Fullscreen View */}
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-lg"
            title="Toggle Zen Mode (Press H)"
          >
            {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isControlsCollapsed ? 'Show HUD' : 'Zen Mode [H]'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3D WEBGL VIEWPORT (100% UNOBSTRUCTED CENTER)
          ========================================================================= */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-b from-[#020617] via-[#030712] to-[#040813]">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing block focus:outline-none"
        />

        {/* Interactive Center Crosshair Sensor Guide (Subtle, Non-occluding) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 hover:opacity-50 transition-opacity">
          <div className="w-12 h-12 rounded-full border border-cyan-400/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          ZERO-OCCLUSION COLLAPSIBLE BOTTOM DOCK
          Consolidates ALL camera presets, exploded-view slider, finishes, and specs
          into a sleek horizontal dock pinned to the bottom. Never covers the 3D subject!
          ========================================================================= */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 transition-all duration-300 ease-out pointer-events-auto ${
          isControlsCollapsed ? 'translate-y-[calc(100%+24px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-2.5 flex flex-col gap-2">
          {/* Dock Category Selector & Collapse Grip */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-xs font-mono flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'camera'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Views</span>
              </button>

              <button
                onClick={() => setActiveTab('explode')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'explode'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Exploded View</span>
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'materials'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Studio Rig Finishes</span>
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'diagnostics'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Telemetry Specs</span>
              </button>
            </div>

            {/* Collapse toggle attached to dock top */}
            <button
              onClick={() => setIsControlsCollapsed(true)}
              className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-900 transition-colors"
              title="Hide dock (H)"
            >
              <span>▾ Hide HUD</span>
            </button>
          </div>

          {/* Category Content: CAMERA VIEWS */}
          {activeTab === 'camera' && (
            <div className="flex items-center justify-between text-xs font-mono gap-2 flex-wrap pt-0.5">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Orbit Presets:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => applyCameraPreset('orbit')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeCameraPreset === 'orbit'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  Chamber Wide
                </button>
                <button
                  onClick={() => applyCameraPreset('macro')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeCameraPreset === 'macro'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  Macro Flame
                </button>
                <button
                  onClick={() => applyCameraPreset('top')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeCameraPreset === 'top'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  Top-Down Ortho
                </button>
                <button
                  onClick={() => applyCameraPreset('side')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeCameraPreset === 'side'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  Side Profile
                </button>
                <button
                  onClick={() => applyCameraPreset('injector')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeCameraPreset === 'injector'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  Burner Nozzle
                </button>
              </div>

              {/* Specimen Switcher */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] text-slate-400">Specimen:</span>
                <button
                  onClick={() => setSpecimenType('candle')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    specimenType === 'candle'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  NASA CFM Candle
                </button>
                <button
                  onClick={() => setSpecimenType('droplet')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    specimenType === 'droplet'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  FLEX Droplet
                </button>
              </div>
            </div>
          )}

          {/* Category Content: EXPLODED VIEW */}
          {activeTab === 'explode' && (
            <div className="flex items-center justify-between text-xs font-mono gap-3 flex-wrap pt-0.5">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <span className="text-slate-400 text-[11px] whitespace-nowrap">
                  Separation: <strong className="text-cyan-400">{Math.round(explodedAmount * 100)}%</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedAmount}
                  onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExplodeChange(0)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                    explodedAmount === 0
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Assembled (0%)
                </button>
                <button
                  onClick={() => handleExplodeChange(0.5)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                    Math.abs(explodedAmount - 0.5) < 0.05
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Mid (50%)
                </button>
                <button
                  onClick={() => handleExplodeChange(1.0)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                    explodedAmount === 1
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Exploded (100%)
                </button>
              </div>

              {/* Chamber Glass Switch */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[11px] text-slate-400">Quartz Wall:</span>
                <button
                  onClick={() => setGlassVisibility('clear')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    glassVisibility === 'clear'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Glass
                </button>
                <button
                  onClick={() => setGlassVisibility('wireframe')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    glassVisibility === 'wireframe'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setGlassVisibility('hidden')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    glassVisibility === 'hidden'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cutaway
                </button>
              </div>
            </div>
          )}

          {/* Category Content: STUDIO RIG FINISHES & LIGHTING */}
          {activeTab === 'materials' && (
            <div className="flex items-center justify-between text-xs font-mono gap-3 flex-wrap pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Metal Finish:</span>
                <button
                  onClick={() => setRigFinish('titanium')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    rigFinish === 'titanium'
                      ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  Aerospace Titanium
                </button>
                <button
                  onClick={() => setRigFinish('carbon')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    rigFinish === 'carbon'
                      ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
                  Dark Anodized Carbon
                </button>
                <button
                  onClick={() => setRigFinish('gold')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    rigFinish === 'gold'
                      ? 'bg-slate-800 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  ISS Thermal Gold
                </button>
              </div>

              {/* Lighting Preset */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-slate-400 text-[11px]">Studio Lighting:</span>
                <button
                  onClick={() => setLightingPreset('studio')}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    lightingPreset === 'studio'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  High-Key Studio
                </button>
                <button
                  onClick={() => setLightingPreset('deepspace')}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    lightingPreset === 'deepspace'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Deep Space Void
                </button>
                <button
                  onClick={() => setLightingPreset('uv')}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                    lightingPreset === 'uv'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  UV Chemiluminescence
                </button>
              </div>
            </div>
          )}

          {/* Category Content: TELEMETRY SPECS */}
          {activeTab === 'diagnostics' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Flame Temperature</span>
                <span className="text-amber-400 font-bold text-sm">{flameTempK} K</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Convective Airflow</span>
                <span className="text-cyan-400 font-bold text-sm">{ventilationSpeed.toFixed(2)} m/s</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Effective Gravity</span>
                <span className="text-emerald-400 font-bold text-sm">{gravityG.toFixed(2)} g</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Chamber Pressure</span>
                <span className="text-purple-400 font-bold text-sm">{pressureKpa} kPa</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Zen Mode Restore Tab when dock is collapsed */}
      {isControlsCollapsed && (
        <button
          onClick={() => setIsControlsCollapsed(false)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-2xl backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Show Controls Dock [H]</span>
        </button>
      )}
    </div>
  );
};
