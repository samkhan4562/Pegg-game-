import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Grid,
  Sliders,
  HelpCircle,
  Volume2,
  VolumeX,
  Home,
  Flame,
  Star,
  ChevronRight,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { BridgeProgress } from '../types';

interface BridgeSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<number, BridgeProgress>;
  totalLevels: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLevelSelect: () => void;
  onOpenSandbox: () => void;
  onOpenHowToPlay: () => void;
  onReturnToHub: () => void;
}

export const BridgeSlideDrawer: React.FC<BridgeSlideDrawerProps> = ({
  isOpen,
  onClose,
  progress,
  totalLevels,
  isMuted,
  onToggleMute,
  onOpenLevelSelect,
  onOpenSandbox,
  onOpenHowToPlay,
  onReturnToHub,
}) => {
  // Calculate total stars earned in Bridge Game
  const totalStars: number = (Object.values(progress) as BridgeProgress[]).reduce(
    (sum: number, p: BridgeProgress) => sum + (p?.stars || 0),
    0
  );
  const maxStars: number = totalLevels * 3;
  const progressPercent = maxStars > 0 ? Math.min(100, (totalStars / maxStars) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-slate-900/95 border-r border-slate-700/80 backdrop-blur-2xl z-50 p-6 flex flex-col justify-between shadow-2xl shadow-black/80"
          >
            {/* Top Section */}
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Midnight Bridge & Torch
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Bottleneck Logic Engine
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress & Star Registry Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 my-5">
                <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-300">
                  <span>Campaign Progress</span>
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono">
                    <Star size={14} className="fill-amber-400" />
                    <span>
                      {totalStars} / {maxStars} Stars
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Navigation Menu Links */}
              <div className="flex flex-col gap-2">
                {/* Level Catalog */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenLevelSelect();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-amber-500/40 flex items-center justify-between text-slate-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                      <Grid size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Level Catalog</div>
                      <div className="text-[11px] text-slate-400">
                        10 Verified Puzzles
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all"
                  />
                </button>

                {/* Custom Puzzle Architect */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenSandbox();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-amber-500/40 flex items-center justify-between text-slate-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                      <Sliders size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">
                        Puzzle Architect
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Custom Scenarios & Solver
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all"
                  />
                </button>

                {/* How to Play & Logic Theorem */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenHowToPlay();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-amber-500/40 flex items-center justify-between text-slate-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                      <HelpCircle size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">
                        How to Play & Theorem
                      </div>
                      <div className="text-[11px] text-slate-400">
                        17m Bottleneck Proof
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all"
                  />
                </button>

                {/* Return to Master Games Hub */}
                <button
                  onClick={() => {
                    onClose();
                    onReturnToHub();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-amber-500/30 flex items-center justify-between text-amber-300 hover:text-white transition-all group cursor-pointer mt-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <LayoutGrid size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">Games Hub</div>
                      <div className="text-[11px] text-slate-400">
                        Axiom Labs Portal
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-amber-400 group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={onToggleMute}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <>
                    <VolumeX size={17} className="text-rose-400" />
                    <span>Sound Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={17} className="text-amber-400" />
                    <span>Sound Active</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-500 font-mono">
                Axiom Labs v2.0
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
