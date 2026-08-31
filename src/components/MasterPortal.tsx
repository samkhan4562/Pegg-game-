import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Flame,
  Star,
  Sparkles,
  Lock,
  ArrowRight,
  Volume2,
  VolumeX,
  Layers,
  Award,
  BookOpen,
  Cpu,
  Grid,
} from 'lucide-react';
import { ActiveGameView } from '../types';

interface MasterPortalProps {
  pegsStars: number;
  maxPegsStars: number;
  bridgeStars: number;
  maxBridgeStars: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onSelectGame: (game: ActiveGameView) => void;
}

export const MasterPortal: React.FC<MasterPortalProps> = ({
  pegsStars,
  maxPegsStars,
  bridgeStars,
  maxBridgeStars,
  isMuted,
  onToggleMute,
  onSelectGame,
}) => {
  const totalEarnedStars = pegsStars + bridgeStars;
  const totalPossibleStars = maxPegsStars + maxBridgeStars;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#07090e] text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30 font-sans touch-pan-y z-0">
      {/* Background Ambient Lighting Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ========================================================
          GLOBAL TOP NAVIGATION BAR
         ======================================================== */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-amber-500/20 border border-slate-700/80 backdrop-blur-xl flex items-center justify-center text-cyan-400 shadow-lg shadow-black/40">
            <Compass size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white tracking-tight">
                Axiom Labs
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                PRO v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Mathematical & Logic Game Hub
            </p>
          </div>
        </div>

        {/* Global Stats & SFX Control */}
        <div className="flex items-center gap-3">
          {/* Master Star Registry */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl px-4 py-2 flex items-center gap-2.5 shadow-lg shadow-black/40">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Total Stars
              </div>
              <div className="font-mono text-sm font-bold text-white">
                <span className="text-amber-400">{totalEarnedStars}</span>
                <span className="text-xs text-slate-500"> / {totalPossibleStars}</span>
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-black/40 active:scale-95 ${
              isMuted
                ? 'bg-slate-900/80 border-slate-700/60 text-slate-500 hover:text-slate-300'
                : 'bg-slate-900/80 border-slate-700/60 text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-800'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {/* ========================================================
          HERO TITLE & INTRO
         ======================================================== */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-4 shadow-md"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Interactive 3D Discrete Mathematics & Invariant Puzzles</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3"
          >
            Axiom Labs Arcade
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto"
          >
            Engage with legendary mathematical invariants, point-reflection lattices, and bottleneck graph optimizations in immersive WebGL 3D environments.
          </motion.p>
        </div>

        {/* ========================================================
            GAMES CATALOG MATRIX
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full mb-10">
          {/* ====================================================
              GAME CARD 1: THE JUMPING PEGS 3D
             ==================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/80 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-cyan-950/20 hover:shadow-2xl hover:shadow-cyan-500/15 overflow-hidden"
          >
            {/* Card Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition-all" />

            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    Game 01
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                    20 Levels + Sandbox
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-amber-400 font-bold">
                  <Star size={14} className="fill-amber-400" />
                  <span>{pegsStars} / {maxPegsStars} ★</span>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors mb-2">
                The Jumping Pegs 3D
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Based on MoMath and 3Blue1Brown mechanics. Master $180^\circ$ coordinate point-reflections $(C = 2B - A)$ and navigate parity invariant sub-lattices.
              </p>

              {/* Feature Chips */}
              <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Grid size={15} className="text-cyan-400" />
                  <span>Point-Reflection $C=2B-A$</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Layers size={15} className="text-cyan-400" />
                  <span>Modulo 2 Parity Lock</span>
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              onClick={() => onSelectGame('pegs')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-98 group-hover:gap-3"
            >
              <span>Launch Jumping Pegs</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* ====================================================
              GAME CARD 2: MIDNIGHT BRIDGE & TORCH
             ==================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative group rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-amber-500/30 hover:border-amber-400/80 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-amber-950/20 hover:shadow-2xl hover:shadow-amber-500/15 overflow-hidden"
          >
            {/* Card Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all" />

            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    Game 02
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                    10 Levels + Architect
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-amber-400 font-bold">
                  <Star size={14} className="fill-amber-400" />
                  <span>{bridgeStars} / {maxBridgeStars} ★</span>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors mb-2">
                Midnight Bridge & Torch
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                The classic river-crossing bottleneck puzzle. Harness the 17-minute bottleneck theorem: pair the slowest travelers together to absorb crossing times!
              </p>

              {/* Feature Chips */}
              <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Flame size={15} className="text-amber-400" />
                  <span>Bottleneck $\max(T_A, T_B)$</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Cpu size={15} className="text-amber-400" />
                  <span>Dijkstra Auto-Solver</span>
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              onClick={() => onSelectGame('bridge')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 group-hover:gap-3"
            >
              <span>Launch Midnight Bridge</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* ========================================================
            COMING SOON EXPANSION SLOTS
           ======================================================== */}
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center sm:text-left">
            Future Mathematical Puzzle Modules (In Research)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Expansion 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between opacity-75">
              <div>
                <div className="text-xs font-bold text-slate-300">
                  Water Jugs Invariant
                </div>
                <div className="text-[10px] text-slate-500">
                  Bézout&apos;s Identity & GCD Lattices
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Lock size={11} /> Soon
              </span>
            </div>

            {/* Expansion 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between opacity-75">
              <div>
                <div className="text-xs font-bold text-slate-300">
                  Wolf, Goat & Cabbage
                </div>
                <div className="text-[10px] text-slate-500">
                  State-Space Graph Constraints
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Lock size={11} /> Soon
              </span>
            </div>

            {/* Expansion 3 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between opacity-75">
              <div>
                <div className="text-xs font-bold text-slate-300">
                  Towers of Hanoi 3D
                </div>
                <div className="text-[10px] text-slate-500">
                  Mersenne Numbers & Gray Codes
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Lock size={11} /> Soon
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          GLOBAL FOOTER
         ======================================================== */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-5 pb-12 sm:pb-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>Axiom Labs • Pure Mathematical Logic Arcade Platform</div>
        <div>Built for WebGL 3D Exploration</div>
      </footer>
    </div>
  );
};
