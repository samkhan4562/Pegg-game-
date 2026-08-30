import { Point2D, PegData, ValidMove } from '../types';

export const DEFAULT_GRID_BOUNDS = {
  minX: -8,
  maxX: 8,
  minY: -8,
  maxY: 8,
};

/**
 * Calculates point reflection of point A across pivot B
 * C = 2B - A
 */
export function calculateReflection(a: Point2D, b: Point2D): Point2D {
  return {
    x: 2 * b.x - a.x,
    y: 2 * b.y - a.y,
  };
}

/**
 * Checks if two 2D points are identical
 */
export function arePointsEqual(p1: Point2D, p2: Point2D): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

/**
 * Checks if a coordinate is occupied by any peg
 */
export function isOccupied(pos: Point2D, pegs: PegData[]): boolean {
  return pegs.some((peg) => arePointsEqual(peg, pos));
}

/**
 * Checks if coordinate is within grid bounds
 */
export function isWithinBounds(
  pos: Point2D,
  bounds = DEFAULT_GRID_BOUNDS
): boolean {
  return (
    pos.x >= bounds.minX &&
    pos.x <= bounds.maxX &&
    pos.y >= bounds.minY &&
    pos.y <= bounds.maxY
  );
}

/**
 * Euclidean distance between two points
 */
export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes all legal reflection moves for a specific peg A given current pegs
 */
export function getValidMovesForPeg(
  pegA: PegData,
  allPegs: PegData[],
  bounds = DEFAULT_GRID_BOUNDS
): ValidMove[] {
  const validMoves: ValidMove[] = [];

  for (const pegB of allPegs) {
    if (pegB.id === pegA.id) continue; // Cannot jump over itself

    const dest = calculateReflection(pegA, pegB);

    // Validate bounds
    if (!isWithinBounds(dest, bounds)) continue;

    // Validate unoccupied destination
    if (isOccupied(dest, allPegs)) continue;

    validMoves.push({
      from: { x: pegA.x, y: pegA.y },
      pivot: { x: pegB.x, y: pegB.y },
      dest,
      pegId: pegA.id,
      pivotId: pegB.id,
      distance: getDistance(pegA, dest),
    });
  }

  return validMoves;
}

/**
 * Checks if the target is reached (any peg is currently at target coordinate)
 */
export function isTargetReached(pegs: PegData[], target: Point2D): boolean {
  return pegs.some((peg) => arePointsEqual(peg, target));
}

/**
 * Checks if any peg has any valid move remaining
 */
export function hasAnyLegalMoves(
  pegs: PegData[],
  bounds = DEFAULT_GRID_BOUNDS
): boolean {
  return pegs.some((peg) => getValidMovesForPeg(peg, pegs, bounds).length > 0);
}
