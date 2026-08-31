import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Traveler, BridgeBank } from '../types';

interface BridgeCanvas3DProps {
  leftBank: Traveler[];
  rightBank: Traveler[];
  torchBank: BridgeBank;
  selectedIds: string[];
  crossingTravelers: Traveler[] | null;
  crossingDirection: 'forward' | 'backward' | null;
  crossingProgress: number; // 0 to 1
  onSelectTraveler: (travelerId: string) => void;
  cameraResetTrigger: number;
}

export const BridgeCanvas3D: React.FC<BridgeCanvas3DProps> = ({
  leftBank,
  rightBank,
  torchBank,
  selectedIds,
  crossingTravelers,
  crossingDirection,
  crossingProgress,
  onSelectTraveler,
  cameraResetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const torchLightRef = useRef<THREE.PointLight | null>(null);
  const torchMeshRef = useRef<THREE.Group | null>(null);
  const flameParticlesRef = useRef<THREE.Points | null>(null);
  const travelerMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Mouse / Touch Orbit Drag & Zoom State
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchRadiusRef = useRef<number>(18.0);
  const cameraAngleRef = useRef({ theta: 0.22, phi: 1.05, radius: 18.0 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.5, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ==========================================
    // LIGHTING SETUP
    // ==========================================
    // Ambient night glow
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    // Directional moonlight from above
    const moonLight = new THREE.DirectionalLight(0x60a5fa, 0.85);
    moonLight.position.set(12, 22, 14);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 50;
    moonLight.shadow.camera.left = -16;
    moonLight.shadow.camera.right = 16;
    moonLight.shadow.camera.top = 16;
    moonLight.shadow.camera.bottom = -16;
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);

    // Subtle Cyan Fill Light from bottom canyon
    const canyonRimLight = new THREE.DirectionalLight(0x0284c7, 0.35);
    canyonRimLight.position.set(-10, -10, -10);
    scene.add(canyonRimLight);

    // Dynamic Torch Point Light
    const torchLight = new THREE.PointLight(0xffa100, 5.2, 18, 1.2);
    torchLight.castShadow = true;
    torchLight.shadow.bias = -0.002;
    scene.add(torchLight);
    torchLightRef.current = torchLight;

    // 3D Torch Group (Handle + Brazier + Flame Mesh)
    const torchGroup = create3DTorchGroup();
    scene.add(torchGroup);
    torchMeshRef.current = torchGroup;

    // Torch Rising Spark Particles
    const flameParticles = createFlameParticles();
    scene.add(flameParticles);
    flameParticlesRef.current = flameParticles;

    // ==========================================
    // 3D ENVIRONMENT: CLIFFS, BRIDGE, WATER & STARS
    // ==========================================
    buildBridgeEnvironment(scene);

    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic torch flame flicker
      if (torchLightRef.current) {
        const flicker = 4.8 + Math.sin(elapsedTime * 14) * 0.4 + Math.cos(elapsedTime * 22) * 0.3;
        torchLightRef.current.intensity = flicker;
      }

      if (torchMeshRef.current) {
        const flameCore = torchMeshRef.current.getObjectByName('flameCore');
        const flameAura = torchMeshRef.current.getObjectByName('flameAura');
        if (flameCore) {
          const s = 1.0 + Math.sin(elapsedTime * 18) * 0.15;
          flameCore.scale.set(s, s * 1.25, s);
        }
        if (flameAura) {
          const s = 1.0 + Math.cos(elapsedTime * 15) * 0.2;
          flameAura.scale.set(s, s * 1.3, s);
        }
      }

      // Animate Torch Sparks
      if (flameParticlesRef.current && torchMeshRef.current) {
        const posAttr = flameParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const torchPos = torchMeshRef.current.position;
        const count = posAttr.count;
        for (let i = 0; i < count; i++) {
          let y = posAttr.getY(i);
          y += 0.035 + (i % 5) * 0.006;
          if (y > torchPos.y + 1.6) {
            y = torchPos.y + 0.35;
            posAttr.setX(i, torchPos.x + (Math.random() - 0.5) * 0.25);
            posAttr.setZ(i, torchPos.z + (Math.random() - 0.5) * 0.25);
          }
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Mouse Wheel Zoom Listener
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.015;
      cameraAngleRef.current.radius = Math.max(7.0, Math.min(32.0, cameraAngleRef.current.radius + zoomDelta));
      updateCameraPosition();
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Resize Handler
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('wheel', handleWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Camera based on spherical angles
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAtRef.current);
  };

  // Reset Camera View Smoothly
  useEffect(() => {
    cameraAngleRef.current = { theta: 0.22, phi: 1.05, radius: 18.0 };
    updateCameraPosition();
  }, [cameraResetTrigger]);

  // Pointer & Multi-Touch Pinch-to-Zoom Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (activePointersRef.current.size === 2) {
      isDraggingRef.current = false;
      const pts = Array.from(activePointersRef.current.values()) as { x: number; y: number }[];
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchRadiusRef.current = cameraAngleRef.current.radius;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-Finger Pinch-to-Zoom
    if (activePointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(activePointersRef.current.values()) as { x: number; y: number }[];
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = initialPinchDistRef.current / Math.max(10, currentDist);
      cameraAngleRef.current.radius = Math.max(7.0, Math.min(32.0, initialPinchRadiusRef.current * ratio));
      updateCameraPosition();
      return;
    }

    // Handle 1-Finger / Mouse Camera Orbit Rotation
    if (isDraggingRef.current && activePointersRef.current.size === 1) {
      const deltaX = e.clientX - pointerDownPosRef.current.x;
      const deltaY = e.clientY - pointerDownPosRef.current.y;

      if (Math.abs(deltaX) > 1.5 || Math.abs(deltaY) > 1.5) {
        cameraAngleRef.current.theta -= deltaX * 0.005;
        cameraAngleRef.current.phi = Math.max(0.28, Math.min(1.35, cameraAngleRef.current.phi - deltaY * 0.004));
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
        updateCameraPosition();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const wasSinglePointer = activePointersRef.current.size === 1;
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
    }

    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    // If it was a clean click / tap (not dragging or pinching)
    if (wasSinglePointer) {
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
      if (dx <= 6 && dy <= 6) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        const interactables: THREE.Object3D[] = [];
        travelerMeshesRef.current.forEach((group) => {
          interactables.push(...group.children);
        });

        const intersects = raycaster.intersectObjects(interactables, true);
        if (intersects.length > 0) {
          let curr: THREE.Object3D | null = intersects[0].object;
          while (curr && !curr.userData.travelerId && curr.parent) {
            curr = curr.parent;
          }
          if (curr && curr.userData.travelerId) {
            onSelectTraveler(curr.userData.travelerId);
          }
        }
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
    }
  };

  // ==========================================
  // SYNC TRAVELERS, TORCH AND MOVEMENTS
  // ==========================================
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old traveler meshes
    travelerMeshesRef.current.forEach((group) => scene.remove(group));
    travelerMeshesRef.current.clear();

    const allTravelers = [
      ...leftBank,
      ...rightBank,
      ...(crossingTravelers || []),
    ];

    const uniqueMap = new Map<string, Traveler>();
    allTravelers.forEach((t) => uniqueMap.set(t.id, t));

    const bridgeStartX = -4.8;
    const bridgeEndX = 4.8;

    // Find who currently carries the torch
    let torchX = -6.4;
    let torchY = 1.35;
    let torchZ = 0;

    uniqueMap.forEach((traveler) => {
      const isSelected = selectedIds.includes(traveler.id);
      const isCrossing = crossingTravelers?.some((ct) => ct.id === traveler.id);

      let targetX = 0;
      let targetZ = 0;
      let targetY = 0.05;

      if (isCrossing) {
        // Interpolate along bridge
        const progress = crossingDirection === 'forward' ? crossingProgress : 1 - crossingProgress;
        targetX = THREE.MathUtils.lerp(bridgeStartX, bridgeEndX, progress);
        const indexInGroup = crossingTravelers?.findIndex((ct) => ct.id === traveler.id) || 0;
        const totalCrossing = crossingTravelers?.length || 2;
        if (totalCrossing === 1) {
          targetZ = 0;
        } else if (totalCrossing === 2) {
          targetZ = indexInGroup === 0 ? -0.42 : 0.42;
        } else {
          targetZ = indexInGroup === 0 ? -0.48 : indexInGroup === 1 ? 0.48 : 0;
        }
        // Walking bounce effect
        targetY = 0.05 + Math.abs(Math.sin(crossingProgress * Math.PI * 8)) * 0.16;
      } else if (leftBank.some((t) => t.id === traveler.id)) {
        // Left Bank layout (supports up to 6 travelers in 2 clean staggered rows)
        const idx = leftBank.findIndex((t) => t.id === traveler.id);
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        targetX = -6.5 - row * 1.45;
        targetZ = (col - 1) * 0.95;
      } else {
        // Right Bank layout (supports up to 6 travelers in 2 clean staggered rows)
        const idx = rightBank.findIndex((t) => t.id === traveler.id);
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        targetX = 6.5 + row * 1.45;
        targetZ = (col - 1) * 0.95;
      }

      // Elevate slightly if selected
      if (isSelected && !isCrossing) {
        targetY += 0.35;
      }

      const hasTorch =
        isCrossing
          ? crossingTravelers?.[0]?.id === traveler.id
          : torchBank === 'left'
          ? (leftBank[0]?.id === traveler.id || (selectedIds.length > 0 && selectedIds[0] === traveler.id))
          : (rightBank[0]?.id === traveler.id || (selectedIds.length > 0 && selectedIds[0] === traveler.id));

      if (hasTorch) {
        torchX = targetX + 0.35;
        torchY = targetY + 1.25;
        torchZ = targetZ + 0.25;
      }

      // Build 3D Realistic Adventurer Model
      const group = create3DTravelerAvatar(traveler, isSelected, isCrossing, hasTorch);
      group.position.set(targetX, targetY, targetZ);
      group.userData.travelerId = traveler.id;
      scene.add(group);
      travelerMeshesRef.current.set(traveler.id, group);
    });

    // Update Torch Light & Flame Mesh Position
    if (torchLightRef.current && torchMeshRef.current) {
      torchLightRef.current.position.set(torchX, torchY, torchZ);
      torchMeshRef.current.position.set(torchX, torchY, torchZ);
    }
  }, [leftBank, rightBank, torchBank, selectedIds, crossingTravelers, crossingDirection, crossingProgress]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
};

// ==========================================
// 3D TORCH GEOMETRY FACTORY
// ==========================================
function create3DTorchGroup(): THREE.Group {
  const group = new THREE.Group();

  // Wooden Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.65, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = -0.15;
  shaft.rotation.z = -0.15;
  group.add(shaft);

  // Metal Brazier Head
  const headGeo = new THREE.CylinderGeometry(0.12, 0.06, 0.16, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0.02, 0.18, 0);
  head.rotation.z = -0.15;
  group.add(head);

  // Flame Inner Core
  const flameCoreGeo = new THREE.ConeGeometry(0.12, 0.38, 8);
  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMat);
  flameCore.name = 'flameCore';
  flameCore.position.set(0.04, 0.36, 0);
  group.add(flameCore);

  // Flame Outer Glowing Aura
  const flameAuraGeo = new THREE.ConeGeometry(0.22, 0.52, 8);
  const flameAuraMat = new THREE.MeshBasicMaterial({ color: 0xff7b00, transparent: true, opacity: 0.75 });
  const flameAura = new THREE.Mesh(flameAuraGeo, flameAuraMat);
  flameAura.name = 'flameAura';
  flameAura.position.set(0.04, 0.38, 0);
  group.add(flameAura);

  return group;
}

// Flame Rising Sparks
function createFlameParticles(): THREE.Points {
  const particleCount = 45;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 1] = Math.random() * 1.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffa100,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}

