import React from 'react';
import {
  Play,
  Grid,
  Sliders,
  HelpCircle,
  Star,
  Sparkles,
  Award,
  LayoutGrid,
} from 'lucide-react';
import { LevelProgress } from '../types';

interface HeroMenuProps {
  currentLevelIndex: number;
  totalLevels: number;
  progress: Record<number, LevelProgress>;
  onStartCampaign: () => void;
  onOpenLevelSelect: () => void;
  onOpenSandbox: () => void;
  onOpenHowToPlay: () => void;
  onReturnToHub?: () => void;
}

export const HeroMenu: React.FC<HeroMenuProps> = ({
  currentLevelIndex,
  totalLevels,
  progress,
  onStartCampaign,
  onOpenLevelSelect,
  onOpenSandbox,
  onOpenHowToPlay,
  onReturnToHub,
}) => {
  // Compute stars and completed levels
  let totalStars = 0;
  let completedCount = 0;
  Object.values(progress).forEach((p: LevelProgress) => {
    if (p && p.bestMoves !== null) {
      completedCount++;
      totalStars += p.stars || 0;
    }
  });

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none select-none">
      {/* Top Header Brand */}
      <header className="w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          {onReturnToHub && (
            <button
              onClick={onReturnToHub}
              className="glass-panel px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              title="Return to Master Games Hub"
            >
              <LayoutGrid size={14} />
              <span>Games Hub</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 glass-panel px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Point Reflection Mechanics</span>
          </div>
        </div>

        {totalStars > 0 && (
          <div className="flex items-center gap-2 glass-panel px-3.5 py-1.5 rounded-full border border-amber-500/30 text-amber-300 text-xs font-bold font-mono-code shadow-lg">
            <Star size={14} fill="#fbbf24" />
            <span>{totalStars} / {totalLevels * 3} Stars</span>
          </div>
        )}
      </header>

      {/* Center Cinematic Title Card */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center pointer-events-auto">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-lg shadow-amber-500/10">
          <Sparkles size={14} />
          <span>Mathematical Geometry Puzzle</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 tracking-tight leading-none mb-3 drop-shadow-md">
          THE JUMPING PEGS
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-md mb-8 leading-relaxed font-normal">
          Jump porcelain pegs across pivot coordinates via point reflection invariant <span className="font-mono-code text-amber-300 font-bold">C = 2B - A</span>.
        </p>

        {/* Main Action Buttons */}
        <div className="w-full max-w-md flex flex-col gap-3">
          {/* Campaign Button */}
          <button
            id="hero-start-campaign-btn"
            onClick={onStartCampaign}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Play size={20} fill="#020617" />
            <span>
              {completedCount > 0 ? `Continue Campaign (Level ${currentLevelIndex + 1})` : 'Start Campaign'}
            </span>
          </button>

          {/* Secondary 3-Column Navigation Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              id="hero-level-select-btn"
              onClick={onOpenLevelSelect}
              className="py-3 px-2 rounded-2xl glass-panel hover:bg-slate-800/80 border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <Grid size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Levels</span>
            </button>

            <button
              id="hero-sandbox-btn"
              onClick={onOpenSandbox}
              className="py-3 px-2 rounded-2xl glass-panel hover:bg-slate-800/80 border border-white/10 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <Sliders size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Sandbox</span>
            </button>

            <button
              id="hero-tutorial-btn"
              onClick={onOpenHowToPlay}
              className="py-3 px-2 rounded-2xl glass-panel hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-white transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <HelpCircle size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Tutorial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full flex items-center justify-between text-xs text-slate-500 pointer-events-auto">
        <div className="flex items-center gap-1.5 font-mono-code">
          <Award size={14} className="text-slate-400" />
          <span>{totalLevels} Progressive Levels</span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Invariant Parity • MoMath Inspired
        </div>
      </footer>
    </div>
  );
};
