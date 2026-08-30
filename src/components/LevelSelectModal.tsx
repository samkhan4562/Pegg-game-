import React from 'react';
import { X, Star, CheckCircle, Lock, Play } from 'lucide-react';
import { LevelData, LevelProgress } from '../types';

interface LevelSelectModalProps {
  isOpen: boolean;
  levels: LevelData[];
  currentLevelIndex: number;
  progress: Record<number, LevelProgress>;
  onSelectLevel: (index: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  levels,
  currentLevelIndex,
  progress,
  onSelectLevel,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[88vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
              Puzzle Catalog
            </span>
            <h2 className="text-xl font-bold text-slate-100">Select Level</h2>
          </div>
          <button
            id="close-level-select-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Level Cards Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 custom-scrollbar">
          {levels.map((level, idx) => {
            const levelProg = progress[level.id] || {
              unlocked: idx === 0,
              bestMoves: null,
              stars: 0,
            };
            const isCurrent = idx === currentLevelIndex;
            const isUnlocked = levelProg.unlocked;

            return (
              <div
                key={level.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectLevel(idx);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between text-left ${
                  !isUnlocked
                    ? 'opacity-45 bg-slate-900/40 border-slate-800 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-900/20 cursor-pointer ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 font-mono-code">
                        #{level.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {level.difficulty}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Playing
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm">{level.name}</h3>
                  </div>

                  {/* Lock / Star icons */}
                  {!isUnlocked ? (
                    <Lock size={16} className="text-slate-600 shrink-0 mt-1" />
                  ) : levelProg.bestMoves !== null ? (
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={s <= levelProg.stars ? '#fbbf24' : 'none'}
                          className={s <= levelProg.stars ? 'text-amber-400' : 'text-slate-700'}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play size={14} className="text-emerald-400 shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {level.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono-code border-t border-slate-800/80 pt-2 text-slate-400">
                  <span>Par: {level.parMoves} moves</span>
                  {levelProg.bestMoves !== null ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Best: {levelProg.bestMoves}
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-slate-500">Unplayed</span>
                  ) : (
                    <span className="text-slate-600">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
