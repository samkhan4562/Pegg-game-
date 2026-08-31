import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MasterPortal } from './components/MasterPortal';
import { GameCanvas3D } from './components/GameCanvas3D';
import { HUD } from './components/HUD';
import { HeroMenu } from './components/HeroMenu';
import { SlideDrawer } from './components/SlideDrawer';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { BridgeGame } from './components/BridgeGame';
import { LEVELS } from './data/levels';
import { BRIDGE_LEVELS } from './data/bridgeLevels';
import {
  LevelData,
  PegData,
  ValidMove,
  LevelProgress,
  MoveHistoryItem,
  ScreenMode,
  ActiveGameView,
  BridgeProgress,
} from './types';
import { getValidMovesForPeg, isTargetReached } from './game/reflectionMath';
import { sound } from './audio/soundEffects';

export default function App() {
  // Master Platform Game View ('hub' | 'pegs' | 'bridge')
  const [activeGame, setActiveGame] = useState<ActiveGameView>('hub');

  // Jumping Pegs: Screen Mode ('menu' | 'game')
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');

  // Jumping Pegs: Level State
  const [levelList, setLevelList] = useState<LevelData[]>(LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = levelList[currentLevelIndex] || LEVELS[0];

  // Jumping Pegs: Gameplay State
  const [pegs, setPegs] = useState<PegData[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [selectedPegId, setSelectedPegId] = useState<string | null>(null);
  const [focusedMove, setFocusedMove] = useState<ValidMove | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Slide Drawer & Modal States (Jumping Pegs)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Jumping Pegs: Persistence State
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

  // Midnight Bridge: Persistence State (for Master Hub aggregation)
  const [bridgeProgress, setBridgeProgress] = useState<Record<number, BridgeProgress>>(() => {
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

  // Calculate Aggregated Stars
  const pegsStars = useMemo(() => {
    return Object.values(progress).reduce((acc: number, p: LevelProgress) => acc + (p?.stars || 0), 0);
  }, [progress]);

  const maxPegsStars = useMemo(() => LEVELS.length * 3, []);

  const bridgeStars = useMemo(() => {
    return Object.values(bridgeProgress).reduce((acc: number, p: BridgeProgress) => acc + (p?.stars || 0), 0);
  }, [bridgeProgress]);

  const maxBridgeStars = useMemo(() => BRIDGE_LEVELS.length * 3, []);

  // Synchronize bridge progress when returning to hub
  const refreshBridgeProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem('bridge_puzzle_progress_v2');
      if (saved) setBridgeProgress(JSON.parse(saved));
    } catch {
      // Ignore
    }
  }, []);

  // Load Level Helper (Jumping Pegs)
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
    let targetIndex = 0;
    for (let i = 0; i < levelList.length; i++) {
      const lvl = levelList[i];
      const prog = progress[lvl.id];
      if (prog && prog.unlocked) {
        targetIndex = i;
        if (prog.bestMoves === null) {
          break;
        }
      }
    }
    loadLevel(targetIndex);
    setScreenMode('game');
  }, [levelList, progress, loadLevel]);

  // Execute Valid Move (Jumping Pegs)
  const handleExecuteMove = useCallback(
    (move: ValidMove) => {
      const snapshot: MoveHistoryItem = {
        pegs: pegs.map((p) => ({ ...p })),
        move,
      };
      setHistory((prev) => [...prev, snapshot]);

      const newPegs = pegs.map((p) =>
        p.id === move.pegId ? { ...p, x: move.dest.x, y: move.dest.y } : p
      );

      const nextMovesCount = movesCount + 1;
      setPegs(newPegs);
      setMovesCount(nextMovesCount);
      setSelectedPegId(null);
      setIsAnimating(false);

      if (isTargetReached(newPegs, currentLevel.target)) {
        sound.playWin();
        setIsLevelComplete(true);

        let starsEarned = 1;
        if (nextMovesCount <= currentLevel.parMoves) {
          starsEarned = 3;
        } else if (nextMovesCount === currentLevel.parMoves + 1) {
          starsEarned = 2;
        }

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
            // Ignore
          }
          return updated;
        });
      }
    },
    [pegs, movesCount, currentLevel]
  );

  // Undo Move (Jumping Pegs)
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimating || isLevelComplete) return;

    sound.playUndo();
    const lastState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPegs(lastState.pegs.map((p) => ({ ...p })));
    setMovesCount((prev) => Math.max(0, prev - 1));
    setSelectedPegId(null);
  }, [history, isAnimating, isLevelComplete]);

  // Restart Level (Jumping Pegs)
  const handleRestart = useCallback(() => {
    if (isAnimating) return;
    sound.playSelect();
    loadLevel(currentLevelIndex);
  }, [isAnimating, currentLevelIndex, loadLevel]);

  // Next Level (Jumping Pegs)
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

  // Play Custom Sandbox Level (Jumping Pegs)
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

  // Keyboard shortcuts (Jumping Pegs)
  useEffect(() => {
    if (activeGame !== 'pegs') return;

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
  }, [activeGame, handleUndo, handleRestart]);

  // ==========================================================
  // RENDER VIEW: 1. MASTER PORTAL GAMES HUB
  // ==========================================================
  if (activeGame === 'hub') {
    return (
      <MasterPortal
        pegsStars={pegsStars}
        maxPegsStars={maxPegsStars}
        bridgeStars={bridgeStars}
        maxBridgeStars={maxBridgeStars}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onSelectGame={(game) => {
          sound.playSelect();
          setActiveGame(game);
        }}
      />
    );
  }

  // ==========================================================
  // RENDER VIEW: 2. GAME 2: MIDNIGHT BRIDGE & TORCH
  // ==========================================================
  if (activeGame === 'bridge') {
    return (
      <BridgeGame
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReturnToHub={() => {
          refreshBridgeProgress();
          sound.playSelect();
          setActiveGame('hub');
        }}
      />
    );
  }

  // ==========================================================
  // RENDER VIEW: 3. GAME 1: THE JUMPING PEGS 3D
  // ==========================================================
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
        onFocusMove={setFocusedMove}
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
          onReturnToHub={() => {
            sound.playSelect();
            setActiveGame('hub');
          }}
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
          focusedMove={focusedMove}
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
        onReturnToHub={() => {
          setIsDrawerOpen(false);
          sound.playSelect();
          setActiveGame('hub');
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
