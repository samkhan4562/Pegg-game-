import { LevelData } from '../types';

export const LEVELS: LevelData[] = [
  // --- CHAPTER 1: THE BASICS (LINEAR JUMPS) ---
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
    hint: "Click Peg A, then click the golden destination ring at (2, 0). C = 2B - A.",
  },
  {
    id: 2,
    name: "Linear Relay",
    difficulty: "Easy",
    description: "Chain reflections along a straight line to project pegs to distant coordinates.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 0, label: 'B' },
      { id: 'p3', x: 2, y: 0, label: 'C' }
    ],
    target: { x: 4, y: 0 },
    cameraPos: { x: 2, y: 9, z: 7 },
    hint: "Jump Peg A over Peg C to leap straight to (4, 0)!",
  },
  {
    id: 3,
    name: "Turnaround",
    difficulty: "Easy",
    description: "Reflect in reverse across the origin to hit a negative coordinate target.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' }
    ],
    target: { x: -2, y: 0 },
    cameraPos: { x: 0, y: 9, z: 7 },
    hint: "Jump Peg B(2,0) over Peg A(0,0): 2*(0) - 2 = -2!",
  },
  {
    id: 4,
    name: "Orthogonal Shift",
    difficulty: "Easy-Medium",
    description: "Shift between perpendicular axes to navigate the coordinate plane.",
    parMoves: 2,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 0, y: 2, label: 'B' },
      { id: 'p3', x: 1, y: 1, label: 'C' }
    ],
    target: { x: 2, y: 0 },
    cameraPos: { x: 1, y: 10, z: 8 },
    hint: "Use the midpoint C(1,1) to transition between X and Y axes.",
  },

  // --- CHAPTER 2: 2D DIAGONALS & BRIDGES ---
  {
    id: 5,
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
    hint: "Reflect (0,0) over (1,1) to immediately land on (2,2).",
  },
  {
    id: 6,
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
    hint: "Jump (0,0) over (0,1) then align diagonals towards (2,2).",
  },
  {
    id: 7,
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
    hint: "Reflecting (0,0) over (1,2) lands at 2*(1,2) - (0,0) = (2,4)!",
  },
  {
    id: 8,
    name: "The Cross Reflection",
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
    hint: "Jump Peg A(-1,0) over Peg B(1,0) to reach (3,0).",
  },

  // --- CHAPTER 3: MULTI-STEP REBOUNDS ---
  {
    id: 9,
    name: "The Parity Lock",
    difficulty: "Hard",
    description: "Navigate a complex 3-peg asymmetric cluster to reach the target parity coordinates.",
    parMoves: 4,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 2, y: 0, label: 'B' },
      { id: 'p3', x: 1, y: 2, label: 'C' }
    ],
    target: { x: 3, y: 4 },
    cameraPos: { x: 2, y: 14, z: 11 },
    hint: "Plan intermediate pivots to shift the parity coordinate.",
  },
  {
    id: 10,
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
    hint: "Reflect (0,0) over (2,2) to reach (4,4) directly!",
  },
  {
    id: 11,
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
    hint: "Use Peg B(1,1) and C(2,0) as consecutive stepping pivots.",
  },
  {
    id: 12,
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
    hint: "Leap across diagonal peg D(2,2) to land directly at (4,4).",
  },

  // --- CHAPTER 4: GRANDMASTER PUZZLES ---
  {
    id: 13,
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
    target: { x: 4, y: 5 },
    cameraPos: { x: 2, y: 15, z: 13 },
    hint: "Carefully align your knight moves to construct a pivot towards (4,5).",
  },
  {
    id: 14,
    name: "The Quantum Leap",
    difficulty: "Grandmaster",
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
    hint: "Build a chain of pivots that maintains diagonal momentum.",
  },
  {
    id: 15,
    name: "Infinity Paradox",
    difficulty: "Grandmaster",
    description: "The grandmaster summit: reach (6,6) using precise rotational point reflections.",
    parMoves: 5,
    pegs: [
      { id: 'p1', x: 0, y: 0, label: 'A' },
      { id: 'p2', x: 1, y: 1, label: 'B' },
      { id: 'p3', x: 3, y: 1, label: 'C' },
      { id: 'p4', x: 1, y: 3, label: 'D' }
    ],
    target: { x: 6, y: 6 },
    cameraPos: { x: 3, y: 18, z: 15 },
    hint: "Use double diagonal expansions to reach the outer corner.",
  }
];
