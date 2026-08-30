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
