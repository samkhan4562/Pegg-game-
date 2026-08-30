import React, { useState } from 'react';
import { X, Plus, Trash2, Play, Target, Sparkles } from 'lucide-react';
import { LevelData, PegData, Point2D } from '../types';

interface LevelEditorModalProps {
  isOpen: boolean;
  onPlayCustomLevel: (level: LevelData) => void;
  onClose: () => void;
}

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  onPlayCustomLevel,
  onClose,
}) => {
  const [levelName, setLevelName] = useState('My Custom Puzzle');
  const [target, setTarget] = useState<Point2D>({ x: 3, y: 3 });
  const [pegs, setPegs] = useState<PegData[]>([
    { id: 'custom-p1', x: 0, y: 0, label: 'A' },
    { id: 'custom-p2', x: 1, y: 1, label: 'B' },
  ]);
  const [newX, setNewX] = useState(0);
  const [newY, setNewY] = useState(2);
  const [parMoves, setParMoves] = useState(2);

  if (!isOpen) return null;

  const handleAddPeg = () => {
    // Check if duplicate
    const exists = pegs.some((p) => p.x === newX && p.y === newY);
    if (exists) return;

    const nextId = `custom-p${Date.now()}`;
    const nextLabel = String.fromCharCode(65 + (pegs.length % 26));
    setPegs([...pegs, { id: nextId, x: newX, y: newY, label: nextLabel }]);
  };

  const handleRemovePeg = (id: string) => {
    if (pegs.length <= 2) return; // Keep at least 2 pegs
    setPegs(pegs.filter((p) => p.id !== id));
  };

  const handleStartPlay = () => {
    const customLevel: LevelData = {
      id: 99,
      name: levelName || 'Custom Level',
      difficulty: 'Medium',
      description: 'Custom created puzzle in Sandbox Mode.',
      parMoves: parMoves || 2,
      pegs: pegs.map((p) => ({ ...p })),
      target: { ...target },
      cameraPos: { x: 2, y: 12, z: 10 },
      hint: 'Navigate pegs using reflection geometry $C = 2B - A$.',
    };
    onPlayCustomLevel(customLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl max-h-[90vh] rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                Puzzle Architect
              </span>
              <h2 className="text-lg font-bold text-white">Custom Sandbox Creator</h2>
            </div>
          </div>
          <button
            id="close-editor-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
          {/* Level Title & Par */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Puzzle Name</label>
              <input
                type="text"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                placeholder="Name your puzzle"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Par Moves</label>
              <input
                type="number"
                min="1"
                max="20"
                value={parMoves}
                onChange={(e) => setParMoves(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-code text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Goal Target Coordinate */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-emerald-400" />
              <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                Goal Target Coordinate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code text-slate-400">Target X:</span>
                <input
                  type="number"
                  value={target.x}
                  onChange={(e) => setTarget({ ...target, x: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-900 border border-emerald-500/40 rounded-lg px-2 py-1 text-center font-mono-code text-white font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code text-slate-400">Target Y:</span>
                <input
                  type="number"
                  value={target.y}
                  onChange={(e) => setTarget({ ...target, y: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-900 border border-emerald-500/40 rounded-lg px-2 py-1 text-center font-mono-code text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Pegs List */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Starting Pegs ({pegs.length})
              </span>
              <span className="text-[11px] text-slate-400">Minimum 2 pegs required</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {pegs.map((peg, idx) => (
                <div
                  key={peg.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 font-mono-code font-bold text-xs flex items-center justify-center border border-amber-500/30">
                      {peg.label || idx + 1}
                    </span>
                    <span className="font-mono-code text-xs text-slate-200">
                      Position: ({peg.x}, {peg.y})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemovePeg(peg.id)}
                    disabled={pegs.length <= 2}
                    className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Peg Controls */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-mono-code">
                <span>X:</span>
                <input
                  type="number"
                  value={newX}
                  onChange={(e) => setNewX(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-white"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono-code">
                <span>Y:</span>
                <input
                  type="number"
                  value={newY}
                  onChange={(e) => setNewY(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-white"
                />
              </div>
              <button
                id="add-custom-peg-btn"
                onClick={handleAddPeg}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
              >
                <Plus size={14} />
                <span>Add Peg</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="play-custom-puzzle-btn"
            onClick={handleStartPlay}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Play size={14} />
            <span>Play Custom Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
