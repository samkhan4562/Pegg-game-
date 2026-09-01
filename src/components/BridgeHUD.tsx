import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  RotateCcw,
  Undo2,
  Camera,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight,
  ArrowLeft,
  Timer,
  BarChart3,
  HelpCircle,
  Footprints,
  CheckCircle2,
  Sparkles,
  Users,
  Copy,
  Check,
  LogOut,
  Radio,
} from 'lucide-react';
import { BridgeLevelData, Traveler, BridgeBank, BridgeStep } from '../types';
import { getCrossingDuration } from '../game/bridgeMath';
import { BridgeRoom, sendBridgeReaction } from '../firebase/multiplayer';

interface BridgeHUDProps {
  level?: BridgeLevelData;
  currentLevel?: BridgeLevelData;
  levelIndex: number;
  totalLevels: number;
  elapsedTime: number;
  leftBank?: Traveler[];
  rightBank?: Traveler[];
  torchBank?: BridgeBank;
  selectedIds?: string[];
  history?: any[];
  isCrossing?: boolean;
  canUndo?: boolean;
  canCross?: boolean;
  isMuted: boolean;
  onlineRoom?: BridgeRoom | null;
  myUid?: string;
  onSelectTraveler?: (id: string) => void;
  onExecuteCrossing?: () => void;
  onCross?: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onResetCamera: () => void;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
  onOpenComparison?: () => void;
  onOpenHowToPlay?: () => void;
  onExitRoom?: () => void;
}

