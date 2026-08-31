import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Star, ArrowRight, RotateCcw, Grid, Award, Flame, CheckCircle2, Zap } from 'lucide-react';
import { BridgeLevelData } from '../types';
import { solveBridgeCrossing } from '../game/bridgeMath';

interface BridgeVictoryModalProps {
  isOpen: boolean;
  level: BridgeLevelData;
  levelIndex: number;
  totalLevels: number;
  elapsedTime: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const BridgeVictoryModal: React.FC<BridgeVictoryModalProps> = ({
  isOpen,
  level,
  levelIndex,
  totalLevels,
  elapsedTime,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  const isLastLevel = levelIndex >= totalLevels - 1;

  // Solve for comparison data
  const solution = solveBridgeCrossing(level.travelers, level.bridgeCapacity);
  const isOptimal = elapsedTime <= level.parTime;

  // Star calculation
  let starsEarned = 1;
  if (isOptimal) {
    starsEarned = 3;
  } else if (elapsedTime <= solution.naiveTime) {
    starsEarned = 2;
  }

  // Trigger celebration confetti
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#34d399', '#f87171', '#e2e8f0'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-center overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Flame size={14} className="text-amber-400" />
            <span>All Travelers Across Safely!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Level {level.id} Completed
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">{level.name}</p>

          {/* Star Rating Animation */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map((starNum) => {
              const active = starNum <= starsEarned;
              return (
                <motion.div
                  key={starNum}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + starNum * 0.15, type: 'spring', stiffness: 200 }}
                  className={`p-3 rounded-2xl border ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/50 border-slate-700 text-slate-600'
                  }`}
                >
                  <Star size={32} fill={active ? 'currentColor' : 'none'} />
                </motion.div>
              );
            })}
          </div>

          {/* Time Comparison & Optimization Breakdown */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider">Time Strategy Matrix</span>
              <span className="text-emerald-400 font-mono font-bold">
                {isOptimal ? '★ Master Optimal Solution' : 'Cleared'}
              </span>
            </div>

            {/* Bar 1: Your Time */}
            <div className="mb-2.5">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-200">Your Time:</span>
                <span className={isOptimal ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                  {elapsedTime} minutes
                </span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isOptimal ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (elapsedTime / Math.max(elapsedTime, solution.naiveTime, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Bar 2: Optimal Par Time */}
            <div className="mb-2.5">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Target Par ($T_{'{'}optimal{'}'}$):</span>
                <span className="text-emerald-400 font-mono">{level.parTime} minutes</span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (level.parTime / Math.max(elapsedTime, solution.naiveTime, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Bar 3: Naive Greedy Time */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Naive Shuttle Strategy:</span>
                <span className="text-rose-400 font-mono">{solution.naiveTime} minutes</span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500/70 rounded-full"
                  style={{
                    width: `${Math.min(100, (solution.naiveTime / Math.max(elapsedTime, solution.naiveTime, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Mathematical Note */}
            <div className="mt-3.5 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-semibold">Invariant Insight: </span>
              {solution.breakdown}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={onReplay}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw size={15} />
              <span>Replay</span>
            </button>

            <button
              onClick={onOpenLevelSelect}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Grid size={15} />
              <span>Catalog</span>
            </button>

            <button
              onClick={onNextLevel}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <span>{isLastLevel ? 'Complete' : 'Next'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
