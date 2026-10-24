/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3D Holographic Spacecraft Wireframe & Orbit HUD (NASA Space App Challenge | Flame style)
 * Recreates the exact opening shot of the video (00:00 - 00:04):
 * - Holographic neon cyan wireframe shuttle on a coordinate grid
 * - Pulsing orange/amber rocket thruster exhaust
 * - Orbit trajectory vector and tactical flight telemetry
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const HolographicSpacecraftCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050a14, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 2.8, 5.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Grid Floor
    const gridHelper = new THREE.GridHelper(16, 32, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -1.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.45;
    scene.add(gridHelper);

    // Concentric coordinate rings on grid floor
    const ringGeo1 = new THREE.RingGeometry(2.5, 2.54, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat);
    ringMesh1.rotation.x = Math.PI / 2;
    ringMesh1.position.y = -1.18;
    scene.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(4.8, 4.85, 64);
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat);
    ringMesh2.rotation.x = Math.PI / 2;
    ringMesh2.position.y = -1.18;
    scene.add(ringMesh2);

    // 4. Construct Sleek Spacecraft Wireframe
    const shipGroup = new THREE.Group();

    // A. Fuselage (elongated nose + cockpit)
    const noseGeo = new THREE.ConeGeometry(0.7, 2.4, 8);
    noseGeo.rotateX(Math.PI / 2);
    noseGeo.translate(0, 0, 1.2);
    const noseEdges = new THREE.EdgesGeometry(noseGeo);
    const wireMatCyan = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
    const noseWire = new THREE.LineSegments(noseEdges, wireMatCyan);
    shipGroup.add(noseWire);

    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.85, 2.6, 8);
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.translate(0, 0, -1.2);
    const bodyEdges = new THREE.EdgesGeometry(bodyGeo);
    const bodyWire = new THREE.LineSegments(bodyEdges, wireMatCyan);
    shipGroup.add(bodyWire);

    // Cockpit canopy window wireframe
    const canopyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.0, 6);
    canopyGeo.rotateX(Math.PI / 2);
    canopyGeo.translate(0, 0.45, 0.4);
    const canopyEdges = new THREE.EdgesGeometry(canopyGeo);
    const canopyMat = new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.95 });
    shipGroup.add(new THREE.LineSegments(canopyEdges, canopyMat));

    // B. Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -1.5);
    wingShape.lineTo(2.4, -2.4);
    wingShape.lineTo(0.5, -2.4);
    wingShape.lineTo(0, -2.4);

    const extrudeSettings = { depth: 0.08, bevelEnabled: false };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);
    wingGeo.translate(0, 0, 0.2);

    // Right Wing
    const rightWingEdges = new THREE.EdgesGeometry(wingGeo);
    const rightWingWire = new THREE.LineSegments(rightWingEdges, wireMatCyan);
    shipGroup.add(rightWingWire);

    // Left Wing (Mirrored)
    const leftWingGeo = wingGeo.clone();
    leftWingGeo.scale(-1, 1, 1);
    const leftWingEdges = new THREE.EdgesGeometry(leftWingGeo);
    const leftWingWire = new THREE.LineSegments(leftWingEdges, wireMatCyan);
    shipGroup.add(leftWingWire);

    // Winglet tips (upward angled fins)
    const wingletGeo = new THREE.BoxGeometry(0.08, 0.6, 0.9);
    const wingletEdges = new THREE.EdgesGeometry(wingletGeo);
    const rightWinglet = new THREE.LineSegments(wingletEdges, wireMatCyan);
    rightWinglet.position.set(2.4, 0.25, -1.8);
    rightWinglet.rotation.z = -0.2;
    shipGroup.add(rightWinglet);

    const leftWinglet = new THREE.LineSegments(wingletEdges, wireMatCyan);
    leftWinglet.position.set(-2.4, 0.25, -1.8);
    leftWinglet.rotation.z = 0.2;
    shipGroup.add(leftWinglet);

    // C. Vertical Stabilizer Tail Fin
    const tailFinGeo = new THREE.BoxGeometry(0.1, 1.4, 1.4);
    tailFinGeo.translate(0, 0.7, -2.0);
    const tailEdges = new THREE.EdgesGeometry(tailFinGeo);
    const tailWire = new THREE.LineSegments(tailEdges, wireMatCyan);
    shipGroup.add(tailWire);

    // D. Dual Rocket Thrusters with Glowing Amber Exhaust
    const thrusterGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.7, 8);
    thrusterGeo.rotateX(Math.PI / 2);

    const thrusterWireMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
    const rightThruster = new THREE.LineSegments(new THREE.EdgesGeometry(thrusterGeo), thrusterWireMat);
    rightThruster.position.set(0.42, 0, -2.6);
    shipGroup.add(rightThruster);

    const leftThruster = new THREE.LineSegments(new THREE.EdgesGeometry(thrusterGeo), thrusterWireMat);
    leftThruster.position.set(-0.42, 0, -2.6);
    shipGroup.add(leftThruster);

    // Orange glowing rocket exhaust plumes
    const plumeGeo = new THREE.ConeGeometry(0.35, 1.4, 8);
    plumeGeo.rotateX(-Math.PI / 2);
    plumeGeo.translate(0, 0, -0.7);

    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });

    const rightPlume = new THREE.Mesh(plumeGeo, plumeMat);
    rightPlume.position.set(0.42, 0, -2.9);
    shipGroup.add(rightPlume);

    const leftPlume = new THREE.Mesh(plumeGeo, plumeMat);
    leftPlume.position.set(-0.42, 0, -2.9);
    shipGroup.add(leftPlume);

    // Inner fiery core plumes
    const innerPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const innerPlumeGeo = new THREE.ConeGeometry(0.18, 0.9, 6);
    innerPlumeGeo.rotateX(-Math.PI / 2);
    innerPlumeGeo.translate(0, 0, -0.45);

    const innerRightPlume = new THREE.Mesh(innerPlumeGeo, innerPlumeMat);
    innerRightPlume.position.set(0.42, 0, -2.9);
    shipGroup.add(innerRightPlume);

    const innerLeftPlume = new THREE.Mesh(innerPlumeGeo, innerPlumeMat);
    innerLeftPlume.position.set(-0.42, 0, -2.9);
    shipGroup.add(innerLeftPlume);

    // Trajectory arc line
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4.5, -0.8, -3.0),
      new THREE.Vector3(-1.0, 1.5, -0.5),
      new THREE.Vector3(0, 0, 0)
    );
    const points = curve.getPoints(30);
    const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(points);
    const trajectoryMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.25,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const trajectoryLine = new THREE.Line(trajectoryGeo, trajectoryMat);
    trajectoryLine.computeLineDistances();
    scene.add(trajectoryLine);

    // Initial position & elevation
    shipGroup.position.set(0, 0.2, 0);
    shipGroup.rotation.y = -Math.PI / 5;
    scene.add(shipGroup);

    camera.lookAt(0, 0, 0);

    // 5. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle orbital hovering & roll oscillation
      shipGroup.position.y = 0.2 + Math.sin(elapsedTime * 1.5) * 0.08;
      shipGroup.rotation.y = -Math.PI / 5 + Math.sin(elapsedTime * 0.8) * 0.15;
      shipGroup.rotation.z = Math.sin(elapsedTime * 1.2) * 0.05;

      // Exhaust plume flicker & pulse
      const flickerScale = 1.0 + Math.sin(elapsedTime * 28) * 0.18 + Math.random() * 0.06;
      rightPlume.scale.set(1, 1, flickerScale);
      leftPlume.scale.set(1, 1, flickerScale);
      innerRightPlume.scale.set(1, 1, flickerScale * 1.1);
      innerLeftPlume.scale.set(1, 1, flickerScale * 1.1);

      // Floor grid subtle rotation
      gridHelper.rotation.y = elapsedTime * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative" />;
};
