import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Users, Timer, CheckCircle, ArrowRightLeft, Sparkles, HelpCircle } from 'lucide-react';

interface BridgeHowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BridgeHowToPlayModal: React.FC<BridgeHowToPlayModalProps> = ({
  isOpen,
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
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How to Play: Midnight Bridge & Torch
              </h2>
              <p className="text-xs text-slate-400">
                Mastering the Bottleneck Pairing Optimization Puzzle
              </p>
            </div>
          </div>

          {/* Core Rules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {/* Rule 1: Capacity */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Users size={16} />
                <span>1. Bridge Capacity</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The narrow bridge can hold at most <strong className="text-white">2 travelers</strong> at any time.
              </p>
            </div>

            {/* Rule 2: The Torch */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Flame size={16} />
                <span>2. The Shared Torch</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                In pitch darkness, no one can cross without the lantern. The torch must be hand-carried across and shuttled back.
              </p>
            </div>

            {/* Rule 3: Bottleneck Pace */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Timer size={16} />
                <span>3. Slower Pace Invariant</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When two travelers cross together, their speed is strictly determined by the <strong className="text-white">slower person</strong>: <span className="font-mono text-amber-300">Time = max(T_A, T_B)</span>.
              </p>
            </div>

            {/* Rule 4: Par Goal */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <CheckCircle size={16} />
                <span>4. Par Objective</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transport all travelers to the right bank in or under the <strong className="text-emerald-400">Target Par Time</strong> to earn 3 Stars!
              </p>
            </div>
          </div>

          {/* The Classic 17-Minute Solution Diagram */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              The Classic 17-Minute Riddle (1m, 2m, 5m, 10m)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              If the fastest traveler (1m) escorts everyone individually (Naive Greedy), the total time is <span className="text-rose-400 font-mono">19 minutes</span> ($10 + 1 + 5 + 1 + 2 = 19$).
            </p>

            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col gap-2 font-mono text-xs">
              <div className="text-emerald-400 font-bold mb-1">
                ★ The Optimal Bottleneck Strategy (17 minutes):
              </div>
              <div className="text-slate-300">
                1. <strong>(1m, 2m)</strong> cross forward ➔ <span className="text-amber-400 font-bold">2 mins</span> (Elapsed: 2m)
              </div>
              <div className="text-slate-300">
                2. <strong>(1m)</strong> returns with torch ⬅ <span className="text-amber-400 font-bold">1 min</span> (Elapsed: 3m)
              </div>
              <div className="text-emerald-300 font-semibold">
                3. <strong>(5m, 10m)</strong> cross TOGETHER ➔ <span className="text-amber-400 font-bold">10 mins</span> (Elapsed: 13m)
              </div>
              <div className="text-slate-300">
                4. <strong>(2m)</strong> returns with torch ⬅ <span className="text-amber-400 font-bold">2 mins</span> (Elapsed: 15m)
              </div>
              <div className="text-slate-300">
                5. <strong>(1m, 2m)</strong> cross together ➔ <span className="text-amber-400 font-bold">2 mins</span> (Elapsed: 17m)
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
            >
              Got It, Let&apos;s Play!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
