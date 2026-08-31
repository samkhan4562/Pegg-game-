import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PegData, Point2D, ValidMove } from '../types';
import { sound } from '../audio/soundEffects';

interface GameCanvas3DProps {
  pegs: PegData[];
  target: Point2D;
  selectedPegId: string | null;
  validMoves: ValidMove[];
  isAnimating: boolean;
  isMenuMode?: boolean;
  cameraResetTrigger: number;
  levelCameraPos?: { x: number; y: number; z: number };
  onSelectPeg: (pegId: string | null) => void;
  onExecuteMove: (move: ValidMove) => void;
  onFocusMove?: (move: ValidMove | null) => void;
}

interface PegMeshWrapper {
  id: string;
  group: THREE.Group;
  baseY: number;
  currentY: number;
  targetY: number;
  targetScaleY: number;
  currentScaleY: number;
  meshMaterials: THREE.MeshStandardMaterial[];
  selectionRing: THREE.Mesh;
  glowAura: THREE.Mesh;
  labelSprite?: THREE.Sprite;
  currentLabel?: string;
}

// Helper to create a crisp high-res floating letter badge for Pegs (A, B, C, D)
function createPegLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    // Glowing circular backdrop disc
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // High contrast letter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px "Fira Code", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.55, 0.55, 1);
  sprite.position.y = 1.15;
  return sprite;
}

