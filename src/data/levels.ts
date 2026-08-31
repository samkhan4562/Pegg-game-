import { LevelData } from '../types';

export const LEVELS: LevelData[] = [
  // --- CHAPTER 1: LINEAR REFLECTIONS (TUTORIAL & EASY) ---
  {
    id: 1,
    name: "The First Hop",
    difficulty: "Tutorial",
    description: "Jump Peg A over Peg B along the line to reach the green target hole.",
    parMoves: 1,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' }
    ],
    target: { x: 2, y: 0 },
    cameraPos: { x: 1, y: 8, z: 6 },
    hint: "Click Peg A(0,0), then click the golden destination ring at (2,0). Formula: 2*(1)-0 = 2.",
  },
  {
    id: 2,
    name: "Reverse Leap",
    difficulty: "Tutorial",
    description: "Reflect in reverse across the origin to hit a negative coordinate target.",
    parMoves: 1,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' }
    ],
    target: { x: -2, y: 0 },
    cameraPos: { x: 0, y: 8, z: 6 },
    hint: "Jump Peg B(2,0) over Peg A(0,0): 2*(0) - 2 = -2!",
  },
  {
    id: 3,
    name: "Linear Relay",
    difficulty: "Easy",
    description: "Chain reflections along a straight line to project pegs to distant coordinates.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 3, y: 0, label: 'C' }
    ],
    target: { x: 5, y: 0 },
    cameraPos: { x: 2, y: 9, z: 7 },
    hint: "Move 1: p1 over p2 -> (2,0). Move 2: p2 over p3 -> (5,0)!",
  },
  {
    id: 4,
    name: "Vertical Ascent",
    difficulty: "Easy",
    description: "Reflect along the Y-axis to climb coordinate heights.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 0, y: 1, label: 'B' },
      { id: 'p3', x: 0, y: 3, label: 'C' }
    ],
    target: { x: 0, y: 5 },
    cameraPos: { x: 0, y: 9, z: 7 },
    hint: "Move 1: p1 over p2 -> (0,2). Move 2: p2 over p3 -> (0,5)!",
  },
  {
    id: 5,
    name: "Extended Runway",
    difficulty: "Easy-Medium",
    description: "Navigate a three-peg linear sequence to reach the outer runway target.",
    parMoves: 3,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 2, y: 0, label: 'C' }
    ],
    target: { x: 4, y: 0 },
    cameraPos: { x: 2, y: 10, z: 8 },
    hint: "Jump Peg A(0,0) over Peg C(2,0) directly to (4,0): 2*(2) - 0 = 4!",
  },

  // --- CHAPTER 2: 2D DIAGONALS & BRIDGES (MEDIUM) ---
  {
    id: 6,
    name: "Diagonal Inversion",
    difficulty: "Medium",
    description: "Use 2D diagonal reflection across a 45° angle to shift both X and Y simultaneously.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 1, label: 'B' },
      { id: 'p3', x: 0, y: 2, label: 'C' }
    ],
    target: { x: 2, y: 2 },
    cameraPos: { x: 1, y: 10, z: 8 },
    hint: "Move 1: p3 over p2 -> (2,0). Move 2: p1 over p2 -> (2,2) directly!",
  },
  {
    id: 7,
    name: "Stepping Stones",
    difficulty: "Medium",
    description: "Bounce pegs alternately to build stepping stones across the 2D grid plane.",
    parMoves: 3,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 0, y: 1, label: 'C' }
    ],
    target: { x: 2, y: 2 },
    cameraPos: { x: 1, y: 11, z: 9 },
    hint: "Move 1: p1 over p2 -> (2,0). Move 2: p1 over p3 -> (0,2). Move 3: (2,0) over (0,2) cross -> (2,2).",
  },
  {
    id: 8,
    name: "Knight's Oblique Leap",
    difficulty: "Medium-Hard",
    description: "Utilize non-orthogonal reflection vectors to land directly on an off-axis coordinate.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 2, label: 'B' },
      { id: 'p3', x: 0, y: 1, label: 'C' }
    ],
    target: { x: 2, y: 4 },
    cameraPos: { x: 1, y: 12, z: 10 },
    hint: "Direct leap: p1(0,0) over p2(1,2) lands at 2*(1,2) - (0,0) = (2,4)!",
  },
  {
    id: 9,
    name: "The Parity Lock (Corrected)",
    difficulty: "Hard",
    description: "Navigate a complex 3-peg asymmetric cluster to reach the target parity coordinates.",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' },
      { id: 'p3', x: 1, y: 2, label: 'C' }
    ],
    target: { x: 3, y: 6 },
    cameraPos: { x: 2, y: 14, z: 11 },
    hint: "Move 1: p1 over p3 -> (2,4). Move 2: p2 over p3 -> (0,4). Move 3: (0,4) over (2,4) -> (4,4). Move 4: p3(1,2) over (2,4) -> (3,6)!",
  },
  {
    id: 10,
    name: "Cross Reflection",
    difficulty: "Medium-Hard",
    description: "Symmetrically mirror across the vertical center to reach distant positive coordinates.",
    parMoves: 3,
    pegs: [
      { id: 'p1', x: -1, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 0, y: 1, label: 'C' }
    ],
    target: { x: 3, y: 0 },
    cameraPos: { x: 1, y: 12, z: 10 },
    hint: "Jump Peg A(-1,0) over Peg B(1,0) to reach (3,0): 2*(1) - (-1) = 3.",
  },

  // --- CHAPTER 3: MULTI-STAGE REBOUNDS (HARD) ---
  {
    id: 11,
    name: "The Corner Pivot",
    difficulty: "Hard",
    description: "Utilize a 2:1 slope angle to mirror across an eccentric pivot point.",
    parMoves: 3,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 1, label: 'B' },
      { id: 'p3', x: 1, y: 0, label: 'C' }
    ],
    target: { x: 4, y: 2 },
    cameraPos: { x: 2, y: 12, z: 10 },
    hint: "Jump p1(0,0) over p2(2,1) -> lands at 2*(2,1)-(0,0) = (4,2) directly!",
  },
  {
    id: 12,
    name: "The MoMath Triangle",
    difficulty: "Hard",
    description: "An equilateral-style peg lattice requiring multi-stage rotational reflections.",
    parMoves: 3,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 2, label: 'B' },
      { id: 'p3', x: 4, y: 0, label: 'C' }
    ],
    target: { x: 4, y: 4 },
    cameraPos: { x: 2, y: 13, z: 11 },
    hint: "Reflect p1(0,0) over p2(2,2) to reach (4,4) directly!",
  },
  {
    id: 13,
    name: "Double Slingshot",
    difficulty: "Hard",
    description: "Coordinate a 4-peg diamond matrix to sling pegs across multiple axes.",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 1, label: 'B' },
      { id: 'p3', x: 2, y: 0, label: 'C' },
      { id: 'p4', x: 0, y: 2, label: 'D' }
    ],
    target: { x: 4, y: 2 },
    cameraPos: { x: 2, y: 14, z: 12 },
    hint: "Move 1: p1 over p2 -> (2,2). Move 2: p3 over (2,2) -> (2,4). Move 3: p4 over (2,2) -> (4,2).",
  },
  {
    id: 14,
    name: "The Quad Inversion",
    difficulty: "Hard",
    description: "Expand a 2x2 square peg grid outward to hit the outer perimeter goal.",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' },
      { id: 'p3', x: 0, y: 2, label: 'C' },
      { id: 'p4', x: 2, y: 2, label: 'D' }
    ],
    target: { x: 4, y: 4 },
    cameraPos: { x: 2, y: 14, z: 12 },
    hint: "Leap across diagonal peg p4(2,2): 2*(2,2) - (0,0) = (4,4)!",
  },
  {
    id: 15,
    name: "Rhombus Expansion",
    difficulty: "Hard",
    description: "Expand a diamond rhombus configuration to project out to (3,3).",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 1, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 2, y: 1, label: 'C' },
      { id: 'p4', x: 1, y: 2, label: 'D' }
    ],
    target: { x: 3, y: 3 },
    cameraPos: { x: 2, y: 15, z: 12 },
    hint: "Chain reflections across the upper pivot p4(1,2) and right pivot p3(2,1).",
  },

  // --- CHAPTER 4: GRANDMASTER & EXPONENTIAL EXPANSION ---
  {
    id: 16,
    name: "Hyper-Grid Ascendance",
    difficulty: "Master",
    description: "The ultimate lattice puzzle: navigate 4 pegs across deep coordinate space.",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 2, label: 'B' },
      { id: 'p3', x: 2, y: 1, label: 'C' },
      { id: 'p4', x: 3, y: 0, label: 'D' }
    ],
    target: { x: 4, y: 4 },
    cameraPos: { x: 2, y: 15, z: 13 },
    hint: "Move 1: p1 over p2 -> (2,4). Move 2: p4 over p2 -> (-1,4). Move 3: (2,4) over center -> (4,4).",
  },
  {
    id: 17,
    name: "The Quantum Leap",
    difficulty: "Master",
    description: "Multi-stage harmonic reflections across 4 non-linear pegs.",
    parMoves: 5,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 1, label: 'B' },
      { id: 'p3', x: 1, y: 3, label: 'C' },
      { id: 'p4', x: 3, y: 2, label: 'D' }
    ],
    target: { x: 5, y: 5 },
    cameraPos: { x: 3, y: 16, z: 14 },
    hint: "Build a chain of pivots that maintains diagonal momentum towards (5,5).",
  },
  {
    id: 18,
    name: "Infinity Paradox",
    difficulty: "Grandmaster",
    description: "The grandmaster summit: reach (5,5) using precise rotational point reflections.",
    parMoves: 5,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 1, label: 'B' },
      { id: 'p3', x: 3, y: 1, label: 'C' },
      { id: 'p4', x: 1, y: 3, label: 'D' }
    ],
    target: { x: 5, y: 5 },
    cameraPos: { x: 3, y: 18, z: 15 },
    hint: "Parity signature: (1,1) matches target (5,5) (both odd,odd). Use p2 as the core reflection vector.",
  },
  {
    id: 19,
    name: "Fractal Constellation",
    difficulty: "Grandmaster",
    description: "Symmetric center pivot reflection chains across a 5-peg constellation.",
    parMoves: 6,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' },
      { id: 'p3', x: 0, y: 2, label: 'C' },
      { id: 'p4', x: 2, y: 2, label: 'D' },
      { id: 'p5', x: 1, y: 1, label: 'E' }
    ],
    target: { x: 4, y: 2 },
    cameraPos: { x: 3, y: 18, z: 15 },
    hint: "Use central pivot E(1,1) in coordination with the 4 corner pegs.",
  },
  {
    id: 20,
    name: "The Final Singularity",
    difficulty: "Grandmaster",
    description: "The ultimate mathematical reflection challenge: project across the deep lattice to (6,6).",
    parMoves: 6,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 1, label: 'B' },
      { id: 'p3', x: 1, y: 3, label: 'C' },
      { id: 'p4', x: 4, y: 2, label: 'D' },
      { id: 'p5', x: 3, y: 5, label: 'E' }
    ],
    target: { x: 6, y: 6 },
    cameraPos: { x: 4, y: 20, z: 16 },
    hint: "Parity (0,0) matches target (6,6) (both even,even). Relay over the central cluster to reach (6,6)!",
  }
];