// ==========================================
// 3D ENVIRONMENT BUILDER (CLIFFS & BRIDGE)
// ==========================================
function buildBridgeEnvironment(scene: THREE.Scene) {
  // 1. Left Cliff Bank
  const leftCliffGeo = new THREE.BoxGeometry(10, 6, 8);
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x181e29,
    roughness: 0.9,
    metalness: 0.1,
  });
  const leftCliff = new THREE.Mesh(leftCliffGeo, cliffMat);
  leftCliff.position.set(-10, -3, 0);
  leftCliff.receiveShadow = true;
  scene.add(leftCliff);

  // Left Bank Grass/Top Platform
  const topGrassMat = new THREE.MeshStandardMaterial({ color: 0x0f291e, roughness: 0.8 });
  const leftTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), topGrassMat);
  leftTop.position.set(-10, 0, 0);
  leftTop.receiveShadow = true;
  scene.add(leftTop);

  // 2. Right Cliff Bank
  const rightCliff = new THREE.Mesh(leftCliffGeo, cliffMat);
  rightCliff.position.set(10, -3, 0);
  rightCliff.receiveShadow = true;
  scene.add(rightCliff);

  const rightTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), topGrassMat);
  rightTop.position.set(10, 0, 0);
  rightTop.receiveShadow = true;
  scene.add(rightTop);

  // 3. Wooden Plank Bridge across chasm
  const bridgeGroup = new THREE.Group();
  const plankCount = 28;
  const plankGeo = new THREE.BoxGeometry(0.32, 0.08, 1.8);
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });

  for (let i = 0; i < plankCount; i++) {
    const t = i / (plankCount - 1);
    const x = THREE.MathUtils.lerp(-4.8, 4.8, t);
    // Slight natural bridge catenary sag
    const sag = Math.sin(t * Math.PI) * -0.22;
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(x, sag, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
  }

  // Suspension Ropes
  const ropeGeo = new THREE.CylinderGeometry(0.025, 0.025, 10, 8);
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x785535, roughness: 0.9 });

  const northRope = new THREE.Mesh(ropeGeo, ropeMat);
  northRope.rotation.z = Math.PI / 2;
  northRope.position.set(0, 0.55, 0.85);
  bridgeGroup.add(northRope);

  const southRope = new THREE.Mesh(ropeGeo, ropeMat);
  southRope.rotation.z = Math.PI / 2;
  southRope.position.set(0, 0.55, -0.85);
  bridgeGroup.add(southRope);

  // Bridge Support Posts on banks
  const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.4, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.8 });

  const posts = [
    { x: -4.8, z: 0.85 },
    { x: -4.8, z: -0.85 },
    { x: 4.8, z: 0.85 },
    { x: 4.8, z: -0.85 },
  ];
  posts.forEach((p) => {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(p.x, 0.5, p.z);
    post.castShadow = true;
    bridgeGroup.add(post);
  });

  scene.add(bridgeGroup);

  // 4. Abyss Mist / Chasm Floor
  const abyssGeo = new THREE.PlaneGeometry(60, 40);
  const abyssMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
  const abyss = new THREE.Mesh(abyssGeo, abyssMat);
  abyss.rotation.x = -Math.PI / 2;
  abyss.position.y = -8;
  scene.add(abyss);

  // 5. Starfield Sky
  const starGeo = new THREE.BufferGeometry();
  const starCount = 350;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 60;
    starPos[i * 3 + 1] = 6 + Math.random() * 25;
    starPos[i * 3 + 2] = -15 - Math.random() * 25;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.85 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

