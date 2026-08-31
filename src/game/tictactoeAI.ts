import { WINNING_COMBOS, checkTicTacToeWinner } from '../firebase/multiplayer';

export type AIDifficulty = 'easy' | 'medium' | 'unbeatable';

/**
 * Returns the best move index (0-8) for AI based on chosen difficulty
 */
export function getAIMove(
  board: (string | null)[],
  aiSymbol: 'X' | 'O',
  difficulty: AIDifficulty
): number {
  const availableIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val): val is number => val !== null);

  if (availableIndices.length === 0) return -1;

  // 1. Easy: Completely random move
  if (difficulty === 'easy') {
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';

  // 2. Medium: 60% optimal Minimax, 40% heuristic / random
  if (difficulty === 'medium') {
    if (Math.random() < 0.4) {
      // Check if immediate win or block is available
      for (const idx of availableIndices) {
        board[idx] = aiSymbol;
        if (checkTicTacToeWinner(board).winner === aiSymbol) {
          board[idx] = null;
          return idx;
        }
        board[idx] = null;
      }
      for (const idx of availableIndices) {
        board[idx] = humanSymbol;
        if (checkTicTacToeWinner(board).winner === humanSymbol) {
          board[idx] = null;
          return idx;
        }
        board[idx] = null;
      }
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
  }

  // 3. Unbeatable: Complete Minimax algorithm with depth scoring
  let bestScore = -Infinity;
  let bestMove = availableIndices[0];

  for (const idx of availableIndices) {
    board[idx] = aiSymbol;
    const score = minimax(board, 0, false, aiSymbol, humanSymbol);
    board[idx] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

function minimax(
  board: (string | null)[],
  depth: number,
  isMaximizing: boolean,
  aiSymbol: 'X' | 'O',
  humanSymbol: 'X' | 'O'
): number {
  const result = checkTicTacToeWinner(board);
  if (result.winner === aiSymbol) return 10 - depth;
  if (result.winner === humanSymbol) return depth - 10;
  if (result.winner === 'draw') return 0;

  const availableIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val): val is number => val !== null);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of availableIndices) {
      board[idx] = aiSymbol;
      const evaluation = minimax(board, depth + 1, false, aiSymbol, humanSymbol);
      board[idx] = null;
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const idx of availableIndices) {
      board[idx] = humanSymbol;
      const evaluation = minimax(board, depth + 1, true, aiSymbol, humanSymbol);
      board[idx] = null;
      minEval = Math.min(minEval, evaluation);
    }
    return minEval;
  }
}