export const BridgeHUD: React.FC<BridgeHUDProps> = ({
  level: propLevel,
  currentLevel,
  levelIndex,
  totalLevels,
  elapsedTime,
  leftBank = [],
  rightBank = [],
  torchBank = 'left',
  selectedIds = [],
  history = [],
  isCrossing = false,
  canUndo = false,
  canCross: propCanCross,
  isMuted,
  onlineRoom,
  myUid,
  onSelectTraveler,
  onExecuteCrossing,
  onCross,
  onUndo,
  onRestart,
  onResetCamera,
  onToggleMute,
  onOpenDrawer,
  onOpenComparison,
  onOpenHowToPlay,
  onExitRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const effectiveLevel = propLevel || currentLevel;

  const currentBankTravelers = (torchBank === 'left' ? leftBank : rightBank).filter((t): t is Traveler => Boolean(t && t.id));
  const destinationBankTravelers = (torchBank === 'left' ? rightBank : leftBank).filter((t): t is Traveler => Boolean(t && t.id));

  const selectedTravelers = [...leftBank, ...rightBank].filter((t): t is Traveler =>
    Boolean(t && t.id && selectedIds.includes(t.id))
  );

  const selectedCrossingTime = getCrossingDuration(selectedTravelers);
  const isTorchLeft = torchBank === 'left';
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
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-10 font-sans">
      {/* ========================================================
          TOP HEADER BAR
         ======================================================== */}
      <header className="w-full flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: Menu & Level Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800 flex items-center justify-center text-slate-200 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-900 transition-all shadow-xl cursor-pointer active:scale-95 shrink-0"
            title="Open Menu"
          >
            <Menu size={19} />
          </button>

          <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
                  Level {effectiveLevel?.id ?? (levelIndex + 1)} of {totalLevels}
                </span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-medium">
                  {effectiveLevel?.difficulty ?? 'Classic'}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[130px] sm:max-w-[220px]">
                {effectiveLevel?.name ?? 'Midnight Bridge'}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Online Co-op Turn Indicator (If multiplayer) */}
        {onlineRoom && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{partnerInfo?.avatar || '👤'}</span>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                {partnerInfo ? partnerInfo.name : 'Waiting for Friend...'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isMyTurnInOnline ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className={`text-xs font-bold ${isMyTurnInOnline ? 'text-amber-400' : 'text-slate-400'}`}>
                {isMyTurnInOnline
                  ? 'Your Turn to Cross!'
                  : `Waiting for ${partnerInfo?.name || 'Partner'}...`}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="ml-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-300 flex items-center gap-1 cursor-pointer border border-slate-700"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{onlineRoom.code}</span>
            </button>
          </div>
        )}

        {/* Right: Stopwatch & Target Par */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2.5 sm:gap-3 shadow-xl">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
              <Timer size={16} className="text-amber-400 shrink-0" />
              <div className="text-right">
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Elapsed
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-white leading-none">
                  <span className={isWithinPar ? 'text-amber-400' : 'text-rose-400'}>
                    {elapsedTime}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-0.5">m</span>
                </div>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-slate-400">
                Par Goal
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-emerald-400 leading-none">
                {parTime} <span className="text-[10px] text-slate-400">m</span>
              </div>
            </div>
          </div>

          {onOpenHowToPlay && (
            <button
              onClick={onOpenHowToPlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-900 transition-all shadow-xl cursor-pointer active:scale-95 shrink-0"
              title="How to Play"
            >
              <HelpCircle size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Online Co-op Mobile Turn Bar */}
      {onlineRoom && (
        <div className="md:hidden w-full max-w-sm mx-auto pointer-events-auto flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-950/95 border border-amber-500/30 backdrop-blur-xl shadow-xl mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{partnerInfo?.avatar || '👤'}</span>
            <span className={`text-[11px] font-bold ${isMyTurnInOnline ? 'text-amber-400' : 'text-slate-400'}`}>
              {isMyTurnInOnline ? 'Your Turn' : `Turn: ${partnerInfo?.name || 'Partner'}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {['🔥', '💡', '👏', '🧠', '⚡'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-xs p-1 hover:scale-125 transition-transform active:scale-90 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM DOCK BAR: CONTROLS & SELECTION TRAY
         ======================================================== */}
      <footer className="w-full max-w-xl mx-auto flex flex-col items-center justify-center gap-2.5 pointer-events-auto">
        {/* Active Bank Traveler Selection Tray */}
        <div className="w-full bg-slate-950/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5">
          {/* Bank Title & Torch Indicator */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Flame size={13} className="text-amber-400 animate-pulse" />
              </div>
              <span>
                {isTorchLeft ? 'Start Bank (Left Plateau)' : 'Destination Bank (Right Plateau)'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                • {currentBankTravelers.length} waiting
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Select 1-{bridgeCapacity} with torch
            </div>
          </div>

          {/* Traveler Interactive Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
            {currentBankTravelers.map((traveler) => {
              const isSelected = selectedIds.includes(traveler.id);
              return (
                <button
                  key={traveler.id}
                  onClick={() => handleSelect(traveler.id)}
                  className={`relative p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                        style={{ backgroundColor: traveler.avatarColor }}
                      />
                      <span className="text-xs font-bold text-white truncate max-w-[60px] sm:max-w-[75px]">
                        {traveler.name}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Pace</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-amber-300'
                      }`}
                    >
                      {traveler.time}m
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button: Cross Bridge / Return Torch */}
          <motion.button
            whileHover={canCross ? { scale: 1.02 } : {}}
            whileTap={canCross ? { scale: 0.98 } : {}}
            disabled={!canCross}
            onClick={handleExecute}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
              canCross
                ? isTorchLeft
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300/60'
                  : 'bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-300/60'
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            {isTorchLeft ? (
              <>
                <Flame size={17} className={canCross ? 'text-slate-950' : 'text-slate-500'} />
                <span>
                  {selectedIds.length === 0
                    ? 'Select Travelers to Cross'
                    : `Cross Bridge (${selectedCrossingTime} min)`}
                </span>
                <ArrowRight size={17} />
              </>
            ) : (
              <>
                <ArrowLeft size={17} />
                <span>
                  {selectedIds.length === 0
                    ? 'Select Torch Bearer to Return'
                    : `Return Torch (${selectedCrossingTime} min)`}
                </span>
                <Flame size={17} className="text-amber-300" />
              </>
            )}
          </motion.button>

          {/* Bottleneck Speed Formula Indicator */}
          {selectedTravelers.length > 0 && (
            <div className="text-[11px] text-center text-slate-300 bg-slate-900/60 rounded-xl py-1 px-2 border border-slate-800/80">
              <span className="text-amber-400 font-semibold">Bottleneck Law: </span>
              <span className="font-mono text-slate-200">
                Pace = max({selectedTravelers.map((t) => `${t.time}m`).join(', ')}) = {selectedCrossingTime}m
              </span>
            </div>
          )}
        </div>

        {/* Floating Utility Controls Dock */}
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800 rounded-full p-1.5 flex items-center gap-1.5 shadow-2xl">
          {/* Undo Step */}
          <button
            disabled={!canUndo}
            onClick={onUndo}
            className={`px-3.5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo Last Crossing (Ctrl+Z)"
          >
            <Undo2 size={15} />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Restart Level */}
          <button
            onClick={onRestart}
            className="px-3.5 py-2 rounded-full bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Restart Level (R)"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Strategy Breakdown Modal */}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="px-3 py-2 rounded-full bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              title="View Strategy Breakdown"
            >
              <BarChart3 size={15} />
              <span>Analysis</span>
            </button>
          )}

          {/* Recenter Camera */}
          <button
            onClick={onResetCamera}
            className="w-8 h-8 rounded-full bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Reset Camera View"
          >
            <Camera size={15} />
          </button>

          {/* Toggle Mute */}
          <button
            onClick={onToggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isMuted
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {onlineRoom && onExitRoom && (
            <button
              onClick={onExitRoom}
              className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95 ml-1"
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

