import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Menu,
  Copy,
  Check,
  LogOut,
  Camera,
  Smile,
  Compass,
} from 'lucide-react';
import { LevelData, Point2D, ValidMove } from '../types';
import { PegsRoom, sendPegsReaction } from '../firebase/multiplayer';

interface HUDProps {
  currentLevel: LevelData;
  levelIndex: number;
  totalLevels: number;
  movesCount: number;
  canUndo: boolean;
  isMuted: boolean;
  target: Point2D;
  focusedMove?: ValidMove | null;
  pegsRoom?: PegsRoom | null;
  myUid?: string;
  onUndo: () => void;
  onRestart: () => void;
  onResetCamera: () => void;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
  onExitRoom?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  currentLevel,
  levelIndex,
  totalLevels,
  movesCount,
  canUndo,
  isMuted,
  target = { x: 0, y: 0 },
  focusedMove,
  pegsRoom,
  myUid,
  onUndo,
  onRestart,
  onResetCamera,
  onToggleMute,
  onOpenDrawer,
  onExitRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Tutorial':
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Easy-Medium':
      case 'Medium':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'Medium-Hard':
      case 'Hard':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Master':
      case 'Grandmaster':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const isUnderPar = movesCount <= (currentLevel?.parMoves ?? 5);
  const isMyTurn = !pegsRoom || pegsRoom.currentTurnUid === myUid;
  const partnerInfo = pegsRoom
    ? pegsRoom.host.uid === myUid
      ? pegsRoom.guest
      : pegsRoom.host
    : null;

  const handleCopyCode = () => {
    if (pegsRoom?.code) {
      navigator.clipboard.writeText(pegsRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (pegsRoom && myUid) {
      sendPegsReaction(pegsRoom.id, myUid, emoji);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20 font-sans select-none overflow-hidden">
      {/* ========================================================
          TOP NAVIGATION BAR (Apple Frosted Glass)
         ======================================================== */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: Menu & Level Name */}
        <div className="flex items-center gap-2">
          <button
            id="hud-hamburger-btn"
            onClick={onOpenDrawer}
            aria-label="Open Navigation Menu"
            title="Menu & Catalog"
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer shrink-0"
          >
            <Menu size={18} />
          </button>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
              L{currentLevel?.id ?? levelIndex + 1}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <h1 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[90px] sm:max-w-[150px]">
              {currentLevel?.name ?? 'Level'}
            </h1>
            <span
              className={`hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                currentLevel?.difficulty ?? 'Easy'
              )}`}
            >
              {currentLevel?.difficulty ?? 'Easy'}
            </span>
          </div>
        </div>

        {/* Center: Co-op Multiplayer Turn Indicator (Integrated into Header, Non-obstructive) */}
        {pegsRoom && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-cyan-500/30 backdrop-blur-2xl shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{partnerInfo?.avatar || '👤'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMyTurn ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  isMyTurn
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isMyTurn ? 'Your Turn' : partnerInfo?.name ? `${partnerInfo.name}'s Turn` : 'Waiting...'}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            <button
              onClick={handleCopyCode}
              className="px-1.5 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 flex items-center gap-1 cursor-pointer border border-cyan-500/20 transition-all"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              <span>{pegsRoom.code}</span>
            </button>
          </div>
        )}

        {/* Right: Goal Coordinate & Moves / Par Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-3 py-1.5 rounded-2xl shadow-lg border border-white/60 dark:border-white/10">
            {/* Goal Point */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700/60 pr-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                ({target?.x ?? 0}, {target?.y ?? 0})
              </span>
            </div>

            {/* Moves Count */}
            <div className="flex items-center gap-1">
              <span
                className={`font-mono font-extrabold text-xs sm:text-sm ${
                  isUnderPar ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {movesCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ {currentLevel?.parMoves ?? 5}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          BOTTOM DOCK BAR: MATHEMATICAL STATUS & CONTROLS
         ======================================================== */}
      <footer className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-2 pointer-events-auto pb-1 sm:pb-2">
        {/* Dynamic Point Reflection Formula Banner */}
        {focusedMove && (
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-cyan-500/40 text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 shadow-xl backdrop-blur-2xl">
            <span className="font-bold text-cyan-600 dark:text-cyan-400">180° Reflection:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
              C({focusedMove.dest.x}, {focusedMove.dest.y}) = 2·({focusedMove.pivot.x}, {focusedMove.pivot.y}) - ({focusedMove.from.x}, {focusedMove.from.y})
            </span>
          </div>
        )}

        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-full p-1 flex items-center gap-1 shadow-xl">
          {/* Undo Button */}
          <button
            id="hud-dock-undo-btn"
            onClick={onUndo}
            disabled={!canUndo || Boolean(pegsRoom)}
            title="Undo Move (Ctrl+Z)"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <Undo2 size={15} />
          </button>

          {/* Restart Level */}
          <button
            id="hud-dock-restart-btn"
            onClick={onRestart}
            title="Restart Level (R)"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-500 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={15} />
          </button>

          {/* Reset Camera View */}
          <button
            id="hud-dock-camera-btn"
            onClick={onResetCamera}
            title="Recenter Camera (C)"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-500 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Camera size={15} />
          </button>

          {/* Toggle Audio */}
          <button
            id="hud-dock-mute-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isMuted
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-500'
            }`}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Online Quick Emoji Reactions */}
          {pegsRoom && (
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/25 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Send Quick Reaction"
              >
                <Smile size={15} />
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: -45 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl z-30"
                  >
                    {['🔥', '💡', '👏', '🧠', '⚡'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSendReaction(emoji)}
                        className="text-base p-1 hover:scale-125 active:scale-90 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {pegsRoom && onExitRoom && (
            <button
              onClick={onExitRoom}
              className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-95 ml-0.5"
              title="Leave Room"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
