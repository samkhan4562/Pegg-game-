import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, BookOpen, MousePointer, Layers } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [interactiveA, setInteractiveA] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [interactiveB, setInteractiveB] = useState<{ x: number; y: number }>({ x: 1, y: 1 });

  if (!isOpen) return null;

  const calculatedC = {
    x: 2 * interactiveB.x - interactiveA.x,
    y: 2 * interactiveB.y - interactiveA.y,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                Math Lab & Rules
              </span>
              <h2 className="text-lg font-bold text-white">How Point Reflection Works</h2>
            </div>
          </div>
          <button
            id="close-how-to-play-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {/* Section 1: The Core Formula */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-base">
              <Sparkles size={16} className="text-amber-400" />
              The Reflection Formula ($C = 2B - A$)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              When a jumping peg <strong className="text-amber-300">A</strong> reflects over a pivot peg <strong className="text-cyan-300">B</strong>, it lands at destination <strong className="text-emerald-300">C</strong> directly across <strong className="text-cyan-300">B</strong> at the exact same distance:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono-code text-center text-sm sm:text-base text-cyan-300 font-bold tracking-wide">
              C = 2B - A &nbsp;⟹&nbsp; (x_C = 2x_B - x_A, &nbsp; y_C = 2y_B - y_A)
            </div>
            <p className="text-xs text-slate-400">
              * Unlike standard checkers or solitaire, <strong>pegs remain on the board</strong> after being jumped over.
            </p>
          </div>

          {/* Section 2: Interactive Sandbox Formula Visualizer */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Layers size={16} className="text-emerald-400" />
              Live Reflection Calculator
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Peg A */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col items-center">
                <span className="text-xs font-bold text-amber-300 mb-1">Start Peg A</span>
                <div className="flex items-center gap-2 text-xs font-mono-code">
                  <span>X:</span>
                  <input
                    type="number"
                    value={interactiveA.x}
                    onChange={(e) => setInteractiveA({ ...interactiveA, x: parseInt(e.target.value) || 0 })}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                  />
                  <span>Y:</span>
                  <input
                    type="number"
                    value={interactiveA.y}
                    onChange={(e) => setInteractiveA({ ...interactiveA, y: parseInt(e.target.value) || 0 })}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                  />
                </div>
              </div>

              {/* Pivot B */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex flex-col items-center">
                <span className="text-xs font-bold text-cyan-300 mb-1">Pivot Peg B</span>
                <div className="flex items-center gap-2 text-xs font-mono-code">
                  <span>X:</span>
                  <input
                    type="number"
                    value={interactiveB.x}
                    onChange={(e) => setInteractiveB({ ...interactiveB, x: parseInt(e.target.value) || 0 })}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                  />
                  <span>Y:</span>
                  <input
                    type="number"
                    value={interactiveB.y}
                    onChange={(e) => setInteractiveB({ ...interactiveB, y: parseInt(e.target.value) || 0 })}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                  />
                </div>
              </div>

              {/* Result C */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-emerald-300 mb-0.5">Landing C = 2B - A</span>
                <span className="font-mono-code font-bold text-base text-emerald-400">
                  ({calculatedC.x}, {calculatedC.y})
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Controls & Tips */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <MousePointer size={16} className="text-slate-400" />
              Controls & Shortcuts
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code">Left Click</span>
                <span>Select peg / Execute jump</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code">Right Click</span>
                <span>Cancel peg selection</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code">Drag / Orbit</span>
                <span>Rotate 3D isometric camera</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code">Ctrl + Z</span>
                <span>Undo previous jump</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            id="how-to-play-got-it-btn"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Got it, let's play!</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
