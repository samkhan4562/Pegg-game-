import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X as XIcon,
  Circle as OIcon,
  RotateCcw,
  Bot,
  Users,
  Globe,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  Swords,
  Radio,
  Send,
  Zap,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { sound } from '../audio/soundEffects';
import { getAIMove, AIDifficulty } from '../game/tictactoeAI';
import {
  TicTacToeRoom,
  createTicTacToeRoom,
  joinTicTacToeRoom,
  quickMatchTicTacToe,
  makeMultiplayerMove,
  requestMultiplayerRematch,
  sendRoomReaction,
  subscribeToTicTacToeRoom,
  leaveTicTacToeRoom,
  checkTicTacToeWinner,
} from '../firebase/multiplayer';
import { getLocalProfile } from '../firebase/presence';

export type GameMode = 'ai' | 'local' | 'online';

interface TicTacToeGameProps {
  onBackToHub: () => void;
  myUid: string;
  initialRoomId?: string | null;
  onOpenFriends?: () => void;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  onBackToHub,
  myUid,
  initialRoomId,
  onOpenFriends,
}) => {
  const profile = getLocalProfile();
  const [mode, setMode] = useState<GameMode>(initialRoomId ? 'online' : 'ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('unbeatable');

  // Offline Board State
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Online Multiplayer State
  const [onlineRoom, setOnlineRoom] = useState<TicTacToeRoom | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(initialRoomId || null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeReaction, setActiveReaction] = useState<{ emoji: string; sender: string } | null>(null);

  // Sound Mute
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Online Room Subscription
  useEffect(() => {
    if (!onlineRoomId) return;
    const unsub = subscribeToTicTacToeRoom(onlineRoomId, (room) => {
      if (room) {
        setOnlineRoom(room);
        setMode('online');

        // Check for winner celebration
        if (room.winner && room.winner !== 'draw') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }

        // Live Reactions
        if (room.lastReaction && Date.now() - room.lastReaction.timestamp < 3000) {
          const senderName = room.lastReaction.uid === room.host.uid ? room.host.name : room.guest?.name || 'Player';
          setActiveReaction({ emoji: room.lastReaction.emoji, sender: senderName });
          setTimeout(() => setActiveReaction(null), 3000);
        }
      } else {
        setOnlineRoom(null);
        setOnlineRoomId(null);
      }
    });

    return () => unsub();
  }, [onlineRoomId, myUid]);

  // Handle Initial Room Id from invite
  useEffect(() => {
    if (initialRoomId) {
      handleJoinByCode(initialRoomId);
    }
  }, [initialRoomId]);

  // AI Turn handling
  useEffect(() => {
    if (mode !== 'ai') return;
    if (currentTurn === 'O' && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiIndex = getAIMove(board, 'O', difficulty);
        if (aiIndex !== -1) {
          handleOfflineMove(aiIndex, 'O');
        }
        setIsAiThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, mode, winner, board, difficulty]);

  const handleOfflineMove = (index: number, symbol: 'X' | 'O') => {
    if (board[index] !== null || winner) return;

    sound.playSelect();
    const newBoard = [...board];
    newBoard[index] = symbol;

    const check = checkTicTacToeWinner(newBoard);
    setBoard(newBoard);

    if (check.winner) {
      setWinner(check.winner);
      setWinningLine(check.winningLine);
      if (check.winner === 'X') {
        sound.playWin();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setScores((prev) => ({ ...prev, X: prev.X + 1 }));
      } else if (check.winner === 'O') {
        if (mode === 'local') sound.playWin();
        setScores((prev) => ({ ...prev, O: prev.O + 1 }));
      } else {
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      }
    } else {
      setCurrentTurn(symbol === 'X' ? 'O' : 'X');
    }
  };

  const handleCellClick = async (index: number) => {
    if (mode === 'online') {
      if (!onlineRoom) return;
      const isHost = onlineRoom.host.uid === myUid;
      const mySymbol: 'X' | 'O' = isHost ? 'X' : 'O';

      if (onlineRoom.currentTurn !== mySymbol) return;
      if (onlineRoom.status !== 'playing' || onlineRoom.board[index] !== null) return;

      sound.playSelect();
      await makeMultiplayerMove(onlineRoom.id, index, mySymbol);
    } else {
      if (mode === 'ai' && currentTurn !== 'X') return;
      handleOfflineMove(index, currentTurn);
    }
  };

  const handleResetOffline = () => {
    sound.playRestart();
    setBoard(Array(9).fill(null));
    setCurrentTurn('X');
    setWinner(null);
    setWinningLine(null);
  };

  // Online Room Operations
  const handleCreateRoom = async () => {
    try {
      setIsJoining(true);
      setOnlineError(null);
      const room = await createTicTacToeRoom({
        uid: myUid,
        name: profile.name,
        avatar: profile.avatar,
      });
      setOnlineRoomId(room.id);
      setOnlineRoom(room);
      setIsJoining(false);
      sound.playSelect();
    } catch (err: any) {
      setOnlineError('Failed to create room: ' + err.message);
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim();
    if (!code) return;
    try {
      setIsJoining(true);
      setOnlineError(null);
      const res = await joinTicTacToeRoom(code, {
        uid: myUid,
        name: profile.name,
        avatar: profile.avatar,
      });
      if (res.success && res.room) {
        setOnlineRoomId(res.room.id);
        setOnlineRoom(res.room);
        setJoinCodeInput('');
        sound.playWin();
      } else {
        setOnlineError(res.error || 'Failed to join room. Verify code.');
        sound.playError();
      }
      setIsJoining(false);
    } catch (err: any) {
      setOnlineError('Failed to join: ' + err.message);
      setIsJoining(false);
    }
  };

  const handleQuickMatch = async () => {
    try {
      setIsJoining(true);
      setOnlineError(null);
      const res = await quickMatchTicTacToe({
        uid: myUid,
        name: profile.name,
        avatar: profile.avatar,
      });
      setOnlineRoomId(res.room.id);
      setOnlineRoom(res.room);
      setIsJoining(false);
      sound.playSelect();
    } catch (err: any) {
      setOnlineError('Quick Match error: ' + err.message);
      setIsJoining(false);
    }
  };

  const handleLeaveOnlineRoom = async () => {
    if (onlineRoom) {
      await leaveTicTacToeRoom(onlineRoom.id, myUid);
      setOnlineRoom(null);
      setOnlineRoomId(null);
      sound.playSelect();
    }
  };

  const handleRematchOnline = async () => {
    if (!onlineRoom) return;
    const isHost = onlineRoom.host.uid === myUid;
    const mySymbol: 'X' | 'O' = isHost ? 'X' : 'O';
    await requestMultiplayerRematch(onlineRoom.id, mySymbol);
    sound.playSelect();
  };

  const handleSendReaction = async (emoji: string) => {
    if (onlineRoom) {
      await sendRoomReaction(onlineRoom.id, myUid, emoji);
    }
  };

  const handleCopyCode = () => {
    if (!onlineRoom) return;
    navigator.clipboard.writeText(onlineRoom.code);
    setCopiedCode(true);
    sound.playSelect();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Determine active board & state depending on mode
  const activeBoard = mode === 'online' && onlineRoom ? onlineRoom.board : board;
  const activeWinner = mode === 'online' && onlineRoom ? onlineRoom.winner : winner;
  const activeWinningLine = mode === 'online' && onlineRoom ? onlineRoom.winningLine : winningLine;
  const activeTurn = mode === 'online' && onlineRoom ? onlineRoom.currentTurn : currentTurn;
  const activeScores = mode === 'online' && onlineRoom ? onlineRoom.scores : scores;

  const isHost = onlineRoom ? onlineRoom.host.uid === myUid : true;
  const myOnlineSymbol: 'X' | 'O' = isHost ? 'X' : 'O';
  const isMyTurnOnline = mode === 'online' ? activeTurn === myOnlineSymbol : true;

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden font-sans select-none transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      {/* ========================================================
          HEADER NAVIGATION (Apple Glass Style)
         ======================================================== */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 py-3 sm:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onlineRoom) handleLeaveOnlineRoom();
              onBackToHub();
            }}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-500 flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95"
            title="Back to Arcade"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Tic-Tac-Toe Pro
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {mode === 'ai'
                ? `Playing vs Minimax AI (${difficulty})`
                : mode === 'local'
                ? 'Pass & Play Local 2-Player'
                : onlineRoom
                ? `Online Room #${onlineRoom.code}`
                : 'Real-time Online Match'}
            </p>
          </div>
        </div>

        {/* Header Actions (Compact Icon Buttons) */}
        <div className="flex items-center gap-2">
          {onOpenFriends && (
            <button
              onClick={onOpenFriends}
              className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-500 flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 relative group"
              title="Friends & Multiplayer"
              aria-label="Friends and Multiplayer"
            >
              <Users size={18} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </button>
          )}

          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              sound.setMuted(nextMuted);
            }}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
              isMuted
                ? 'bg-white/80 dark:bg-slate-900/80 border-white/60 dark:border-white/10 text-rose-500'
                : 'bg-white/80 dark:bg-slate-900/80 border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-500'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN GAME AREA
         ======================================================== */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 py-2 flex-1 flex flex-col items-center justify-center">
        {/* Mode Selector Tabs (when not in active online room) */}
        {!onlineRoom && (
          <div className="w-full flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 mb-6 backdrop-blur-xl shadow-lg">
            <button
              onClick={() => {
                setMode('ai');
                handleResetOffline();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'ai'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot size={15} />
              vs AI
            </button>
            <button
              onClick={() => {
                setMode('local');
                handleResetOffline();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'local'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={15} />
              Pass &amp; Play
            </button>
            <button
              onClick={() => {
                setMode('online');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'online'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={15} />
              Online 1v1
            </button>
          </div>
        )}

        {/* AI Difficulty Selector (in vs AI mode) */}
        {mode === 'ai' && !onlineRoom && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-400">AI Difficulty:</span>
            {(['easy', 'medium', 'unbeatable'] as AIDifficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setDifficulty(diff);
                  handleResetOffline();
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  difficulty === diff
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'unbeatable' ? '⚡ Master Minimax' : diff}
              </button>
            ))}
          </div>
        )}

        {/* Online Multiplayer Lobby Selection (when mode is online but no active room) */}
        {mode === 'online' && !onlineRoom && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 mb-6 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Online Real-time 1v1 Multiplayer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Play in real-time with friends or random players worldwide
              </p>
            </div>

            {onlineError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                {onlineError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {/* Quick Match */}
              <button
                onClick={handleQuickMatch}
                disabled={isJoining}
                className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex flex-col items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Zap size={22} className="text-amber-300 animate-pulse" />
                <span>Quick Match</span>
                <span className="text-[10px] font-normal text-cyan-100 opacity-80">
                  Auto match with any player
                </span>
              </button>

              {/* Create Room */}
              <button
                onClick={handleCreateRoom}
                disabled={isJoining}
                className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/40 text-white font-bold text-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Swords size={22} className="text-cyan-400" />
                <span>Create Custom Room</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Get a 6-digit code for friends
                </span>
              </button>
            </div>

            {/* Join Room by Code */}
            <div className="pt-4 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block mb-2 text-center">
                Or Join with 6-Digit Room Code:
              </label>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  maxLength={10}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X9K2A"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-sm font-mono tracking-widest text-white uppercase focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleJoinByCode()}
                  disabled={!joinCodeInput.trim() || isJoining}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isJoining ? <Loader2 size={14} className="animate-spin" /> : null}
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            ONLINE ROOM WAITING LOBBY (FIX FOR BLANK SCREEN)
           ======================================================== */}
        {mode === 'online' && onlineRoom && onlineRoom.status === 'waiting' && (
          <div className="w-full bg-slate-900/95 border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl backdrop-blur-2xl text-center">
            {/* Animated Radar */}
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-60" />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg">
                <Radio size={28} className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Waiting for Opponent to Join
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Share the 6-digit room code with your friend, or invite an active player directly!
            </p>

            {/* Large Room Code Display */}
            <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center gap-3 max-w-xs mx-auto shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase">Code:</span>
              <span className="font-mono text-2xl font-black tracking-widest text-cyan-400">
                {onlineRoom.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Players Status Slot Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
              {/* Host Slot */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-500/40 flex items-center gap-3">
                <div className="text-2xl p-1 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                  {onlineRoom.host.avatar || '👾'}
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{onlineRoom.host.name}</div>
                  <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Host (X) Ready
                  </span>
                </div>
              </div>

              {/* Guest Slot */}
              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 border-dashed flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <UserPlus size={18} className="animate-pulse" />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-bold text-slate-400">Player 2 (O)</div>
                  <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
                    Waiting to connect...
                  </span>
                </div>
              </div>
            </div>

            {/* Lobby Actions */}
            <div className="flex items-center justify-center gap-3">
              {onOpenFriends && (
                <button
                  onClick={onOpenFriends}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Users size={15} />
                  Invite Online Friend
                </button>
              )}

              <button
                onClick={handleLeaveOnlineRoom}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel Room
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            ACTIVE GAME STATUS & SCORECARD
           ======================================================== */}
        {(mode !== 'online' || (onlineRoom && onlineRoom.status !== 'waiting')) && (
          <div className="w-full mb-5">
            {/* Online Room Info Bar */}
            {mode === 'online' && onlineRoom && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Room Code:</span>
                  <span className="font-mono font-black text-cyan-400 text-sm tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {onlineRoom.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Match
                  </span>
                  <button
                    onClick={handleLeaveOnlineRoom}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                  >
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Scorecard and Player Avatars */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg">
              {/* Player X */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  activeTurn === 'X' && !activeWinner
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <XIcon size={18} strokeWidth={3} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-white truncate">
                    {mode === 'online' && onlineRoom
                      ? onlineRoom.host.name
                      : mode === 'ai'
                      ? 'You (X)'
                      : 'Player 1 (X)'}
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    Wins: {activeScores.X}
                  </div>
                </div>
              </div>

              {/* Draws */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Draws
                </div>
                <div className="text-sm font-mono font-bold text-slate-200">
                  {activeScores.draws}
                </div>
              </div>

              {/* Player O */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  activeTurn === 'O' && !activeWinner
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <OIcon size={18} strokeWidth={3} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-white truncate">
                    {mode === 'online' && onlineRoom
                      ? onlineRoom.guest?.name || 'Waiting...'
                      : mode === 'ai'
                      ? 'Smart AI (O)'
                      : 'Player 2 (O)'}
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    Wins: {activeScores.O}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Turn / Winner Status Banner */}
        {(mode !== 'online' || (onlineRoom && onlineRoom.status === 'playing')) && (
          <div className="mb-4 text-center">
            {activeWinner ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-emerald-500/20 border border-slate-700 text-sm font-extrabold text-white shadow-lg"
              >
                <Trophy size={16} className="text-amber-400" />
                {activeWinner === 'draw' ? (
                  <span>It&apos;s a Stalemate Draw!</span>
                ) : (
                  <span>
                    Player{' '}
                    <span
                      className={
                        activeWinner === 'X' ? 'text-cyan-400' : 'text-amber-400'
                      }
                    >
                      {activeWinner}
                    </span>{' '}
                    Victorious!
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                {isAiThinking ? (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1.5">
                    <Sparkles size={14} />
                    AI is calculating optimal minimax move...
                  </span>
                ) : mode === 'online' ? (
                  isMyTurnOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      Your Turn ({myOnlineSymbol})
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Waiting for Opponent ({activeTurn})...
                    </span>
                  )
                ) : (
                  <span>
                    Current Turn:{' '}
                    <span
                      className={
                        activeTurn === 'X' ? 'text-cyan-400' : 'text-amber-400'
                      }
                    >
                      Player {activeTurn}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reaction Pop-up banner */}
        <AnimatePresence>
          {activeReaction && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-3 px-4 py-1.5 rounded-full bg-slate-800 border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center gap-2 shadow-lg"
            >
              <span>{activeReaction.sender}:</span>
              <span className="text-xl">{activeReaction.emoji}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================
            3D NEO-GRID TIC-TAC-TOE BOARD (3x3)
           ======================================================== */}
        {(mode !== 'online' || (onlineRoom && onlineRoom.status !== 'waiting')) && (
          <div className="relative p-4 bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-2xl">
            <div className="grid grid-cols-3 gap-3.5 w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]">
              {activeBoard.map((cell, idx) => {
                const isWinningCell = activeWinningLine?.includes(idx);
                const isCellDisabled =
                  cell !== null ||
                  Boolean(activeWinner) ||
                  (mode === 'online' && !isMyTurnOnline) ||
                  isAiThinking;

                return (
                  <button
                    key={`cell-${idx}`}
                    disabled={isCellDisabled}
                    onClick={() => handleCellClick(idx)}
                    className={`relative rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                      isWinningCell
                        ? 'bg-gradient-to-br from-amber-500/30 to-emerald-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/30'
                        : cell
                        ? 'bg-slate-950/80 border border-slate-800 shadow-inner'
                        : isCellDisabled
                        ? 'bg-slate-950/40 border border-slate-800/60 cursor-not-allowed'
                        : 'bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Render X */}
                    {cell === 'X' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                      >
                        <XIcon size={52} strokeWidth={3.5} />
                      </motion.div>
                    )}

                    {/* Render O */}
                    {cell === 'O' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                      >
                        <OIcon size={46} strokeWidth={3.8} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Reactions Bar in Online Mode */}
        {mode === 'online' && onlineRoom && onlineRoom.status === 'playing' && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-[11px] font-bold text-slate-400">Reaction:</span>
            {['🔥', '😎', '👏', '🤯', '💪', '😂', 'GG'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-lg p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Controls: Reset / Rematch */}
        {(mode !== 'online' || (onlineRoom && onlineRoom.status !== 'waiting')) && (
          <div className="flex items-center gap-3 mt-6">
            {mode === 'online' ? (
              <button
                onClick={handleRematchOnline}
                className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                Request Rematch
              </button>
            ) : (
              <button
                onClick={handleResetOffline}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                New Round
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-3 text-center text-slate-500 text-[11px]">
        Axiom Labs Real-time Tic-Tac-Toe • Zero-latency Firebase Synchronization
      </footer>
    </div>
  );
};