// =========================================================================
// REALISTIC STYLIZED 3D ADVENTURER CHARACTER GENERATOR
// =========================================================================
function create3DTravelerAvatar(
  traveler: Traveler,
  isSelected: boolean,
  isCrossing: boolean,
  hasTorch: boolean
): THREE.Group {
  const group = new THREE.Group();
  const color = new THREE.Color(traveler.avatarColor);

  // --- 1. Ground Contact Shadow & Base Disc ---
  const shadowGeo = new THREE.CircleGeometry(0.38, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.005;
  group.add(shadowMesh);

  // --- 2. Heavy Leather Boots & Feet ---
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.8,
    metalness: 0.1,
  });
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), bootMat);
  leftBoot.position.set(-0.11, 0.07, 0.02);
  leftBoot.castShadow = true;
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), bootMat);
  rightBoot.position.set(0.11, 0.07, 0.02);
  rightBoot.castShadow = true;
  group.add(rightBoot);

  // --- 3. Adventurer Trousers & Legs ---
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.7,
  });
  const legGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.32, 12);
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.11, 0.28, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.11, 0.28, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // --- 4. Belt with Golden Buckle ---
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.6 });
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), beltMat);
  belt.position.y = 0.46;
  belt.castShadow = true;
  group.add(belt);

  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.06), buckleMat);
  buckle.position.set(0, 0.46, 0.23);
  group.add(buckle);

  // --- 5. Layered Adventurer Tunic / Coat Torso ---
  const coatMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.25,
    emissive: color,
    emissiveIntensity: isSelected ? 0.4 : 0.08,
  });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.52, 16), coatMat);
  torso.position.y = 0.74;
  torso.castShadow = true;
  group.add(torso);

  // Shoulder Harness Leather Straps
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x45220d, roughness: 0.8 });
  const leftStrap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.04), strapMat);
  leftStrap.position.set(-0.1, 0.74, 0.17);
  leftStrap.rotation.z = -0.15;
  group.add(leftStrap);

  const rightStrap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.04), strapMat);
  rightStrap.position.set(0.1, 0.74, 0.17);
  rightStrap.rotation.z = 0.15;
  group.add(rightStrap);

  // --- 6. Arms & Hands ---
  const armGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.42, 10);
  const leftArm = new THREE.Mesh(armGeo, coatMat);
  leftArm.position.set(-0.28, 0.72, 0);
  leftArm.rotation.z = 0.2;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, coatMat);
  rightArm.position.set(0.28, 0.72, 0);
  rightArm.rotation.z = -0.2;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Hands (Gloves)
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), gloveMat);
  leftHand.position.set(-0.33, 0.48, 0.05);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), gloveMat);
  rightHand.position.set(0.33, 0.48, 0.05);
  group.add(rightHand);

  // --- 7. Head & Neck ---
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 12), skinMat);
  neck.position.y = 1.03;
  group.add(neck);

  const headGeo = new THREE.SphereGeometry(0.22, 20, 18);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.22;
  head.castShadow = true;
  group.add(head);

  // --- 8. Role-Specific Equipment & Accessories ---
  if (traveler.time === 1) {
    // Speedster / Scout: Glowing Cyber Headband & Courier Bag
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 8, 20), visorMat);
    visor.rotation.x = Math.PI / 2;
    visor.position.y = 1.25;
    group.add(visor);

    // Sleek Messenger Satchel
    const satchelMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.5 });
    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.12), satchelMat);
    satchel.position.set(-0.22, 0.62, 0.08);
    satchel.rotation.y = 0.2;
    satchel.castShadow = true;
    group.add(satchel);
  } else if (traveler.time === 2 || traveler.time === 3) {
    // Guide / Navigator: Explorer Hat & Brass Compass
    const hatBrimMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0d, roughness: 0.8 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 20), hatBrimMat);
    hatBrim.position.y = 1.34;
    group.add(hatBrim);

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.16, 16), hatBrimMat);
    hatCrown.position.y = 1.42;
    hatCrown.castShadow = true;
    group.add(hatCrown);
  } else if (traveler.time >= 4 && traveler.time <= 6) {
    // Scholar / Climber: Climbing Rope Coil & Mountaineer Carabiners
    const ropeCoilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const ropeCoil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 10, 20), ropeCoilMat);
    ropeCoil.rotation.y = Math.PI / 2;
    ropeCoil.position.set(0.22, 0.68, -0.12);
    ropeCoil.castShadow = true;
    group.add(ropeCoil);
  } else if (traveler.time >= 7 && traveler.time <= 10) {
    // Porter / Heavy / Blacksmith: Multi-Pouch Camping Rucksack
    const packMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.32), packMat);
    pack.position.set(0, 0.72, -0.28);
    pack.castShadow = true;
    group.add(pack);

    // Bedroll on top of pack
    const bedrollMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.42, 12), bedrollMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 1.02, -0.28);
    bedroll.castShadow = true;
    group.add(bedroll);
  } else {
    // Elder / Sage / Titan (12m+): Mystic Hooded Cloak & Carved Elder Staff
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.7 });
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.45, 8), staffMat);
    staff.position.set(0.38, 0.72, 0.12);
    staff.castShadow = true;
    group.add(staff);

    // Glowing staff gem orb
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xc084fc,
      emissiveIntensity: 0.85,
      roughness: 0.1,
    });
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), gemMat);
    gem.position.set(0.38, 1.48, 0.12);
    group.add(gem);
  }

  // --- 9. Selection Indicator (Golden Runic Ring & Column Pulse) ---
  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(0.48, 0.68, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffa100,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    group.add(ringMesh);

    // Soft beacon disc
    const beaconDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );
    beaconDisc.rotation.x = -Math.PI / 2;
    beaconDisc.position.y = 0.015;
    group.add(beaconDisc);
  }

  // --- 10. Overhead Crisp 3D Speed Badge ---
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 256;
  badgeCanvas.height = 128;
  const ctx = badgeCanvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 128);

    // Rounded Pill background
    ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.96)' : 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(16, 20, 224, 88, 44);
    ctx.fill();

    // Luminous Border
    ctx.strokeStyle = isSelected ? '#ffffff' : traveler.avatarColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Time text
    ctx.fillStyle = isSelected ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 44px "Fira Code", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${traveler.time}m`, 128, 64);
  }

  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: badgeTexture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.y = 1.95;
  sprite.scale.set(1.35, 0.68, 1);
  group.add(sprite);

  return group;
}
