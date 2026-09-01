import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Menu,
  Timer,
  CheckCircle2,
  Flame,
  ArrowRight,
  ArrowLeft,
  Camera,
  BarChart3,
  HelpCircle,
  LogOut,
  Copy,
  Check,
  Sparkles,
  Smile,
} from 'lucide-react';
import { Traveler, BridgeBank, BridgeLevelData } from '../types';
import { BridgeRoom, sendBridgeReaction } from '../firebase/multiplayer';

interface BridgeHUDProps {
  levelIndex: number;
  totalLevels: number;
  currentLevel?: BridgeLevelData;
  elapsedTime: number;
  isCrossing: boolean;
  canUndo: boolean;
  isMuted: boolean;
  selectedIds: string[];
  torchBank: BridgeBank;
  leftBank: Traveler[];
  rightBank: Traveler[];
  onlineRoom?: BridgeRoom | null;
  myUid?: string;
  onSelectTraveler?: (travelerId: string) => void;
  onCross?: () => void;
  onExecuteCrossing?: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onResetCamera: () => void;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
  onOpenHowToPlay?: () => void;
  onOpenComparison?: () => void;
  onExitRoom?: () => void;
}

export const BridgeHUD: React.FC<BridgeHUDProps> = ({
  levelIndex,
  totalLevels,
  currentLevel,
  elapsedTime,
  isCrossing,
  canUndo,
  isMuted,
  selectedIds = [],
  torchBank = 'left',
  leftBank = [],
  rightBank = [],
  onlineRoom,
  myUid,
  onSelectTraveler,
  onCross,
  onExecuteCrossing,
  onUndo,
  onRestart,
  onResetCamera,
  onToggleMute,
  onOpenDrawer,
  onOpenHowToPlay,
  onOpenComparison,
  onExitRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Safe fallback if currentLevel is undefined
  const effectiveLevel = currentLevel || {
    id: levelIndex + 1,
    name: 'Midnight Bridge',
    difficulty: 'Classic',
    parTime: 60,
    bridgeCapacity: 2,
  };

  const isTorchLeft = torchBank === 'left';
  const currentBankTravelers = isTorchLeft ? leftBank : rightBank;

  const selectedTravelers = (
    isTorchLeft ? leftBank : rightBank
  ).filter((t) => selectedIds.includes(t.id));

  const selectedCrossingTime =
    selectedTravelers.length > 0
      ? Math.max(...selectedTravelers.map((t) => t.time))
      : 0;

  const parTime = effectiveLevel?.parTime ?? 60;
  const bridgeCapacity = effectiveLevel?.bridgeCapacity ?? 2;
  const isWithinPar = elapsedTime <= parTime;

  // Crossing validity & handler
  const handleExecute = onExecuteCrossing || onCross || (() => {});
  const handleSelect = onSelectTraveler || (() => {});

  const isMyTurnInOnline = !onlineRoom || onlineRoom.currentTurnUid === myUid;
  const canCross =
    !isCrossing &&
    selectedIds.length > 0 &&
    selectedIds.length <= bridgeCapacity &&
    isMyTurnInOnline;

  const partnerInfo = onlineRoom
    ? onlineRoom.host.uid === myUid
      ? onlineRoom.guest
      : onlineRoom.host
    : null;

  const handleCopyCode = () => {
    if (onlineRoom?.code) {
      navigator.clipboard.writeText(onlineRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (onlineRoom && myUid) {
      sendBridgeReaction(onlineRoom.id, myUid, emoji);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20 font-sans select-none overflow-hidden">
      {/* ========================================================
          TOP HEADER BAR (Streamlined Apple Frosted Glass)
         ======================================================== */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: Menu & Level Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-amber-500 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer shrink-0"
            title="Open Menu"
          >
            <Menu size={18} />
          </button>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl px-3 sm:px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                L{effectiveLevel?.id ?? levelIndex + 1}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[90px] sm:max-w-[150px]">
                {effectiveLevel?.name ?? 'Midnight Bridge'}
              </span>
            </div>
            <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
              {effectiveLevel?.difficulty ?? 'Classic'}
            </span>
          </div>
        </div>

        {/* Center: Online Turn Indicator (Integrated into Header, Non-obstructive) */}
        {onlineRoom && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/30 backdrop-blur-2xl shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{partnerInfo?.avatar || '👤'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMyTurnInOnline ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  isMyTurnInOnline
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isMyTurnInOnline ? 'Your Turn' : partnerInfo?.name ? `${partnerInfo.name}'s Turn` : 'Waiting...'}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            <button
              onClick={handleCopyCode}
              className="px-1.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1 cursor-pointer border border-amber-500/20 transition-all"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              <span>{onlineRoom.code}</span>
            </button>
          </div>
        )}

        {/* Right: Stopwatch & Target Par */}
        <div className="flex items-center gap-2">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-2 sm:gap-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Timer size={15} className="text-amber-500 shrink-0" />
              <div className="text-right">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  <span className={isWithinPar ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}>
                    {elapsedTime}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal"> / {parTime}m</span>
                </span>
              </div>
            </div>
          </div>

          {onOpenHowToPlay && (
            <button
              onClick={onOpenHowToPlay}
              className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-amber-500 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer shrink-0"
              title="How to Play"
            >
              <HelpCircle size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
          BOTTOM DOCK BAR: SELECTION TRAY & COMPACT CONTROLS
         ======================================================== */}
      <footer className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-2 pointer-events-auto pb-1 sm:pb-2">
        {/* Active Bank Traveler Selection Tray */}
        <div className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2">
          {/* Bank Title & Torch Indicator */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Flame size={12} className="text-amber-500 animate-pulse" />
              </div>
              <span className="text-xs">
                {isTorchLeft ? 'Start Bank (Left)' : 'Destination Bank (Right)'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({currentBankTravelers.length})
              </span>
            </div>

            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Select 1-{bridgeCapacity} to cross
            </div>
          </div>

          {/* Traveler Interactive Selection Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {currentBankTravelers.map((traveler) => {
              const isSelected = selectedIds.includes(traveler.id);
              return (
                <button
                  key={traveler.id}
                  onClick={() => handleSelect(traveler.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/10'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                      style={{ backgroundColor: traveler.avatarColor }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[65px]">
                      {traveler.name}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {traveler.time}m
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Button: Cross Bridge / Return Torch */}
          <motion.button
            whileTap={canCross ? { scale: 0.98 } : {}}
            disabled={!canCross}
            onClick={handleExecute}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              canCross
                ? isTorchLeft
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300/50'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25 ring-2 ring-cyan-300/50'
                : 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700/60 cursor-not-allowed opacity-70'
            }`}
          >
            {isTorchLeft ? (
              <>
                <Flame size={15} className={canCross ? 'text-slate-950' : 'text-slate-400'} />
                <span>
                  {selectedIds.length === 0
                    ? 'Select Travelers to Cross'
                    : `Cross Bridge (${selectedCrossingTime} min)`}
                </span>
                <ArrowRight size={15} />
              </>
            ) : (
              <>
                <ArrowLeft size={15} />
                <span>
                  {selectedIds.length === 0
                    ? 'Select Torch Bearer to Return'
                    : `Return Torch (${selectedCrossingTime} min)`}
                </span>
                <Flame size={15} className="text-amber-500" />
              </>
            )}
          </motion.button>
        </div>

        {/* Floating Utility Controls Dock (Apple Style Icon Bar) */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-full p-1 flex items-center gap-1 shadow-xl">
          {/* Undo Step */}
          <button
            disabled={!canUndo}
            onClick={onUndo}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canUndo
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 cursor-pointer active:scale-95'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>

          {/* Restart Level */}
          <button
            onClick={onRestart}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Restart Level (R)"
          >
            <RotateCcw size={15} />
          </button>

          {/* Strategy Breakdown Modal */}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Strategy Analysis"
            >
              <BarChart3 size={15} />
            </button>
          )}

          {/* Recenter Camera */}
          <button
            onClick={onResetCamera}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Reset Camera View"
          >
            <Camera size={15} />
          </button>

          {/* Toggle Mute */}
          <button
            onClick={onToggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isMuted
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Online Quick Emoji Reactions */}
          {onlineRoom && (
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 flex items-center justify-center transition-all cursor-pointer active:scale-95"
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

          {onlineRoom && onExitRoom && (
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
