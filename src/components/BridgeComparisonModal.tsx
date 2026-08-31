import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { BridgeLevelData, BridgeStep } from '../types';
import { solveBridgeCrossing } from '../game/bridgeMath';

interface BridgeComparisonModalProps {
  isOpen: boolean;
  level: BridgeLevelData;
  elapsedTime: number;
  history: BridgeStep[];
  onClose: () => void;
}

export const BridgeComparisonModal: React.FC<BridgeComparisonModalProps> = ({
  isOpen,
  level,
  elapsedTime,
  history,
  onClose,
}) => {
  if (!isOpen) return null;

  const solution = solveBridgeCrossing(level.travelers, level.bridgeCapacity);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Strategy & Bottleneck Analysis
              </h2>
              <p className="text-xs text-slate-400">
                {level.name} • Target Par: {level.parTime}m
              </p>
            </div>
          </div>

          {/* Mathematical Proof Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              The Bottleneck Optimization Theorem
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              When two slow travelers cross separately, their crossing times are added together ($T_3 + T_4$). By having them cross <strong className="text-white">together in a single trip</strong>, the faster person&apos;s time is completely absorbed into the slower person&apos;s time:
            </p>

            <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 font-mono text-xs text-slate-200 mb-4 flex flex-col gap-1.5">
              <div className="text-rose-400">
                • Naive Greedy Cost: Escort each separately = {solution.naiveTime} mins
              </div>
              <div className="text-emerald-400">
                • Optimal Bottleneck Cost: Pair slowest together = {solution.minTime} mins
              </div>
              <div className="text-amber-400 font-bold">
                ★ Time Saved: {Math.max(0, solution.naiveTime - solution.minTime)} minutes!
              </div>
            </div>

            <div className="text-xs text-slate-300">
              {solution.breakdown}
            </div>
          </div>

          {/* Theoretical Optimal Steps vs Player History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Player's Current History */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Your Current Steps ({elapsedTime}m)
              </h4>
              {history.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  No moves taken yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl text-xs border border-slate-700/50"
                    >
                      <span className="text-slate-300">
                        {step.direction === 'forward' ? '➔ Forward' : '⬅ Return'}:{' '}
                        {step.travelers.map((t) => t.name).join(' & ')}
                      </span>
                      <span className="font-mono text-amber-400 font-semibold">
                        +{step.duration}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optimal Strategy Roadmap */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                Optimal Sequence ({solution.minTime}m)
              </h4>
              <div className="flex flex-col gap-2">
                {solution.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl text-xs border border-emerald-500/20"
                  >
                    <span className="text-slate-300">
                      Step {idx + 1}: {step.direction === 'forward' ? '➔' : '⬅'}{' '}
                      {step.travelerNames.join(' & ')}
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      +{step.time}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              Close Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