export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  pegs,
  target,
  selectedPegId,
  validMoves,
  isAnimating,
  isMenuMode = false,
  cameraResetTrigger,
  levelCameraPos,
  onSelectPeg,
  onExecuteMove,
  onFocusMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References for dynamic 3D elements
  const pegsGroupRef = useRef<THREE.Group | null>(null);
  const pegWrappersRef = useRef<Map<string, PegMeshWrapper>>(new Map());
  const targetGroupRef = useRef<THREE.Group | null>(null);
  const targetLightRef = useRef<THREE.PointLight | null>(null);
  const targetRingsRef = useRef<THREE.Mesh[]>([]);
  const targetBeamRef = useRef<THREE.Mesh | null>(null);
  const guideLinesGroupRef = useRef<THREE.Group | null>(null);
  const pivotsGroupRef = useRef<THREE.Group | null>(null);
  const landingHolesGroupRef = useRef<THREE.Group | null>(null);
  const landingRingsRef = useRef<{ mesh: THREE.Mesh; move: ValidMove }[]>([]);
  const focusedMoveRef = useRef<ValidMove | null>(null);

  // Ghost Peg Preview Mesh
  const ghostPegGroupRef = useRef<THREE.Group | null>(null);

  // Hover state
  const hoveredPegIdRef = useRef<string | null>(null);
  const hoveredMoveDestRef = useRef<Point2D | null>(null);

  // Animation active state
  const activeAnimationRef = useRef<{
    pegId: string;
    startPos: THREE.Vector3;
    controlPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTime: number;
    duration: number;
    move: ValidMove;
    onComplete: () => void;
  } | null>(null);

  // Raycaster & Mouse
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    // Compute initial bounding center
    const allInitX = [...pegs.map((p) => p.x), target.x];
    const allInitY = [...pegs.map((p) => p.y), target.y];
    const initMinX = Math.min(...allInitX);
    const initMaxX = Math.max(...allInitX);
    const initMinY = Math.min(...allInitY);
    const initMaxY = Math.max(...allInitY);
    const initCenterX = (initMinX + initMaxX) / 2;
    const initCenterZ = (initMinY + initMaxY) / 2;
    const initMaxSpan = Math.max(initMaxX - initMinX, initMaxY - initMinY, 3.2);

    const initCamY = Math.max(8.0, initMaxSpan * 1.55 + 3.0);
    const initCamZ = initCenterZ + Math.max(6.5, initMaxSpan * 1.25 + 2.5);

    camera.position.set(initCenterX, initCamY, initCamZ);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent going underneath floor
    controls.minDistance = 3.5;
    controls.maxDistance = 35;
    controls.target.set(initCenterX, 0, initCenterZ);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(12, 24, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    const shadowDist = 16;
    dirLight.shadow.camera.left = -shadowDist;
    dirLight.shadow.camera.right = shadowDist;
    dirLight.shadow.camera.top = shadowDist;
    dirLight.shadow.camera.bottom = -shadowDist;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-14, 12, -10);
    scene.add(fillLight);

    // Lattice Floor & Dimples
    buildLatticeGrid(scene);

    // Groups for dynamic elements
    // Clear any previous references
    pegWrappersRef.current.clear();
    landingRingsRef.current = [];

    const pegsGroup = new THREE.Group();
    pegsGroupRef.current = pegsGroup;
    scene.add(pegsGroup);

    const targetGroup = new THREE.Group();
    targetGroupRef.current = targetGroup;
    scene.add(targetGroup);
    buildTargetMarker(targetGroup, scene);

    const guideLinesGroup = new THREE.Group();
    guideLinesGroupRef.current = guideLinesGroup;
    scene.add(guideLinesGroup);

    const pivotsGroup = new THREE.Group();
    pivotsGroupRef.current = pivotsGroup;
    scene.add(pivotsGroup);

    const landingHolesGroup = new THREE.Group();
    landingHolesGroupRef.current = landingHolesGroup;
    scene.add(landingHolesGroup);

    // Ghost Peg Group for Preview
    const ghostGroup = buildGhostPegModel();
    ghostGroup.visible = false;
    ghostPegGroupRef.current = ghostGroup;
    scene.add(ghostGroup);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // In Menu Mode: Slow cinematic orbital rotation
      if (controlsRef.current) {
        if (controlsRef.current.autoRotate) {
          controlsRef.current.update();
        } else {
          controlsRef.current.update();
        }
      }

      // Animate Target Marker (Pulsing rings & laser beam)
      if (targetGroupRef.current) {
        targetRingsRef.current.forEach((ring, idx) => {
          const speed = 2.0 + idx * 0.5;
          const scale = 1.0 + Math.sin(elapsedTime * speed + idx * 1.5) * 0.15;
          ring.scale.set(scale, scale, 1);
          ring.rotation.z += 0.008 * (idx % 2 === 0 ? 1 : -1);
        });

        if (targetBeamRef.current) {
          const beamMat = targetBeamRef.current.material as THREE.MeshBasicMaterial;
          beamMat.opacity = 0.4 + Math.sin(elapsedTime * 3) * 0.18;
        }

        if (targetLightRef.current) {
          targetLightRef.current.intensity = 2.2 + Math.sin(elapsedTime * 4) * 0.6;
        }
      }

      // Animate Landing Hole Rings
      landingRingsRef.current.forEach((item, idx) => {
        const isHovered =
          hoveredMoveDestRef.current &&
          hoveredMoveDestRef.current.x === item.move.dest.x &&
          hoveredMoveDestRef.current.y === item.move.dest.y;

        const pulseScale = isHovered
          ? 1.35 + Math.sin(elapsedTime * 8) * 0.18
          : 1.0 + Math.sin(elapsedTime * 4 + idx) * 0.12;

        item.mesh.scale.set(pulseScale, pulseScale, 1);
        item.mesh.rotation.z += isHovered ? 0.04 : 0.015;
      });

      // Animate Ghost Peg floating hover bobbing
      if (ghostPegGroupRef.current && ghostPegGroupRef.current.visible) {
        const bob = Math.sin(elapsedTime * 6) * 0.06;
        ghostPegGroupRef.current.position.y = 0.05 + bob;
      }

      // Animate Active Jump Trajectory
      if (activeAnimationRef.current) {
        const anim = activeAnimationRef.current;
        const now = performance.now();
        const rawProgress = (now - anim.startTime) / anim.duration;
        const progress = Math.min(1.0, Math.max(0.0, rawProgress));

        // Smooth trajectory: Smooth linear horizontal lerp + smooth parabolic vertical arc
        const smoothT = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const currentX = anim.startPos.x + (anim.endPos.x - anim.startPos.x) * smoothT;
        const currentZ = anim.startPos.z + (anim.endPos.z - anim.startPos.z) * smoothT;
        // Natural physics sine arc for vertical leap
        const arcY = Math.sin(progress * Math.PI) * (anim.controlPos.y || 1.8);

        const pegWrapper = pegWrappersRef.current.get(anim.pegId);
        if (pegWrapper) {
          pegWrapper.group.position.set(currentX, arcY, currentZ);

          // Flight stretch and squash
          if (progress < 0.85) {
            pegWrapper.group.scale.set(0.96, 1.08, 0.96);
          } else {
            const landingT = (progress - 0.85) / 0.15;
            const squash = 1.0 - (1.0 - landingT) * 0.12;
            pegWrapper.group.scale.set(1.06, squash, 1.06);
          }
        }

        if (progress >= 1.0) {
          if (pegWrapper) {
            pegWrapper.group.position.set(anim.endPos.x, 0, anim.endPos.z);
            pegWrapper.group.scale.set(1, 1, 1);
            pegWrapper.currentY = 0;
            pegWrapper.targetY = 0;
            pegWrapper.currentScaleY = 1;
            pegWrapper.targetScaleY = 1;
          }
          const callback = anim.onComplete;
          activeAnimationRef.current = null;
          callback();
        }
      }

      // Smooth Peg Hover Lift & Scale Interpolation
      pegWrappersRef.current.forEach((wrapper) => {
        if (!activeAnimationRef.current || activeAnimationRef.current.pegId !== wrapper.id) {
          // Smooth Y position lift
          wrapper.currentY += (wrapper.targetY - wrapper.currentY) * 0.22;
          wrapper.group.position.y = wrapper.currentY;

          // Smooth scale recovery
          wrapper.currentScaleY += (wrapper.targetScaleY - wrapper.currentScaleY) * 0.22;
          wrapper.group.scale.set(1, wrapper.currentScaleY, 1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      pegWrappersRef.current.clear();
      landingRingsRef.current = [];
    };
  }, []);

  // 2. Control Menu Mode Auto-Orbit
  useEffect(() => {
    if (!controlsRef.current) return;
    if (isMenuMode) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.0;
    } else {
      controlsRef.current.autoRotate = false;
    }
  }, [isMenuMode]);

  // 3. Build Floor Grid & Hole Dimples
  const buildLatticeGrid = (scene: THREE.Scene) => {
    // Ground Plane
    const planeGeo = new THREE.PlaneGeometry(60, 60);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f17,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle coordinate lines
    const gridHelper = new THREE.GridHelper(32, 32, 0x1e293b, 0x111827);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // Coordinate dimple holes (grid of subtle circular insets)
    const holeRadius = 0.18;
    const holeGeo = new THREE.RingGeometry(holeRadius * 0.5, holeRadius, 24);
    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x1f293d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    const innerHoleGeo = new THREE.CircleGeometry(holeRadius * 0.5, 24);
    const innerHoleMat = new THREE.MeshBasicMaterial({
      color: 0x05070a,
      side: THREE.DoubleSide,
    });

    const dimpleGroup = new THREE.Group();
    const bound = 9;
    for (let x = -bound; x <= bound; x++) {
      for (let z = -bound; z <= bound; z++) {
        const ring = new THREE.Mesh(holeGeo, holeMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.002, z);
        dimpleGroup.add(ring);

        const inner = new THREE.Mesh(innerHoleGeo, innerHoleMat);
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(x, 0.0025, z);
        dimpleGroup.add(inner);
      }
    }
    scene.add(dimpleGroup);
  };

  // 4. Build Target Marker Visuals
  const buildTargetMarker = (targetGroup: THREE.Group, scene: THREE.Scene) => {
    // Neon Ring 1 (Inner glow)
    const ringGeo1 = new THREE.RingGeometry(0.24, 0.38, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.006;
    targetGroup.add(ring1);

    // Neon Ring 2 (Outer dashed/halo)
    const ringGeo2 = new THREE.RingGeometry(0.42, 0.54, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.007;
    targetGroup.add(ring2);

    targetRingsRef.current = [ring1, ring2];

    // Energy Laser Beam
    const beamGeo = new THREE.CylinderGeometry(0.06, 0.24, 4.5, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.25;
    targetGroup.add(beam);
    targetBeamRef.current = beam;

    // Target Point Light
    const pointLight = new THREE.PointLight(0x10b981, 2.4, 10, 2);
    pointLight.position.set(0, 0.8, 0);
    targetGroup.add(pointLight);
    targetLightRef.current = pointLight;
  };

  // 5. Build Ghost Peg Model
  const buildGhostPegModel = (): THREE.Group => {
    const ghostGroup = new THREE.Group();
    ghostGroup.name = 'ghost-peg-preview';

    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
    });

    // Base foot
    const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.12, 24);
    const baseMesh = new THREE.Mesh(baseGeo, ghostMat);
    baseMesh.position.y = 0.06;
    ghostGroup.add(baseMesh);

    // Waist
    const waistGeo = new THREE.CylinderGeometry(0.13, 0.24, 0.44, 24);
    const waistMesh = new THREE.Mesh(waistGeo, ghostMat);
    waistMesh.position.y = 0.32;
    ghostGroup.add(waistMesh);

    // Collar
    const collarGeo = new THREE.TorusGeometry(0.16, 0.035, 12, 24);
    const collarMesh = new THREE.Mesh(collarGeo, ghostMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.52;
    ghostGroup.add(collarMesh);

    // Bulb Head Sphere
    const headGeo = new THREE.SphereGeometry(0.24, 24, 20);
    const headMesh = new THREE.Mesh(headGeo, ghostMat);
    headMesh.position.y = 0.72;
    ghostGroup.add(headMesh);

    return ghostGroup;
  };

  // 6. Update Target Position
  useEffect(() => {
    if (targetGroupRef.current) {
      targetGroupRef.current.position.set(target.x, 0, target.y);
    }
  }, [target]);

  // 7. Build and Update Peg 3D Meshes
  useEffect(() => {
    if (!pegsGroupRef.current) return;
    const group = pegsGroupRef.current;

    // Existing IDs
    const currentIds = new Set(pegs.map((p) => p.id));

    // Remove obsolete pegs
    pegWrappersRef.current.forEach((wrapper, id) => {
      if (!currentIds.has(id)) {
        if (wrapper.group.parent) wrapper.group.parent.remove(wrapper.group);
        pegWrappersRef.current.delete(id);
      }
    });

    // Create or update pegs
    pegs.forEach((pegData) => {
      let wrapper = pegWrappersRef.current.get(pegData.id);
      const pegLabel = pegData.label || pegData.id.replace('p', '');

      if (!wrapper) {
        // Create new Peg Group
        const pegGroup = new THREE.Group();
        pegGroup.name = `peg-${pegData.id}`;

        const mats: THREE.MeshStandardMaterial[] = [];

        // Porcelain material
        const porcelainMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.22,
          metalness: 0.08,
          emissive: 0x000000,
        });
        mats.push(porcelainMat);

        // Base foot
        const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.12, 32);
        const baseMesh = new THREE.Mesh(baseGeo, porcelainMat);
        baseMesh.position.y = 0.06;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        pegGroup.add(baseMesh);

        // Waist
        const waistGeo = new THREE.CylinderGeometry(0.13, 0.24, 0.44, 32);
        const waistMesh = new THREE.Mesh(waistGeo, porcelainMat);
        waistMesh.position.y = 0.32;
        waistMesh.castShadow = true;
        waistMesh.receiveShadow = true;
        pegGroup.add(waistMesh);

        // Collar ring
        const collarGeo = new THREE.TorusGeometry(0.16, 0.035, 16, 32);
        const collarMesh = new THREE.Mesh(collarGeo, porcelainMat);
        collarMesh.rotation.x = Math.PI / 2;
        collarMesh.position.y = 0.52;
        collarMesh.castShadow = true;
        pegGroup.add(collarMesh);

        // Bulb Head Sphere
        const headGeo = new THREE.SphereGeometry(0.24, 32, 24);
        const headMesh = new THREE.Mesh(headGeo, porcelainMat);
        headMesh.position.y = 0.72;
        headMesh.castShadow = true;
        headMesh.receiveShadow = true;
        pegGroup.add(headMesh);

        // Golden Selection Ring
        const ringGeo = new THREE.RingGeometry(0.32, 0.44, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        });
        const selectionRing = new THREE.Mesh(ringGeo, ringMat);
        selectionRing.rotation.x = -Math.PI / 2;
        selectionRing.position.y = 0.005;
        pegGroup.add(selectionRing);

        // Glowing Aura disc underneath
        const auraGeo = new THREE.CircleGeometry(0.55, 32);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        });
        const glowAura = new THREE.Mesh(auraGeo, auraMat);
        glowAura.rotation.x = -Math.PI / 2;
        glowAura.position.y = 0.004;
        pegGroup.add(glowAura);

        // Floating Letter Badge (A, B, C, D)
        const labelSprite = createPegLabelSprite(pegLabel);
        pegGroup.add(labelSprite);

        // Invisible Raycast Hit Box
        const hitGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitGeo, hitMat);
        hitBox.position.y = 0.5;
        hitBox.name = `hitbox-${pegData.id}`;
        pegGroup.add(hitBox);

        pegGroup.position.set(pegData.x, 0, pegData.y);
        group.add(pegGroup);

        wrapper = {
          id: pegData.id,
          group: pegGroup,
          baseY: 0,
          currentY: 0,
          targetY: 0,
          targetScaleY: 1,
          currentScaleY: 1,
          meshMaterials: mats,
          selectionRing,
          glowAura,
          labelSprite,
          currentLabel: pegLabel,
        };

        pegWrappersRef.current.set(pegData.id, wrapper);
      } else {
        // Ensure wrapper is in current active group
        if (wrapper.group.parent !== group) {
          if (wrapper.group.parent) wrapper.group.parent.remove(wrapper.group);
          group.add(wrapper.group);
        }

        // Update label sprite if changed
        if (wrapper.currentLabel !== pegLabel) {
          if (wrapper.labelSprite) wrapper.group.remove(wrapper.labelSprite);
          const newSprite = createPegLabelSprite(pegLabel);
          wrapper.group.add(newSprite);
          wrapper.labelSprite = newSprite;
          wrapper.currentLabel = pegLabel;
        }

        // Update position if not currently in flight animation
        if (!activeAnimationRef.current || activeAnimationRef.current.pegId !== pegData.id) {
          wrapper.group.position.set(pegData.x, wrapper.currentY, pegData.y);
        }
      }

      // Update Selection Styling
      const isSelected = selectedPegId === pegData.id;
      const isHovered = hoveredPegIdRef.current === pegData.id;

      wrapper.targetY = isSelected ? 0.35 : isHovered ? 0.2 : 0;

      wrapper.meshMaterials.forEach((mat) => {
        if (isSelected) {
          mat.emissive.setHex(0xf59e0b);
          mat.emissiveIntensity = 0.45;
        } else if (isHovered) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.25;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });

      const selMat = wrapper.selectionRing.material as THREE.MeshBasicMaterial;
      selMat.opacity = isSelected ? 0.9 : 0;

      const auraMat = wrapper.glowAura.material as THREE.MeshBasicMaterial;
      auraMat.opacity = isSelected ? 0.35 : isHovered ? 0.15 : 0;
    });
  }, [pegs, selectedPegId]);

  // 8. Build Aiming Trajectory Arc & Landing Target Rings (Single 180° Point-Reflection Trajectory)
  const renderAimingTrajectory = React.useCallback(() => {
    if (
      !guideLinesGroupRef.current ||
      !landingHolesGroupRef.current ||
      !pivotsGroupRef.current
    )
      return;

    const guideGroup = guideLinesGroupRef.current;
    const landingGroup = landingHolesGroupRef.current;
    const pivotsGroup = pivotsGroupRef.current;

    // Clear old guides, pivots & landing rings
    while (guideGroup.children.length > 0) {
      const obj = guideGroup.children[0];
      guideGroup.remove(obj);
    }
    while (landingGroup.children.length > 0) {
      const obj = landingGroup.children[0];
      landingGroup.remove(obj);
    }
    while (pivotsGroup.children.length > 0) {
      const obj = pivotsGroup.children[0];
      pivotsGroup.remove(obj);
    }
    landingRingsRef.current = [];

    // Hide ghost preview when no selection or moves
    if (!selectedPegId || validMoves.length === 0) {
      if (ghostPegGroupRef.current) {
        ghostPegGroupRef.current.visible = false;
      }
      focusedMoveRef.current = null;
      onFocusMove?.(null);
      return;
    }

    const selectedPeg = pegs.find((p) => p.id === selectedPegId);
    if (!selectedPeg) {
      focusedMoveRef.current = null;
      onFocusMove?.(null);
      return;
    }

    // Determine the single active / focused move
    let activeMove: ValidMove = validMoves[0];
    if (hoveredMoveDestRef.current) {
      const destMove = validMoves.find(
        (m) =>
          m.dest.x === hoveredMoveDestRef.current?.x &&
          m.dest.y === hoveredMoveDestRef.current?.y
      );
      if (destMove) activeMove = destMove;
    } else if (hoveredPegIdRef.current) {
      const pivotMove = validMoves.find(
        (m) => m.pivotId === hoveredPegIdRef.current
      );
      if (pivotMove) activeMove = pivotMove;
    } else if (focusedMoveRef.current) {
      const existing = validMoves.find(
        (m) =>
          m.pivotId === focusedMoveRef.current?.pivotId &&
          m.dest.x === focusedMoveRef.current?.dest.x &&
          m.dest.y === focusedMoveRef.current?.dest.y
      );
      if (existing) activeMove = existing;
    }

    focusedMoveRef.current = activeMove;
    onFocusMove?.(activeMove);

    // 1. Render Distinct Pivot Markers for all valid pivots
    const renderedPivots = new Set<string>();
    validMoves.forEach((move) => {
      if (renderedPivots.has(move.pivotId)) return;
      renderedPivots.add(move.pivotId);

      const isCurrentPivot = activeMove.pivotId === move.pivotId;

      const pivotGroupItem = new THREE.Group();
      pivotGroupItem.position.set(move.pivot.x, 0.02, move.pivot.y);

      // Cyan Pivot Ring around the pivot peg
      const pRingGeo = new THREE.RingGeometry(0.32, isCurrentPivot ? 0.48 : 0.42, 32);
      const pRingMat = new THREE.MeshBasicMaterial({
        color: isCurrentPivot ? 0x06b6d4 : 0x0ea5e9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isCurrentPivot ? 0.95 : 0.55,
      });
      const pRingMesh = new THREE.Mesh(pRingGeo, pRingMat);
      pRingMesh.rotation.x = -Math.PI / 2;
      pivotGroupItem.add(pRingMesh);

      // Outer ripple for active pivot
      if (isCurrentPivot) {
        const outerGeo = new THREE.RingGeometry(0.52, 0.62, 32);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const outerMesh = new THREE.Mesh(outerGeo, outerMat);
        outerMesh.rotation.x = -Math.PI / 2;
        pivotGroupItem.add(outerMesh);
      }

      pivotsGroup.add(pivotGroupItem);
    });

    // 2. Render Landing Target Rings for ALL valid moves
    validMoves.forEach((move) => {
      const isCurrentMove =
        move.pivotId === activeMove.pivotId &&
        move.dest.x === activeMove.dest.x &&
        move.dest.y === activeMove.dest.y;

      const landingGroupItem = new THREE.Group();
      landingGroupItem.position.set(move.dest.x, 0.015, move.dest.y);

      // Inner ring
      const ringGeo = new THREE.RingGeometry(0.22, 0.38, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isCurrentMove ? 0xf59e0b : 0xf97316,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isCurrentMove ? 0.95 : 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      landingGroupItem.add(ringMesh);

      // Outer ripple ring
      const outerRingGeo = new THREE.RingGeometry(0.44, 0.56, 32);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: isCurrentMove ? 0xfbbf24 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isCurrentMove ? 0.7 : 0.4,
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRingMesh.rotation.x = -Math.PI / 2;
      landingGroupItem.add(outerRingMesh);

      // Clickable / Touchable Hit Disc for Landing Ring
      const hitDiscGeo = new THREE.CircleGeometry(0.72, 24);
      const hitDiscMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitDisc = new THREE.Mesh(hitDiscGeo, hitDiscMat);
      hitDisc.rotation.x = -Math.PI / 2;
      hitDisc.name = 'landing_hitdisc';
      hitDisc.userData = {
        isLanding: true,
        move: move,
        dest: move.dest,
      };
      landingGroupItem.add(hitDisc);

      landingGroup.add(landingGroupItem);

      landingRingsRef.current.push({
        mesh: ringMesh,
        move: move,
      });
    });

    // 3. Render Trajectory Curves and Ground Lines for ALL Valid Moves
    validMoves.forEach((move) => {
      const isCurrentMove =
        move.pivotId === activeMove.pivotId &&
        move.dest.x === activeMove.dest.x &&
        move.dest.y === activeMove.dest.y;

      // Ground Projection Dashed Line (Start -> Pivot -> Dest)
      const groundPoints = [
        new THREE.Vector3(move.from.x, 0.02, move.from.y),
        new THREE.Vector3(move.pivot.x, 0.02, move.pivot.y),
        new THREE.Vector3(move.dest.x, 0.02, move.dest.y),
      ];
      const groundGeo = new THREE.BufferGeometry().setFromPoints(groundPoints);
      const groundMat = new THREE.LineDashedMaterial({
        color: isCurrentMove ? 0x06b6d4 : 0x0ea5e9,
        dashSize: 0.22,
        gapSize: isCurrentMove ? 0.1 : 0.14,
        linewidth: isCurrentMove ? 3.0 : 2.0,
        transparent: true,
        opacity: isCurrentMove ? 0.9 : 0.55,
      });
      const groundLine = new THREE.Line(groundGeo, groundMat);
      groundLine.computeLineDistances();
      guideGroup.add(groundLine);

      // Parabolic 3D Bezier Curve (Flying Arcs)
      const apexHeight = Math.min(3.8, Math.max(1.3, move.distance * 0.55));
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(move.from.x, 0.6, move.from.y),
        new THREE.Vector3(move.pivot.x, 0.6 + apexHeight, move.pivot.y),
        new THREE.Vector3(move.dest.x, 0.6, move.dest.y)
      );

      const curvePoints = curve.getPoints(36);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const curveMat = new THREE.LineDashedMaterial({
        color: isCurrentMove ? 0xfbbf24 : 0xf97316,
        dashSize: isCurrentMove ? 0.28 : 0.22,
        gapSize: isCurrentMove ? 0.1 : 0.14,
        linewidth: isCurrentMove ? 3.8 : 2.6,
        transparent: true,
        opacity: isCurrentMove ? 0.98 : 0.8,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcLine.computeLineDistances();
      guideGroup.add(arcLine);

      // Trajectory bead points along the curve for crisp visibility
      const numBeads = Math.max(4, Math.min(8, Math.round(move.distance * 1.5)));
      const beadGeo = new THREE.SphereGeometry(isCurrentMove ? 0.055 : 0.042, 8, 8);
      const beadMat = new THREE.MeshBasicMaterial({
        color: isCurrentMove ? 0xfffbeb : 0xfef08a,
        transparent: true,
        opacity: isCurrentMove ? 0.95 : 0.75,
      });
      for (let i = 1; i <= numBeads; i++) {
        const t = i / (numBeads + 1);
        const pt = curve.getPoint(t);
        const bead = new THREE.Mesh(beadGeo, beadMat);
        bead.position.copy(pt);
        guideGroup.add(bead);
      }
    });

    // 4. Position Ghost Peg at destination of currently focused move
    if (ghostPegGroupRef.current) {
      ghostPegGroupRef.current.position.set(
        activeMove.dest.x,
        0.05,
        activeMove.dest.y
      );
      ghostPegGroupRef.current.visible = true;
    }
  }, [selectedPegId, validMoves, pegs, onFocusMove]);

  useEffect(() => {
    renderAimingTrajectory();
  }, [renderAimingTrajectory]);

  // 9. Handle Camera Reset / Auto-Framing Transition
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const controls = controlsRef.current;

    // Reset active animation state on level load / reset
    activeAnimationRef.current = null;

    // Calculate dynamic bounding box of all pegs and target
    const allX = [...pegs.map((p) => p.x), target.x];
    const allY = [...pegs.map((p) => p.y), target.y];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const centerX = (minX + maxX) / 2;
    const centerZ = (minY + maxY) / 2;
    const spanX = maxX - minX;
    const spanZ = maxY - minY;
    const maxSpan = Math.max(spanX, spanZ, 3.2);

    const targetCamY = Math.max(8.0, maxSpan * 1.55 + 3.0);
    const targetCamZ = centerZ + Math.max(6.5, maxSpan * 1.25 + 2.5);
    const targetCamX = centerX;

    const startPos = cam.position.clone();
    const endPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(centerX, 0, centerZ);

    const startTime = performance.now();
    const duration = 600;

    let animId: number;
    const easeCamera = () => {
      const now = performance.now();
      const progress = Math.min(1.0, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out

      cam.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (progress < 1.0) {
        animId = requestAnimationFrame(easeCamera);
      }
    };

    easeCamera();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraResetTrigger, pegs, target]);

  // 10. Pointer Event Handlers (Click & Hover)
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || isAnimating || isMenuMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Check hit objects
    const hitList: THREE.Object3D[] = [];
    if (pegsGroupRef.current) hitList.push(...pegsGroupRef.current.children);
    if (landingHolesGroupRef.current) hitList.push(...landingHolesGroupRef.current.children);

    const intersects = raycasterRef.current.intersectObjects(hitList, true);

    let foundPegId: string | null = null;
    let foundDest: Point2D | null = null;

    if (intersects.length > 0) {
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr.parent && curr.parent !== sceneRef.current) {
          if (curr.userData && curr.userData.isLanding && curr.userData.dest) {
            foundDest = curr.userData.dest;
            break;
          }
          if (curr.name && curr.name.startsWith('peg-')) {
            foundPegId = curr.name.replace('peg-', '');
            break;
          }
          curr = curr.parent;
        }
        if (foundPegId || foundDest) break;
      }
    }

    // Check if hovering over a pivot peg for the current selection
    if (selectedPegId && foundPegId && !foundDest) {
      const moveForPivot = validMoves.find((m) => m.pivotId === foundPegId);
      if (moveForPivot) {
        foundDest = moveForPivot.dest;
      }
    }

    let stateChanged = false;

    if (foundPegId !== hoveredPegIdRef.current) {
      hoveredPegIdRef.current = foundPegId;
      stateChanged = true;
      if (foundPegId) {
        sound.playHover();
        containerRef.current.style.cursor = 'pointer';
      } else if (!foundDest) {
        containerRef.current.style.cursor = 'default';
      }
      // Update visual states on wrappers
      pegWrappersRef.current.forEach((wrapper) => {
        const isHovered = wrapper.id === foundPegId;
        const isSelected = wrapper.id === selectedPegId;
        wrapper.targetY = isSelected ? 0.35 : isHovered ? 0.2 : 0;
      });
    }

    if (foundDest !== hoveredMoveDestRef.current) {
      hoveredMoveDestRef.current = foundDest;
      stateChanged = true;
      if (foundDest) {
        containerRef.current.style.cursor = 'pointer';
      }
    }

    if (stateChanged && selectedPegId && validMoves.length > 0) {
      renderAimingTrajectory();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || isAnimating || isMenuMode) return;

    // Check if this was a drag or a click
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx > 6 || dy > 6) {
      // User was orbiting/dragging camera, ignore as click
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const hitList: THREE.Object3D[] = [];
    if (pegsGroupRef.current) hitList.push(...pegsGroupRef.current.children);
    if (landingHolesGroupRef.current) hitList.push(...landingHolesGroupRef.current.children);

    const intersects = raycasterRef.current.intersectObjects(hitList, true);

    let clickedPegId: string | null = null;
    let clickedMove: ValidMove | null = null;

    if (intersects.length > 0) {
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr.parent && curr.parent !== sceneRef.current) {
          if (curr.userData && curr.userData.isLanding && curr.userData.move) {
            clickedMove = curr.userData.move;
            break;
          }
          if (curr.name && curr.name.startsWith('peg-')) {
            clickedPegId = curr.name.replace('peg-', '');
            break;
          }
          curr = curr.parent;
        }
        if (clickedPegId || clickedMove) break;
      }
    }

    // 1. If clicked a landing target ring -> Execute Jump!
    if (clickedMove && selectedPegId) {
      if (ghostPegGroupRef.current) {
        ghostPegGroupRef.current.visible = false;
      }
      executeJumpAnimation(clickedMove);
      return;
    }

    // 2. If clicked a peg
    if (clickedPegId) {
      // If currently selected peg clicked again -> Deselect smoothly
      if (clickedPegId === selectedPegId) {
        sound.playSelect();
        onSelectPeg(null);
        if (ghostPegGroupRef.current) ghostPegGroupRef.current.visible = false;
        return;
      }

      // If clicked a pivot peg for a valid move from the selected peg -> Execute Jump!
      if (selectedPegId) {
        const moveWithPivot = validMoves.find((m) => m.pivotId === clickedPegId);
        if (moveWithPivot) {
          if (ghostPegGroupRef.current) ghostPegGroupRef.current.visible = false;
          executeJumpAnimation(moveWithPivot);
          return;
        }
      }

      // Otherwise select this new peg
      sound.playSelect();
      onSelectPeg(clickedPegId);
      if (ghostPegGroupRef.current) ghostPegGroupRef.current.visible = false;
      return;
    }

    // 3. Clicked empty background / grid -> Deselect
    if (selectedPegId) {
      onSelectPeg(null);
      if (ghostPegGroupRef.current) ghostPegGroupRef.current.visible = false;
    }
  };

  // 11. Execute Smooth 3D Parabolic Jump Animation
  const executeJumpAnimation = (move: ValidMove) => {
    const duration = 400; // 400ms per PRD
    const apexHeight = Math.min(4.0, Math.max(1.2, move.distance * 0.5));

    const startPos = new THREE.Vector3(move.from.x, 0, move.from.y);
    const controlPos = new THREE.Vector3(move.pivot.x, apexHeight, move.pivot.y);
    const endPos = new THREE.Vector3(move.dest.x, 0, move.dest.y);

    // Audio triggers
    sound.playJumpWhoosh(duration / 1000);

    activeAnimationRef.current = {
      pegId: move.pegId,
      startPos,
      controlPos,
      endPos,
      startTime: performance.now(),
      duration,
      move,
      onComplete: () => {
        sound.playLanding();
        onExecuteMove(move);
      },
    };
  };

  return (
    <div
      ref={containerRef}
      id="three-canvas-container"
      className="w-full h-full relative cursor-default touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelectPeg(null);
        if (ghostPegGroupRef.current) ghostPegGroupRef.current.visible = false;
      }}
    />
  );
};
