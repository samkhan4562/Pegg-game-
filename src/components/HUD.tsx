import React from 'react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Compass,
  Menu,
} from 'lucide-react';
import { LevelData, Point2D } from '../types';

interface HUDProps {
  currentLevel: LevelData;
  levelIndex: number;
  totalLevels: number;
  movesCount: number;
  canUndo: boolean;
  isMuted: boolean;
  target: Point2D;
  onUndo: () => void;
  onRestart: () => void;
  onResetCamera: () => void;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  currentLevel,
  levelIndex,
  totalLevels,
  movesCount,
  canUndo,
  isMuted,
  target,
  onUndo,
  onRestart,
  onResetCamera,
  onToggleMute,
  onOpenDrawer,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Tutorial':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Easy':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Easy-Medium':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Medium-Hard':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Hard':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Master':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Grandmaster':
        return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const isUnderPar = movesCount <= currentLevel.parMoves;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-10 select-none">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="flex items-center justify-between gap-3 w-full max-w-6xl mx-auto">
        {/* Left: Hamburger Menu Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            id="hud-hamburger-btn"
            onClick={onOpenDrawer}
            aria-label="Open Navigation Menu"
            title="Menu & Catalog"
            className="flex items-center gap-2 glass-panel px-3.5 py-2.5 rounded-2xl shadow-xl hover:bg-slate-800/80 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer group"
          >
            <Menu size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold tracking-wide uppercase hidden sm:inline">Menu</span>
          </button>
        </div>

        {/* Center: Level Name & Difficulty Badge */}
        <div className="pointer-events-auto glass-panel px-4 py-2 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 max-w-[50vw] sm:max-w-md truncate">
          <span className="text-xs font-bold text-slate-400 font-mono-code shrink-0">
            L{currentLevel.id}
          </span>
          <div className="h-3.5 w-px bg-slate-700/60 shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
            {currentLevel.name}
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getDifficultyBadge(
              currentLevel.difficulty
            )}`}
          >
            {currentLevel.difficulty}
          </span>
        </div>

        {/* Right: Compact Goal Coordinate and Move/Par Counter */}
        <div className="pointer-events-auto flex items-center gap-3 glass-panel px-3.5 py-2 rounded-2xl shadow-xl border border-white/10">
          {/* Goal Coordinate */}
          <div className="flex items-center gap-2 border-r border-slate-700/60 pr-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                Goal
              </span>
              <span className="font-mono-code font-bold text-xs sm:text-sm text-slate-100">
                ({target.x}, {target.y})
              </span>
            </div>
          </div>

          {/* Moves / Par Counter */}
          <div className="flex items-center gap-2 pl-0.5">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Moves / Par
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-mono-code font-extrabold text-xs sm:text-sm ${
                    isUnderPar ? 'text-emerald-300' : 'text-amber-400'
                  }`}
                >
                  {movesCount}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-code">/ {currentLevel.parMoves}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONSOLIDATED FLOATING BOTTOM DOCK */}
      <footer className="w-full max-w-xl mx-auto flex items-center justify-center">
        <div className="pointer-events-auto flex items-center gap-2 glass-panel p-2 rounded-full shadow-2xl border border-white/10 backdrop-blur-xl">
          {/* Undo Button */}
          <button
            id="hud-dock-undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Move (Ctrl+Z)"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/80 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            <Undo2 size={16} />
            <span>Undo</span>
          </button>

          {/* Restart Level Button */}
          <button
            id="hud-dock-restart-btn"
            onClick={onRestart}
            title="Restart Level (R)"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw size={16} />
            <span>Restart</span>
          </button>

          <div className="h-5 w-px bg-slate-700/60 mx-1" />

          {/* Reset Camera Button */}
          <button
            id="hud-dock-reset-camera-btn"
            onClick={onResetCamera}
            title="Reset Camera View"
            className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Compass size={18} />
          </button>

          {/* Mute / Unmute Audio Button */}
          <button
            id="hud-dock-toggle-sound-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              isMuted
                ? 'text-rose-400 hover:bg-rose-500/10'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
            }`}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </footer>
    </div>
  );
};
