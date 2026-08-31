import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Lock, Flame, Play } from 'lucide-react';
import { BridgeLevelData, BridgeProgress } from '../types';

interface BridgeLevelSelectModalProps {
  isOpen: boolean;
  levels: BridgeLevelData[];
  currentLevelIndex: number;
  progress: Record<number, BridgeProgress>;
  onSelectLevel: (index: number) => void;
  onClose: () => void;
}

export const BridgeLevelSelectModal: React.FC<BridgeLevelSelectModalProps> = ({
  isOpen,
  levels,
  currentLevelIndex,
  progress,
  onSelectLevel,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 max-h-[90vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Midnight Bridge Levels
                </h2>
                <p className="text-xs text-slate-400">
                  Select a chasm scenario to optimize crossing bottlenecks
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6 overflow-y-auto pr-1">
            {levels.map((lvl, idx) => {
              const record = progress[lvl.id] || {
                unlocked: idx === 0,
                bestTime: null,
                stars: 0,
              };
              const isCurrent = idx === currentLevelIndex;
              const isLocked = !record.unlocked;

              return (
                <button
                  key={`bridge-lvl-${lvl.id}-${idx}`}
                  disabled={isLocked}
                  onClick={() => {
                    onSelectLevel(idx);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-600 cursor-not-allowed opacity-60'
                      : isCurrent
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 cursor-pointer hover:bg-amber-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">
                        #{lvl.id}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {lvl.name}
                      </span>
                    </div>

                    {isLocked ? (
                      <Lock size={15} className="text-slate-600" />
                    ) : (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((starNum) => (
                          <Star
                            key={starNum}
                            size={14}
                            className={
                              starNum <= record.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                      {lvl.difficulty}
                    </span>
                    <span className="font-mono text-emerald-400 font-medium">
                      Par: {lvl.parTime}m
                    </span>
                    {record.bestTime !== null && (
                      <span className="font-mono text-amber-300 font-bold">
                        Best: {record.bestTime}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
