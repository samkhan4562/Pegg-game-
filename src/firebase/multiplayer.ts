import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  Unsubscribe,
} from 'firebase/database';
import { rtdb } from './config';
import { PegData, Point2D, Traveler, ValidMove } from '../types';

export interface PlayerInfo {
  uid: string;
  name: string;
  avatar: string;
  symbol?: 'X' | 'O';
  role?: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==========================================================
// 1. TIC-TAC-TOE MULTIPLAYER
// ==========================================================

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

export async function createTicTacToeRoom(host: {
  uid: string;
  name: string;
  avatar: string;
}): Promise<TicTacToeRoom> {
  const code = generateRoomCode();
  const roomId = `ttt_${code}`;

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

  await set(ref(rtdb, `rooms/tictactoe/${roomId}`), initialRoom);
  return initialRoom;
}

export async function joinTicTacToeRoom(
  codeOrId: string,
  guest: { uid: string; name: string; avatar: string }
): Promise<{ success: boolean; room?: TicTacToeRoom; error?: string }> {
  let cleanCode = codeOrId.trim().toUpperCase();
  if (cleanCode.startsWith('TTT_')) {
    cleanCode = cleanCode.replace('TTT_', '');
  }
  const roomId = `ttt_${cleanCode}`;

  try {
    const roomRef = ref(rtdb, `rooms/tictactoe/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: `Room "${cleanCode}" not found. Verify 6-digit code.` };
    }

    const room: TicTacToeRoom = snapshot.val();

    if (room.host.uid === guest.uid) return { success: true, room };
    if (room.guest?.uid === guest.uid) return { success: true, room };
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
      updatedAt: Date.now(),
    });

    return { success: true, room: { ...room, guest: guestPlayer, status: 'playing' } };
  } catch (err: any) {
    return { success: false, error: 'Connection failed: ' + (err?.message || 'Check Firebase rules') };
  }
}

export async function quickMatchTicTacToe(player: {
  uid: string;
  name: string;
  avatar: string;
}): Promise<{ room: TicTacToeRoom; role: 'host' | 'guest' }> {
  const newRoom = await createTicTacToeRoom(player);
  return { room: newRoom, role: 'host' };
}

export async function makeMultiplayerMove(
  roomId: string,
  cellIndex: number,
  playerSymbol: 'X' | 'O'
): Promise<boolean> {
  try {
    const roomRef = ref(rtdb, `rooms/tictactoe/${roomId}`);
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
      updatedAt: Date.now(),
    });

    return true;
  } catch {
    return false;
  }
}

export async function requestMultiplayerRematch(
  roomId: string,
  playerSymbol: 'X' | 'O'
) {
  try {
    const roomRef = ref(rtdb, `rooms/tictactoe/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room: TicTacToeRoom = snapshot.val();
    const updatedRematch = { ...room.rematch, [playerSymbol]: true };

    if (updatedRematch.X && updatedRematch.O) {
      await update(roomRef, {
        board: Array(9).fill(null),
        currentTurn: 'X',
        winner: null,
        winningLine: null,
        status: 'playing',
        rematch: {},
        updatedAt: Date.now(),
      });
    } else {
      await update(roomRef, {
        rematch: updatedRematch,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignore
  }
}

export async function sendRoomReaction(roomId: string, uid: string, emoji: string) {
  try {
    await update(ref(rtdb, `rooms/tictactoe/${roomId}`), {
      lastReaction: { uid, emoji, timestamp: Date.now() },
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

export function subscribeToTicTacToeRoom(
  roomId: string,
  callback: (room: TicTacToeRoom | null) => void
): Unsubscribe {
  try {
    const roomRef = ref(rtdb, `rooms/tictactoe/${roomId}`);
    return onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('subscribeToTicTacToeRoom error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToTicTacToeRoom error:', err);
    return () => {};
  }
}

export async function leaveTicTacToeRoom(roomId: string, uid: string) {
  try {
    await update(ref(rtdb, `rooms/tictactoe/${roomId}`), {
      status: 'finished',
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

// ==========================================================
// 2. THE JUMPING PEGS 3D MULTIPLAYER
// ==========================================================

export interface PegsRoom {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: 'waiting' | 'playing' | 'completed';
  host: PlayerInfo;
  guest: PlayerInfo | null;
  levelIndex: number;
  pegs: PegData[];
  target: Point2D;
  currentTurnUid: string;
  movesCount: number;
  isVictory: boolean;
  lastMove?: {
    pegId: string;
    from: Point2D;
    dest: Point2D;
    pivot: Point2D;
    movedByUid: string;
    timestamp: number;
  };
  lastReaction?: {
    uid: string;
    emoji: string;
    timestamp: number;
  };
  rematch?: Record<string, boolean>;
}

export async function createPegsRoom(
  host: { uid: string; name: string; avatar: string },
  levelIndex: number,
  initialPegs: PegData[],
  target: Point2D
): Promise<PegsRoom> {
  const code = generateRoomCode();
  const roomId = `pegs_${code}`;

  const initialRoom: PegsRoom = {
    id: roomId,
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'waiting',
    host: {
      uid: host.uid,
      name: host.name,
      avatar: host.avatar,
      role: 'Host (Player 1)',
    },
    guest: null,
    levelIndex,
    pegs: initialPegs,
    target,
    currentTurnUid: host.uid,
    movesCount: 0,
    isVictory: false,
    rematch: {},
  };

  await set(ref(rtdb, `rooms/pegs/${roomId}`), initialRoom);
  return initialRoom;
}

export async function joinPegsRoom(
  codeOrId: string,
  guest: { uid: string; name: string; avatar: string }
): Promise<{ success: boolean; room?: PegsRoom; error?: string }> {
  let cleanCode = codeOrId.trim().toUpperCase();
  if (cleanCode.startsWith('PEGS_')) {
    cleanCode = cleanCode.replace('PEGS_', '');
  }
  const roomId = `pegs_${cleanCode}`;

  try {
    const roomRef = ref(rtdb, `rooms/pegs/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: `Pegs room "${cleanCode}" not found. Verify room code.` };
    }

    const room: PegsRoom = snapshot.val();
    if (room.host.uid === guest.uid) return { success: true, room };
    if (room.guest?.uid === guest.uid) return { success: true, room };
    if (room.guest && room.guest.uid !== guest.uid) {
      return { success: false, error: 'Room is already full with 2 players.' };
    }

    const guestPlayer: PlayerInfo = {
      uid: guest.uid,
      name: guest.name,
      avatar: guest.avatar,
      role: 'Partner (Player 2)',
    };

    await update(roomRef, {
      guest: guestPlayer,
      status: 'playing',
      updatedAt: Date.now(),
    });

    return { success: true, room: { ...room, guest: guestPlayer, status: 'playing' } };
  } catch (err: any) {
    return { success: false, error: 'Failed to join: ' + (err?.message || 'Check Firebase rules') };
  }
}

export async function quickMatchPegs(
  player: { uid: string; name: string; avatar: string },
  levelIndex: number,
  initialPegs: PegData[],
  target: Point2D
): Promise<{ room: PegsRoom; role: 'host' | 'guest' }> {
  const newRoom = await createPegsRoom(player, levelIndex, initialPegs, target);
  return { room: newRoom, role: 'host' };
}

export async function makePegsMultiplayerMove(
  roomId: string,
  move: ValidMove,
  nextPegs: PegData[],
  moverUid: string,
  isVictory: boolean
): Promise<boolean> {
  try {
    const roomRef = ref(rtdb, `rooms/pegs/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;

    const room: PegsRoom = snapshot.val();
    const nextTurnUid = moverUid === room.host.uid ? (room.guest?.uid || room.host.uid) : room.host.uid;

    await update(roomRef, {
      pegs: nextPegs,
      currentTurnUid: nextTurnUid,
      movesCount: (room.movesCount || 0) + 1,
      isVictory,
      status: isVictory ? 'completed' : 'playing',
      lastMove: {
        pegId: move.pegId,
        from: move.from,
        dest: move.dest,
        pivot: move.pivot,
        movedByUid: moverUid,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function requestPegsRematch(
  roomId: string,
  uid: string,
  initialPegs: PegData[]
) {
  try {
    const roomRef = ref(rtdb, `rooms/pegs/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room: PegsRoom = snapshot.val();
    const updatedRematch = { ...(room.rematch || {}), [uid]: true };
    const bothReady = room.guest && updatedRematch[room.host.uid] && updatedRematch[room.guest.uid];

    if (bothReady || !room.guest) {
      await update(roomRef, {
        pegs: initialPegs,
        movesCount: 0,
        isVictory: false,
        status: 'playing',
        currentTurnUid: room.host.uid,
        lastMove: null,
        rematch: {},
        updatedAt: Date.now(),
      });
    } else {
      await update(roomRef, {
        rematch: updatedRematch,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignore
  }
}

export async function sendPegsReaction(roomId: string, uid: string, emoji: string) {
  try {
    await update(ref(rtdb, `rooms/pegs/${roomId}`), {
      lastReaction: { uid, emoji, timestamp: Date.now() },
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

export function subscribeToPegsRoom(
  roomId: string,
  callback: (room: PegsRoom | null) => void
): Unsubscribe {
  try {
    const roomRef = ref(rtdb, `rooms/pegs/${roomId}`);
    return onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('subscribeToPegsRoom error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToPegsRoom error:', err);
    return () => {};
  }
}

export async function leavePegsRoom(roomId: string, uid: string) {
  try {
    await update(ref(rtdb, `rooms/pegs/${roomId}`), {
      status: 'completed',
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

// ==========================================================
// 3. MIDNIGHT BRIDGE & TORCH MULTIPLAYER
// ==========================================================

export interface BridgeRoom {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: 'waiting' | 'playing' | 'completed';
  host: PlayerInfo;
  guest: PlayerInfo | null;
  levelIndex: number;
  leftBank: Traveler[];
  rightBank: Traveler[];
  torchBank: 'left' | 'right';
  elapsedTime: number;
  currentTurnUid: string;
  isVictory: boolean;
  lastCrossing?: {
    travelerIds: string[];
    direction: 'forward' | 'backward';
    duration: number;
    movedByUid: string;
    timestamp: number;
  };
  lastReaction?: {
    uid: string;
    emoji: string;
    timestamp: number;
  };
  rematch?: Record<string, boolean>;
}

export async function createBridgeRoom(
  host: { uid: string; name: string; avatar: string },
  levelIndex: number,
  initialTravelers: Traveler[]
): Promise<BridgeRoom> {
  const code = generateRoomCode();
  const roomId = `bridge_${code}`;

  const initialRoom: BridgeRoom = {
    id: roomId,
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'waiting',
    host: {
      uid: host.uid,
      name: host.name,
      avatar: host.avatar,
      role: 'Host (Explorer 1)',
    },
    guest: null,
    levelIndex,
    leftBank: initialTravelers,
    rightBank: [],
    torchBank: 'left',
    elapsedTime: 0,
    currentTurnUid: host.uid,
    isVictory: false,
    rematch: {},
  };

  await set(ref(rtdb, `rooms/bridge/${roomId}`), initialRoom);
  return initialRoom;
}

export async function joinBridgeRoom(
  codeOrId: string,
  guest: { uid: string; name: string; avatar: string }
): Promise<{ success: boolean; room?: BridgeRoom; error?: string }> {
  let cleanCode = codeOrId.trim().toUpperCase();
  if (cleanCode.startsWith('BRIDGE_')) {
    cleanCode = cleanCode.replace('BRIDGE_', '');
  }
  const roomId = `bridge_${cleanCode}`;

  try {
    const roomRef = ref(rtdb, `rooms/bridge/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: `Bridge room "${cleanCode}" not found. Verify room code.` };
    }

    const room: BridgeRoom = snapshot.val();
    if (room.host.uid === guest.uid) return { success: true, room };
    if (room.guest?.uid === guest.uid) return { success: true, room };
    if (room.guest && room.guest.uid !== guest.uid) {
      return { success: false, error: 'Room is already full with 2 players.' };
    }

    const guestPlayer: PlayerInfo = {
      uid: guest.uid,
      name: guest.name,
      avatar: guest.avatar,
      role: 'Partner (Explorer 2)',
    };

    await update(roomRef, {
      guest: guestPlayer,
      status: 'playing',
      updatedAt: Date.now(),
    });

    return { success: true, room: { ...room, guest: guestPlayer, status: 'playing' } };
  } catch (err: any) {
    return { success: false, error: 'Failed to join: ' + (err?.message || 'Check Firebase rules') };
  }
}

export async function quickMatchBridge(
  player: { uid: string; name: string; avatar: string },
  levelIndex: number,
  initialTravelers: Traveler[]
): Promise<{ room: BridgeRoom; role: 'host' | 'guest' }> {
  const newRoom = await createBridgeRoom(player, levelIndex, initialTravelers);
  return { room: newRoom, role: 'host' };
}

export async function makeBridgeMultiplayerCrossing(
  roomId: string,
  travelerIds: string[],
  direction: 'forward' | 'backward',
  duration: number,
  nextLeft: Traveler[],
  nextRight: Traveler[],
  nextTorch: 'left' | 'right',
  nextElapsed: number,
  moverUid: string,
  isVictory: boolean
): Promise<boolean> {
  try {
    const roomRef = ref(rtdb, `rooms/bridge/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;

    const room: BridgeRoom = snapshot.val();
    const nextTurnUid = moverUid === room.host.uid ? (room.guest?.uid || room.host.uid) : room.host.uid;

    await update(roomRef, {
      leftBank: nextLeft,
      rightBank: nextRight,
      torchBank: nextTorch,
      elapsedTime: nextElapsed,
      currentTurnUid: nextTurnUid,
      isVictory,
      status: isVictory ? 'completed' : 'playing',
      lastCrossing: {
        travelerIds,
        direction,
        duration,
        movedByUid: moverUid,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return true;
  } catch {
    return false;
  }
}

export async function requestBridgeRematch(
  roomId: string,
  uid: string,
  initialTravelers: Traveler[]
) {
  try {
    const roomRef = ref(rtdb, `rooms/bridge/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room: BridgeRoom = snapshot.val();
    const updatedRematch = { ...(room.rematch || {}), [uid]: true };
    const bothReady = room.guest && updatedRematch[room.host.uid] && updatedRematch[room.guest.uid];

    if (bothReady || !room.guest) {
      await update(roomRef, {
        leftBank: initialTravelers,
        rightBank: [],
        torchBank: 'left',
        elapsedTime: 0,
        isVictory: false,
        status: 'playing',
        currentTurnUid: room.host.uid,
        lastCrossing: null,
        rematch: {},
        updatedAt: Date.now(),
      });
    } else {
      await update(roomRef, {
        rematch: updatedRematch,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignore
  }
}

export async function sendBridgeReaction(roomId: string, uid: string, emoji: string) {
  try {
    await update(ref(rtdb, `rooms/bridge/${roomId}`), {
      lastReaction: { uid, emoji, timestamp: Date.now() },
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}

export function subscribeToBridgeRoom(
  roomId: string,
  callback: (room: BridgeRoom | null) => void
): Unsubscribe {
  try {
    const roomRef = ref(rtdb, `rooms/bridge/${roomId}`);
    return onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('subscribeToBridgeRoom error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToBridgeRoom error:', err);
    return () => {};
  }
}

export async function leaveBridgeRoom(roomId: string, uid: string) {
  try {
    await update(ref(rtdb, `rooms/bridge/${roomId}`), {
      status: 'completed',
      updatedAt: Date.now(),
    });
  } catch {
    // ignore
  }
}
