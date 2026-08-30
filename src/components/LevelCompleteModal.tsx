import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, RotateCcw, ArrowRight, Grid } from 'lucide-react';
import { LevelData } from '../types';

interface LevelCompleteModalProps {
  isOpen: boolean;
  level: LevelData;
  levelIndex: number;
  totalLevels: number;
  movesCount: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  level,
  levelIndex,
  totalLevels,
  movesCount,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti explosion
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 45 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.5, y: 0.4 },
          colors: ['#10b981', '#06b6d4', '#fbbf24', '#f59e0b', '#38bdf8'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Star calculation
  let stars = 1;
  if (movesCount <= level.parMoves) {
    stars = 3;
  } else if (movesCount === level.parMoves + 1) {
    stars = 2;
  }

  const isLastLevel = levelIndex === totalLevels - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glowing emerald top aura */}
        <div className="absolute -top-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Title */}
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
          Target Reached!
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
          Level {level.id} Complete
        </h2>

        {/* Star Rating Display */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= stars;
            return (
              <div
                key={starIndex}
                className={`p-2 rounded-2xl transition-all ${
                  isEarned
                    ? 'bg-amber-500/20 text-amber-300 scale-110 shadow-lg glow-amber'
                    : 'bg-slate-800/50 text-slate-600'
                }`}
              >
                <Star
                  size={starIndex === 2 ? 36 : 28}
                  fill={isEarned ? '#fbbf24' : 'none'}
                  strokeWidth={2}
                />
              </div>
            );
          })}
        </div>

        {/* Stats Card */}
        <div className="w-full bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-6 flex justify-around items-center">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Moves
            </span>
            <span
              className={`text-2xl font-mono-code font-bold ${
                movesCount <= level.parMoves ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {movesCount}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Target Par
            </span>
            <span className="text-2xl font-mono-code font-bold text-slate-200">
              {level.parMoves}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Efficiency
            </span>
            <span className="text-sm font-bold text-slate-300 mt-1">
              {stars === 3 ? '★ Perfect' : stars === 2 ? 'Great' : 'Solved'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5">
          {!isLastLevel ? (
            <button
              id="modal-next-level-btn"
              onClick={onNextLevel}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            >
              <span>Next Level</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <div className="py-2 text-emerald-400 font-bold text-sm">
              🏆 All Standard Levels Solved!
            </div>
          )}

          <div className="flex gap-2 w-full">
            <button
              id="modal-replay-btn"
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer border border-slate-700/60"
            >
              <RotateCcw size={15} />
              <span>Replay</span>
            </button>

            <button
              id="modal-select-levels-btn"
              onClick={onOpenLevelSelect}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer border border-slate-700/60"
            >
              <Grid size={15} />
              <span>All Levels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
