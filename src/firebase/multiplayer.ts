import {
  ref,
  set,
  get,
  update,
  onValue,
  remove,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from './config';

export interface PlayerInfo {
  uid: string;
  name: string;
  avatar: string;
  symbol: 'X' | 'O';
}

export interface TicTacToeRoom {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: 'waiting' | 'playing' | 'finished';
  host: PlayerInfo;
  guest: PlayerInfo | null;
  board: (string | null)[];
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
  scores: {
    X: number;
    O: number;
    draws: number;
  };
  rematch: {
    X?: boolean;
    O?: boolean;
  };
  lastReaction?: {
    uid: string;
    emoji: string;
    timestamp: number;
  };
}

export const WINNING_COMBOS = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
  [0, 4, 8], // diagonal 1
  [2, 4, 6], // diagonal 2
];

export function checkTicTacToeWinner(board: (string | null)[]): {
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
} {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', winningLine: combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', winningLine: null };
  }
  return { winner: null, winningLine: null };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new multiplayer Tic-Tac-Toe room
 */
export async function createTicTacToeRoom(host: {
  uid: string;
  name: string;
  avatar: string;
}): Promise<TicTacToeRoom> {
  const code = generateRoomCode();
  const roomId = `ttt_${code}`;
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);

  const initialRoom: TicTacToeRoom = {
    id: roomId,
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'waiting',
    host: {
      uid: host.uid,
      name: host.name,
      avatar: host.avatar,
      symbol: 'X',
    },
    guest: null,
    board: Array(9).fill(null),
    currentTurn: 'X',
    winner: null,
    winningLine: null,
    scores: { X: 0, O: 0, draws: 0 },
    rematch: {},
  };

  await set(roomRef, initialRoom);
  return initialRoom;
}

/**
 * Join an existing room by 6-char Room Code or Room ID
 */
export async function joinTicTacToeRoom(
  codeOrId: string,
  guest: { uid: string; name: string; avatar: string }
): Promise<{ success: boolean; room?: TicTacToeRoom; error?: string }> {
  const cleanCode = codeOrId.trim().toUpperCase();
  const roomId = cleanCode.startsWith('TTT_') ? cleanCode.toLowerCase() : `ttt_${cleanCode}`;
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);

  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    return { success: false, error: 'Room not found. Please check code.' };
  }

  const room: TicTacToeRoom = snapshot.val();

  // If already the host, rejoin
  if (room.host.uid === guest.uid) {
    return { success: true, room };
  }

  // If already the guest, rejoin
  if (room.guest?.uid === guest.uid) {
    return { success: true, room };
  }

  // If full with another guest
  if (room.guest && room.guest.uid !== guest.uid) {
    return { success: false, error: 'Room is already full with 2 players.' };
  }

  const guestPlayer: PlayerInfo = {
    uid: guest.uid,
    name: guest.name,
    avatar: guest.avatar,
    symbol: 'O',
  };

  await update(roomRef, {
    guest: guestPlayer,
    status: 'playing',
    updatedAt: serverTimestamp(),
  });

  return { success: true, room: { ...room, guest: guestPlayer, status: 'playing' } };
}

/**
 * Quick Match matchmaking queue
 */
export async function quickMatchTicTacToe(player: {
  uid: string;
  name: string;
  avatar: string;
}): Promise<{ room: TicTacToeRoom; role: 'host' | 'guest' }> {
  const allRoomsRef = ref(rtdb, '/rooms/tictactoe');
  const snapshot = await get(allRoomsRef);

  if (snapshot.exists()) {
    const rooms = snapshot.val();
    for (const [key, val] of Object.entries(rooms)) {
      const r = val as TicTacToeRoom;
      // Found open room not created by self
      if (r.status === 'waiting' && !r.guest && r.host.uid !== player.uid) {
        const joinResult = await joinTicTacToeRoom(key, player);
        if (joinResult.success && joinResult.room) {
          return { room: joinResult.room, role: 'guest' };
        }
      }
    }
  }

  // No open room found, create new one
  const newRoom = await createTicTacToeRoom(player);
  return { room: newRoom, role: 'host' };
}

/**
 * Make a move in the multiplayer room
 */
export async function makeMultiplayerMove(
  roomId: string,
  cellIndex: number,
  playerSymbol: 'X' | 'O'
): Promise<boolean> {
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) return false;

  const room: TicTacToeRoom = snapshot.val();
  if (room.status !== 'playing' || room.winner !== null) return false;
  if (room.currentTurn !== playerSymbol) return false;
  if (room.board[cellIndex] !== null) return false;

  const newBoard = [...room.board];
  newBoard[cellIndex] = playerSymbol;

  const check = checkTicTacToeWinner(newBoard);
  const nextTurn: 'X' | 'O' = playerSymbol === 'X' ? 'O' : 'X';

  const newScores = { ...room.scores };
  if (check.winner === 'X') newScores.X += 1;
  else if (check.winner === 'O') newScores.O += 1;
  else if (check.winner === 'draw') newScores.draws += 1;

  await update(roomRef, {
    board: newBoard,
    currentTurn: nextTurn,
    winner: check.winner,
    winningLine: check.winningLine,
    scores: newScores,
    status: check.winner ? 'finished' : 'playing',
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Request rematch in room
 */
export async function requestMultiplayerRematch(
  roomId: string,
  playerSymbol: 'X' | 'O'
) {
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) return;

  const room: TicTacToeRoom = snapshot.val();
  const updatedRematch = { ...room.rematch, [playerSymbol]: true };

  // If both players requested rematch, reset board
  if (updatedRematch.X && updatedRematch.O) {
    await update(roomRef, {
      board: Array(9).fill(null),
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      status: 'playing',
      rematch: {},
      updatedAt: serverTimestamp(),
    });
  } else {
    await update(roomRef, {
      rematch: updatedRematch,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Send Quick Reaction / Emoji
 */
export async function sendRoomReaction(roomId: string, uid: string, emoji: string) {
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}/lastReaction`);
  await set(roomRef, {
    uid,
    emoji,
    timestamp: Date.now(),
  });
}

/**
 * Subscribe to live Room updates
 */
export function subscribeToTicTacToeRoom(
  roomId: string,
  callback: (room: TicTacToeRoom | null) => void
) {
  const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
}

/**
 * Leave / Close room
 */
export async function leaveTicTacToeRoom(roomId: string, uid: string) {
  try {
    const roomRef = ref(rtdb, `/rooms/tictactoe/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room: TicTacToeRoom = snapshot.val();
    if (room.host.uid === uid && !room.guest) {
      // Host left while alone, delete room
      await remove(roomRef);
    } else {
      // Mark player left
      await update(roomRef, {
        status: 'finished',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Error leaving room:', err);
  }
}
