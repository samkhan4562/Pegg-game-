import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Play,
  Volume2,
  VolumeX,
  Users,
  Star,
  Swords,
  Grid3X3,
  Flame,
  CircleDot,
  Compass,
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

  const games = [
    {
      id: 'pegs' as ActiveGameView,
      number: '01',
      title: 'The Jumping Pegs 3D',
      subtitle: 'Point-Reflection Parity Physics',
      description: 'Solve discrete mathematics puzzles using 180° geometric reflections and parity invariants.',
      icon: CircleDot,
      themeColor: 'cyan',
      stars: `${pegsStars} / ${maxPegsStars}`,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderHover: 'hover:border-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500',
    },
    {
      id: 'bridge' as ActiveGameView,
      number: '02',
      title: 'Midnight Bridge & Torch',
      subtitle: '17-Minute Bottleneck Scheduling',
      description: 'Navigate travelers safely across the canyon bridge before the flickering torch flame dies.',
      icon: Flame,
      themeColor: 'amber',
      stars: `${bridgeStars} / ${maxBridgeStars}`,
      gradient: 'from-amber-500/20 to-yellow-500/20',
      borderHover: 'hover:border-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      btnBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-400 font-extrabold',
    },
    {
      id: 'tictactoe' as ActiveGameView,
      number: '03',
      title: 'Tic-Tac-Toe Pro',
      subtitle: 'Minimax AI & Live 1v1 Arena',
      description: 'Battle smart AI with minimax depth logic, local pass & play, or online realtime rooms.',
      icon: Swords,
      themeColor: 'emerald',
      stars: 'Live 1v1',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderHover: 'hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500',
    },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden font-sans select-none z-0 transition-colors duration-300">
      {/* Apple Frosted Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-indigo-400/15 dark:bg-indigo-500/10 rounded-full blur-[140px]" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ========================================================
          GLOBAL TOP NAVIGATION BAR (Apple Glass Style)
         ======================================================== */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 backdrop-blur-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-lg">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Axiom Arcade
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              3D Mathematical Puzzles &amp; Multiplayer Arena
            </p>
          </div>
        </div>

        {/* Global Quick Action Icon Dock */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Friends & Multiplayer (Clean Apple Glass Icon Button) */}
          <button
            onClick={onOpenFriends}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-cyan-500 transition-all shadow-lg cursor-pointer active:scale-95 group relative"
            title="Friends & Multiplayer Hub"
            aria-label="Friends and Multiplayer"
          >
            <Users size={18} className="group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {/* Master Stars Registry (Compact Apple Glass Chip) */}
          <div
            className="h-10 sm:h-11 px-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center gap-1.5 shadow-lg"
            title={`Total Earned Stars: ${totalEarnedStars} of ${totalPossibleStars}`}
          >
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              {totalEarnedStars}
            </span>
          </div>

          {/* Sound Toggle (Clean Apple Glass Icon Button) */}
          <button
            onClick={onToggleMute}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border backdrop-blur-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isMuted
                ? 'bg-white/80 dark:bg-slate-900/80 border-white/60 dark:border-white/10 text-rose-500'
                : 'bg-white/80 dark:bg-slate-900/80 border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-cyan-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN CATALOG AREA
         ======================================================== */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex-1 flex flex-col justify-center">
        {/* Subtle Headline */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2 shadow-sm backdrop-blur-xl"
          >
            <Sparkles size={13} className="text-cyan-500" />
            <span>Interactive 3D Discrete Math • Real-time Multiplayer</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            Choose Your Arena
          </motion.h1>
        </div>

        {/* ========================================================
            APPLE GLASS 3-MODULE CARDS
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {games.map((game, idx) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx }}
                className={`relative group rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-white/60 dark:border-white/10 ${game.borderHover} p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}
              >
                {/* Background Ambient Glow */}
                <div
                  className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${game.gradient} rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`}
                />

                <div>
                  {/* Top Row: Game Badge & Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${game.badgeBg}`}
                    >
                      Game {game.number}
                    </span>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-amber-500 font-bold">
                      <Star size={12} className="fill-amber-500" />
                      <span>{game.stars}</span>
                    </div>
                  </div>

                  {/* Visual 3D Icon Header */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-slate-100 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>

                  {/* Title & Subtitle */}
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                    {game.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {game.description}
                  </p>
                </div>

                {/* Action Button (Icon-focused & Clear) */}
                <button
                  onClick={() => onSelectGame(game.id)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${game.btnBg}`}
                >
                  <Play size={15} className="fill-current" />
                  <span>Play {game.title.split(' ')[0]}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ========================================================
          CLEAN APPLE FOOTER
         ======================================================== */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
        <div>Axiom Arcade • Discrete Math &amp; Real-time Multiplayer</div>
        <div>Point-Reflection • Bottleneck Scheduling • Firebase Sync</div>
      </footer>
    </div>
  );
};
