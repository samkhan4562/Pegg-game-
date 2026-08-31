import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Play, Sparkles, Sliders, Flame, Cpu, Users } from 'lucide-react';
import { Traveler, BridgeLevelData } from '../types';
import { solveBridgeCrossing } from '../game/bridgeMath';

interface BridgeEditorModalProps {
  isOpen: boolean;
  onPlayCustomLevel: (customLevel: BridgeLevelData) => void;
  onClose: () => void;
}

const DEFAULT_AVATAR_COLORS = [
  '#38bdf8', // Sky
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Rose
  '#a78bfa', // Purple
  '#f472b6', // Pink
];

export const BridgeEditorModal: React.FC<BridgeEditorModalProps> = ({
  isOpen,
  onPlayCustomLevel,
  onClose,
}) => {
  const [levelName, setLevelName] = useState('Custom Chasm Challenge');
  const [bridgeCapacity, setBridgeCapacity] = useState<number>(2);
  const [travelers, setTravelers] = useState<Traveler[]>([
    { id: 'custom-1', name: 'Scout', time: 1, avatarColor: DEFAULT_AVATAR_COLORS[0] },
    { id: 'custom-2', name: 'Guide', time: 2, avatarColor: DEFAULT_AVATAR_COLORS[1] },
    { id: 'custom-3', name: 'Porter', time: 5, avatarColor: DEFAULT_AVATAR_COLORS[2] },
    { id: 'custom-4', name: 'Elder', time: 10, avatarColor: DEFAULT_AVATAR_COLORS[3] },
  ]);

  // Compute live optimal solution using Dijkstra solver
  const optimalSolution = useMemo(() => {
    return solveBridgeCrossing(travelers, bridgeCapacity);
  }, [travelers, bridgeCapacity]);

  // Add Traveler (up to 6)
  const handleAddTraveler = () => {
    if (travelers.length >= 6) return;
    const nextIdx = travelers.length + 1;
    const color = DEFAULT_AVATAR_COLORS[(nextIdx - 1) % DEFAULT_AVATAR_COLORS.length];
    const newTraveler: Traveler = {
      id: `custom-${Date.now()}-${nextIdx}`,
      name: `Traveler ${nextIdx}`,
      time: Math.min(99, nextIdx * 3),
      avatarColor: color,
    };
    setTravelers([...travelers, newTraveler]);
  };

  // Remove Traveler
  const handleRemoveTraveler = (id: string) => {
    if (travelers.length <= 2) return;
    setTravelers(travelers.filter((t) => t.id !== id));
  };

  // Update Traveler Field
  const handleUpdateTraveler = (id: string, field: 'name' | 'time' | 'avatarColor', value: string | number) => {
    setTravelers(
      travelers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Launch Play
  const handleLaunch = () => {
    const customLevel: BridgeLevelData = {
      id: Date.now(),
      name: levelName.trim() || 'Custom Chasm',
      difficulty: 'Master',
      bridgeCapacity,
      parTime: optimalSolution.minTime,
      travelers: travelers.map((t) => ({ ...t })),
      description: `Custom scenario with ${travelers.length} travelers and bridge capacity ${bridgeCapacity}.`,
      hint: `Optimal calculated par is ${optimalSolution.minTime} minutes.`,
    };
    onPlayCustomLevel(customLevel);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sliders size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Bridge Puzzle Architect
                </h2>
                <p className="text-xs text-slate-400">
                  Build custom chasm scenarios with automated graph solver
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

          {/* Form Content */}
          <div className="overflow-y-auto my-5 pr-1 flex flex-col gap-5">
            {/* Level Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Scenario Title
                </label>
                <input
                  type="text"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bridge Capacity (Max Travelers)
                </label>
                <div className="flex items-center gap-3">
                  {[2, 3].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setBridgeCapacity(cap)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        bridgeCapacity === cap
                          ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cap} Persons at once
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Travelers Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Travelers ({travelers.length}/6)
                </span>
                <button
                  type="button"
                  disabled={travelers.length >= 6}
                  onClick={handleAddTraveler}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    travelers.length < 6
                      ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 cursor-pointer'
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Plus size={14} />
                  <span>Add Traveler</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {travelers.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="color"
                        value={t.avatarColor}
                        onChange={(e) =>
                          handleUpdateTraveler(t.id, 'avatarColor', e.target.value)
                        }
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                        title="Avatar Color"
                      />
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) =>
                          handleUpdateTraveler(t.id, 'name', e.target.value)
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                        placeholder="Name"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700/60">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={t.time}
                          onChange={(e) =>
                            handleUpdateTraveler(
                              t.id,
                              'time',
                              Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
                            )
                          }
                          className="w-10 text-center font-mono text-xs font-bold text-amber-400 bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">min</span>
                      </div>

                      {travelers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTraveler(t.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Remove Traveler"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Automated Dijkstra Solver Analysis */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Cpu size={16} />
                  <span>Automated Dijkstra Par Solver</span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400">
                  Optimal Par: {optimalSolution.minTime}m
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Naive Greedy Shuttle: <span className="font-mono text-rose-400">{optimalSolution.naiveTime}m</span> • Saved via Bottlenecking: <span className="font-mono text-amber-400 font-bold">{Math.max(0, optimalSolution.naiveTime - optimalSolution.minTime)}m</span>.
              </p>

              <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                {optimalSolution.breakdown}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleLaunch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              <span>Launch & Test Scenario</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
