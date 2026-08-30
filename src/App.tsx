import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameCanvas3D } from './components/GameCanvas3D';
import { HUD } from './components/HUD';
import { HeroMenu } from './components/HeroMenu';
import { SlideDrawer } from './components/SlideDrawer';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { LEVELS } from './data/levels';
import { LevelData, PegData, ValidMove, LevelProgress, MoveHistoryItem, ScreenMode } from './types';
import { getValidMovesForPeg, isTargetReached } from './game/reflectionMath';
import { sound } from './audio/soundEffects';

export default function App() {
  // Screen Mode ('menu' | 'game')
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');

  // Level State
  const [levelList, setLevelList] = useState<LevelData[]>(LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = levelList[currentLevelIndex] || LEVELS[0];

  // Gameplay State
  const [pegs, setPegs] = useState<PegData[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [selectedPegId, setSelectedPegId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Slide Drawer & Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Persistence State (Unlocked levels, best scores, stars)
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem('peg_puzzle_progress_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      1: { unlocked: true, bestMoves: null, stars: 0 },
    };
  });

  // Load Level helper
  const loadLevel = useCallback(
    (index: number) => {
      const targetLevel = levelList[index] || levelList[0];
      setCurrentLevelIndex(index);
      setPegs(targetLevel.pegs.map((p) => ({ ...p })));
      setMovesCount(0);
      setHistory([]);
      setSelectedPegId(null);
      setIsAnimating(false);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
    },
    [levelList]
  );

  // Initialize initial level configuration on mount
  useEffect(() => {
    loadLevel(0);
  }, []);

  // Compute Valid Moves for Selected Peg
  const validMoves: ValidMove[] = useMemo(() => {
    if (!selectedPegId) return [];
    const selectedPeg = pegs.find((p) => p.id === selectedPegId);
    if (!selectedPeg) return [];
    return getValidMovesForPeg(selectedPeg, pegs);
  }, [selectedPegId, pegs]);

  // Start / Continue Campaign from Title Screen
  const handleStartCampaign = useCallback(() => {
    sound.playSelect();
    // Find highest unlocked or uncompleted level
    let targetIndex = 0;
    for (let i = 0; i < levelList.length; i++) {
      const lvl = levelList[i];
      const prog = progress[lvl.id];
      if (prog && prog.unlocked) {
        targetIndex = i;
        if (prog.bestMoves === null) {
          break; // First uncompleted level
        }
      }
    }
    loadLevel(targetIndex);
    setScreenMode('game');
  }, [levelList, progress, loadLevel]);

  // Execute Valid Move
  const handleExecuteMove = useCallback(
    (move: ValidMove) => {
      // Record History for Undo
      const snapshot: MoveHistoryItem = {
        pegs: pegs.map((p) => ({ ...p })),
        move,
      };
      setHistory((prev) => [...prev, snapshot]);

      // Update Peg Coordinate
      const newPegs = pegs.map((p) =>
        p.id === move.pegId ? { ...p, x: move.dest.x, y: move.dest.y } : p
      );

      const nextMovesCount = movesCount + 1;
      setPegs(newPegs);
      setMovesCount(nextMovesCount);
      setSelectedPegId(null);
      setIsAnimating(false);

      // Check Target Win Condition
      if (isTargetReached(newPegs, currentLevel.target)) {
        sound.playWin();
        setIsLevelComplete(true);

        // Calculate Stars
        let starsEarned = 1;
        if (nextMovesCount <= currentLevel.parMoves) {
          starsEarned = 3;
        } else if (nextMovesCount === currentLevel.parMoves + 1) {
          starsEarned = 2;
        }

        // Update & Persist Progress
        setProgress((prev) => {
          const currentRecord = prev[currentLevel.id] || {
            unlocked: true,
            bestMoves: null,
            stars: 0,
          };
          const newBestMoves =
            currentRecord.bestMoves === null
              ? nextMovesCount
              : Math.min(currentRecord.bestMoves, nextMovesCount);
          const newStars = Math.max(currentRecord.stars, starsEarned);

          const nextLevelId = currentLevel.id + 1;
          const updated: Record<number, LevelProgress> = {
            ...prev,
            [currentLevel.id]: {
              unlocked: true,
              bestMoves: newBestMoves,
              stars: newStars,
            },
            [nextLevelId]: {
              ...(prev[nextLevelId] || {}),
              unlocked: true,
              bestMoves: prev[nextLevelId]?.bestMoves || null,
              stars: prev[nextLevelId]?.stars || 0,
            },
          };

          try {
            localStorage.setItem('peg_puzzle_progress_v2', JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      }
    },
    [pegs, movesCount, currentLevel]
  );

  // Undo Move
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimating || isLevelComplete) return;

    sound.playUndo();
    const lastState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPegs(lastState.pegs.map((p) => ({ ...p })));
    setMovesCount((prev) => Math.max(0, prev - 1));
    setSelectedPegId(null);
  }, [history, isAnimating, isLevelComplete]);

  // Restart Level
  const handleRestart = useCallback(() => {
    if (isAnimating) return;
    sound.playSelect();
    loadLevel(currentLevelIndex);
  }, [isAnimating, currentLevelIndex, loadLevel]);

  // Next Level
  const handleNextLevel = useCallback(() => {
    if (currentLevelIndex < levelList.length - 1) {
      loadLevel(currentLevelIndex + 1);
    }
  }, [currentLevelIndex, levelList.length, loadLevel]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    sound.playSelect();
    setCameraResetTrigger((prev) => prev + 1);
  }, []);

  // Toggle Sound Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Play Custom Sandbox Level
  const handlePlayCustomLevel = useCallback(
    (customLevel: LevelData) => {
      setLevelList((prev) => [...prev, customLevel]);
      const nextIndex = levelList.length;
      setCurrentLevelIndex(nextIndex);
      setPegs(customLevel.pegs.map((p) => ({ ...p })));
      setMovesCount(0);
      setHistory([]);
      setSelectedPegId(null);
      setIsAnimating(false);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
      setScreenMode('game');
    },
    [levelList.length]
  );

  // Global Keyboard Shortcuts
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
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedPegId(null);
        setIsDrawerOpen(false);
        setIsLevelSelectOpen(false);
        setIsHowToPlayOpen(false);
        setIsSandboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRestart]);

  return (
    <div className="relative w-screen h-screen bg-[#0a0c10] overflow-hidden select-none font-sans text-slate-100">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas3D
        pegs={pegs}
        target={currentLevel.target}
        selectedPegId={selectedPegId}
        validMoves={validMoves}
        isAnimating={isAnimating}
        isMenuMode={screenMode === 'menu'}
        cameraResetTrigger={cameraResetTrigger}
        levelCameraPos={currentLevel.cameraPos}
        onSelectPeg={setSelectedPegId}
        onExecuteMove={handleExecuteMove}
      />

      {/* Screen Mode 1: Main Title Screen (Hero Menu) */}
      {screenMode === 'menu' && (
        <HeroMenu
          currentLevelIndex={currentLevelIndex}
          totalLevels={levelList.length}
          progress={progress}
          onStartCampaign={handleStartCampaign}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenSandbox={() => setIsSandboxOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        />
      )}

      {/* Screen Mode 2: Active In-Game HUD (with Top Hamburger & Floating Bottom Dock) */}
      {screenMode === 'game' && (
        <HUD
          currentLevel={currentLevel}
          levelIndex={currentLevelIndex}
          totalLevels={levelList.length}
          movesCount={movesCount}
          canUndo={history.length > 0 && !isAnimating && !isLevelComplete}
          isMuted={isMuted}
          target={currentLevel.target}
          onUndo={handleUndo}
          onRestart={handleRestart}
          onResetCamera={handleResetCamera}
          onToggleMute={handleToggleMute}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Slide-over Glassmorphic Drawer Navigation */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        progress={progress}
        totalLevels={levelList.length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onReturnToMainMenu={() => {
          setIsDrawerOpen(false);
          setScreenMode('menu');
        }}
      />

      {/* Level Complete Celebration Modal */}
      <LevelCompleteModal
        isOpen={isLevelComplete}
        level={currentLevel}
        levelIndex={currentLevelIndex}
        totalLevels={levelList.length}
        movesCount={movesCount}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onOpenLevelSelect={() => {
          setIsLevelComplete(false);
          setIsLevelSelectOpen(true);
        }}
      />

      {/* Level Select Catalog Modal */}
      <LevelSelectModal
        isOpen={isLevelSelectOpen}
        levels={levelList}
        currentLevelIndex={currentLevelIndex}
        progress={progress}
        onSelectLevel={(idx) => {
          loadLevel(idx);
          setScreenMode('game');
        }}
        onClose={() => setIsLevelSelectOpen(false)}
      />

      {/* How To Play & Parity Explanation Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Custom Sandbox Puzzle Creator Modal */}
      <LevelEditorModal
        isOpen={isSandboxOpen}
        onPlayCustomLevel={handlePlayCustomLevel}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
}
