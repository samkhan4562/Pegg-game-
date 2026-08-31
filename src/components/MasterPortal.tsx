import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Flame,
  Star,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX,
  Grid,
  Users,
  Swords,
  Globe,
  Radio,
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
  onOpenFriends: () => void;
  onlineCount?: number;
}

export const MasterPortal: React.FC<MasterPortalProps> = ({
  pegsStars,
  maxPegsStars,
  bridgeStars,
  maxBridgeStars,
  isMuted,
  onToggleMute,
  onSelectGame,
  onOpenFriends,
  onlineCount = 1,
}) => {
  const totalEarnedStars = pegsStars + bridgeStars;
  const totalPossibleStars = maxPegsStars + maxBridgeStars;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05070a] text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30 font-sans touch-pan-y z-0">
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
                PRO v5.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              3D Mathematical Puzzles &amp; Real-time Multiplayer Arena
            </p>
          </div>
        </div>

        {/* Global Stats, Friends & SFX Control */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Friends & Live Community Button */}
          <button
            onClick={onOpenFriends}
            className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-lg shadow-black/40 text-cyan-300 transition-all cursor-pointer group"
          >
            <div className="relative">
              <Users size={16} className="text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Community
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                Friends List
              </div>
            </div>
          </button>

          {/* Master Star Registry */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-lg shadow-black/40">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Stars
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-white">
                <span className="text-amber-400">{totalEarnedStars}</span>
                <span className="text-[10px] text-slate-500"> / {totalPossibleStars}</span>
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
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-3 shadow-md"
          >
            <Sparkles size={14} className="text-cyan-400" />
            <span>Interactive 3D Discrete Math • Real-time Multiplayer • Instant Matchmaking</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2"
          >
            Axiom Labs Arcade
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto"
          >
            Play solo puzzle campaigns, challenge AI bots, or create multiplayer rooms to battle live opponents with real-time Firebase sync.
          </motion.p>
        </div>

        {/* ========================================================
            MASTER 3-MODULE ARCADE CATALOG MATRIX
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full mb-10">
          {/* ====================================================
              GAME CARD 1: THE JUMPING PEGS 3D
             ==================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/80 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-cyan-950/20 hover:shadow-2xl hover:shadow-cyan-500/15 overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  Game 01
                </span>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-amber-400 font-bold">
                  <Star size={13} className="fill-amber-400" />
                  <span>{pegsStars} / {maxPegsStars} ★</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors mb-1.5">
                The Jumping Pegs 3D
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                MoMath point-reflections $(C = 2B - A)$ with Klein 4-group parity invariants and parabolic jump trajectory physics.
              </p>

              <div className="flex flex-col gap-1.5 mb-5 text-[11px] text-slate-300">
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Grid size={14} className="text-cyan-400 shrink-0" />
                  <span>Point-Reflection $C=2B-A$</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectGame('pegs')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-98"
            >
              <span>Launch Jumping Pegs</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>

          {/* ====================================================
              GAME CARD 2: MIDNIGHT BRIDGE & TORCH
             ==================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative group rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-amber-500/30 hover:border-amber-400/80 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-amber-950/20 hover:shadow-2xl hover:shadow-amber-500/15 overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  Game 02
                </span>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-amber-400 font-bold">
                  <Star size={13} className="fill-amber-400" />
                  <span>{bridgeStars} / {maxBridgeStars} ★</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors mb-1.5">
                Midnight Bridge &amp; Torch
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                The 17-minute bottleneck theorem: strategic paired river crossings under dynamic torch constraints.
              </p>

              <div className="flex flex-col gap-1.5 mb-5 text-[11px] text-slate-300">
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Flame size={14} className="text-amber-400 shrink-0" />
                  <span>Bottleneck $\max(T_A, T_B)$</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectGame('bridge')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98"
            >
              <span>Launch Midnight Bridge</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>

          {/* ====================================================
              GAME CARD 3: TIC-TAC-TOE PRO (कांटा और ज़ीरो)
             ==================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-emerald-950/20 hover:shadow-2xl hover:shadow-emerald-500/15 overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  Game 03 • Real-Time
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-emerald-400 font-bold">
                  <Globe size={13} />
                  <span>MULTIPLAYER</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition-colors mb-1.5">
                Tic-Tac-Toe Pro
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                कांटा और ज़ीरो (X &amp; O) with Smart AI Bot (Minimax), Local Pass &amp; Play, and Online 1v1 Rooms via Firebase Realtime Sync.
              </p>

              <div className="flex flex-col gap-1.5 mb-5 text-[11px] text-slate-300">
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
                  <Swords size={14} className="text-emerald-400 shrink-0" />
                  <span>Minimax AI • Online Rooms • Quick Match</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectGame('tictactoe')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
            >
              <span>Play Tic-Tac-Toe Pro</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>
        </div>
      </main>

      {/* ========================================================
          GLOBAL FOOTER
         ======================================================== */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-4 pb-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>Axiom Labs • 3D Mathematical Logic Arcade &amp; Realtime Multiplayer Arena</div>
        <div>Point-Reflection • Bottleneck Scheduling • Online Firebase Realtime Sync</div>
      </footer>
    </div>
  );
};
