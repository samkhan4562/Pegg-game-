import React from 'react';
import {
  X,
  Grid,
  Sliders,
  HelpCircle,
  Volume2,
  VolumeX,
  Home,
  Star,
  Award,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { LevelProgress } from '../types';

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<number, LevelProgress>;
  totalLevels: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLevelSelect: () => void;
  onOpenSandbox: () => void;
  onOpenHowToPlay: () => void;
  onReturnToMainMenu: () => void;
}

export const SlideDrawer: React.FC<SlideDrawerProps> = ({
  isOpen,
  onClose,
  progress,
  totalLevels,
  isMuted,
  onToggleMute,
  onOpenLevelSelect,
  onOpenSandbox,
  onOpenHowToPlay,
  onReturnToMainMenu,
}) => {
  if (!isOpen) return null;

  // Calculate total stars & completed levels
  let totalStars = 0;
  let completedCount = 0;
  Object.values(progress).forEach((p: LevelProgress) => {
    if (p && p.bestMoves !== null) {
      completedCount++;
      totalStars += p.stars || 0;
    }
  });
  const maxPossibleStars = totalLevels * 3;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 w-full max-w-sm h-full glass-panel bg-slate-950/85 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-300">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Calculator size={20} className="text-slate-950" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 tracking-tight">The Jumping Pegs</h2>
                <p className="text-xs text-slate-400">Navigation & Systems</p>
              </div>
            </div>
            <button
              id="drawer-close-btn"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Player Progress Stats Card */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>CAMPAIGN MASTERY</span>
              <span className="text-amber-400 font-mono-code font-bold flex items-center gap-1">
                <Star size={13} fill="#fbbf24" /> {totalStars} / {maxPossibleStars}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(totalStars / maxPossibleStars) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Award size={14} className="text-emerald-400" /> Completed
              </span>
              <span className="font-mono-code font-bold text-slate-200">
                {completedCount} / {totalLevels} Levels
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              id="drawer-level-catalog-btn"
              onClick={() => {
                onClose();
                onOpenLevelSelect();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Grid size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Level Catalog</div>
                  <div className="text-[11px] text-slate-400">Chapters 1 to 4 (15 Levels)</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              id="drawer-puzzle-architect-btn"
              onClick={() => {
                onClose();
                onOpenSandbox();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Sliders size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Puzzle Architect</div>
                  <div className="text-[11px] text-slate-400">Custom Sandbox & Level Creator</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              id="drawer-how-to-play-btn"
              onClick={() => {
                onClose();
                onOpenHowToPlay();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <HelpCircle size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">How to Play & Math</div>
                  <div className="text-[11px] text-slate-400">Reflection Formula & Invariant</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              id="drawer-audio-toggle-btn"
              onClick={onToggleMute}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border transition-all ${
                    isMuted
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Sound FX & Audio</div>
                  <div className="text-[11px] text-slate-400">
                    {isMuted ? 'Muted' : 'Enabled (Synthesizer)'}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isMuted ? 'OFF' : 'ON'}
              </span>
            </button>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            id="drawer-return-home-btn"
            onClick={() => {
              onClose();
              onReturnToMainMenu();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer shadow-lg"
          >
            <Home size={16} className="text-amber-400" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
