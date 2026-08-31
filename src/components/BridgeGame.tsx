import React, { useState, useEffect, useCallback } from 'react';
import { BridgeCanvas3D } from './BridgeCanvas3D';
import { BridgeHUD } from './BridgeHUD';
import { BridgeSlideDrawer } from './BridgeSlideDrawer';
import { BridgeVictoryModal } from './BridgeVictoryModal';
import { BridgeComparisonModal } from './BridgeComparisonModal';
import { BridgeLevelSelectModal } from './BridgeLevelSelectModal';
import { BridgeHowToPlayModal } from './BridgeHowToPlayModal';
import { BridgeEditorModal } from './BridgeEditorModal';
import { BRIDGE_LEVELS } from '../data/bridgeLevels';
import {
  BridgeLevelData,
  Traveler,
  BridgeBank,
  BridgeStep,
  BridgeHistorySnapshot,
  BridgeProgress,
} from '../types';
import { getCrossingDuration, validateCrossing, solveBridgeCrossing } from '../game/bridgeMath';
import { sound } from '../audio/soundEffects';

interface BridgeGameProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnToHub: () => void;
}

export const BridgeGame: React.FC<BridgeGameProps> = ({
  isMuted,
  onToggleMute,
  onReturnToHub,
}) => {
  // Level State
  const [levelList, setLevelList] = useState<BridgeLevelData[]>(BRIDGE_LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = levelList[currentLevelIndex] || BRIDGE_LEVELS[0];

  // Bank & Gameplay State
  const [leftBank, setLeftBank] = useState<Traveler[]>([]);
  const [rightBank, setRightBank] = useState<Traveler[]>([]);
  const [torchBank, setTorchBank] = useState<BridgeBank>('left');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [history, setHistory] = useState<BridgeHistorySnapshot[]>([]);

  // Animation & Transition State
  const [crossingTravelers, setCrossingTravelers] = useState<Traveler[] | null>(null);
  const [crossingDirection, setCrossingDirection] = useState<'forward' | 'backward' | null>(null);
  const [crossingProgress, setCrossingProgress] = useState<number>(0);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);

  // Modals & Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Progress Persistence
  const [progress, setProgress] = useState<Record<number, BridgeProgress>>(() => {
    try {
      const saved = localStorage.getItem('bridge_puzzle_progress_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      1: { unlocked: true, bestTime: null, stars: 0 },
    };
  });

  // Load Level Helper
  const loadLevel = useCallback(
    (index: number) => {
      const targetLevel = levelList[index] || levelList[0];
      setCurrentLevelIndex(index);
      setLeftBank(targetLevel.travelers.map((t) => ({ ...t })));
      setRightBank([]);
      setTorchBank('left');
      setSelectedIds([]);
      setElapsedTime(0);
      setHistory([]);
      setCrossingTravelers(null);
      setCrossingDirection(null);
      setCrossingProgress(0);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
    },
    [levelList]
  );

  // Initialize on mount
  useEffect(() => {
    loadLevel(0);
  }, []);

  // Handle Traveler Selection
  const handleSelectTraveler = useCallback(
    (travelerId: string) => {
      if (crossingTravelers !== null || isLevelComplete) return;

      const currentBankTravelers = torchBank === 'left' ? leftBank : rightBank;
      const isEligible = currentBankTravelers.some((t) => t.id === travelerId);

      if (!isEligible) {
        sound.playError();
        return;
      }

      if (selectedIds.includes(travelerId)) {
        // Deselect
        sound.playSelect();
        setSelectedIds((prev) => prev.filter((id) => id !== travelerId));
      } else {
        // Select (cap at bridgeCapacity)
        if (selectedIds.length < currentLevel.bridgeCapacity) {
          sound.playSelect();
          setSelectedIds((prev) => [...prev, travelerId]);
        } else {
          // Replace oldest selection
          sound.playSelect();
          setSelectedIds((prev) => [...prev.slice(1), travelerId]);
        }
      }
    },
    [crossingTravelers, isLevelComplete, torchBank, leftBank, rightBank, selectedIds, currentLevel.bridgeCapacity]
  );

  // Execute Bridge Crossing
  const handleExecuteCrossing = useCallback(() => {
    if (crossingTravelers !== null || selectedIds.length === 0 || isLevelComplete) return;

    const leftIds = leftBank.map((t) => t.id);
    const rightIds = rightBank.map((t) => t.id);

    const validation = validateCrossing(
      selectedIds,
      torchBank,
      leftIds,
      rightIds,
      currentLevel.bridgeCapacity
    );

    if (!validation.valid) {
      sound.playError();
      return;
    }

    const currentBankList = torchBank === 'left' ? leftBank : rightBank;
    const movingTravelers = currentBankList.filter((t) => selectedIds.includes(t.id));
    const stepDuration = getCrossingDuration(movingTravelers);
    const direction = torchBank === 'left' ? 'forward' : 'backward';

    // Record History Snapshot for Undo
    const snapshot: BridgeHistorySnapshot = {
      leftBankIds: leftBank.map((t) => t.id),
      rightBankIds: rightBank.map((t) => t.id),
      torchPosition: torchBank,
      elapsedTime,
      step: {
        travelerIds: [...selectedIds],
        travelers: movingTravelers.map((t) => ({ ...t })),
        duration: stepDuration,
        direction,
      },
    };
    setHistory((prev) => [...prev, snapshot]);

    // Remove travelers from current bank
    if (torchBank === 'left') {
      setLeftBank((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    } else {
      setRightBank((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    }

    setSelectedIds([]);
    setCrossingTravelers(movingTravelers);
    setCrossingDirection(direction);
    setCrossingProgress(0);

    // Play sounds
    sound.playTorchIgnite();
    const footstepPace = Math.max(160, Math.min(380, 240 + stepDuration * 20));
    sound.startFootsteps(footstepPace);

    // Animation loop (simulates crossing over bridge duration)
    const animDurationMs = Math.max(1200, Math.min(2600, 1000 + stepDuration * 160));
    const startTime = performance.now();

    const frameHandler = (now: number) => {
      const elapsed = now - startTime;
      const progressRatio = Math.min(1, elapsed / animDurationMs);
      setCrossingProgress(progressRatio);

      if (progressRatio < 1) {
        requestAnimationFrame(frameHandler);
      } else {
        // Crossing Complete
        sound.stopFootsteps();
        sound.playLanding();

        const nextTorch: BridgeBank = torchBank === 'left' ? 'right' : 'left';
        setTorchBank(nextTorch);

        let finalLeftBank = leftBank.filter((t) => !selectedIds.includes(t.id));
        let finalRightBank = rightBank.filter((t) => !selectedIds.includes(t.id));

        if (nextTorch === 'right') {
          finalRightBank = [...finalRightBank, ...movingTravelers];
        } else {
          finalLeftBank = [...finalLeftBank, ...movingTravelers];
        }

        setLeftBank(finalLeftBank);
        setRightBank(finalRightBank);
        setCrossingTravelers(null);
        setCrossingDirection(null);
        setCrossingProgress(0);

        const nextTotalTime = elapsedTime + stepDuration;
        setElapsedTime(nextTotalTime);

        // Check Win Condition: All travelers on right bank
        if (finalRightBank.length === currentLevel.travelers.length) {
          sound.playWin();
          setIsLevelComplete(true);

          // Calculate Stars
          const solution = solveBridgeCrossing(currentLevel.travelers, currentLevel.bridgeCapacity);
          let starsEarned = 1;
          if (nextTotalTime <= currentLevel.parTime) {
            starsEarned = 3;
          } else if (nextTotalTime <= solution.naiveTime) {
            starsEarned = 2;
          }

          // Update Progress
          setProgress((prev) => {
            const currentRecord = prev[currentLevel.id] || {
              unlocked: true,
              bestTime: null,
              stars: 0,
            };
            const newBestTime =
              currentRecord.bestTime === null
                ? nextTotalTime
                : Math.min(currentRecord.bestTime, nextTotalTime);
            const newStars = Math.max(currentRecord.stars, starsEarned);

            const nextLevelId = currentLevel.id + 1;
            const updated: Record<number, BridgeProgress> = {
              ...prev,
              [currentLevel.id]: {
                unlocked: true,
                bestTime: newBestTime,
                stars: newStars,
              },
              [nextLevelId]: {
                ...(prev[nextLevelId] || {}),
                unlocked: true,
                bestTime: prev[nextLevelId]?.bestTime || null,
                stars: prev[nextLevelId]?.stars || 0,
              },
            };

            try {
              localStorage.setItem('bridge_puzzle_progress_v2', JSON.stringify(updated));
            } catch {
              // Ignore
            }
            return updated;
          });
        }
      }
    };

    requestAnimationFrame(frameHandler);
  }, [
    crossingTravelers,
    selectedIds,
    isLevelComplete,
    leftBank,
    rightBank,
    torchBank,
    currentLevel,
    elapsedTime,
  ]);

  // Undo Move
  const handleUndo = useCallback(() => {
    if (history.length === 0 || crossingTravelers !== null || isLevelComplete) return;

    sound.playUndo();
    const lastSnapshot = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // Restore banks
    const restoredLeft = currentLevel.travelers.filter((t) =>
      lastSnapshot.leftBankIds.includes(t.id)
    );
    const restoredRight = currentLevel.travelers.filter((t) =>
      lastSnapshot.rightBankIds.includes(t.id)
    );

    setLeftBank(restoredLeft);
    setRightBank(restoredRight);
    setTorchBank(lastSnapshot.torchPosition);
    setElapsedTime(lastSnapshot.elapsedTime);
    setSelectedIds([]);
    setCrossingTravelers(null);
  }, [history, crossingTravelers, isLevelComplete, currentLevel]);

  // Restart Level
  const handleRestart = useCallback(() => {
    if (crossingTravelers !== null) return;
    sound.playSelect();
    loadLevel(currentLevelIndex);
  }, [crossingTravelers, currentLevelIndex, loadLevel]);

  // Next Level
  const handleNextLevel = useCallback(() => {
    if (currentLevelIndex < levelList.length - 1) {
      loadLevel(currentLevelIndex + 1);
    }
  }, [currentLevelIndex, levelList.length, loadLevel]);

  // Reset Camera
  const handleResetCamera = useCallback(() => {
    sound.playSelect();
    setCameraResetTrigger((prev) => prev + 1);
  }, []);

  // Custom Scenario Launch
  const handlePlayCustomLevel = useCallback(
    (customLevel: BridgeLevelData) => {
      setLevelList((prev) => [...prev, customLevel]);
      const nextIndex = levelList.length;
      setCurrentLevelIndex(nextIndex);
      setLeftBank(customLevel.travelers.map((t) => ({ ...t })));
      setRightBank([]);
      setTorchBank('left');
      setSelectedIds([]);
      setElapsedTime(0);
      setHistory([]);
      setCrossingTravelers(null);
      setCrossingDirection(null);
      setCrossingProgress(0);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
    },
    [levelList.length]
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleExecuteCrossing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIds([]);
        setIsDrawerOpen(false);
        setIsLevelSelectOpen(false);
        setIsHowToPlayOpen(false);
        setIsComparisonOpen(false);
        setIsSandboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRestart, handleExecuteCrossing]);

  return (
    <div className="relative w-screen h-screen bg-[#06080d] overflow-hidden select-none font-sans text-slate-100">
      {/* 3D WebGL Bridge & Torch Canvas Layer */}
      <BridgeCanvas3D
        leftBank={leftBank}
        rightBank={rightBank}
        torchBank={torchBank}
        selectedIds={selectedIds}
        crossingTravelers={crossingTravelers}
        crossingDirection={crossingDirection}
        crossingProgress={crossingProgress}
        onSelectTraveler={handleSelectTraveler}
        cameraResetTrigger={cameraResetTrigger}
      />

      {/* In-Game HUD (Top Stopwatch + Floating Crossing Action + Bottom Dock) */}
      <BridgeHUD
        level={currentLevel}
        levelIndex={currentLevelIndex}
        totalLevels={levelList.length}
        elapsedTime={elapsedTime}
        leftBank={leftBank}
        rightBank={rightBank}
        torchBank={torchBank}
        selectedIds={selectedIds}
        history={history.map((h) => h.step)}
        isCrossing={crossingTravelers !== null}
        canUndo={history.length > 0 && crossingTravelers === null && !isLevelComplete}
        isMuted={isMuted}
        onSelectTraveler={handleSelectTraveler}
        onExecuteCrossing={handleExecuteCrossing}
        onUndo={handleUndo}
        onRestart={handleRestart}
        onResetCamera={handleResetCamera}
        onToggleMute={onToggleMute}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
      />

      {/* Slide-over Navigation Drawer */}
      <BridgeSlideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        progress={progress}
        totalLevels={levelList.length}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onReturnToHub={onReturnToHub}
      />

      {/* Victory Celebration & Par Comparison Modal */}
      <BridgeVictoryModal
        isOpen={isLevelComplete}
        level={currentLevel}
        levelIndex={currentLevelIndex}
        totalLevels={levelList.length}
        elapsedTime={elapsedTime}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onOpenLevelSelect={() => {
          setIsLevelComplete(false);
          setIsLevelSelectOpen(true);
        }}
      />

      {/* Strategy Breakdown Modal */}
      <BridgeComparisonModal
        isOpen={isComparisonOpen}
        level={currentLevel}
        elapsedTime={elapsedTime}
        history={history.map((h) => h.step)}
        onClose={() => setIsComparisonOpen(false)}
      />

      {/* Level Select Catalog Modal */}
      <BridgeLevelSelectModal
        isOpen={isLevelSelectOpen}
        levels={levelList}
        currentLevelIndex={currentLevelIndex}
        progress={progress}
        onSelectLevel={(idx) => {
          loadLevel(idx);
        }}
        onClose={() => setIsLevelSelectOpen(false)}
      />

      {/* How to Play Modal */}
      <BridgeHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Custom Scenario Builder Modal */}
      <BridgeEditorModal
        isOpen={isSandboxOpen}
        onPlayCustomLevel={handlePlayCustomLevel}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
};
