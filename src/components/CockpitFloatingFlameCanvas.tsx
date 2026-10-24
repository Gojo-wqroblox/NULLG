/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3D Spherical Zero-G Flame in Cockpit (Matching NASA Space App Video 00:05 - 00:08)
 * Renders a glowing spherical zero-G microgravity flame floating weightlessly,
 * with blue chemiluminescent outer mantle and incandescent yellow/orange core.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const CockpitFloatingFlameCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const flameGroup = new THREE.Group();

    // 1. Outermost Blue Chemiluminescent Zero-G Spherical Shell
    const outerGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    flameGroup.add(outerMesh);

    // 2. Translucent Blue Ion Envelope
    const haloGeo = new THREE.SphereGeometry(0.92, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    flameGroup.add(haloMesh);

    // 3. Middle Luminous Orange/Cyan Reaction Front
    const midGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const midMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    flameGroup.add(midMesh);

    // 4. Inner Hot Yellow Core (Soot Incandescence / Reaction Zone)
    const coreGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    flameGroup.add(coreMesh);

    // 5. Orbiting Ambient Zero-G Soot & Spark Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.05 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      speeds[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    flameGroup.add(particlePoints);

    scene.add(flameGroup);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Organic zero-G breathing & pulsation
      const breath = 1.0 + Math.sin(t * 3.5) * 0.06 + Math.cos(t * 5.2) * 0.03;
      outerMesh.scale.set(breath, breath, breath);
      haloMesh.scale.set(breath * 0.98, breath * 1.02, breath);
      midMesh.scale.set(breath * 1.03, breath * 0.96, breath);
      coreMesh.scale.set(breath * 0.95, breath * 1.04, breath);

      // Slow gentle rotation
      flameGroup.rotation.y = t * 0.4;
      flameGroup.rotation.x = Math.sin(t * 0.5) * 0.15;
      particlePoints.rotation.y = -t * 0.3;
      particlePoints.rotation.z = t * 0.15;

      // Vertical floating oscillation
      flameGroup.position.y = Math.sin(t * 1.8) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
