export interface Point2D {
  x: number;
  y: number;
}

export interface PegData {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface ValidMove {
  from: Point2D;
  pivot: Point2D;
  dest: Point2D;
  pegId: string;
  pivotId: string;
  distance: number;
}

export interface LevelData {
  id: number;
  name: string;
  difficulty: 'Tutorial' | 'Easy' | 'Easy-Medium' | 'Medium' | 'Medium-Hard' | 'Hard' | 'Master' | 'Grandmaster';
  description?: string;
  parMoves: number;
  pegs: PegData[];
  target: Point2D;
  cameraPos?: { x: number; y: number; z: number };
  hint?: string;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface LevelProgress {
  unlocked: boolean;
  bestMoves: number | null;
  stars: number; // 0 to 3
}

export interface MoveHistoryItem {
  pegs: PegData[];
  move: ValidMove;
}

export type ScreenMode = 'menu' | 'game';

// ==============================
// GAME 2: BRIDGE & TORCH TYPES
// ==============================

export type BridgeBank = 'left' | 'right';

export interface Traveler {
  id: string;
  name: string;
  time: number; // in minutes
  avatarColor: string;
  role?: string;
}

export interface BridgeLevelData {
  id: number;
  name: string;
  difficulty: 'Tutorial' | 'Easy' | 'Medium' | 'Hard' | 'Master' | 'Grandmaster';
  bridgeCapacity: number;
  parTime: number;
  travelers: Traveler[];
  description?: string;
  hint?: string;
}

export interface BridgeStep {
  travelerIds: string[];
  travelers: Traveler[];
  duration: number;
  direction: 'forward' | 'backward'; // forward = left to right, backward = right to left
}

export interface BridgeHistorySnapshot {
  leftBankIds: string[];
  rightBankIds: string[];
  torchPosition: BridgeBank;
  elapsedTime: number;
  step: BridgeStep;
}

export interface BridgeProgress {
  unlocked: boolean;
  bestTime: number | null;
  stars: number; // 0 to 3
}

export interface OptimalSolutionResult {
  minTime: number;
  naiveTime: number;
  steps: { travelerNames: string[]; time: number; direction: 'forward' | 'backward' }[];
  breakdown: string;
}

// ==============================
// MASTER PORTAL & HUB TYPES
// ==============================

export type ActiveGameView = 'hub' | 'pegs' | 'bridge' | 'tictactoe';

// ==============================
// GAME 3: TIC-TAC-TOE & FRIENDS TYPES
// ==============================

export type TicTacToeSymbol = 'X' | 'O';
export type TicTacToeDifficulty = 'easy' | 'medium' | 'unbeatable';

